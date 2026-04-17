"""Briefing adapter: confidence formula + DB-backed cache."""
import json
import time
from datetime import datetime, timezone
from typing import Dict, Tuple
from models import Briefing
from pipeline import run_briefing, extract_briefing

_cache: Dict[str, Tuple[Briefing, float]] = {}
_MEM_TTL = 300.0   # 5 min hot cache
_DB_TTL  = 86400   # 24 h DB cache


def confidence(successes: int, total_uses: int, months_since_last_use: float) -> float:
    if total_uses == 0:
        return 0.0
    base = successes / total_uses
    recency_decay = max(0.3, 0.9 ** months_since_last_use)
    return round(base * recency_decay, 2)


def _days_remaining(renewal_date: str) -> int:
    target = datetime.strptime(renewal_date, "%Y-%m-%d")
    return max(0, (target - datetime.utcnow()).days)


async def build_briefing(bank_id: str, vendor_meta: dict) -> Briefing:
    raw, trail = await run_briefing(bank_id, vendor_meta)
    return extract_briefing(raw, vendor_meta, bank_id, trail)


async def cached_briefing(bank_id: str, vendor_meta: dict) -> Briefing:
    import database

    # 1. Hot in-memory cache
    entry = _cache.get(bank_id)
    if entry and time.monotonic() - entry[1] < _MEM_TTL:
        return entry[0]

    # 2. DB cache
    if database.pool:
        row = await database.pool.fetchrow(
            "SELECT data, generated_at FROM briefings WHERE vendor=$1", bank_id
        )
        if row:
            age = (datetime.now(timezone.utc) - row["generated_at"]).total_seconds()
            if age < _DB_TTL:
                data = row["data"]
                if isinstance(data, str):
                    data = json.loads(data)
                briefing = Briefing(**data)
                _cache[bank_id] = (briefing, time.monotonic())
                return briefing

    # 3. Generate fresh
    briefing = await build_briefing(bank_id, vendor_meta)

    # 4. Persist to DB
    if database.pool:
        await database.pool.execute(
            """INSERT INTO briefings (vendor, data, generated_at)
               VALUES ($1, $2, now())
               ON CONFLICT (vendor) DO UPDATE
                 SET data=$2, generated_at=now()""",
            bank_id, json.dumps(briefing.model_dump()),
        )

    _cache[bank_id] = (briefing, time.monotonic())
    return briefing


async def invalidate_cache(bank_id: str) -> None:
    import database
    _cache.pop(bank_id, None)
    if database.pool:
        await database.pool.execute(
            "DELETE FROM briefings WHERE vendor=$1", bank_id
        )
