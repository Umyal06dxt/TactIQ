"use client";

import { useState } from "react";
import type { CallRecord, KeyMoment } from "@/lib/types";

function fmtDuration(secs: number | null): string {
  if (secs === null) return "--:--";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const OUTCOME_STYLES: Record<string, string> = {
  won: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  lost: "bg-red-500/15 text-red-400 border border-red-500/30",
  pending: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  escalated: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
};

const MOMENT_ICONS: Record<string, string> = {
  good: "✓",
  missed: "✗",
  correction: "⚠",
  anchor: "⚓",
  concession: "↓",
};

const MOMENT_STYLES: Record<string, string> = {
  good: "border-emerald-500/30 bg-emerald-950/20",
  missed: "border-red-500/30 bg-red-950/20",
  correction: "border-yellow-500/30 bg-yellow-950/20",
  anchor: "border-blue-500/30 bg-blue-950/20",
  concession: "border-orange-500/30 bg-orange-950/20",
};

const MOMENT_ICON_STYLES: Record<string, string> = {
  good: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  missed: "bg-red-500/15 text-red-400 border border-red-500/30",
  correction: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  anchor: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  concession: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
};

const MOMENT_DEFAULT = { style: "border-white/10 bg-white/5", icon: "bg-white/8 text-white/30 border border-white/10" };

function AdherenceVisual({ score }: { score: number }) {
  const color =
    score >= 70
      ? { ring: "stroke-emerald-500", text: "text-emerald-400" }
      : score >= 40
      ? { ring: "stroke-yellow-500", text: "text-yellow-400" }
      : { ring: "stroke-red-500", text: "text-red-400" };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-24 h-24 shrink-0">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} strokeWidth="8" className="stroke-white/8 fill-none" />
          <circle
            cx="48"
            cy="48"
            r={radius}
            strokeWidth="8"
            className={`fill-none ${color.ring} transition-all`}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-black ${color.text}`}>{Math.round(score)}%</span>
        </div>
      </div>
      <div>
        <p className="text-white/50 text-sm font-semibold">Coaching Adherence</p>
        <p className={`text-sm font-bold mt-0.5 ${score >= 70 ? "text-emerald-400" : score >= 40 ? "text-yellow-400" : "text-red-400"}`}>
          {score >= 70 ? "Strong execution" : score >= 40 ? "Moderate — room to improve" : "Needs work — review key moments"}
        </p>
        <p className="text-white/20 text-xs mt-1">
          {score >= 70
            ? "Tactics deployed effectively"
            : score >= 40
            ? "Followed some suggestions, missed others"
            : "Most coaching suggestions were not applied"}
        </p>
      </div>
    </div>
  );
}

export function CallSummaryDetail({ call }: { call: CallRecord }) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-6 border-b border-white/8">
        <div>
          <h1 className="text-2xl font-bold text-white">{call.vendor.toUpperCase()}</h1>
          <p className="text-sm text-white/35 mt-1">{fmtDate(call.created_at)}</p>
          <p className="text-sm text-white/30 mt-0.5 font-mono">{fmtDuration(call.duration_secs)}</p>
        </div>
        {call.outcome && (
          <span className={`shrink-0 text-sm font-bold px-3 py-1.5 rounded-full capitalize ${OUTCOME_STYLES[call.outcome] ?? "bg-white/8 text-white/30 border border-white/10"}`}>
            {call.outcome}
          </span>
        )}
      </div>

      {/* AI Narrative */}
      {call.narrative && (
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">AI Summary</h2>
          <blockquote className="border-l-2 border-white/15 pl-4 text-white/60 leading-relaxed text-sm italic">
            {call.narrative}
          </blockquote>
        </section>
      )}

      {/* Adherence Score */}
      {call.adherence_score !== null && (
        <section className="border-t border-white/8 pt-6">
          <AdherenceVisual score={call.adherence_score} />
        </section>
      )}

      {/* Key Moments */}
      {call.key_moments && call.key_moments.length > 0 && (
        <section className="border-t border-white/8 pt-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">Key Moments</h2>
          <div className="relative space-y-3 pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-white/8" />
            {call.key_moments.map((km, i) => (
              <div key={i} className={`relative rounded-xl border p-4 ${MOMENT_STYLES[km.type] ?? MOMENT_DEFAULT.style}`}>
                <div className={`absolute -left-5 top-4 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${MOMENT_ICON_STYLES[km.type] ?? MOMENT_DEFAULT.icon}`}>
                  {MOMENT_ICONS[km.type] ?? "·"}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-white/70 leading-relaxed">{km.moment}</p>
                  <span className="shrink-0 text-[10px] text-white/20 font-mono mt-0.5">T{km.turn_index}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tactics Used */}
      {call.tactics_used && call.tactics_used.length > 0 && (
        <section className="border-t border-white/8 pt-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Tactics Used</h2>
          <div className="flex flex-wrap gap-2">
            {call.tactics_used.map((t) => (
              <span
                key={t}
                className="bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-medium px-3 py-1 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Transcript (collapsible) */}
      {call.transcript && call.transcript.length > 0 && (
        <section className="border-t border-white/8 pt-6">
          <button
            onClick={() => setTranscriptOpen((o) => !o)}
            className="flex items-center justify-between w-full text-left group"
          >
            <h2 className="text-xs font-black uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors">
              Transcript ({call.transcript.length} lines)
            </h2>
            <span className="text-white/20 text-sm group-hover:text-white/40 transition-colors">
              {transcriptOpen ? "▲" : "▼"}
            </span>
          </button>
          {transcriptOpen && (
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-1">
              {call.transcript.map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span className="shrink-0 text-[10px] text-white/20 font-mono w-6 text-right mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-white/55 leading-relaxed">{line}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
