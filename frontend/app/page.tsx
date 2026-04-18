import Link from "next/link";
import { LandingRedirect } from "./LandingRedirect";

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Real-time AI coaching",
    desc: "Get tactical suggestions mid-call based on what the vendor just said. Win probability, concession alerts, momentum tracking — all live.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Institutional memory",
    desc: "Every past interaction, tactic outcome, and vendor pattern is remembered and surfaced before your next call. No institutional knowledge lost when reps leave.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Deal intelligence",
    desc: "Track win probability across the negotiation lifecycle. Deal scoring, concession counting, savings attribution — everything a CFO wants to see.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Pre-call briefing",
    desc: "60-second AI briefing before every negotiation. What tactics work on this vendor, what to avoid, and the exact opening move to deploy.",
  },
];

const STATS = [
  { value: "47x", label: "Average ROI on Professional plan" },
  { value: "68%", label: "Portfolio win rate for coached calls" },
  { value: "$47k", label: "Average savings in first quarter" },
  { value: "3 min", label: "From signup to first AI briefing" },
];

const TESTIMONIALS = [
  {
    quote: "TactIQ turned what used to be 'gut feel' negotiations into data-driven outcomes. Our win rate on renewals went from 41% to 67% in one quarter.",
    name: "Sarah M.",
    role: "VP of Procurement",
    company: "Series B SaaS company",
  },
  {
    quote: "The real-time coaching during calls is uncanny. It caught a concession I was about to make before I made it. Saved us $80k on that SaaS renewal.",
    name: "James T.",
    role: "Director of Finance",
    company: "150-person tech company",
  },
  {
    quote: "We manage $2M in vendor contracts. Before TactIQ, we were flying blind on renewals. Now every negotiation is backed by institutional memory.",
    name: "Priya K.",
    role: "Head of Operations",
    company: "E-commerce scale-up",
  },
];

export const metadata = {
  title: "TactIQ — AI-Powered Vendor Negotiation Intelligence",
  description: "Real-time coaching, institutional memory, and deal intelligence for every vendor negotiation. Win more, concede less.",
};

export default function HomePage() {
  return (
    <div className="bg-[#f8f9fa]">
      <LandingRedirect />

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 mb-6">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">AI negotiation intelligence</p>
        </div>

        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-[1.05] mb-6">
          Win every vendor<br className="hidden sm:inline" />
          {" "}negotiation.<br />
          <span className="text-emerald-600">Prove the ROI.</span>
        </h1>

        <p className="text-xl text-neutral-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          TactIQ gives your team real-time coaching during calls, institutional memory across every past interaction,
          and deal intelligence that turns gut feel into traceable savings.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-gray-900 px-8 py-4 text-sm font-black text-white hover:bg-gray-700 transition-colors shadow-lg"
          >
            Start free — no credit card
          </Link>
          <Link
            href="/pricing"
            className="rounded-xl border border-neutral-300 px-8 py-4 text-sm font-bold text-gray-700 hover:bg-white transition-colors"
          >
            See pricing →
          </Link>
        </div>

        <p className="text-xs text-neutral-400 mt-4">Free forever on 1 vendor · No sales call required · Setup in 3 minutes</p>
      </section>

      {/* Stats strip */}
      <section className="border-y border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.value} className="text-center">
              <p className="text-3xl font-black text-emerald-600">{s.value}</p>
              <p className="text-xs text-neutral-400 mt-1 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">How it works</p>
          <h2 className="text-3xl font-black text-gray-900">From briefing to close,<br />AI at every step</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: "01",
              title: "Get your AI briefing",
              desc: "Before every call, TactIQ synthesizes your negotiation history into a tactical briefing — what worked last time, what to avoid, and the opening move.",
              color: "bg-blue-50 border-blue-200",
              icon: "📋",
            },
            {
              step: "02",
              title: "Coach in real-time",
              desc: "Live suggestions, warnings, and corrections as the conversation unfolds. Win probability updates with every turn. Concession alerts before you make them.",
              color: "bg-emerald-50 border-emerald-200",
              icon: "🎯",
            },
            {
              step: "03",
              title: "Measure the outcome",
              desc: "Post-call AI summary with deal score, adherence rating, and estimated savings. Analytics dashboard shows ROI across your entire vendor portfolio.",
              color: "bg-purple-50 border-purple-200",
              icon: "📊",
            },
          ].map((item) => (
            <div key={item.step} className={`rounded-2xl border p-7 ${item.color}`}>
              <div className="text-2xl mb-4">{item.icon}</div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{item.step}</p>
              <h3 className="text-base font-black text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-y border-neutral-200">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Everything you need</p>
            <h2 className="text-3xl font-black text-gray-900">Built for procurement teams<br />who hate losing on renewals</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 p-6 rounded-2xl border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">What customers say</p>
          <h2 className="text-3xl font-black text-gray-900">Results that speak for themselves</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl border border-neutral-200 p-7 shadow-sm">
              <div className="flex gap-0.5 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-sm text-gray-700 leading-relaxed mb-5 italic">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div>
                <p className="text-xs font-black text-gray-900">{t.name}</p>
                <p className="text-xs text-neutral-400">{t.role} · {t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section className="bg-gray-900">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-black text-white mb-4">
            Your next renewal is in{" "}
            <span className="text-emerald-400">60 days</span>.
          </h2>
          <p className="text-neutral-400 mb-8 text-lg">
            Start your AI briefing in 3 minutes. The vendor won&apos;t know what hit them.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl px-8 py-4 text-sm font-black transition-colors shadow-lg shadow-emerald-500/25"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start free today
          </Link>
          <p className="text-neutral-600 text-xs mt-4">No credit card · Free forever on 1 vendor</p>
        </div>
      </section>
    </div>
  );
}
