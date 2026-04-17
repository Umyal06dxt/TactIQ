"""OpenAI Agents SDK orchestration for LEVERAGE."""
from __future__ import annotations
import json
import os
import time
from typing import Any, List, Optional

from agents import Agent, Runner, RunHooks, function_tool
from openai import OpenAI

from prompts import AGENT_INSTRUCTIONS, BRIEFING_PROMPT
from models import PipelineStep

MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")
_openai = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

_hindsight: Optional[Any] = None


def set_hindsight_client(client: Any) -> None:
    global _hindsight
    _hindsight = client


@function_tool
def recall_memories(bank_id: str) -> str:
    """Recall Hindsight memories for a vendor bank.

    Args:
        bank_id: Hindsight bank identifier (e.g., 'nexacloud').

    Returns:
        JSON string of the recalled memory payload.
    """
    assert _hindsight is not None, "pipeline.set_hindsight_client() was never called"
    response = _hindsight.reflect(
        bank_id=bank_id,
        query="negotiation tactics, concessions, outcomes, strategies, patterns, anti-patterns",
    )
    return json.dumps(response.model_dump(), default=str)


@function_tool
def synthesize_briefing(vendor_name: str, memories_json: str) -> str:
    """Synthesize a negotiation briefing JSON from recalled memories.

    Args:
        vendor_name: Display name of the vendor.
        memories_json: JSON string returned by recall_memories.

    Returns:
        JSON string with tactics, playbook, signals.
    """
    user_content = f"Vendor: {vendor_name}\n\nHindsight data:\n{memories_json}"
    resp = _openai.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": BRIEFING_PROMPT},
            {"role": "user", "content": user_content},
        ],
        temperature=0.2,
    )
    return resp.choices[0].message.content or "{}"


@function_tool
def rank_tactics(tactics_json: str) -> str:
    """Sort tactics by confidence descending."""
    tactics = json.loads(tactics_json)
    tactics.sort(key=lambda t: t.get("confidence", 0.0), reverse=True)
    return json.dumps(tactics)


BRIEFING_AGENT = Agent(
    name="BriefingAgent",
    model=MODEL,
    instructions=AGENT_INSTRUCTIONS,
    tools=[recall_memories, synthesize_briefing, rank_tactics],
)

_TOOL_LABELS = {
    "recall_memories": "Recalling memories from Hindsight",
    "synthesize_briefing": "Synthesizing tactics via gpt-4o",
    "rank_tactics": "Ranking tactics by confidence",
}


class PipelineHooks(RunHooks):
    def __init__(self) -> None:
        self.steps: List[PipelineStep] = []
        self._starts: dict[str, float] = {}

    async def on_tool_start(self, context, agent, tool) -> None:
        self._starts[tool.name] = time.perf_counter()

    async def on_tool_end(self, context, agent, tool, result) -> None:
        t0 = self._starts.pop(tool.name, time.perf_counter())
        ms = int((time.perf_counter() - t0) * 1000)
        self.steps.append(PipelineStep(
            step=tool.name,
            status="ok",
            ms=ms,
            label=_TOOL_LABELS.get(tool.name, tool.name),
        ))


async def run_briefing(bank_id: str, vendor_meta: dict) -> tuple[dict, List[PipelineStep]]:
    """Run BriefingAgent pipeline. Returns (raw_dict, pipeline_trail)."""
    hooks = PipelineHooks()
    user_input = (
        f"Build a negotiation briefing for vendor '{vendor_meta['name']}' "
        f"(bank_id='{bank_id}'). Contact: {vendor_meta['contact']}. "
        f"Contract ${vendor_meta['annual_value']:,}/yr, renewal {vendor_meta['renewal_date']}. "
        f"Follow your instructions exactly: recall -> synthesize -> rank. "
        f"Return the complete briefing JSON as your final answer."
    )
    result = await Runner.run(BRIEFING_AGENT, input=user_input, hooks=hooks)
    raw = json.loads(result.final_output)
    # Agent sometimes wraps output: {"briefing": {...}} — unwrap if needed
    if "briefing" in raw and "tactics" not in raw:
        raw = raw["briefing"]
    return raw, hooks.steps


def _norm_playbook(pb) -> dict:
    """Coerce LLM playbook output into the expected schema."""
    if not isinstance(pb, dict):
        pb = {"opening": {"move": str(pb), "rationale": "", "tactic_ref": ""}, "branches": []}

    opening = pb.get("opening", {})
    if isinstance(opening, str):
        opening = {"move": opening, "rationale": "", "tactic_ref": ""}
    opening.setdefault("rationale", "")
    opening.setdefault("tactic_ref", "")

    branches = []
    for b in pb.get("branches", []):
        if isinstance(b, str):
            b = {"condition": b, "move": b, "rationale": "", "tactic_ref": "", "followup": None}
        b.setdefault("move", b.get("condition", ""))
        b.setdefault("rationale", "")
        b.setdefault("tactic_ref", "")
        followup = b.get("followup")
        if isinstance(followup, str) or followup is None:
            b["followup"] = None
        branches.append(b)

    return {"opening": opening, "branches": branches}


def _norm_signals(items: list, kind: str) -> list:
    """Coerce string signals into proper dicts."""
    out = []
    for item in items:
        if isinstance(item, str):
            if kind == "temporal":
                out.append({"label": item, "severity": "medium"})
            else:
                out.append({"date": "", "source": "unknown", "summary": item, "interpretation": ""})
        else:
            out.append(item)
    return out


def extract_briefing(raw: dict, vendor_meta: dict, bank_id: str, trail: List[PipelineStep]):
    from briefing import _days_remaining
    from models import Briefing
    return Briefing(
        vendor=bank_id,
        contract={
            "value": vendor_meta["annual_value"],
            "renewal_date": vendor_meta["renewal_date"],
            "days_remaining": _days_remaining(vendor_meta["renewal_date"]),
            "contact": vendor_meta["contact"],
        },
        tactics=raw.get("tactics", []),
        playbook=_norm_playbook(raw.get("playbook", {})),
        temporal_signals=_norm_signals(raw.get("temporal_signals", []), "temporal"),
        recent_signals=_norm_signals(raw.get("recent_signals", []), "recent"),
        pipeline_trail=[s.model_dump() for s in trail],
    )
