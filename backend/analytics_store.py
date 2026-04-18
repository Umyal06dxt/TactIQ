"""Analytics queries — win rates, savings, tactic effectiveness, trends."""
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional
import database


async def get_vendor_analytics(vendor: str) -> dict:
    if not database.pool:
        return _empty_analytics(vendor)

    rows = await database.pool.fetch(
        """SELECT outcome, adherence_score, duration_secs, tactics_used,
                  deal_score, win_probability, concessions_made, savings_achieved,
                  created_at
           FROM calls WHERE vendor=$1 ORDER BY created_at DESC""",
        vendor,
    )
    records = [dict(r) for r in rows]

    total = len(records)
    if total == 0:
        return _empty_analytics(vendor)

    decided = [r for r in records if r["outcome"] in ("won", "lost")]
    wins = sum(1 for r in decided if r["outcome"] == "won")
    win_rate = round(wins / len(decided), 3) if decided else None

    adherences = [r["adherence_score"] for r in records if r["adherence_score"] is not None]
    avg_adherence = round(sum(adherences) / len(adherences), 2) if adherences else None

    durations = [r["duration_secs"] for r in records if r["duration_secs"]]
    avg_duration = int(sum(durations) / len(durations)) if durations else None

    total_savings = sum(r.get("savings_achieved") or 0 for r in records)

    tactic_counter: Counter = Counter()
    for r in records:
        for t in (r.get("tactics_used") or []):
            tactic_counter[t] += 1
    top_tactics = [{"name": t, "uses": c} for t, c in tactic_counter.most_common(5)]

    deal_scores = [r["deal_score"] for r in records if r.get("deal_score") is not None]
    avg_deal_score = int(sum(deal_scores) / len(deal_scores)) if deal_scores else None

    # 30-day trend
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    recent = [r for r in records if r["created_at"] and r["created_at"] > cutoff]
    recent_decided = [r for r in recent if r["outcome"] in ("won", "lost")]
    recent_wins = sum(1 for r in recent_decided if r["outcome"] == "won")
    recent_win_rate = round(recent_wins / len(recent_decided), 3) if recent_decided else None

    # Weekly call volume (last 8 weeks)
    weekly: dict = defaultdict(lambda: {"total": 0, "won": 0})
    for r in records:
        if not r["created_at"]:
            continue
        week = r["created_at"].strftime("%Y-W%W")
        weekly[week]["total"] += 1
        if r["outcome"] == "won":
            weekly[week]["won"] += 1
    weekly_trend = [
        {"week": w, "calls": v["total"], "wins": v["won"]}
        for w, v in sorted(weekly.items())[-8:]
    ]

    # Adherence trend
    adherence_trend = [
        {
            "date": r["created_at"].strftime("%Y-%m-%d") if r["created_at"] else "",
            "score": round(r["adherence_score"] * 100) if r["adherence_score"] else None,
            "outcome": r["outcome"],
        }
        for r in records[-20:]
        if r.get("adherence_score") is not None
    ]

    return {
        "vendor": vendor,
        "total_calls": total,
        "win_rate": win_rate,
        "recent_win_rate": recent_win_rate,
        "avg_adherence": avg_adherence,
        "avg_duration_secs": avg_duration,
        "total_savings": total_savings,
        "avg_deal_score": avg_deal_score,
        "top_tactics": top_tactics,
        "weekly_trend": weekly_trend,
        "adherence_trend": adherence_trend,
        "outcome_distribution": {
            "won": sum(1 for r in records if r["outcome"] == "won"),
            "lost": sum(1 for r in records if r["outcome"] == "lost"),
            "pending": sum(1 for r in records if r["outcome"] == "pending"),
            "escalated": sum(1 for r in records if r["outcome"] == "escalated"),
        },
    }


