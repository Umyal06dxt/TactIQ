"""Dynamic vendor management — DB-backed with fallback to hardcoded meta."""
import re
from datetime import date
from typing import Optional
import database
from vendors_meta import VENDOR_META


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", name.lower())[:24]


async def seed_vendors_if_empty() -> None:
    """Populate vendors table from VENDOR_META if empty."""
    if not database.pool:
        return
    count = await database.pool.fetchval("SELECT COUNT(*) FROM vendors")
    if count and count > 0:
        return
    for bank_id, meta in VENDOR_META.items():
        try:
            await database.pool.execute(
                """INSERT INTO vendors (bank_id, name, annual_value, renewal_date, contact)
                   VALUES ($1,$2,$3,$4,$5)
                   ON CONFLICT (bank_id) DO NOTHING""",
                bank_id, meta["name"], meta["annual_value"],
                date.fromisoformat(meta["renewal_date"]), meta["contact"],
            )
        except Exception:
            pass


async def list_vendors() -> list[dict]:
    if not database.pool:
        return [
            {
                "bank_id": bid, "name": m["name"], "annual_value": m["annual_value"],
                "renewal_date": m["renewal_date"], "contact": m["contact"],
                "contact_email": "", "notes": "", "industry": "", "risk_level": "medium",
                "interaction_count": m.get("interaction_count", 0),
                "tactic_count": m.get("tactic_count", 0),
            }
            for bid, m in VENDOR_META.items()
        ]
    rows = await database.pool.fetch(
        "SELECT * FROM vendors ORDER BY renewal_date ASC"
    )
    return [_enrich(dict(r)) for r in rows]


async def get_vendor(bank_id: str) -> Optional[dict]:
    if not database.pool:
        meta = VENDOR_META.get(bank_id)
        if not meta:
            return None
        return {"bank_id": bank_id, **meta}
    row = await database.pool.fetchrow("SELECT * FROM vendors WHERE bank_id=$1", bank_id)
    return _enrich(dict(row)) if row else None


async def create_vendor(
    name: str,
    annual_value: int,
    renewal_date: str,
    contact: str,
    contact_email: str = "",
    notes: str = "",
    industry: str = "",
    risk_level: str = "medium",
    bank_id: Optional[str] = None,
) -> dict:
    if not database.pool:
        raise RuntimeError("Database not available")
    bid = bank_id or _slug(name)
    # ensure uniqueness
    existing = await database.pool.fetchval("SELECT COUNT(*) FROM vendors WHERE bank_id=$1", bid)
    if existing:
        bid = f"{bid}{existing}"
    row = await database.pool.fetchrow(
        """INSERT INTO vendors (bank_id, name, annual_value, renewal_date, contact,
                               contact_email, notes, industry, risk_level)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           RETURNING *""",
        bid, name, annual_value, date.fromisoformat(renewal_date),
        contact, contact_email, notes, industry, risk_level,
    )
    return _enrich(dict(row))


async def update_vendor(bank_id: str, updates: dict) -> Optional[dict]:
    if not database.pool:
        raise RuntimeError("Database not available")
    allowed = {"name", "annual_value", "renewal_date", "contact", "contact_email",
                "notes", "industry", "risk_level"}
    fields = {k: v for k, v in updates.items() if k in allowed}
    if not fields:
        return await get_vendor(bank_id)
    sets = ", ".join(f"{k}=${i+2}" for i, k in enumerate(fields))
    values = list(fields.values())
    if "renewal_date" in fields:
        idx = list(fields.keys()).index("renewal_date")
        values[idx] = date.fromisoformat(str(values[idx]))
    row = await database.pool.fetchrow(
        f"UPDATE vendors SET {sets}, updated_at=now() WHERE bank_id=$1 RETURNING *",
        bank_id, *values,
    )
    return _enrich(dict(row)) if row else None


async def delete_vendor(bank_id: str) -> bool:
    if not database.pool:
        raise RuntimeError("Database not available")
    result = await database.pool.execute("DELETE FROM vendors WHERE bank_id=$1", bank_id)
    return result == "DELETE 1"


def _enrich(row: dict) -> dict:
    renewal = row.get("renewal_date")
    if renewal and not isinstance(renewal, str):
        renewal = str(renewal)
    from datetime import datetime
    days_remaining = 0
    if renewal:
        try:
            days_remaining = max(0, (date.fromisoformat(renewal) - date.today()).days)
        except Exception:
            pass
    meta = VENDOR_META.get(row.get("bank_id", ""), {})
    return {
        **row,
        "renewal_date": renewal,
        "days_remaining": days_remaining,
        "interaction_count": meta.get("interaction_count", 0),
        "tactic_count": meta.get("tactic_count", 0),
        "id": str(row.get("id", "")),
    }
