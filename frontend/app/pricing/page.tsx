import Link from "next/link";
import { ROICalculator } from "./ROICalculator";

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Try TactIQ with one vendor before you commit.",
    accent: "border-neutral-200",
    badge: null,
    features: [
      "1 vendor tracked",
      "10 coached calls / month",
      "AI briefing & playbook",
      "Basic analytics",
      "Email support",
    ],
    cta: "Start free",
    href: "/signup",
    ctaClass: "border border-neutral-300 text-gray-700 hover:bg-neutral-50",
  },
  {
    name: "Professional",
    price: "$99",
    period: "per month",
    description: "The full negotiation stack for individual practitioners.",
    accent: "border-emerald-500 ring-2 ring-emerald-500/20",
    badge: "Most popular",
    features: [
      "Up to 10 vendors",
      "Unlimited coached calls",
      "Real-time win probability",
      "Deal score & concession tracking",
      "Full analytics dashboard",
      "Savings ROI reporting",
      "Priority support",
    ],
    cta: "Start 14-day trial",
    href: "/signup?plan=pro",
    ctaClass: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20",
  },
  {
    name: "Enterprise",
    price: "$299",
    period: "per month",
    description: "Institutional memory and coaching across procurement teams.",
    accent: "border-neutral-200",
    badge: null,
    features: [
      "Unlimited vendors",
      "Unlimited calls + users",
      "Team analytics & benchmarking",
      "Gmail / calendar integration",
      "Custom vendor onboarding",
      "Dedicated success manager",
      "SSO & audit logs",
      "Custom contracts",
    ],
    cta: "Contact sales",
    href: "mailto:sales@tactiq.ai",
    ctaClass: "border border-neutral-300 text-gray-700 hover:bg-neutral-50",
  },
];

const FAQS = [
  {
    q: "How does the free tier work?",
    a: "You get one vendor slot and 10 calls per month, free forever. No credit card required. When you're ready to scale, upgrade in one click.",
  },
  {
    q: "What counts as a 'coached call'?",
    a: "Any negotiation session where TactIQ's real-time coaching is active. Briefing generation, analytics, and call history do not count toward your limit.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — no lock-in, no penalty. Cancel from your settings page and your data is retained for 30 days so you can export it.",
  },
  {
    q: "Is our negotiation data private?",
    a: "Absolutely. Your call data, transcripts, and vendor information are never shared, never used to train models, and are encrypted at rest and in transit.",
  },
  {
    q: "Do you offer annual pricing?",
    a: "Yes — pay annually and save 20%. Contact us to get the annual invoice.",
  },
];

export const metadata = {
  title: "Pricing — TactIQ",
  description: "Start free. Upgrade when you're winning. TactIQ pricing for individuals and procurement teams.",
};

export default function PricingPage() {
  return (
    <main className="bg-[#f8f9fa] min-h-screen">
      {/* Header */}
      <section className="mx-auto max-w-4xl px-6 pt-16 pb-12 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Simple pricing</p>
        <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-tight">
          Pay for results,<br className="hidden sm:inline" /> not for access
        </h1>
        <p className="mt-4 text-lg text-neutral-500 max-w-xl mx-auto">
          TactIQ turns every vendor negotiation into a strategic advantage.
          Start free, upgrade when your savings justify it.
        </p>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl border p-8 flex flex-col ${plan.accent}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">{plan.name}</p>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                  {plan.period !== "forever" && (
                    <span className="text-sm text-neutral-400 mb-1.5">{plan.period}</span>
                  )}
                  {plan.period === "forever" && (
                    <span className="text-sm text-neutral-400 mb-1.5">forever</span>
                  )}
                </div>
                <p className="text-sm text-neutral-500 mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.ctaClass}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Interactive ROI calculator */}
        <ROICalculator />
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-6 pb-24">
        <h2 className="text-xl font-black text-gray-900 mb-6 text-center">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <div key={faq.q} className="bg-white rounded-xl border border-neutral-200 p-5">
              <p className="font-bold text-gray-900 text-sm">{faq.q}</p>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-neutral-400">Still have questions?</p>
          <a href="mailto:hello@tactiq.ai" className="text-sm font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
            hello@tactiq.ai →
          </a>
        </div>
      </section>
    </main>
  );
}
