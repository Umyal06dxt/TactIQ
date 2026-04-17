import { api } from "@/lib/api";
import { VendorCard } from "@/components/VendorCard";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { vendors } = await api.vendors();
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">LEVERAGE</h1>
        <p className="mt-2 text-neutral-600">Negotiation memory for procurement.</p>
      </header>
      {vendors.length === 0 ? (
        <div className="rounded-xl bg-amber-50 p-6 text-amber-900">
          No vendors. Seed the Hindsight banks before demo — see README §7.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {vendors.map((v) => (
            <VendorCard key={v.bank_id} v={v} />
          ))}
        </div>
      )}
    </main>
  );
}
