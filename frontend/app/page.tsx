import { api } from "@/lib/api";
import { VendorCard } from "@/components/VendorCard";

export const dynamic = "force-dynamic";

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">{label}</p>
      <p className={`text-3xl font-black mt-1 tracking-tight ${accent ?? "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}

export default async function Dashboard() {
  const { vendors } = await api.vendors();

  const totalValue = vendors.reduce((s, v) => s + v.annual_value, 0);
  const urgentCount = vendors.filter((v) => v.days_remaining < 60).length;
  const urgentValue = vendors.filter((v) => v.days_remaining < 60).reduce((s, v) => s + v.annual_value, 0);
  const soonCount = vendors.filter((v) => v.days_remaining < 90).length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">

      {/* Hero header */}
      <header className="mb-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">Contract Portfolio</h1>
            <p className="mt-1 text-sm text-neutral-400">
              {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} tracked · AI-powered negotiation intelligence
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-400 uppercase tracking-wider">Total under management</p>
            <p className="text-2xl font-black text-gray-900">${(totalValue / 1_000_000).toFixed(2)}M</p>
          </div>
        </div>
      </header>

      {/* Portfolio stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Annual Value"
          value={`$${(totalValue / 1000).toFixed(0)}k`}
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
          sub={urgentCount > 0 ? `$${(urgentValue / 1000).toFixed(0)}k at risk` : "No urgent renewals"}
          accent={urgentCount > 0 ? "text-red-600" : "text-gray-900"}
        />
        <StatCard
          label="Vendors Tracked"
          value={`${vendors.length}`}
          sub={`${vendors.reduce((s, v) => s + v.tactic_count, 0)} tactics in memory`}
        />
      </div>

      {/* Urgency divider */}
      {urgentCount > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <p className="text-xs font-bold uppercase tracking-widest text-red-600">Requires attention — {urgentCount} renewal{urgentCount !== 1 ? "s" : ""} in &lt;60 days</p>
        </div>
      )}

      {/* Vendor grid */}
      {vendors.length === 0 ? (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-8 text-center">
          <p className="text-amber-800 font-medium">No vendors configured.</p>
          <p className="text-amber-600 text-sm mt-1">Seed Hindsight banks to get started — see README §7.</p>
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
  );
}
