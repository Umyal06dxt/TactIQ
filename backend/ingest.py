"""Post-call ingest flow: capture_old → retain → reflect → diff."""
import time
from typing import List, Dict
from briefing import build_briefing
from models import IngestRequest, IngestResponse, ScoreDiff, PipelineStep

DIFF_THRESHOLD = 0.01


def compute_diffs(old_tactics: List[dict], new_tactics: List[dict]) -> Dict[str, dict]:
    """Return {name: {old, new, delta, direction}} for tactics changed >= DIFF_THRESHOLD."""
    old_map = {t["name"]: t["confidence"] for t in old_tactics}
    diffs: Dict[str, dict] = {}
    for t in new_tactics:
        name = t["name"]
        new_c = t["confidence"]
        old_c = old_map.get(name, 0.0)
        delta = new_c - old_c
        if abs(delta) < DIFF_THRESHOLD:
            continue
        diffs[name] = {
            "old": round(old_c, 2),
            "new": round(new_c, 2),
            "delta": round(delta, 2),
            "direction": "up" if delta > 0 else "down",
        }
    return diffs


async def run_ingest(req: IngestRequest, vendor_meta: dict, hindsight_client) -> IngestResponse:
    """Four-step §5.4 flow with outer step timings."""
    trail: List[PipelineStep] = []

    def _timed_step(name: str, label: str, ms: int, status: str = "ok") -> None:
        trail.append(PipelineStep(step=name, status=status, ms=ms, label=label))

    t0 = time.perf_counter()
    old_briefing = await build_briefing(req.vendor, vendor_meta)
    old_tactics = [t.model_dump() for t in old_briefing.tactics]
    _timed_step("capture_old_scores", "Snapshotting current confidences", int((time.perf_counter() - t0) * 1000))

    t0 = time.perf_counter()
    hindsight_client.retain(
        bank_id=req.vendor,
        content=req.notes,
        metadata={"outcome": req.outcome, "timestamp": req.timestamp, "type": "call"},
    )
    _timed_step("retain", "Storing new interaction in Hindsight", int((time.perf_counter() - t0) * 1000))

    t0 = time.perf_counter()
    new_briefing = await build_briefing(req.vendor, vendor_meta)
    new_tactics = [t.model_dump() for t in new_briefing.tactics]
    _timed_step("reflect", "Re-synthesizing tactics via BriefingAgent", int((time.perf_counter() - t0) * 1000))

    t0 = time.perf_counter()
    diffs_raw = compute_diffs(old_tactics, new_tactics)
    score_diffs = {k: ScoreDiff(**v) for k, v in diffs_raw.items()}
    _timed_step("diff", "Computing score diffs", int((time.perf_counter() - t0) * 1000))

    new_briefing.pipeline_trail = trail
    return IngestResponse(briefing=new_briefing, score_diffs=score_diffs, pipeline_trail=trail)
