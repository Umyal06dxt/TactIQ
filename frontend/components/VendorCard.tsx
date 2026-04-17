import Link from "next/link";
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
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function VendorCard({ v }: { v: Vendor }) {
  const daysLeft = v.days_remaining;
  const isUrgent = daysLeft < 30;
  const isWarning = daysLeft >= 30 && daysLeft < 60;
  const isSoon = daysLeft >= 60 && daysLeft < 90;

  const urgencyLabel =
    isUrgent ? { text: `${daysLeft}d — URGENT`, cls: "bg-red-50 text-red-700 border-red-200" } :
    isWarning ? { text: `${daysLeft}d — Act soon`, cls: "bg-orange-50 text-orange-700 border-orange-200" } :
    isSoon ? { text: `${daysLeft}d — Coming up`, cls: "bg-amber-50 text-amber-700 border-amber-200" } :
    { text: `${daysLeft} days`, cls: "bg-neutral-50 text-neutral-500 border-neutral-200" };

  return (
    <Link
      href={`/briefing/${v.bank_id}`}
      className={`group block rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 ${
        isUrgent ? "border-red-200 ring-1 ring-red-100" : "border-neutral-200"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-black text-gray-900 tracking-tight group-hover:text-emerald-700 transition-colors">
            {v.name}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">{v.contact}</p>
        </div>
        <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${urgencyLabel.cls}`}>
          {urgencyLabel.text}
        </span>
      </div>

      {/* Contract value */}
      <div className="mb-4">
        <p className="text-2xl font-black tracking-tight text-gray-900">
          ${v.annual_value.toLocaleString()}
          <span className="text-sm font-medium text-neutral-400">/yr</span>
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">Renewal {v.renewal_date}</p>
      </div>

      {/* Risk bar */}
      <RiskBar days={daysLeft} />

      {/* Stats row */}
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-xs text-neutral-500">{v.tactic_count} tactics</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
          <span className="text-xs text-neutral-500">{v.interaction_count} interactions</span>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
            Open briefing →
          </span>
        </div>
      </div>
    </Link>
  );
}
