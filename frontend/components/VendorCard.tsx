"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Vendor } from "@/lib/types";

function RiskBar({ days }: { days: number }) {
  const pct = Math.min(100, Math.max(0, ((365 - days) / 365) * 100));
  const color =
    days < 30 ? "bg-red-500" :
    days < 60 ? "bg-orange-400" :
    days < 90 ? "bg-amber-400" :
    "bg-emerald-400";
  return (
    <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    high: "bg-red-50 text-red-600 border-red-200",
    medium: "bg-amber-50 text-amber-600 border-amber-200",
    low: "bg-emerald-50 text-emerald-600 border-emerald-200",
  };
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${styles[level] ?? styles.medium}`}>
      {level}
    </span>
  );
}

export function VendorCard({ v }: { v: Vendor }) {
  const router = useRouter();
  const daysLeft = v.days_remaining;
  const isUrgent = daysLeft < 30;
  const isWarning = daysLeft >= 30 && daysLeft < 60;
  const isSoon = daysLeft >= 60 && daysLeft < 90;

  const urgencyLabel =
    isUrgent ? { text: `${daysLeft}d — URGENT`, cls: "bg-red-50 text-red-700 border-red-200" } :
    isWarning ? { text: `${daysLeft}d — Act soon`, cls: "bg-orange-50 text-orange-700 border-orange-200" } :
    isSoon ? { text: `${daysLeft}d — Coming up`, cls: "bg-amber-50 text-amber-700 border-amber-200" } :
    { text: `${daysLeft} days`, cls: "bg-neutral-50 text-neutral-500 border-neutral-200" };

  const fmt$ = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : `$${(n/1_000).toFixed(0)}k`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/briefing/${v.bank_id}`)}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/briefing/${v.bank_id}`)}
      className={`group block rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
        isUrgent ? "border-red-200 ring-1 ring-red-100" : "border-neutral-200"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-base font-black text-gray-900 tracking-tight group-hover:text-emerald-700 transition-colors truncate">
              {v.name}
            </h3>
            {v.risk_level && v.risk_level !== "medium" && <RiskBadge level={v.risk_level} />}
          </div>
          <p className="text-xs text-neutral-400 truncate">{v.contact}</p>
          {v.industry && <p className="text-[10px] text-neutral-300 mt-0.5">{v.industry}</p>}
        </div>
        <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${urgencyLabel.cls}`}>
          {urgencyLabel.text}
        </span>
      </div>

      {/* Contract value */}
      <div className="mb-4">
        <p className="text-2xl font-black tracking-tight text-gray-900">
          {fmt$(v.annual_value)}
          <span className="text-sm font-medium text-neutral-400">/yr</span>
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">Renewal {v.renewal_date}</p>
      </div>

      {/* Risk bar */}
      <RiskBar days={daysLeft} />

      {/* Stats row */}
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        {v.tactic_count > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-xs text-neutral-500">{v.tactic_count} tactics</span>
          </div>
        )}
        {v.interaction_count > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
            <span className="text-xs text-neutral-500">{v.interaction_count} interactions</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
            Open briefing →
          </span>
        </div>
      </div>

      {/* Quick action row — proper links, not nested inside another <a> */}
      <div className="mt-4 pt-4 border-t border-neutral-100 flex gap-2">
        <Link
          href={`/briefing/${v.bank_id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-center text-xs font-semibold text-neutral-500 hover:text-emerald-600 transition-colors py-1.5 rounded-lg hover:bg-emerald-50"
        >
          Briefing
        </Link>
        <Link
          href={`/call/${v.bank_id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-center text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors py-1.5 rounded-lg"
        >
          Start Call
        </Link>
        <Link
          href={`/calls/${v.bank_id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-center text-xs font-semibold text-neutral-500 hover:text-blue-600 transition-colors py-1.5 rounded-lg hover:bg-blue-50"
        >
          History
        </Link>
      </div>
    </div>
  );
}
