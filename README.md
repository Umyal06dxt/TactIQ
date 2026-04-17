# LEVERAGE

**Vendor Negotiation Intelligence Agent**

[Live Demo: deploy to Vercel and add URL] · [Backup Video: record and upload to GitHub Release] · [MIT License]

> Built for the Hindsight Hackathon — memory is the product.

---

## The Priya Story

Priya runs procurement at a 400-person SaaS company. She renews 47 vendors a year — $8M in annual contracts. She's good at her job. But every call, she walked in blind. Generic advice. No history. No patterns. ChatGPT telling her to "anchor high" while she's three weeks from a $380,000 renewal deadline.

Then came NexaCloud.

$380,000 per year. 18 days to renewal. Marcus Chen on the other side of the table — a vendor rep who's been through this rodeo with her three times before.

LEVERAGE showed her what the past actually said:

- **Mention AWS early** — 2 for 2. Last worked May 2024. Net result: 3% discount and an $8k support tier upgrade. Confidence: 0.87.
- **Fiscal Q3 pressure** — 3 for 4. Marcus responds when he's under quota pressure. Confidence: 0.74.
- **Multi-year commitment** — Marcus raised it himself in November, unprompted. Confidence: 0.50 and climbing.
- **Cancellation threat** — 0 for 3. Three times across three years. He doesn't move. He escalates. Confidence: 0.12. **AVOID.**

She mentioned AWS. Marcus moved in 8 minutes. A 3% discount plus the support tier upgrade she had been chasing for two renewals.

**$23,400 saved on one call.**

Across her 47 vendors, running the same memory layer on every renewal: **$1.1 million per year.**

But the real number isn't this year. It's that every call she logs makes the next call sharper. By year three, LEVERAGE knows Marcus better than Marcus knows himself.

---

## Demo

**Live demo:** [Deploy to Vercel and add URL here]

**Backup video:** [Record at hour 8.5 and upload to GitHub Release]

### 6-Beat Demo Script (5 minutes)

**Beat 1 — Cold open (0:00–0:30)**
"This is Priya. She runs procurement at a 400-person SaaS company. Tomorrow at 10 AM she's on a call to renew NexaCloud — $380,000 annual contract, 18 days to renewal. She's done this dance 47 times this year. Every time, she walks in blind."

**Beat 2 — Dashboard (0:30–1:00)**
Open `/`. Three vendor cards appear. NexaCloud has a red badge: `"18 days · fiscal Q3 pressure"`. Click in.

**Beat 3 — The toggle, the hero (1:00–2:30)**
"Here's her briefing. Memory OFF first — this is what ChatGPT gives her."
Toggle OFF. Generic 3-bullet advice. "Anchor high." "Ask for multi-year."
"Now watch."
Flip ON. The pipeline fires — `✓ recall 412ms → ✓ synthesize 1830ms → ✓ rank 87ms`. Four scored tactics render with dated evidence, track records, and a descending red sparkline for the anti-pattern at the bottom.

**Beat 4 — Post-call log (2:30–3:30)**
Click "Log post-call notes." Type the Priya note. Submit. Pipeline flashes again with the 4-step ingest trail. ScoreDiff animates: `Mention AWS 0.87 → 0.79 ▼`, `Multi-year commitment 0.50 → 0.68 ▲`. The playbook cross-fades and changed moves flash green/red.

**Beat 5 — The dollar number (3:30–4:30)**
"Priya just saved $23,400 on this one call. Across her 47 vendors, that's $1.1 million a year. But the real win — her memory compounds. Next year the AWS tactic has a third data point. Five years from now, LEVERAGE knows Marcus better than Marcus knows himself."

**Beat 6 — Company frame (4:30–5:00)**
"Procurement is the wedge. Sales closes, legal settlements, M&A term sheets, hiring packages, partnership deals — every repeated B2B negotiation has the same memory problem. LEVERAGE is the memory layer. Powered by Hindsight. Orchestrated by the OpenAI Agents SDK."

---

## Stack

| Layer | Tech | Notes |
|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript | React 18, TS 5.x, deployed on Vercel |
| Styling | Tailwind CSS v3.4 | Desktop-only (1024px+) |
| Charts | Recharts v2.10 | Anti-pattern sparkline + confidence evolution (P1) |
| Backend | Python 3.11 + FastAPI 0.109 | Deployed on Railway |
| Orchestration | OpenAI Agents SDK (`openai-agents`) | `BriefingAgent` with 3 tools; `RunHooks` for ms-accurate timings |
| Memory | Hindsight Cloud (`hindsight-client`) | 3 vendor banks; recall → synthesize → rank |
| LLM | OpenAI gpt-4o | `gpt-4o-mini` fallback via `OPENAI_MODEL` env var |
| Data gen | Faker v22.0 | Seeder only — critical turning points are hand-authored |
| Frontend host | Vercel | Free tier, auto-deploy from `main` |
| Backend host | Railway | Free tier, Dockerfile deploy |

---

## How It Works

### Memory-ON briefing (the demo beat)

1. Priya opens the NexaCloud briefing. The frontend calls `GET /api/briefing?vendor=nexacloud`.
2. `pipeline.py` spins up a `BriefingAgent` (OpenAI Agents SDK) with three function tools:
   - `recall_memories` — queries Hindsight Cloud for Experiences, Opinions, and world facts about the vendor.
   - `synthesize_briefing` — sends recalled context to gpt-4o with `BRIEFING_PROMPT`; returns structured tactics, playbook, and signals.
   - `rank_tactics` — sorts tactics by confidence score, flags anti-patterns.