async def get_portfolio_analytics() -> dict:
    if not database.pool:
        return {
            "total_calls": 0, "total_vendors": 0, "portfolio_win_rate": None,
            "total_savings": 0, "avg_adherence": None, "vendor_rankings": [],
            "weekly_trend": [], "top_global_tactics": [], "deals_in_flight": [],
        }

    rows = await database.pool.fetch(
        """SELECT id, vendor, outcome, adherence_score, deal_score,
                  savings_achieved, tactics_used, created_at
           FROM calls ORDER BY created_at DESC"""
    )
    records = [dict(r) for r in rows]

    total = len(records)
    decided = [r for r in records if r["outcome"] in ("won", "lost")]
    wins = sum(1 for r in decided if r["outcome"] == "won")
    portfolio_win_rate = round(wins / len(decided), 3) if decided else None

    adherences = [r["adherence_score"] for r in records if r["adherence_score"] is not None]
    avg_adherence = round(sum(adherences) / len(adherences), 2) if adherences else None

    total_savings = sum(r.get("savings_achieved") or 0 for r in records)

    # Per-vendor rollup
    by_vendor: dict = defaultdict(list)
    for r in records:
        by_vendor[r["vendor"]].append(r)

    vendor_rankings = []
    for v, vrecs in by_vendor.items():
        vdecided = [r for r in vrecs if r["outcome"] in ("won", "lost")]
        vwins = sum(1 for r in vdecided if r["outcome"] == "won")
        vwr = round(vwins / len(vdecided), 3) if vdecided else None
        vadh = [r["adherence_score"] for r in vrecs if r["adherence_score"]]
        vsavings = sum(r.get("savings_achieved") or 0 for r in vrecs)
        vendor_rankings.append({
            "vendor": v,
            "calls": len(vrecs),
            "won": vwins,
            "decided": len(vdecided),
            "win_rate": vwr,
            "avg_adherence": round(sum(vadh) / len(vadh), 2) if vadh else None,
            "savings": vsavings,
        })
    vendor_rankings.sort(key=lambda x: (x["win_rate"] or 0), reverse=True)

    # Global tactic frequency
    tactic_counter: Counter = Counter()
    for r in records:
        for t in (r.get("tactics_used") or []):
            tactic_counter[t] += 1

    # Weekly portfolio trend
    weekly: dict = defaultdict(lambda: {"total": 0, "won": 0})
    for r in records:
        if not r["created_at"]:
            continue
        week = r["created_at"].strftime("%Y-W%W")
        weekly[week]["total"] += 1
        if r["outcome"] == "won":
            weekly[week]["won"] += 1

    # Deals in flight (pending or escalated in last 30 days)
    cutoff_30 = datetime.now(timezone.utc) - timedelta(days=30)
    deals_in_flight = [
        {
            "id": str(r["id"]) if r.get("id") else None,
            "vendor": r["vendor"],
            "outcome": r["outcome"],
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
            "narrative": (r.get("narrative") or "")[:120],
            "deal_score": r.get("deal_score"),
        }
        for r in records
        if r["outcome"] in ("pending", "escalated")
        and r.get("created_at") and r["created_at"] > cutoff_30
    ]

    return {
        "total_calls": total,
        "total_vendors": len(by_vendor),
        "portfolio_win_rate": portfolio_win_rate,
        "total_savings": total_savings,
        "avg_adherence": avg_adherence,
        "vendor_rankings": vendor_rankings,
        "weekly_trend": [
            {"week": w, "calls": v["total"], "wins": v["won"]}
            for w, v in sorted(weekly.items())[-12:]
        ],
        "top_global_tactics": [
            {"name": t, "uses": c}
            for t, c in tactic_counter.most_common(8)
        ],
        "deals_in_flight": deals_in_flight[:10],
    }


async def estimate_savings(vendor: str, contract_value: int, outcome: Optional[str]) -> int:
    """Heuristic: won calls contribute 8-15% of contract value as negotiated savings."""
    if outcome != "won":
        return 0
    if not database.pool:
        return 0
    past_wins = await database.pool.fetchval(
        "SELECT COUNT(*) FROM calls WHERE vendor=$1 AND outcome='won'", vendor
    )
    base_pct = 0.08 + min(0.07, (past_wins or 0) * 0.01)
    return int(contract_value * base_pct)


def _empty_analytics(vendor: str) -> dict:
    return {
        "vendor": vendor,
        "total_calls": 0,
        "win_rate": None,
        "recent_win_rate": None,
        "avg_adherence": None,
        "avg_duration_secs": None,
        "total_savings": 0,
        "avg_deal_score": None,
        "top_tactics": [],
        "weekly_trend": [],
        "adherence_trend": [],
        "outcome_distribution": {"won": 0, "lost": 0, "pending": 0, "escalated": 0},
    }
