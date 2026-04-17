import Link from "next/link";
import type { Vendor } from "@/lib/types";

export function VendorCard({ v }: { v: Vendor }) {
  const urgent = v.days_remaining < 30;
  return (
    <Link
      href={`/briefing/${v.bank_id}`}
      className="block rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-xl font-semibold">{v.name}</h3>
        <span className="text-sm text-neutral-500">{v.contact}</span>
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight">
        ${v.annual_value.toLocaleString()}<span className="text-base font-medium text-neutral-500">/yr</span>
      </div>
      <div className="mt-4 flex gap-4 text-sm text-neutral-600">
        <span>{v.interaction_count} interactions</span>
        <span>{v.tactic_count} tactics tracked</span>
      </div>
      {urgent ? (
        <div className="mt-4 inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700 ring-1 ring-red-600/20">
          {v.days_remaining} days · fiscal Q3 pressure
        </div>
      ) : (
        <div className="mt-4 text-sm text-neutral-500">
          Renewal {v.renewal_date} · {v.days_remaining} days
        </div>
      )}
    </Link>
  );
}
