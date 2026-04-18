"""
Seed script — inserts realistic demo call records for all vendors.
Run once: python seed_demo.py
Requires DATABASE_URL env var.
"""
import asyncio
import json
import os
import random
from datetime import datetime, timedelta, timezone

import asyncpg

DATABASE_URL = os.getenv("DATABASE_URL", "")

VENDORS = [
    {"bank_id": "nexacloud", "name": "NexaCloud", "contract": 380_000, "industry": "Cloud Infrastructure"},
    {"bank_id": "datapipe",  "name": "DataPipe",  "contract": 120_000, "industry": "Data Pipelines"},
    {"bank_id": "securenet", "name": "SecureNet", "contract": 85_000,  "industry": "Cybersecurity"},
]

TACTICS = [
    "BATNA Framing", "Anchoring", "Silence", "Time Pressure",
    "Competitive Alternative", "Bundle Unbundling", "Reciprocity",
    "Good Cop / Bad Cop", "Deadlines", "Nibbling",
]

NARRATIVES = [
    "Strong negotiation — opened with anchor, held firm on pricing, achieved meaningful concession in final minutes.",
    "Moderate performance. Tactics applied inconsistently; concessions given too early before vendor showed real resistance.",
    "Excellent call. Deployed BATNA framing effectively. Vendor moved 12% on pricing after competitive alternative was raised.",
    "Challenging conversation — vendor was well-prepared. Silence tactic worked well; final outcome better than expected.",
    "Good use of bundling strategy. Traded implementation timeline for a larger discount on annual commitment.",
    "Vendor pushed back hard on SLA guarantees. Escalated to legal review — outcome deferred.",
    "Clean win. Anchored 25% below target, settled at 15% discount. Adherence to playbook was high throughout.",
    "Lost ground on concessions mid-call. Should have maintained silence after initial anchor.",
    "Pending — vendor requested board approval for the pricing structure we proposed.",
    "Strong opening but got distracted by feature scope discussion. Recovered late to secure 8% reduction.",
]

KEY_MOMENT_TEMPLATES = [
    {"type": "good",       "moment": "Anchored at 25% below market rate, setting aggressive baseline."},
    {"type": "good",       "moment": "Used silence after vendor's counter-offer — held for 12 seconds."},
    {"type": "good",       "moment": "Introduced competitive alternative from Vendor B; vendor immediately softened."},
    {"type": "good",       "moment": "Reframed conversation around total cost of ownership, not license fees."},
    {"type": "missed",     "moment": "Missed opportunity to deploy BATNA after vendor's first objection."},
    {"type": "missed",     "moment": "Conceded on payment terms before vendor asked — left money on the table."},
    {"type": "missed",     "moment": "Failed to use silence after initial price anchor — spoke too quickly."},
    {"type": "correction", "moment": "Coach redirected toward reciprocity tactic — applied successfully."},
    {"type": "correction", "moment": "Switched from feature discussion back to pricing frame on coach's cue."},
    {"type": "anchor",     "moment": "Set contract value anchor $40k below asking price in opening."},
    {"type": "anchor",     "moment": "Anchored implementation timeline at 3 months to pressure vendor."},
    {"type": "concession", "moment": "Agreed to 12-month payment upfront without getting price reduction in return."},
    {"type": "concession", "moment": "Conceded on SLA terms before extracting pricing benefit — unearned move."},
]

TRANSCRIPT_LINES = [
    "We've been reviewing your proposal and frankly we were expecting more flexibility on price.",
    "I understand your position, but our costs have increased significantly this year.",
    "What would it take to close this today at a 15% reduction?",
    "Let me be transparent — we're also in conversations with two of your competitors.",
    "That's a fair point. Can we structure this as a two-year deal to justify the discount?",
    "We'd need sign-off from our finance team on anything beyond 10%.",
    "What if we commit to expanding scope by 30% in Q2 in exchange for the discount now?",
    "I'll need to take this back to my VP. Can we reconvene Thursday?",
    "We've built significant institutional knowledge around your platform — switching costs are real.",
    "Let me see what I can do. Give me until end of day.",
    "Our legal team has flagged some concerns about the liability clauses.",
    "If you can match the 18% we received from the alternative vendor, we have a deal.",
    "I appreciate the partnership, but we're firm at 8% for this renewal cycle.",
    "We're willing to remove the professional services line item if you hold on license pricing.",
]


