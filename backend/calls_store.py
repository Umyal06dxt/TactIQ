import os, json
from typing import Optional
from openai import AsyncOpenAI
import database

_ai = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

SUMMARY_PROMPT = """You are analyzing a completed vendor negotiation call. Produce a JSON object — no prose, no fences:
{
  "narrative": "<3-4 sentences: how the opening landed, where the vendor pushed back, what the buyer did well or missed, how it closed>",
  "adherence_score": <0.00–1.00 — fraction of coaching suggestions the speaker actually used or closely echoed>,
  "tactics_used": ["<exact tactic name as it appeared in the briefing>", ...],
  "key_moments": [
    {"turn_index": <int>, "moment": "<10-15 word description>", "type": "good|missed|correction|anchor|concession"}
  ]
}

Scoring rules:
- adherence_score: count turns where the speaker said something close to a suggestion / total coached turns. Be strict.
- tactics_used: only name tactics explicitly visible in what was said — no guessing.
- key_moments: up to 6. Prioritise: anchoring, pushbacks, unearned concessions, corrections, strong closes.
- narrative: be specific — quote or paraphrase actual lines. Avoid vague summaries like "the call went well".
Output valid JSON only."""


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
                {"role": "system", "content": SUMMARY_PROMPT},
                {"role": "user", "content": user_content},
            ],
            response_format={"type": "json_object"},
            max_tokens=600,
            temperature=0.3,
        )
        return json.loads(resp.choices[0].message.content or "{}")
    except Exception:
        return {
            "narrative": "Summary unavailable.",
            "adherence_score": 0.5,
            "tactics_used": [],
            "key_moments": [],
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
) -> dict:
    summary = await generate_summary(vendor, transcript, coaching_shown, briefing_context)
    if not database.pool:
        # Return in-memory result (no persistence)
        return {
            "id": "no-db",
            "vendor": vendor,
            "duration_secs": duration_secs,
            "outcome": outcome,
            **summary,
            "transcript": transcript,
            "coaching_shown": coaching_shown,
        }
    row = await database.pool.fetchrow(
        """INSERT INTO calls
           (user_id, vendor, started_at, ended_at, duration_secs, transcript, coaching_shown,
            outcome, narrative, adherence_score, tactics_used, key_moments)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           RETURNING *""",
        user_id, vendor, started_at, ended_at, duration_secs,
        transcript,
        json.dumps(coaching_shown),
        outcome,
        summary.get("narrative"),
        summary.get("adherence_score", 0.5),
        summary.get("tactics_used", []),
        json.dumps(summary.get("key_moments", [])),
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
