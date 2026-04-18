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
  won: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  lost: "bg-red-50 text-red-700 border border-red-200",
  pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  escalated: "bg-orange-50 text-orange-700 border border-orange-200",
};

export function CallSummaryCard({ call, vendor }: { call: CallRecord; vendor: string }) {
  const score = call.adherence_score != null ? Math.round(call.adherence_score * 100) : null;
  const scoreColor =
    score == null ? "bg-neutral-200" :
    score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";

  return (
    <Link
      href={`/calls/${vendor}/${call.id}`}
      className="block rounded-2xl bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all px-5 py-4 group shadow-sm"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <p className="text-xs text-neutral-400 font-mono">{fmtDate(call.created_at)}</p>
          <p className="text-sm font-semibold text-gray-700 mt-0.5 font-mono">{fmtDuration(call.duration_secs)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {call.deal_score != null && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
              call.deal_score >= 70 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              call.deal_score >= 40 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
              "bg-red-50 text-red-700 border-red-200"
            }`}>
              {call.deal_score}/100
            </span>
          )}
          {call.outcome && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${OUTCOME_STYLES[call.outcome] ?? "bg-neutral-100 text-neutral-500 border border-neutral-200"}`}>
              {call.outcome}
            </span>
          )}
        </div>
      </div>

      {score !== null && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Coaching adherence</span>
            <span className="text-[10px] text-neutral-500 font-mono font-bold">{score}%</span>
          </div>
          <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${scoreColor} transition-all`}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
        </div>
      )}

      {call.narrative && (
        <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2 group-hover:text-neutral-700 transition-colors">
          {call.narrative.slice(0, 120)}{call.narrative.length > 120 ? "…" : ""}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {call.savings_achieved != null && call.savings_achieved > 0 && (
            <span className="text-xs text-emerald-600 font-bold">
              ${call.savings_achieved.toLocaleString()} saved
            </span>
          )}
          {call.concessions_made != null && call.concessions_made > 0 && (
            <span className="text-xs text-red-500">
              {call.concessions_made} concession{call.concessions_made !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span className="text-xs text-neutral-400 group-hover:text-emerald-600 transition-colors font-medium">
          View details →
        </span>
      </div>
    </Link>
  );
}
