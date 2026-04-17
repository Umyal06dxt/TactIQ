# TactIQ — Design Document
**Date:** 2026-04-18
**Hackathon:** CascadeFlow + Hindsight Hackathon
**Promo code:** MEMHACK409

---

## What We're Building

TactIQ is an AI-powered vendor negotiation intelligence agent. It gives procurement managers institutional memory before, during, and after every vendor renewal call — using Hindsight's Opinions network to produce confidence-scored tactics that improve with every interaction.

**Core positioning:** Every tool helps sellers remember buyers. TactIQ is the first buyer-side vendor negotiation memory tool.

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React 18 + Vite 5                |
| Styling     | Tailwind CSS v3.4 + CSS variables |
| HTTP client | Axios v1.6                        |
| Charts      | Recharts v2.10                    |
| Backend     | Python 3.11 + FastAPI 0.109       |
| Memory      | Hindsight Cloud (all 4 networks)  |
| LLM         | Groq API — qwen3-32b              |
| Orchestration | CascadeFlow                     |
| Seed data   | Faker v22.0                       |
| Frontend host | Vercel (free tier)              |
| Backend host  | Railway (free tier)             |

---

## Folder Structure

```
TactIQ/
├── seeder/
│   ├── seed_vendors.py
│   └── vendor_data.py
├── backend/
│   ├── main.py
│   ├── briefing.py
│   ├── ingest.py
│   └── models.py
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── styles/
│       │   └── tokens.css
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   └── Briefing.jsx
│       └── components/
│           ├── TacticCard.jsx
│           ├── TemporalBanner.jsx
│           ├── SignalFeed.jsx
│           ├── PostCallForm.jsx
│           ├── ScoreDiff.jsx
│           ├── ConfidenceChart.jsx
│           ├── ToggleMemory.jsx
│           ├── EmailParser.jsx
│           ├── VendorComparison.jsx
│           └── InteractionTimeline.jsx
├── .env.example
├── requirements.txt
├── package.json
└── README.md
```

---

## Initialization Approach

**Option A (selected):** Full init — run `npm create vite@latest` for the frontend and scaffold all backend/seeder files with stubs. All CSS design tokens, routing, and package configs created from the start.

---

## Naming Convention

- All references to "leverage" (app name, logotype) → **TactIQ**
- `bank_id` values remain lowercase: `nexacloud`, `datapipe`, `securenet`
- App logotype on dashboard: `TACTIQ`

---

## Must-Build Features (in order)

1. Hindsight Cloud account setup + SDK auth verification
2. Vendor data seeder (53 interactions across 3 vendors, with embedded tactic patterns)
3. Vendor dashboard (3-column grid, vendor cards, NexaCloud red urgency badge)
4. Pre-call briefing generator (reflect() → tactic cards, temporal banner, signals feed)
5. Confidence score display (TacticCard component, dot colours, font-mono scores)
6. Post-call note logger (form → retain() → reflect() × 2 → score diffs)
7. Live score update animation (ScoreDiff panel, fade/flash, auto-navigate)

## Nice-to-Have Features (only after 4.1 complete)

1. Before/After memory toggle
2. Confidence evolution chart (Recharts)
3. Email ingestion parser
4. Vendor comparison panel
5. Interaction timeline

---

## Environment Variables

```
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=
GROQ_API_KEY=
CASCADEFLOW_API_KEY=
VITE_API_URL=http://localhost:8000
```

---

## Design System Summary

- **Palette:** Near-black backgrounds (`#0A0A0A`), orange primary (`#F97316`), grey scale
- **Fonts:** Syne (display), DM Sans (body), DM Mono (scores/timestamps)
- **Cards:** 12px radius, `#141414` bg, `#2A2A2A` border, 24px padding
- **Confidence tiers:** >0.75 orange, 0.50–0.75 amber, <0.50 dark grey
- **Animations:** 250ms base transitions, 600ms score flash (green up / red down)

---

## Key Demo Moment

The confidence score update animation after post-call log submission is the single most important demo moment. Score diffs panel slides in, old values fade out, new values fade in with colour flash, briefing auto-refreshes. Build it. Polish it. Test it 10 times.

---

*Full spec: `/spec.md`*