3. A `RunHooks` subclass captures `on_tool_start` / `on_tool_end` timestamps for each tool, producing a `pipeline_trail[]` of `{step, status, ms}` objects.
4. The frontend renders the trail in `PipelineStatus` with real measured latencies.

### Memory-OFF (the contrast)

`POST /api/briefing/nomemory` calls gpt-4o with `NOMEMORY_PROMPT` — only the vendor name and buyer role, no Hindsight context. Returns exactly 3 generic textbook tactics. No dates, no dollar amounts, no contact names. Visibly inferior.

### Post-call ingest (memory compounds)

`POST /api/ingest` runs a 4-step pipeline:
1. **capture_old_scores** — snapshot current tactic confidences via `BriefingAgent`.
2. **retain** — `client.retain(bank_id, experience, metadata)` writes the new interaction to Hindsight.
3. **reflect** — re-run `BriefingAgent` on the updated bank; re-synthesize tactics.
4. **diff** — compute `{old, new, delta, direction}` for every tactic where `abs(delta) >= 0.01`.

The response includes `score_diffs` (powers `ScoreDiff`) and a 4-step `pipeline_trail` (powers `PipelineStatus`).

---

## Run Locally

```bash
# 1. Clone and set up env
git clone https://github.com/<your-handle>/leverage.git
cd leverage
cp .env.example .env
# Fill in: HINDSIGHT_API_KEY, HINDSIGHT_API_URL, OPENAI_API_KEY

# 2. Seed Hindsight banks
#    Run this 6+ hours before the demo (ideally the night before).
#    Hindsight needs time for Observations synthesis to stabilise.
cd seeder
pip install hindsight-client python-dotenv
python seed_vendors.py

# 3. Backend
cd ../backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Verify: curl http://localhost:8000/health

# 4. Frontend
cd ../frontend
pnpm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
pnpm dev
# Open http://localhost:3000
```

### Environment variables

**Backend (`backend/.env`):**
```
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o          # override to gpt-4o-mini if rate-limited
DEMO_MODE=false               # flip to true for canned fixture fallback
CORS_ORIGINS=http://localhost:3000,https://<your-vercel-app>.vercel.app
```

**Frontend (`frontend/.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Deploy

### Backend → Railway

1. Connect the repo to Railway. Set root directory: `backend/`.
2. Set all env vars from `.env.example` in the Railway dashboard.
3. Railway will use the `Dockerfile` in `backend/`. First deploy takes ~2 min.
4. Note your Railway public URL (e.g. `https://leverage-backend.up.railway.app`).

### Frontend → Vercel

1. Import the repo in Vercel. Set root directory: `frontend/`.
2. Add env var: `NEXT_PUBLIC_API_URL=https://<your-railway-domain>`.
3. Deploy. Vercel auto-deploys on every push to `main`.

### CORS

After both are deployed, update `CORS_ORIGINS` on Railway to include your Vercel domain:
```
CORS_ORIGINS=https://<your-vercel-app>.vercel.app
```

Smoke-test the full flow from the deployed Vercel URL (not localhost) before the demo.

---

## Acceptance Criteria

- [ ] `/api/vendors` returns exactly 3 vendors
- [ ] `GET /api/briefing?vendor=nexacloud` returns ≥4 tactics, at least one with `is_anti_pattern: true`, and a non-empty `pipeline_trail` with measured ms
- [ ] `POST /api/briefing/nomemory` returns exactly 3 generic tactics with no dates or dollar amounts
- [ ] `POST /api/ingest` returns a `score_diffs` map with at least 2 entries after the canonical Priya note
- [ ] MemoryToggle flips cleanly OFF ↔ ON with a visible 300ms cross-fade
- [ ] PipelineStatus trail renders on both briefing load and ingest, showing 3 and 4 visible steps respectively
- [ ] AntiPatternSparkline renders a descending red line with "AVOID" tag
- [ ] ScoreDiff shows `old → new` with green-up / red-down arrows and a visible CSS transition
- [ ] Frontend deployed on Vercel, backend deployed on Railway, both reachable via public URL
- [ ] Backup demo video uploaded to a GitHub Release as a fallback
- [ ] Full demo script runs live in under 5 minutes without errors

---

## Vendors Seeded

| Vendor | Annual Value | Renewal | Contact | Interactions |
|--------|-------------|---------|---------|-------------|
| NexaCloud | $380,000 | Dec 31 | Marcus Chen | 23 |
| DataPipe | $120,000 | Mar 15 | Ananya Rao | 4 |
| SecureNet | $85,000 | Jul 1 | James Wu | 3 |

NexaCloud is the primary demo vendor — 23 hand-authored interactions support all four on-screen tactics with dated evidence. DataPipe and SecureNet are present to demonstrate the dashboard is not a one-vendor mock.

---

## Repo Structure

```
TactIQ/
├── backend/          # FastAPI app (main.py, pipeline.py, briefing.py, ingest.py, nomemory.py)
├── frontend/         # Next.js 15 App Router (dashboard, briefing page, all components)
├── seeder/           # Hindsight bank seeder (seed_vendors.py, vendor_data.py)
├── spec.md           # Full build spec
└── .env.example
```

---

## License

MIT
