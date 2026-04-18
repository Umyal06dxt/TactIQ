"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { VendorCard } from "@/components/VendorCard";
import { AddVendorModal } from "@/components/AddVendorModal";
import { api } from "@/lib/api";
import type { Vendor, PortfolioAnalytics, DealInFlight } from "@/lib/types";

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">{label}</p>
      <p className={`text-3xl font-black mt-1 tracking-tight ${accent ?? "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}

const OUTCOME_CHIP: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  escalated: "bg-orange-50 text-orange-700 border-orange-200",
};

function RenewalTimeline({ vendors }: { vendors: Vendor[] }) {
  const DAYS = 90;
  const relevant = vendors
    .filter((v) => v.days_remaining > 0 && v.days_remaining <= DAYS)
    .sort((a, b) => a.days_remaining - b.days_remaining);

  if (relevant.length === 0) return null;

  return (
    <div className="mb-8 rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs font-black uppercase tracking-widest text-neutral-500">90-day renewal radar</p>
        </div>
        <p className="text-xs text-neutral-400">{relevant.length} contract{relevant.length !== 1 ? "s" : ""} expiring</p>
      </div>
      <div className="px-5 py-4">
        <div className="relative h-8 mb-3">
          <div className="absolute inset-y-0 left-0 right-0 bg-neutral-50 rounded-full border border-neutral-100" />
          {[30, 60, 90].map((d) => (
            <div
              key={d}
              className="absolute top-0 bottom-0 flex items-center"
              style={{ left: `${(d / DAYS) * 100}%` }}
            >
              <div className="w-px h-full bg-neutral-200" />
              <span className="absolute -top-5 text-[10px] text-neutral-300 -translate-x-1/2">{d}d</span>
            </div>
          ))}
          {relevant.map((v) => {
            const pct = Math.min((v.days_remaining / DAYS) * 100, 100);
            const isUrgent = v.days_remaining < 30;
            return (
              <Link
                key={v.bank_id}
                href={`/briefing/${v.bank_id}`}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                style={{ left: `${pct}%` }}
              >
                <div className={`w-3 h-3 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-150 ${
                  isUrgent ? "bg-red-500" : v.days_remaining < 60 ? "bg-amber-500" : "bg-emerald-500"
                }`} />
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  <div className="bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                    {v.name} · {v.days_remaining}d
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {relevant.map((v) => (
            <Link
              key={v.bank_id}
              href={`/briefing/${v.bank_id}`}
              className={`flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity ${
                v.days_remaining < 30 ? "text-red-600" : v.days_remaining < 60 ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                v.days_remaining < 30 ? "bg-red-500" : v.days_remaining < 60 ? "bg-amber-500" : "bg-emerald-500"
              }`} />
              <span className="font-bold">{v.name}</span>
              <span className="text-neutral-400">in {v.days_remaining}d</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function DealsInFlight({ deals }: { deals: DealInFlight[] }) {
  if (deals.length === 0) return null;
  return (
    <div className="mb-8 rounded-2xl border border-yellow-200 bg-yellow-50/50 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-yellow-200 bg-yellow-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <p className="text-xs font-black uppercase tracking-widest text-yellow-700">
            {deals.length} deal{deals.length !== 1 ? "s" : ""} in flight — follow-up needed
          </p>
        </div>
      </div>
      <div className="divide-y divide-yellow-100">
        {deals.map((d, i) => (
          <div key={d.id ?? i} className="flex items-center gap-4 px-5 py-3 hover:bg-yellow-50 transition-colors group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-black text-gray-900">{d.vendor.toUpperCase()}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${OUTCOME_CHIP[d.outcome] ?? ""}`}>
                  {d.outcome}
                </span>
                {d.deal_score != null && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-white border ${d.deal_score >= 60 ? "text-emerald-600 border-emerald-200" : "text-red-600 border-red-200"}`}>
                    score {d.deal_score}
                  </span>
                )}
              </div>
              {d.narrative && (
                <p className="text-xs text-neutral-500 truncate">{d.narrative}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-neutral-400">{fmtDate(d.created_at)}</span>
              {d.id && (
                <Link
                  href={`/calls/${d.vendor}/${d.id}`}
                  className="text-[10px] font-bold text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  View
                </Link>
              )}
              <Link
                href={`/call/${d.vendor}`}
                className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Resume →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  vendors: Vendor[];
  portfolio: PortfolioAnalytics | null;
};

export function DashboardClient({ vendors: initial, portfolio }: Props) {
  const [vendors, setVendors] = useState(initial);
  const [showAddModal, setShowAddModal] = useState(false);

  const totalValue = vendors.reduce((s, v) => s + v.annual_value, 0);
  const urgentCount = vendors.filter((v) => v.days_remaining < 60).length;
  const urgentValue = vendors.filter((v) => v.days_remaining < 60).reduce((s, v) => s + v.annual_value, 0);
  const soonCount = vendors.filter((v) => v.days_remaining < 90).length;

  const onVendorCreated = useCallback(async () => {
    setShowAddModal(false);
    try {
      const data = await api.vendors();
      setVendors(data.vendors);
    } catch {}
  }, []);

  return (
    <>
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Hero header */}
        <header className="mb-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900">Contract Portfolio</h1>
              <p className="mt-1 text-sm text-neutral-400">
                {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} tracked · AI-powered negotiation intelligence
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-xs text-neutral-400 uppercase tracking-wider">Total under management</p>
                <p className="text-2xl font-black text-gray-900">{fmt$(totalValue)}</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Vendor
              </button>
            </div>
          </div>
        </header>

        {/* Portfolio stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="Annual Value"
            value={fmt$(totalValue)}
            sub="total contracts managed"
          />
          <StatCard
            label="Renewing Soon"
            value={`${soonCount}`}
            sub="contracts within 90 days"
            accent={soonCount > 0 ? "text-amber-600" : "text-gray-900"}
          />
          <StatCard
            label="Urgent"
            value={`${urgentCount}`}
            sub={urgentCount > 0 ? `${fmt$(urgentValue)} at risk` : "No urgent renewals"}
            accent={urgentCount > 0 ? "text-red-600" : "text-gray-900"}
          />
          {portfolio && portfolio.total_calls > 0 ? (
            <StatCard
              label="Win Rate"
              value={portfolio.portfolio_win_rate != null ? `${Math.round(portfolio.portfolio_win_rate * 100)}%` : "—"}
              sub={`${portfolio.total_calls} coached calls`}
              accent={portfolio.portfolio_win_rate != null && portfolio.portfolio_win_rate >= 0.5 ? "text-emerald-600" : "text-gray-900"}
            />
          ) : (
            <StatCard
              label="Vendors Tracked"
              value={`${vendors.length}`}
              sub={`${vendors.reduce((s, v) => s + v.tactic_count, 0)} tactics in memory`}
            />
          )}
        </div>

        {/* Renewal timeline */}
        <RenewalTimeline vendors={vendors} />

        {/* Savings banner */}
        {portfolio && portfolio.total_savings > 0 && (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900">Negotiation ROI</p>
                <p className="text-xs text-emerald-700">AI coaching has contributed an estimated savings this period</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-emerald-700">{fmt$(portfolio.total_savings)}</p>
              <a href="/analytics" className="text-xs text-emerald-600 hover:text-emerald-500 transition-colors">View analytics →</a>
            </div>
          </div>
        )}

        {/* Deals in flight */}
        {portfolio && portfolio.deals_in_flight && portfolio.deals_in_flight.length > 0 && (
          <DealsInFlight deals={portfolio.deals_in_flight} />
        )}

        {/* Urgency divider */}
        {urgentCount > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">
              Requires attention — {urgentCount} renewal{urgentCount !== 1 ? "s" : ""} in &lt;60 days
            </p>
          </div>
        )}

        {/* Vendor grid */}
        {vendors.length === 0 ? (
          <div className="rounded-2xl bg-white border border-dashed border-neutral-300 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-600 font-semibold">No vendors yet</p>
            <p className="text-neutral-400 text-sm mt-1">Add your first vendor to start tracking negotiations.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add your first vendor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {vendors
              .sort((a, b) => a.days_remaining - b.days_remaining)
              .map((v) => (
                <VendorCard key={v.bank_id} v={v} />
              ))}
          </div>
        )}
      </main>

      {showAddModal && (
        <AddVendorModal onClose={() => setShowAddModal(false)} onCreated={onVendorCreated} />
      )}
    </>
  );
}
