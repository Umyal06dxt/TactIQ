"use client";

import { useState } from "react";
import type { CallRecord, KeyMoment } from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function fmtDuration(secs: number | null): string {
  if (secs === null) return "--:--";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

const OUTCOME_STYLES: Record<string, string> = {
  won: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  lost: "bg-red-500/15 text-red-400 border border-red-500/30",
  pending: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  escalated: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
};

const MOMENT_ICONS: Record<string, string> = {
  good: "✓", missed: "✗", correction: "⚠", anchor: "⚓", concession: "↓",
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
            cx="48" cy="48" r={radius} strokeWidth="8"
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
          {score >= 70 ? "Tactics deployed effectively" : score >= 40 ? "Followed some suggestions, missed others" : "Most coaching suggestions were not applied"}
        </p>
      </div>
    </div>
  );
}

function DealScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "Excellent" : score >= 55 ? "Good" : score >= 40 ? "Average" : "Poor";
  const r = 32;
  const circ = 2 * Math.PI * r;
  const filled = circ * (score / 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} strokeWidth="6" className="stroke-white/8 fill-none" />
          <circle
            cx="36" cy="36" r={r} strokeWidth="6" fill="none"
            stroke={color}
            strokeDasharray={`${filled} ${circ - filled}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-black" style={{ color }}>{score}</span>
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color }}>{label}</p>
    </div>
  );
}

function FollowUpEmailPanel({ callId, vendor }: { callId: string; vendor: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [email, setEmail] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setState("loading");
    try {
      const res = await fetch(`${BASE}/api/calls/${vendor}/${callId}/follow-up`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setEmail(data);
      setState("done");
    } catch {
      setState("error");
    }
  };

  const copy = () => {
    if (!email) return;
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="border-t border-white/8 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-white/30">Follow-up Email</h2>
        {state === "idle" && (
          <button
            onClick={generate}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-all"
          >
            Generate with AI
          </button>
        )}
        {state === "loading" && (
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
            Drafting…
          </div>
        )}
        {state === "done" && (
          <button
            onClick={copy}
            className="text-xs font-bold text-white/40 hover:text-white/70 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
        {state === "error" && (
          <button onClick={generate} className="text-xs text-red-400 hover:text-red-300">Retry</button>
        )}
      </div>

      {state === "idle" && (
        <p className="text-xs text-white/20 italic">AI-drafted follow-up email based on this call's outcome and key moments.</p>
      )}

      {state === "done" && email && (
        <div className="rounded-xl border border-white/10 bg-white/3 p-4 space-y-3">
          <div>
            <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Subject</p>
            <p className="text-sm font-semibold text-white/70">{email.subject}</p>
          </div>
          <div className="h-px bg-white/8" />
          <div>
            <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Body</p>
            <pre className="text-xs text-white/55 leading-relaxed whitespace-pre-wrap font-sans">{email.body}</pre>
          </div>
        </div>
      )}
    </section>
  );
}

export function CallSummaryDetail({ call }: { call: CallRecord }) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const adherenceScore = call.adherence_score != null ? call.adherence_score * 100 : null;
  const winProbPct = call.win_probability != null ? Math.round(call.win_probability * 100) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-6 border-b border-white/8">
        <div>
          <h1 className="text-2xl font-bold text-white">{call.vendor.toUpperCase()}</h1>
          <p className="text-sm text-white/35 mt-1">{fmtDate(call.created_at)}</p>
          <p className="text-sm text-white/30 mt-0.5 font-mono">{fmtDuration(call.duration_secs)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {call.outcome && (
            <span className={`shrink-0 text-sm font-bold px-3 py-1.5 rounded-full capitalize ${OUTCOME_STYLES[call.outcome] ?? "bg-white/8 text-white/30 border border-white/10"}`}>
              {call.outcome}
            </span>
          )}
          {call.savings_achieved != null && call.savings_achieved > 0 && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              {fmt$(call.savings_achieved)} saved
            </span>
          )}
        </div>
      </div>

      {/* Deal Intelligence strip */}
      {(call.deal_score != null || winProbPct != null || call.concessions_made != null) && (
        <section className="grid grid-cols-3 gap-4">
          {call.deal_score != null && (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4 flex flex-col items-center gap-2">
              <DealScoreRing score={call.deal_score} />
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Deal Score</p>
            </div>
          )}
          {winProbPct != null && (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 text-center">
              <p className={`text-3xl font-black ${winProbPct >= 60 ? "text-emerald-400" : winProbPct >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                {winProbPct}%
              </p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Win Probability</p>
              <p className={`text-xs font-semibold ${winProbPct >= 60 ? "text-emerald-400" : winProbPct >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                {winProbPct >= 60 ? "Likely won" : winProbPct >= 40 ? "Uncertain" : "At risk"}
              </p>
            </div>
          )}
          {call.concessions_made != null && (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 text-center">
              <p className={`text-3xl font-black ${call.concessions_made === 0 ? "text-emerald-400" : call.concessions_made <= 2 ? "text-yellow-400" : "text-red-400"}`}>
                {call.concessions_made}
              </p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Concessions</p>
              <p className={`text-xs font-semibold ${call.concessions_made === 0 ? "text-emerald-400" : "text-orange-400"}`}>
                {call.concessions_made === 0 ? "Zero unearned" : "unearned moves"}
              </p>
            </div>
          )}
        </section>
      )}

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
      {adherenceScore !== null && (
        <section className="border-t border-white/8 pt-6">
          <AdherenceVisual score={adherenceScore} />
        </section>
      )}

      {/* Key Moments */}
      {call.key_moments && call.key_moments.length > 0 && (
        <section className="border-t border-white/8 pt-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">Key Moments</h2>
          <div className="relative space-y-3 pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-white/8" />
            {call.key_moments.map((km: KeyMoment, i: number) => (
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
              <span key={t} className="bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-medium px-3 py-1 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Follow-up email */}
      <FollowUpEmailPanel callId={call.id} vendor={call.vendor} />

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
                  <span className="shrink-0 text-[10px] text-white/20 font-mono w-6 text-right mt-0.5">{i + 1}</span>
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
