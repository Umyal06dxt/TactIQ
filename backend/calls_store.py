import os, json
from typing import Optional
from openai import AsyncOpenAI
import database
from prompts import POST_CALL_SUMMARY_PROMPT

_ai = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))


async def generate_summary(
    vendor: str,
    transcript: list[str],
    coaching_shown: list[dict],
    briefing_context: str = "",
) -> dict:
    user_content = f"""Vendor: {vendor}
Briefing context: {briefing_context}

Transcript (what the speaker said):
{chr(10).join(f"[{i+1}] {t}" for i, t in enumerate(transcript))}

Coaching shown at each turn:
{json.dumps(coaching_shown, indent=2)}"""

    try:
        resp = await _ai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": POST_CALL_SUMMARY_PROMPT},
                {"role": "user", "content": user_content},
            ],
            response_format={"type": "json_object"},
            max_tokens=800,
            temperature=0.3,
        )
        return json.loads(resp.choices[0].message.content or "{}")
    except Exception:
        return {
            "narrative": "Summary unavailable.",
            "adherence_score": 0.5,
            "tactics_used": [],
            "key_moments": [],
            "deal_score": 50,
            "win_probability": 50,
            "concessions_made": 0,
            "strengths": [],
            "improvements": [],
            "next_move": "",
        }


async def save_call(
    vendor: str,
    started_at,
    ended_at,
    duration_secs: int,
    transcript: list[str],
    coaching_shown: list[dict],
    outcome: Optional[str],
    user_id: Optional[str] = None,
    briefing_context: str = "",
    savings_achieved: int = 0,
) -> dict:
    summary = await generate_summary(vendor, transcript, coaching_shown, briefing_context)
    if not database.pool:
        return {
            "id": "no-db",
            "vendor": vendor,
            "duration_secs": duration_secs,
            "outcome": outcome,
            **summary,
            "transcript": transcript,
            "coaching_shown": coaching_shown,
            "savings_achieved": savings_achieved,
        }
    row = await database.pool.fetchrow(
        """INSERT INTO calls
           (user_id, vendor, started_at, ended_at, duration_secs, transcript, coaching_shown,
            outcome, narrative, adherence_score, tactics_used, key_moments,
            deal_score, win_probability, concessions_made, savings_achieved)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
           RETURNING *""",
        user_id, vendor, started_at, ended_at, duration_secs,
        transcript,
        json.dumps(coaching_shown),
        outcome,
        summary.get("narrative"),
        summary.get("adherence_score", 0.5),
        summary.get("tactics_used", []),
        json.dumps(summary.get("key_moments", [])),
        summary.get("deal_score"),
        (summary["win_probability"] / 100.0) if summary.get("win_probability") is not None else None,
        summary.get("concessions_made", 0),
        savings_achieved,
    )
    return dict(row)


async def get_calls(vendor: str, limit: int = 20, user_id: Optional[str] = None) -> list[dict]:
    if not database.pool:
        return []
    rows = await database.pool.fetch(
        "SELECT * FROM calls WHERE vendor=$1 ORDER BY created_at DESC LIMIT $2",
        vendor, limit
    )
    return [dict(r) for r in rows]


async def get_call(call_id: str) -> Optional[dict]:
    if not database.pool:
        return None
    row = await database.pool.fetchrow("SELECT * FROM calls WHERE id=$1", call_id)
    return dict(row) if row else None
