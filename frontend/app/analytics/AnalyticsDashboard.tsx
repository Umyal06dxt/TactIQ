"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { PortfolioAnalytics, VendorAnalytics } from "@/lib/types";
import { api } from "@/lib/api";

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

function pct(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%`, transition: "width 0.8s ease" }} />
      </div>
      <span className="text-xs text-neutral-400 w-6 text-right">{value}</span>
    </div>
  );
}

function StatBig({
  label, value, sub, trend, accent = "text-gray-900"
}: { label: string; value: string; sub?: string; trend?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">{label}</p>
      <p className={`text-3xl font-black mt-1 tracking-tight ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
      {trend && <p className="text-xs font-medium mt-2 text-emerald-600">{trend}</p>}
    </div>
  );
}

function WinRateDonut({ rate, calls }: { rate: number | null; calls: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pctVal = rate != null ? rate : 0;
  const filled = circ * pctVal;
  const color = pctVal >= 0.6 ? "#10b981" : pctVal >= 0.4 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} strokeWidth="8" className="stroke-neutral-100 fill-none" />
          <circle
            cx="48" cy="48" r={r} strokeWidth="8" fill="none"
            stroke={color}
            strokeDasharray={`${filled} ${circ - filled}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black text-gray-900">{rate != null ? `${Math.round(rate * 100)}%` : "—"}</span>
          <span className="text-[9px] text-neutral-400 uppercase tracking-wider">win</span>
        </div>
      </div>
      <p className="text-xs text-neutral-400">{calls} calls total</p>
    </div>
  );
}

function TacticBar({ name, uses, max }: { name: string; uses: number; max: number }) {
  const w = max > 0 ? (uses / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-700 w-32 truncate shrink-0">{name}</span>
      <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${w}%`, transition: "width 0.8s ease" }}
        />
      </div>
      <span className="text-xs text-neutral-400 w-4 text-right shrink-0">{uses}</span>
    </div>
  );
}

