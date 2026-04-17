import Link from "next/link";
import type { CallRecord } from "@/lib/types";

function fmtDuration(secs: number | null): string {
  if (secs === null) return "--:--";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const OUTCOME_STYLES: Record<string, string> = {
  won: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  lost: "bg-red-500/15 text-red-400 border border-red-500/30",
  pending: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  escalated: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
};

export function CallSummaryCard({ call, vendor }: { call: CallRecord; vendor: string }) {
  const score = call.adherence_score ?? 0;
  const scoreColor =
    score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";

  return (
    <Link
      href={`/calls/${vendor}/${call.id}`}
      className="block rounded-2xl bg-[#05080f] border border-white/8 hover:border-white/20 transition-all px-5 py-4 group"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <p className="text-xs text-white/30 font-mono">{fmtDate(call.created_at)}</p>
          <p className="text-sm font-semibold text-white/80 mt-0.5 font-mono">{fmtDuration(call.duration_secs)}</p>
        </div>
        {call.outcome && (
          <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full capitalize ${OUTCOME_STYLES[call.outcome] ?? "bg-white/8 text-white/30 border border-white/10"}`}>
            {call.outcome}
          </span>
        )}
      </div>

      {call.adherence_score !== null && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/20 uppercase tracking-wider">Adherence</span>
            <span className="text-[10px] text-white/40 font-mono">{Math.round(score)}%</span>
          </div>
          <div className="h-1 w-full bg-white/8 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${scoreColor} transition-all`}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
        </div>
      )}

      {call.narrative && (
        <p className="text-xs text-white/35 leading-relaxed line-clamp-2 group-hover:text-white/50 transition-colors">
          {call.narrative.slice(0, 100)}{call.narrative.length > 100 ? "…" : ""}
        </p>
      )}
    </Link>
  );
}
