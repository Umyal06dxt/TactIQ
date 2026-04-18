"use client";
import { useState } from "react";

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

export function ROICalculator() {
  const [spend, setSpend] = useState(500_000);
  const [vendors, setVendors] = useState(5);

  const savings = Math.round(spend * 0.11);
  const plan = vendors <= 1 ? 0 : vendors <= 10 ? 99 * 12 : 299 * 12;
  const planName = vendors <= 1 ? "Starter (free)" : vendors <= 10 ? "Professional ($99/mo)" : "Enterprise ($299/mo)";
  const netSavings = savings - plan;
  const roiMultiple = plan > 0 ? (netSavings / plan).toFixed(1) : "∞";

  return (
    <div className="mt-12 rounded-2xl bg-white border border-neutral-200 p-8 shadow-sm">
      <div className="text-center mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">ROI calculator</p>
        <h3 className="text-2xl font-black text-gray-900">How much will TactIQ save you?</h3>
        <p className="text-sm text-neutral-500 mt-1">Adjust your spend to see your estimated return</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Annual vendor spend</label>
            <span className="text-lg font-black text-gray-900">{fmt$(spend)}</span>
          </div>
          <input
            type="range"
            min={50_000}
            max={5_000_000}
            step={50_000}
            value={spend}
            onChange={(e) => setSpend(Number(e.target.value))}
            className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-600 [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <div className="flex justify-between text-xs text-neutral-400 mt-1">
            <span>$50k</span>
            <span>$5M</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Number of vendors</label>
            <span className="text-lg font-black text-gray-900">{vendors}</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={vendors}
            onChange={(e) => setVendors(Number(e.target.value))}
            className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-600 [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <div className="flex justify-between text-xs text-neutral-400 mt-1">
            <span>1</span>
            <span>30</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider mb-1">Estimated savings</p>
          <p className="text-2xl font-black text-emerald-700">{fmt$(savings)}</p>
          <p className="text-[10px] text-emerald-600 mt-1">11% of spend</p>
        </div>
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">Subscription</p>
          <p className="text-2xl font-black text-gray-900">{plan === 0 ? "$0" : fmt$(plan)}</p>
          <p className="text-[10px] text-neutral-400 mt-1">{planName}</p>
        </div>
        <div className={`border rounded-xl p-4 text-center ${netSavings > 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1 text-neutral-500">Net savings</p>
          <p className={`text-2xl font-black ${netSavings > 0 ? "text-emerald-700" : "text-red-600"}`}>{fmt$(netSavings)}</p>
          <p className="text-[10px] text-neutral-400 mt-1">per year</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-1">ROI</p>
          <p className="text-2xl font-black text-emerald-400">{roiMultiple}x</p>
          <p className="text-[10px] text-white/30 mt-1">return on investment</p>
        </div>
      </div>

      {netSavings > 0 && (
        <p className="text-center text-xs text-neutral-400 mt-6">
          At your spend level, TactIQ pays for itself in under{" "}
          <span className="font-bold text-emerald-600">
            {plan > 0 ? `${Math.ceil((plan / savings) * 365)} days` : "no time"}.
          </span>
          {" "}Estimates based on 11% average negotiated savings across the customer base.
        </p>
      )}
    </div>
  );
}