function WeeklyChart({ data }: { data: { week: string; calls: number; wins: number }[] }) {
  const maxCalls = Math.max(...data.map((d) => d.calls), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => {
        const callH = (d.calls / maxCalls) * 100;
        const winH = d.calls > 0 ? (d.wins / d.calls) * callH : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div className="w-full flex flex-col justify-end h-20 gap-0">
              <div
                className="w-full bg-emerald-400 rounded-t-sm opacity-80"
                style={{ height: `${winH}%`, transition: "height 0.8s ease" }}
              />
              <div
                className="w-full bg-neutral-200 rounded-t-sm"
                style={{ height: `${callH - winH}%`, transition: "height 0.8s ease" }}
              />
            </div>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {d.calls} calls · {d.wins} won
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OutcomePie({ dist }: { dist: { won: number; lost: number; pending: number; escalated: number } }) {
  const total = dist.won + dist.lost + dist.pending + dist.escalated;
  if (total === 0) return <p className="text-xs text-neutral-400 text-center py-4">No calls yet</p>;
  const bars = [
    { label: "Won", value: dist.won, color: "bg-emerald-500" },
    { label: "Lost", value: dist.lost, color: "bg-red-400" },
    { label: "Pending", value: dist.pending, color: "bg-yellow-400" },
    { label: "Escalated", value: dist.escalated, color: "bg-orange-400" },
  ].filter((b) => b.value > 0);

  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {bars.map((b) => (
          <div
            key={b.label}
            className={`${b.color} first:rounded-l-full last:rounded-r-full`}
            style={{ width: `${(b.value / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {bars.map((b) => (
          <div key={b.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${b.color}`} />
            <span className="text-xs text-neutral-500">{b.label} ({b.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorRow({ r, rank }: { r: { vendor: string; calls: number; won: number; decided: number; win_rate: number | null; avg_adherence: number | null; savings: number }; rank: number }) {
  const wr = r.win_rate;
  const wrColor = wr == null ? "text-neutral-400" : wr >= 0.6 ? "text-emerald-600 font-bold" : wr >= 0.4 ? "text-amber-600 font-semibold" : "text-red-600 font-semibold";
  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-neutral-50 transition-colors group cursor-pointer">
      <span className="w-5 text-center text-xs font-black text-neutral-300">#{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">{r.vendor.toUpperCase()}</p>
        <p className="text-xs text-neutral-400">{r.calls} calls</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm ${wrColor}`}>{pct(r.win_rate)}</p>
        <p className="text-xs text-neutral-400">win rate</p>
      </div>
      <div className="text-right shrink-0 w-16">
        <p className="text-sm font-semibold text-gray-700">{r.avg_adherence != null ? `${Math.round(r.avg_adherence * 100)}%` : "—"}</p>
        <p className="text-xs text-neutral-400">adherence</p>
      </div>
      <div className="text-right shrink-0 w-20">
        <p className="text-sm font-semibold text-emerald-600">{fmt$(r.savings)}</p>
        <p className="text-xs text-neutral-400">saved</p>
      </div>
    </div>
  );
}

function VendorDetailPanel({ vendor }: { vendor: string }) {
  const [data, setData] = useState<VendorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics.vendor(vendor).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [vendor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-neutral-400">
        <div className="w-5 h-5 border-2 border-neutral-200 border-t-blue-400 rounded-full animate-spin mr-2" />
        Loading…
      </div>
    );
  }
  if (!data) return <p className="text-xs text-neutral-400 text-center py-8">No data</p>;

  const maxTactic = data.top_tactics[0]?.uses ?? 1;

  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-700">{pct(data.win_rate)}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Win Rate</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-blue-700">{data.avg_adherence != null ? `${Math.round(data.avg_adherence * 100)}%` : "—"}</p>
          <p className="text-xs text-blue-600 mt-0.5">Avg Adherence</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-purple-700">{data.avg_deal_score ?? "—"}</p>
          <p className="text-xs text-purple-600 mt-0.5">Avg Deal Score</p>
        </div>
      </div>

      {data.top_tactics.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">Top Tactics</p>
          <div className="space-y-2">
            {data.top_tactics.map((t) => (
              <TacticBar key={t.name} name={t.name} uses={t.uses} max={maxTactic} />
            ))}
          </div>
        </div>
      )}

      {data.outcome_distribution && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">Outcome Breakdown</p>
          <OutcomePie dist={data.outcome_distribution} />
        </div>
      )}

      <div className="flex justify-end">
        <Link
          href={`/briefing/${vendor}`}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
        >
          Open Briefing →
        </Link>
      </div>
    </div>
  );
}

export function AnalyticsDashboard({ portfolio }: { portfolio: PortfolioAnalytics | null }) {
  const [activeVendor, setActiveVendor] = useState<string | null>(null);

  const hasCalls = portfolio && portfolio.total_calls > 0;
  const maxTactic = portfolio?.top_global_tactics[0]?.uses ?? 1;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors">← Portfolio</Link>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">Negotiation Intelligence</h1>
            <p className="mt-1 text-sm text-neutral-400">Tactic performance, deal outcomes, and ROI across your vendor portfolio</p>
          </div>
          {portfolio && (
            <div className="text-right">
              <p className="text-xs text-neutral-400 uppercase tracking-wider">Total estimated savings</p>
              <p className="text-2xl font-black text-emerald-600">{fmt$(portfolio.total_savings)}</p>
              <p className="text-xs text-neutral-400 mt-0.5">through coaching adherence</p>
            </div>
          )}
        </div>
      </header>

      {!hasCalls ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-semibold">No call data yet</p>
          <p className="text-neutral-400 text-sm mt-1">Complete your first coached call to see analytics appear here.</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            Go to Portfolio →
          </Link>
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatBig
              label="Portfolio Win Rate"
              value={pct(portfolio!.portfolio_win_rate)}
              sub={`${portfolio!.total_calls} total calls`}
              accent={portfolio!.portfolio_win_rate != null && portfolio!.portfolio_win_rate >= 0.5 ? "text-emerald-600" : "text-red-600"}
            />
            <StatBig
              label="Avg Adherence"
              value={portfolio!.avg_adherence != null ? `${Math.round(portfolio!.avg_adherence * 100)}%` : "—"}
              sub="coaching followed"
              accent="text-gray-900"
            />
            <StatBig
              label="Savings Achieved"
              value={fmt$(portfolio!.total_savings)}
              sub="estimated this period"
              accent="text-emerald-600"
            />
            <StatBig
              label="Active Vendors"
              value={String(portfolio!.total_vendors)}
              sub="in negotiation portfolio"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Win rate donut + weekly trend */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col gap-5">
              <h2 className="text-sm font-bold text-gray-700">Portfolio Win Rate</h2>
              <div className="flex items-center gap-4">
                <WinRateDonut rate={portfolio!.portfolio_win_rate} calls={portfolio!.total_calls} />
                <div className="flex-1 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Won</span>
                    <span className="font-semibold text-emerald-600">
                      {portfolio!.vendor_rankings.reduce((s, v) => s + (v.won ?? 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Total decided</span>
                    <span className="font-semibold text-gray-700">{portfolio!.total_calls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Savings/call</span>
                    <span className="font-semibold text-gray-700">
                      {portfolio!.total_calls > 0 ? fmt$(Math.round(portfolio!.total_savings / portfolio!.total_calls)) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly trend */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Weekly Call Volume</h2>
              {portfolio!.weekly_trend.length > 0 ? (
                <>
                  <WeeklyChart data={portfolio!.weekly_trend} />
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-xs text-neutral-400">Wins</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-neutral-200" /><span className="text-xs text-neutral-400">Other</span></div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-neutral-400 text-center py-8">No data</p>
              )}
            </div>

            {/* Top global tactics */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Most Used Tactics</h2>
              {portfolio!.top_global_tactics.length > 0 ? (
                <div className="space-y-2.5">
                  {portfolio!.top_global_tactics.map((t) => (
                    <TacticBar key={t.name} name={t.name} uses={t.uses} max={maxTactic} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-400 text-center py-8">No tactic data</p>
              )}
            </div>
          </div>

          {/* Vendor rankings */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700">Vendor Performance Rankings</h2>
              <p className="text-xs text-neutral-400">Click a vendor to drill down</p>
            </div>
            <div className="divide-y divide-neutral-50">
              {portfolio!.vendor_rankings.map((r, i) => (
                <div key={r.vendor}>
                  <div
                    className="cursor-pointer"
                    onClick={() => setActiveVendor(activeVendor === r.vendor ? null : r.vendor)}
                  >
                    <VendorRow r={r} rank={i + 1} />
                  </div>
                  {activeVendor === r.vendor && (
                    <div className="px-6 pb-4 border-t border-neutral-100 bg-neutral-50/50">
                      <VendorDetailPanel vendor={r.vendor} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ROI call-out */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h3 className="text-lg font-black text-emerald-900">Negotiation ROI Summary</h3>
                <p className="text-sm text-emerald-700 mt-1 max-w-lg">
                  TactIQ coaching has contributed an estimated{" "}
                  <strong className="text-emerald-800">{fmt$(portfolio!.total_savings)}</strong> in negotiated savings
                  across {portfolio!.total_calls} calls with {portfolio!.total_vendors} vendors.
                  Win rate of {pct(portfolio!.portfolio_win_rate)} vs industry average of ~40%.
                </p>
              </div>
              <div className="shrink-0 text-center">
                <p className="text-4xl font-black text-emerald-700">{fmt$(portfolio!.total_savings)}</p>
                <p className="text-xs text-emerald-600 mt-1 uppercase tracking-wider">Total savings</p>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
