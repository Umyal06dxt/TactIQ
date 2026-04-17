from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState
from openai import AsyncOpenAI
import json
import os

from models import Briefing

openai_client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

COACH_SYSTEM = """You are a real-time negotiation coach embedded in a live vendor contract call. You see the briefing, the full transcript so far, and the latest thing the buyer said.

Return ONLY this JSON — no prose, no fences:
{
  "suggestions": ["<verbatim phrase to say now>", "<alternative>", "<third option>"],
  "warnings": ["<one concrete pitfall>"],
  "correction": "<only if they just made a strategic error — else null>",
  "current_tactic": "<exact tactic name from briefing in play right now, else null>"
}

STRICT RULES:
- suggestions: 3 verbatim phrases, ready to say out loud, varied in tone (assertive / collaborative / deflecting). Never generic. Use the vendor's name, contract value, renewal date when relevant.
- warnings: exactly 1 specific pitfall based on the vendor's known patterns from the briefing. No generic advice.
- correction: non-null ONLY if they: revealed their budget ceiling, made an unearned concession, contradicted the playbook, or used a known anti-pattern. Be blunt. Otherwise null.
- current_tactic: name the exact briefing tactic being played right now. null if none clearly applies.
- Be a coach who has studied this specific vendor for years. Every output should feel like it could only apply to this call.
"""


def _build_context(briefing: Briefing) -> str:
    tactics_text = "\n".join(
        f"  - {t.name} (confidence {t.confidence:.0%}): {t.evidence}"
        for t in briefing.tactics
        if not t.is_anti_pattern
    )
    anti_text = "\n".join(
        f"  - AVOID {t.name}: {t.evidence}"
        for t in briefing.tactics
        if t.is_anti_pattern
    ) or "  None"
    branches_text = "\n".join(
        f"  - If {b.condition}: {b.move} (rationale: {b.rationale})"
        for b in briefing.playbook.branches
    )
    return f"""VENDOR BRIEFING:
Vendor: {briefing.vendor} | Contract: ${briefing.contract.value:,}/yr | Renewal: {briefing.contract.renewal_date} ({briefing.contract.days_remaining} days left) | Contact: {briefing.contract.contact}

PROVEN TACTICS (high confidence first):
{tactics_text}

ANTI-PATTERNS (never use these):
{anti_text}

PLAYBOOK:
  Opening: {briefing.playbook.opening.move}
{branches_text}"""


async def run_call_coach(websocket: WebSocket, briefing: Briefing) -> None:
    context = _build_context(briefing)
    transcript_lines: list[str] = []

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg.get("type") == "end":
                break

            if msg.get("type") != "transcript":
                continue

            text = msg.get("text", "").strip()
            if not text:
                continue

            transcript_lines.append(text)
            # Keep last 20 turns to avoid bloating context
            recent = "\n".join(f"  [{i+1}] {t}" for i, t in enumerate(transcript_lines[-20:]))

            user_content = f"""{context}

TRANSCRIPT (what the procurement manager has said so far):
{recent}

Latest turn: "{text}"

Coach them now. Return JSON only."""

            try:
                resp = await openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": COACH_SYSTEM},
                        {"role": "user", "content": user_content},
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=500,
                    temperature=0.4,
                )
                content = resp.choices[0].message.content or "{}"
                coaching = json.loads(content)
                await websocket.send_json({"type": "coach", **coaching})
            except Exception as e:
                try:
                    if websocket.client_state == WebSocketState.CONNECTED:
                        await websocket.send_json({"type": "error", "message": str(e)})
                except Exception:
                    pass

    except (WebSocketDisconnect, RuntimeError):
        pass
