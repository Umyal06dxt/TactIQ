"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { VendorCreateRequest } from "@/lib/types";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

const INDUSTRIES = ["Technology", "Security", "Data & Analytics", "Cloud Infrastructure",
  "SaaS", "Consulting", "Telecommunications", "Financial Services", "Healthcare", "Other"];

export function AddVendorModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<VendorCreateRequest>({
    name: "",
    annual_value: 0,
    renewal_date: "",
    contact: "",
    contact_email: "",
    notes: "",
    industry: "",
    risk_level: "medium",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof VendorCreateRequest, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.renewal_date || !form.contact) {
      setError("Name, renewal date, and contact are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.vendor.create(form);
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create vendor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-neutral-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-neutral-100">
          <div>
            <h2 className="text-xl font-black text-gray-900">Add Vendor</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Start tracking a new vendor relationship</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">
              Vendor Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. NexaCloud, Acme Corp"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Annual value */}
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">
                Annual Value ($)
              </label>
              <input
                type="number"
                value={form.annual_value || ""}
                onChange={(e) => set("annual_value", parseInt(e.target.value) || 0)}
                placeholder="e.g. 250000"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Renewal date */}
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">
                Renewal Date *
              </label>
              <input
                type="date"
                value={form.renewal_date}
                onChange={(e) => set("renewal_date", e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Contact name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">
                Contact Name *
              </label>
              <input
                type="text"
                value={form.contact}
                onChange={(e) => set("contact", e.target.value)}
                placeholder="e.g. Sarah Johnson"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Contact email */}
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">
                Contact Email
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => set("contact_email", e.target.value)}
                placeholder="sarah@vendor.com"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Industry */}
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">
                Industry
              </label>
              <select
                value={form.industry}
                onChange={(e) => set("industry", e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select…</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            {/* Risk level */}
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">
                Negotiation Risk
              </label>
              <div className="flex gap-1.5">
                {(["low", "medium", "high"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => set("risk_level", lvl)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                      form.risk_level === lvl
                        ? lvl === "high"
                          ? "bg-red-500 text-white border-red-500"
                          : lvl === "medium"
                          ? "bg-amber-400 text-black border-amber-400"
                          : "bg-emerald-500 text-white border-emerald-500"
                        : "bg-neutral-50 text-neutral-400 border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">
              Initial Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any context about the relationship, past issues, known leverage points…"
              rows={2}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </>
              ) : "Add Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
