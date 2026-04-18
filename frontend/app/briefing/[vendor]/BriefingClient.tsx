"use client";
import { useState, useCallback, useEffect } from "react";
import type { Briefing, NoMemoryResponse, ScoreDiff, CallRecord, EmailThread } from "@/lib/types";
import { api } from "@/lib/api";
import { MemoryToggle } from "@/components/MemoryToggle";
import { PipelineStatus } from "@/components/PipelineStatus";
import { TacticCard } from "@/components/TacticCard";
import { Playbook } from "@/components/Playbook";
import { AntiPatternSparkline } from "@/components/AntiPatternSparkline";
import { SignalFeed } from "@/components/SignalFeed";
import { PostCallForm } from "@/components/PostCallForm";
import { ScoreDiff as ScoreDiffPanel } from "@/components/ScoreDiff";
import { GmailConnect } from "@/components/GmailConnect";

function fmtCallDuration(secs: number | null): string {
  if (secs === null) return "--:--";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtCallDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const OUTCOME_BADGE: Record<string, string> = {
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
  escalated: "bg-orange-100 text-orange-700",
};

export function BriefingClient({ vendor, initial }: { vendor: string; initial: Briefing }) {
  const [memoryOn, setMemoryOn] = useState(true);
  const [briefing, setBriefing] = useState<Briefing>(initial);
  const [nomem, setNomem] = useState<NoMemoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [diffs, setDiffs] = useState<Record<string, ScoreDiff> | null>(null);
  const [flashTactics, setFlashTactics] = useState<Set<string>>(new Set());
  const [recentCalls, setRecentCalls] = useState<CallRecord[]>([]);
  const [emails, setEmails] = useState<EmailThread[]>([]);

  useEffect(() => {
    api.calls.list(vendor).then((data) => {
      setRecentCalls(data.calls.slice(0, 3));
    }).catch(() => {});
  }, [vendor]);

  useEffect(() => {
    api.gmail.emails(vendor, briefing.contract.contact).then((data) => {
      setEmails(data.emails);
    }).catch(() => {});
  }, [vendor, briefing.contract.contact]);

  const toggleMemory = useCallback(async (next: boolean) => {
    setLoading(true);
    setMemoryOn(next);
    try {
      if (next) {
        const b = await api.briefing(vendor);
        setBriefing(b);
        setNomem(null);
      } else {
        const n = await api.nomemory(vendor);
        setNomem(n);
      }
    } finally {
      setLoading(false);
    }
  }, [vendor]);

  const onSubmitLog = useCallback(async (notes: string, outcome: string) => {
    const res = await api.ingest({
      vendor,
      notes,
      outcome: outcome as "Successful concession" | "No movement" | "Escalated" | "Rescheduled",
      timestamp: new Date().toISOString(),
    });
    setBriefing(res.briefing);
    setDiffs(res.score_diffs);
    setFlashTactics(new Set(Object.keys(res.score_diffs)));
    setShowForm(false);
    setTimeout(() => setFlashTactics(new Set()), 1200);
  }, [vendor]);

  const antiPattern = briefing.tactics.find((t) => t.is_anti_pattern);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 border-b border-neutral-200 pb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <a href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-600">← Dashboard</a>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{vendor.toUpperCase()}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Contact <span className="font-medium text-gray-700">{briefing.contract.contact}</span>
            {" · "}${briefing.contract.value.toLocaleString()}/yr
            {" · "}Renewal {briefing.contract.renewal_date}
            {" · "}<span className="font-semibold text-red-600">{briefing.contract.days_remaining} days remaining</span>
          </p>
        </div>
        <div className="shrink-0 pt-1 flex items-center gap-3">
          <a
            href={`/call/${vendor}`}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
            Start Live Call
          </a>
          <GmailConnect />
          <MemoryToggle value={memoryOn} onChange={toggleMemory} disabled={loading} />
        </div>
      </header>

      <PipelineStatus trail={briefing.pipeline_trail} />

      <div className={`transition-opacity duration-300 ${loading ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        {memoryOn ? (
          <div className="space-y-8">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {briefing.tactics.filter((t) => !t.is_anti_pattern).map((t) => (
                <TacticCard key={t.name} tactic={t} flash={flashTactics.has(t.name) ? (diffs?.[t.name]?.direction ?? null) : null} />
              ))}
            </section>
            <Playbook playbook={briefing.playbook} flashRefs={flashTactics} />
            {antiPattern && <AntiPatternSparkline tactic={antiPattern} />}
            <SignalFeed signals={briefing.recent_signals.slice(0, 2)} />

            {recentCalls.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">Recent Calls</h2>
                  <a
                    href={`/calls/${vendor}`}
                    className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    View all calls →
                  </a>
                </div>
                <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 overflow-hidden">
                  {recentCalls.map((c) => (
                    <a
                      key={c.id}
                      href={`/calls/${vendor}/${c.id}`}
                      className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-neutral-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-neutral-400">{fmtCallDate(c.created_at)}</p>
                        {c.narrative && (
                          <p className="text-sm text-neutral-600 mt-0.5 truncate">{c.narrative.slice(0, 80)}{c.narrative.length > 80 ? "…" : ""}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-neutral-400">{fmtCallDuration(c.duration_secs)}</span>
                        {c.outcome && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${OUTCOME_BADGE[c.outcome] ?? "bg-neutral-100 text-neutral-500"}`}>
                            {c.outcome}
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {emails.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-neutral-400" fill="currentColor">
                    <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  <h2 className="text-sm font-semibold text-gray-700">Emails with {briefing.contract.contact}</h2>
                </div>
                <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 overflow-hidden">
                  {emails.map((e) => (
                    <div key={e.id} className="px-4 py-3 bg-white hover:bg-neutral-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{e.subject || "(no subject)"}</p>
                          <p className="text-xs text-neutral-500 mt-0.5 truncate">{e.from}</p>
                          {e.snippet && (
                            <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{e.snippet}</p>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 shrink-0 pt-0.5">{e.date ? new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div>
              <button
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-black px-5 py-3 text-white hover:bg-neutral-800"
              >
                Log post-call notes
              </button>
            </div>
          </div>
        ) : nomem ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-500">Generic advice (no memory)</h2>
            {nomem.tactics.map((t) => (
              <div key={t.name} className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4">
                <div className="font-medium text-gray-800">{t.name}</div>
                <div className="text-sm text-neutral-600 mt-1">{t.advice}</div>
              </div>
            ))}
            <div className="mt-4 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm italic text-neutral-400 text-center">
              — no playbook without memory —
            </div>
          </section>
        ) : (
          <div className="flex items-center justify-center py-20 text-neutral-400">
            <svg className="animate-spin h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </div>
        )}
      </div>

      {showForm && (
        <PostCallForm onClose={() => setShowForm(false)} onSubmit={onSubmitLog} />
      )}

      {diffs && Object.keys(diffs).length > 0 && (
        <ScoreDiffPanel diffs={diffs} onDismiss={() => setDiffs(null)} />
      )}
    </main>
  );
}