def random_call(vendor: dict, days_ago: int, rng: random.Random) -> dict:
    outcome_weights = [("won", 0.45), ("lost", 0.25), ("pending", 0.2), ("escalated", 0.1)]
    outcome = rng.choices([o for o, _ in outcome_weights], weights=[w for _, w in outcome_weights])[0]

    adherence = round(rng.uniform(0.35, 0.95), 2)
    deal_score = rng.randint(38, 92)
    win_prob = round(rng.uniform(0.25, 0.90), 2)
    concessions = rng.randint(0, 4)
    duration = rng.randint(8 * 60, 52 * 60)

    if outcome == "won":
        base_pct = rng.uniform(0.06, 0.15)
        savings = int(vendor["contract"] * base_pct)
    else:
        savings = 0

    num_tactics = rng.randint(1, 4)
    tactics = rng.sample(TACTICS, num_tactics)

    num_moments = rng.randint(2, 4)
    moments = rng.sample(KEY_MOMENT_TEMPLATES, num_moments)
    moments_with_turns = [
        {**m, "turn_index": rng.randint(1, 12)}
        for m in moments
    ]

    num_lines = rng.randint(6, min(len(TRANSCRIPT_LINES), 12))
    transcript = rng.sample(TRANSCRIPT_LINES, num_lines)

    narrative = rng.choice(NARRATIVES)

    now = datetime.now(timezone.utc)
    started_at = now - timedelta(days=days_ago, hours=rng.randint(8, 17), minutes=rng.randint(0, 59))
    ended_at = started_at + timedelta(seconds=duration)

    return {
        "vendor": vendor["bank_id"],
        "started_at": started_at,
        "ended_at": ended_at,
        "duration_secs": duration,
        "transcript": transcript,
        "coaching_shown": json.dumps([]),
        "outcome": outcome,
        "narrative": narrative,
        "adherence_score": adherence,
        "tactics_used": tactics,
        "key_moments": json.dumps(moments_with_turns),
        "deal_score": deal_score,
        "win_probability": win_prob,
        "concessions_made": concessions,
        "savings_achieved": savings,
    }


async def seed():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set")
        return

    conn = await asyncpg.connect(DATABASE_URL)
    try:
        existing = await conn.fetchval("SELECT COUNT(*) FROM calls")
        if existing and existing > 0:
            print(f"Database already has {existing} calls. Skipping seed. (Delete calls to re-seed.)")
            return

        rng = random.Random(42)
        inserted = 0

        for vendor in VENDORS:
            # Spread 20 calls over the last 180 days
            day_slots = sorted(rng.sample(range(1, 181), 20))
            for days_ago in day_slots:
                call = random_call(vendor, days_ago, rng)
                await conn.execute(
                    """INSERT INTO calls
                       (vendor, started_at, ended_at, duration_secs, transcript, coaching_shown,
                        outcome, narrative, adherence_score, tactics_used, key_moments,
                        deal_score, win_probability, concessions_made, savings_achieved)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)""",
                    call["vendor"],
                    call["started_at"],
                    call["ended_at"],
                    call["duration_secs"],
                    call["transcript"],
                    call["coaching_shown"],
                    call["outcome"],
                    call["narrative"],
                    call["adherence_score"],
                    call["tactics_used"],
                    call["key_moments"],
                    call["deal_score"],
                    call["win_probability"],
                    call["concessions_made"],
                    call["savings_achieved"],
                )
                inserted += 1

        print(f"Seeded {inserted} demo calls across {len(VENDORS)} vendors.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed())
