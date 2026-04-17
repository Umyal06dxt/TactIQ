"""Briefing adapter: confidence formula + thin wrapper calling the Agents-SDK pipeline."""
from datetime import datetime
from models import Briefing
from pipeline import run_briefing, extract_briefing


def confidence(successes: int, total_uses: int, months_since_last_use: float) -> float:
    """Core confidence formula.

    base = successes / total_uses
    recency = max(0.3, 0.9^months_since_last_use)
    result = round(base * recency, 2)
    """
    if total_uses == 0:
        return 0.0
    base = successes / total_uses
    recency_decay = max(0.3, 0.9 ** months_since_last_use)
    return round(base * recency_decay, 2)


def _days_remaining(renewal_date: str) -> int:
    target = datetime.strptime(renewal_date, "%Y-%m-%d")
    return max(0, (target - datetime.utcnow()).days)


async def build_briefing(bank_id: str, vendor_meta: dict) -> Briefing:
    """Run the Agents SDK pipeline and assemble the final Briefing."""
    raw, trail = await run_briefing(bank_id, vendor_meta)
    return extract_briefing(raw, vendor_meta, bank_id, trail)
