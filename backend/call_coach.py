from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState
from openai import AsyncOpenAI
import json
import os

from models import Briefing
from prompts import CALL_COACH_SYSTEM

openai_client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))


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
    concession_count = 0
    win_prob = 50

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
            recent = "\n".join(f"  [{i+1}] {t}" for i, t in enumerate(transcript_lines[-20:]))

            user_content = f"""{context}

TRANSCRIPT (what the procurement manager has said so far):
{recent}

Latest turn: "{text}"

Current win probability estimate: {win_prob}%
Concessions made so far: {concession_count}

Coach them now. Return JSON only."""

            try:
                resp = await openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": CALL_COACH_SYSTEM},
                        {"role": "user", "content": user_content},
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=600,
                    temperature=0.4,
                )
                content = resp.choices[0].message.content or "{}"
                coaching = json.loads(content)

                # Update running state
                if coaching.get("win_probability") is not None:
                    win_prob = int(coaching["win_probability"])
                if coaching.get("concession_alert"):
                    concession_count += 1

                await websocket.send_json({
                    "type": "coach",
                    "suggestions": coaching.get("suggestions", []),
                    "warnings": coaching.get("warnings", []),
                    "correction": coaching.get("correction"),
                    "current_tactic": coaching.get("current_tactic"),
                    "win_probability": win_prob,
                    "concession_alert": coaching.get("concession_alert"),
                    "deal_momentum": coaching.get("deal_momentum", "neutral"),
                    "coach_note": coaching.get("coach_note"),
                    "concession_count": concession_count,
                })
            except Exception as e:
                try:
                    if websocket.client_state == WebSocketState.CONNECTED:
                        await websocket.send_json({"type": "error", "message": str(e)})
                except Exception:
                    pass

    except (WebSocketDisconnect, RuntimeError):
        pass
