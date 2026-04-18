# LEVERAGE — Build Specification

> Vendor Negotiation Intelligence Agent
> Stack: Next.js 15 (App Router) + FastAPI + OpenAI Agents SDK + Hindsight Cloud + OpenAI
> Hackathon: Hindsight (CascadeFlow replaced with OpenAI Agents SDK — CascadeFlow was waitlist-gated)
> Promo code: `MEMHACK409` (for $50 Hindsight Cloud credits)
> Status: v3 (CascadeFlow → OpenAI Agents SDK, Groq removed, OpenAI-only, build plan inlined)

---

## 1. Goal

Build a buyer-side vendor negotiation memory tool. A procurement manager (Priya) clicks a vendor, sees a briefing with confidence-scored tactics drawn from past interactions, logs what happened after the call, and watches the confidence scores update live. **Memory is the product — without Hindsight the app is a ChatGPT wrapper.** The **OpenAI Agents SDK** is the visible nervous system that orchestrates every briefing and every ingest as a multi-step agent pipeline (`recall → synthesize → rank`); each tool invocation emits a lifecycle event that drives the `PipelineStatus` UI trail on screen.

### 1.1 Demo arc (the two beats that win the hackathon)

**Opening beat — the A/B that sells Hindsight + OpenAI Agents SDK.**
Priya opens the NexaCloud briefing. MemoryToggle is OFF → generic, textbook advice from OpenAI with no vendor context. She flips it ON. The `PipelineStatus` trail renders three live lines — `recall → synthesize → rank` — with real measured latencies captured from the Agents SDK lifecycle hooks. Four scored tactics materialise: a branching playbook, named tactics with dated evidence (`Mention AWS — 0.87, 2/2, last worked May 2024`), and an anti-pattern sparkline (`Cancellation threat — 0.12, AVOID`) pinned at the bottom.

**Closing beat — the memory compounds in real time.**
Priya logs post-call notes: "Marcus pushed back when I mentioned AWS. Offered a 3-year commitment unprompted — 8% discount plus roadmap access." Submit. `PipelineStatus` flashes again with the four-step ingest trail (`capture_old → retain → reflect → diff`). ScoreDiff animates: AWS mention `0.87 → 0.79` (red arrow down), Multi-year commitment `0.50 → 0.68` (green arrow up). The playbook cross-fades and the changed moves flash green/red for 800ms. One dollar number lands: "Priya just saved $23,400 on this call. $1.1M/year across 47 vendors."

---

## 2. Scope

### 2.1 Must-build (P0 — ship these first, in order)

1. Hindsight Cloud account + env setup using promo code `MEMHACK409`
2. `openai-agents` Python SDK installed; verify a trivial `Agent` + `Runner.run_streamed()` round-trip
3. Seeder that populates 3 Hindsight banks with ~30 synthetic interactions (see §4.1, §7)
4. Backend routes: `/api/vendors`, `/api/briefing`, `/api/briefing/nomemory`, `/api/ingest`, `/health`
5. Agents-SDK pipeline (`pipeline.py`) — a `BriefingAgent` with `recall_memories`, `synthesize_briefing`, `rank_tactics` tools; a `RunHooks` subclass that captures tool-level timings into a `pipeline_trail` for every briefing + every ingest
6. Dashboard page with 3 vendor cards, red temporal badge on the renewal-urgent vendor
7. Briefing page with: MemoryToggle (the hero), 4 TacticCards, branching Playbook, AntiPatternSparkline, SignalFeed (2 items), `PipelineStatus` trail
8. PostCallForm + ScoreDiff with green-up / red-down arrows and CSS transitions
9. Deploy: frontend on Vercel, backend on Railway, deploy smoke before hour 8
10. Backup demo video recorded at hour 8.5, hosted as a GitHub Release asset

### 2.2 Nice-to-have (P1 — only after P0 is complete)

- Confidence evolution chart (Recharts `LineChart` of `history[]` per tactic)
- Email ingestion parser (`POST /api/email/parse`)
- Vendor comparison panel (side-by-side 3 vendors' top tactics)
- Interaction timeline (vertical, dated, filterable)

### 2.3 Out of scope (do not build)

- Auth, multi-tenant, SSO, RBAC
- Real CRM integrations (Salesforce, HubSpot, Gong)
- Email-provider OAuth (Gmail, Outlook)
- Payment / billing
- Mobile responsive below 1024px — demo is desktop only

---

## 3. Architecture

### 3.1 Components

| Layer         | Tech                              | Version / Notes                                       |
| ------------- | --------------------------------- | ----------------------------------------------------- |
| Frontend      | Next.js (App Router) + TypeScript | Next.js **15.x**, React 18, TS 5.x                    |
| Styling       | Tailwind CSS                      | v3.4                                                  |
| HTTP client   | `fetch` (native) or Axios         | Axios v1.6 optional                                   |
| Charts        | Recharts (or inline SVG)          | v2.10                                                 |
| Backend       | Python + FastAPI                  | Python 3.11, FastAPI 0.109                            |
| Orchestration | **OpenAI Agents SDK**             | `openai-agents` pip (`pip install openai-agents`)     |
| Memory        | **Hindsight Cloud**               | `hindsight-client` pip                                |
| LLM           | **OpenAI**                        | `openai` pip, model `gpt-4o` (fallback `gpt-4o-mini`) |
| Data gen      | Faker                             | v22.0                                                 |
| Frontend host | Vercel                            | free tier, auto-deploy from `main`                    |
| Backend host  | Railway                           | free tier, Dockerfile deploy                          |

**Note:** We use **OpenAI for both** the memory-ON briefing synthesis AND the memory-OFF generic-advice endpoint. Groq is intentionally not part of this stack — one LLM provider = one failure mode. The nomemory endpoint uses a deliberately constrained prompt so its output stays visibly inferior to the Hindsight-powered briefing.

**Why OpenAI Agents SDK instead of CascadeFlow:** CascadeFlow was the original hackathon sponsor for orchestration, but signup is waitlist-gated and we can't get keys in time. The Agents SDK is a drop-in replacement that serves the same "visible orchestration" demo beat — a `BriefingAgent` with three function tools (`recall_memories`, `synthesize_briefing`, `rank_tactics`) gives us real, deterministic step lifecycle events via `Runner.run_streamed()`. Every tool call emits a `run_item_stream_event` of type `tool_call_item` / `tool_call_output_item`, and `RunHooks.on_tool_start` / `on_tool_end` give us millisecond-accurate timings for the UI trail. This is strictly better than the hand-rolled timer we'd have otherwise used: named SDK, real lifecycle events, and built-in tracing we can surface later.

### 3.2 Folder structure

```
leverage/
├── seeder/
│   ├── seed_vendors.py
│   └── vendor_data.py              # 30 interactions total (23 + 4 + 3)
├── backend/
│   ├── main.py                     # FastAPI app, CORS, route wiring
│   ├── briefing.py                 # confidence formula + thin adapter calling pipeline.run_briefing
│   ├── ingest.py                   # §5.4 four-step flow (wraps pipeline + hindsight.retain)
│   ├── nomemory.py                 # OpenAI-only generic-advice endpoint
│   ├── pipeline.py                 # OpenAI Agents SDK: BriefingAgent + tools + RunHooks trail
│   ├── models.py                   # Pydantic request/response schemas
│   ├── prompts.py                  # BRIEFING_PROMPT + NOMEMORY_PROMPT + AGENT_INSTRUCTIONS
│   ├── fixtures/
│   │   └── demo.json               # DEMO_MODE canned responses
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                       # Next.js 15 (App Router) + Tailwind v3.4
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Dashboard
│   │   │   └── briefing/[vendor]/
│   │   │       └── page.tsx
│   │   ├── lib/
│   │   │   ├── api.ts              # typed client against backend
│   │   │   └── types.ts            # shared TS types
│   │   └── components/
│   │       ├── VendorCard.tsx
│   │       ├── TacticCard.tsx
│   │       ├── Playbook.tsx
│   │       ├── AntiPatternSparkline.tsx
│   │       ├── MemoryToggle.tsx        # hero component
│   │       ├── PipelineStatus.tsx      # Agents-SDK orchestration trail
│   │       ├── SignalFeed.tsx
│   │       ├── PostCallForm.tsx
│   │       └── ScoreDiff.tsx
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   ├── tsconfig.json
│   └── package.json
├── .env.example
├── README.md
└── LICENSE
```

### 3.3 Environment variables

**Backend (`backend/.env`):**

```
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=...
OPENAI_API_KEY=...                         # used by both `openai` and `openai-agents`
OPENAI_MODEL=gpt-4o                        # override to gpt-4o-mini if rate-limited
DEMO_MODE=false                            # flip to true as stub fallback (§10)
CORS_ORIGINS=http://localhost:3000,https://<your-vercel-app>.vercel.app
```

The Agents SDK reads `OPENAI_API_KEY` from the environment directly — no second key to configure.

**Frontend (`frontend/.env.local`):**

```
NEXT_PUBLIC_API_URL=https://set-daring-tadpole.ngrok-free.app   # -> https://<railway-domain> in prod
```

---

## 4. Data model

### 4.1 Memory banks (one per vendor)

| bank_id     | Vendor    | Annual value | Renewal | Contact     | Seed count |
| ----------- | --------- | ------------ | ------- | ----------- | ---------- |
| `nexacloud` | NexaCloud | $380,000     | Dec 31  | Marcus Chen | 23         |
| `datapipe`  | DataPipe  | $120,000     | Mar 15  | Ananya Rao  | 4          |
| `securenet` | SecureNet | $85,000      | Jul 1   | James Wu    | 3          |

**NexaCloud is the demo vendor** — 23 rich interactions support the 4 on-screen tactics. DataPipe and SecureNet are thin-but-present to prove the dashboard isn't a one-vendor mock.

### 4.2 Hindsight networks used

- **World facts** — contract values, renewal dates, fiscal calendars, contact names
- **Experiences** — call summaries, email summaries, contract events (raw history)
- **Observations** — auto-synthesised patterns (Hindsight derives these; synthesis takes time — see §7.3)
- **Opinions** — confidence-scored beliefs with evidence (this is the UI centrepiece)

### 4.3 Patterns to embed (per vendor)

- **NexaCloud (23 interactions: 3 contracts + 8 calls + 12 emails)**:
  - AWS mention tactic → `0.87` (2/2 success, last worked May 2024)
  - Fiscal Q3 pressure → `0.74` (3/4 success)
  - Multi-year commitment → `0.50` (raised unprompted Nov 2024)
  - Cancellation threat (2022) → `0.12` (anti-pattern, 0/3 success)
- **DataPipe (4 interactions)**:
  - Volume commitment → `0.68`
  - Competitor mention (Fivetran) → `0.15` (anti-pattern)
- **SecureNet (3 interactions)**:
  - Competitive bid (Okta, CrowdStrike quotes) → `0.71`
  - Cancellation threat (2023) → `0.10` (anti-pattern)

---

## 5. Backend API

### 5.1 Routes

| Method | Path                             | Purpose                                                               |
| ------ | -------------------------------- | --------------------------------------------------------------------- |
| GET    | `/health`                        | Liveness probe (returns `{"ok": true}`)                               |
| GET    | `/api/vendors`                   | List 3 vendors with summary fields                                    |
| GET    | `/api/briefing?vendor={bank_id}` | Full Hindsight briefing, orchestrated by the Agents SDK BriefingAgent |
| POST   | `/api/briefing/nomemory`         | OpenAI-only generic advice, 3 tactics, no Hindsight                   |
| POST   | `/api/ingest`                    | Log post-call note, return updated briefing + score diffs             |
| POST   | `/api/email/parse`               | **P1** — parse a pasted email thread into an Experience               |

Every `/api/briefing` and `/api/ingest` response includes a `pipeline_trail[]` field: an ordered list of `{step, status, ms, label}` objects captured from the Agents SDK `RunHooks` lifecycle, powering the PipelineStatus UI.

### 5.2 Response schemas

**GET `/api/briefing`** (JSON):

```json
{
  "vendor": "nexacloud",
  "contract": {
    "value": 380000,
    "renewal_date": "2025-12-31",
    "days_remaining": 18,
    "contact": "Marcus Chen"
  },
  "tactics": [
    {
      "name": "Mention AWS",
      "confidence": 0.87,
      "evidence": "Worked May 2024 — 3% discount + $8k support tier upgrade",
      "timing": "Early in the call, before pricing is anchored",
      "successes": 2,
      "total_uses": 2,
      "last_used_date": "2024-05-14",
      "is_anti_pattern": false,
      "history": [
        { "date": "2023-02-10", "confidence": 0.6 },
        { "date": "2023-09-03", "confidence": 0.75 },
        { "date": "2024-05-14", "confidence": 0.87 }
      ]
    }
  ],
  "playbook": {
    "opening": {
      "move": "...",
      "rationale": "...",
      "tactic_ref": "Mention AWS"
    },
    "branches": [
      {
        "condition": "If Marcus counters with 'our pricing is already competitive'",
        "move": "...",
        "rationale": "...",
        "tactic_ref": "Fiscal Q3 pressure",
        "followup": [
          {
            "condition": "...",
            "move": "...",
            "rationale": "...",
            "tactic_ref": "..."
          }
        ]
      }
    ]
  },
  "temporal_signals": [
    { "label": "18 days to renewal", "severity": "high" },
    { "label": "Fiscal Q3 pressure active", "severity": "medium" }
  ],
  "recent_signals": [
    {
      "date": "2024-11-02",
      "source": "email",
      "summary": "Marcus mentioned roadmap Q1 2026",
      "interpretation": "Warming on multi-year commit"
    }
  ],
  "pipeline_trail": [
    { "step": "recall", "status": "ok", "ms": 412 },
    { "step": "synthesize", "status": "ok", "ms": 1830 },
    { "step": "rank", "status": "ok", "ms": 87 }
  ]
}
```

**POST `/api/ingest`** request:

```json
{
  "vendor": "nexacloud",
  "notes": "Marcus pushed back on AWS mention. Offered 3-year commit unprompted — 8% discount + roadmap access.",
  "outcome": "Successful concession",
  "timestamp": "2025-12-13T16:45:00Z"
}
```

`outcome` is one of: `"Successful concession" | "No movement" | "Escalated" | "Rescheduled"`.

**POST `/api/ingest`** response:

```json
{
  "briefing": { "...same shape as GET /api/briefing..." },
  "score_diffs": {
    "Mention AWS": {"old": 0.87, "new": 0.79, "delta": -0.08, "direction": "down"},
    "Multi-year commitment": {"old": 0.50, "new": 0.68, "delta": 0.18, "direction": "up"}
  },
  "pipeline_trail": [
    {"step": "capture_old_scores", "status": "ok", "ms": 38},
    {"step": "retain", "status": "ok", "ms": 540},
    {"step": "reflect", "status": "ok", "ms": 1920},
    {"step": "diff", "status": "ok", "ms": 12}
  ]
}
```

### 5.3 Briefing prompt (exact string in `prompts.py`)

```python
BRIEFING_PROMPT = """You are a procurement strategist. Using ONLY the provided
Hindsight Opinions and Experiences about the vendor, produce a negotiation briefing
as strict JSON matching this schema: { tactics[], playbook{opening, branches[]},
temporal_signals[], recent_signals[] }.

Rules:
- Return at least 3 tactics sorted by confidence descending.
- For any tactic with confidence < 0.20 AND >= 2 failed uses across multiple years,
  set "is_anti_pattern": true and provide "history" as an array of 4-5
  {date, confidence} points showing descending trend.
- Always provide 2-4 "branches" in the playbook, each with a clear "condition"
  phrased as "If <vendor_contact> says/does X".
- At most one level of "followup" nesting per branch.
- Every tactic MUST include: name, confidence (float 0-1), evidence (with at least
  one dated reference), timing, successes, total_uses, last_used_date, is_anti_pattern.
- Do not invent facts. If evidence is thin, say so in the evidence field.
- Output valid JSON only. No prose, no markdown fences.
"""

NOMEMORY_PROMPT = """You are an AI assistant giving generic negotiation advice for a
B2B vendor renewal. You have NO information about this specific vendor, their history,
or prior calls — only the vendor name and the buyer's role.

Output strict JSON: { "tactics": [ { "name": "<under 10 words>", "advice":
"<one-sentence textbook recommendation>" } ] }

Rules:
- Exactly 3 tactics.
- Advice must be generic textbook content (e.g. "anchor high", "ask for multi-year discount").
- Do NOT invent specific dates, dollar amounts, or contact names.
- Output valid JSON only.
"""
```

**Wrap every `json.loads()` in a `try/except`.** If the LLM returns malformed JSON, retry once with `response_format={"type": "json_object"}` (OpenAI enforces JSON mode on gpt-4o). If it still fails, return a DEMO_MODE fixture — never 500 to the frontend.

### 5.4 Critical flow — `POST /api/ingest` (`ingest.py`)

Wrapped by `pipeline.py` so each step emits a timing into `pipeline_trail`. The first and third steps run the full Agents SDK `BriefingAgent`; their own per-tool trails are collapsed into a single `capture_old_scores` / `reflect` parent step in the response:

1. **capture_old_scores** — run the BriefingAgent once to snapshot current tactic confidences BEFORE any write.
2. **retain** — `client.retain(bank_id=vendor, experience=notes, metadata={outcome, timestamp})`.
3. **reflect** — run the BriefingAgent again on the updated bank; re-synthesize tactics.
4. **diff** — compute `{old, new, delta, direction}` for every tactic where `abs(delta) >= 0.01`. Tactics below threshold are omitted from `score_diffs`.

Return `{briefing, score_diffs, pipeline_trail}`.

---

## 6. Frontend screens

### 6.1 Dashboard (`/` → `app/page.tsx`)

- Header: "LEVERAGE" wordmark, tagline "Negotiation memory for procurement".
- Grid of 3 `VendorCard` components:
  - Vendor name, annual contract value, renewal date, days remaining, M tactics tracked, interaction count.
  - **Red temporal badge** when `days_remaining < 30` (NexaCloud: `"18 days · fiscal Q3 pressure"`).
  - Click → `/briefing/[vendor]`.
- Empty state: if `/api/vendors` returns empty, show "Seed the Hindsight banks before demo — see README §7."

### 6.2 Briefing (`/briefing/[vendor]` → `app/briefing/[vendor]/page.tsx`) — the money shot

Layout (top to bottom):

1. **Temporal banner** — contract value, renewal date, days remaining, contact name.
2. **MemoryToggle** — the hero. Single switch, bold label. Default ON.
3. **PipelineStatus trail** — three lines with checkmarks and measured ms, rendered during load and after toggle flip.
4. **TacticCard grid** — 4 cards, sorted by confidence desc. Each card:
   - Name, 5-dot confidence rating, color (green ≥0.7, amber 0.4–0.7, grey <0.4, **red border + "AVOID" tag** if `is_anti_pattern`).
   - Evidence line, timing line, track record (`2 for 2`, `0 for 3`).
5. **Playbook** — branching decision tree (inline SVG or nested flex). Opening move at top, 2–4 branches below, each with one optional followup.
6. **AntiPatternSparkline** — descending red line, pinned at the bottom with "AVOID" tag.
7. **SignalFeed** — 2 most recent signals (date, source, summary, italic interpretation).
8. **"Log post-call notes" button** → opens `PostCallForm` (modal).

### 6.3 Post-call logger (modal, triggered from briefing)

Form fields:

- Date (defaults to now)
- Outcome dropdown (§5.2 enum)
- Notes (textarea, required, ≥20 chars)
- Submit button

On submit:

- POST `/api/ingest` with PipelineStatus spinner overlay.
- On response: show `ScoreDiff` panel for ~2s (old → new, colored arrow, animate opacity).
- Auto-close modal, briefing playbook cross-fades and flashes changed moves green/red for 800ms.

### 6.4 Before/after memory toggle

- **OFF** → call `POST /api/briefing/nomemory` (OpenAI with vendor name + role only, no Hindsight context). UI shows 3 generic advice bullets, greyed playbook placeholder (`"— no playbook without memory —"`), no anti-pattern, no signals.
- **ON** → `GET /api/briefing` — full Hindsight + Agents-SDK briefing with playbook, tactics, evidence, anti-patterns, signals.
- Toggle flip triggers a 300ms cross-fade; PipelineStatus re-renders fresh timings on each flip.

### 6.5 PipelineStatus (Agents-SDK orchestration trail)

Renders as a 3-line pill on briefing load and as a 4-line pill on ingest. Each line: `✓ <step> <label> — <ms> ms` in a monospace font. Example during briefing:

```
✓ recall    Recalled 23 memories from Hindsight — 412 ms
✓ synthesize  Synthesized 4 tactics via OpenAI — 1830 ms
✓ rank    Ranked by confidence — 87 ms
```

Backend captures real latency per step via `RunHooks.on_tool_start` / `on_tool_end` from the Agents SDK (millisecond-accurate); for ingest it adds outer `time.perf_counter()` timers around `retain` and `diff` since those aren't agent tools. Everything returns in `pipeline_trail[]`. If the Agents SDK integration isn't wired by hour 8, fall back to fake labels with `setTimeout` on the frontend and **drop the ms footers** — never invent fake timings.

### 6.6 Confidence evolution chart (P1)

Recharts `LineChart` rendering `tactic.history[]`, one line per tactic, shown in a collapsed drawer under the TacticCard grid.

---

## 7. Seeder

### 7.1 Contract

`seeder/seed_vendors.py` reads `vendor_data.py` (a pure-Python dict of 30 interactions) and calls `client.retain()` once per interaction into the correct bank.

### 7.2 Data realism requirements

- Dates span 2022–2025, with most recent within the last 90 days.
- NexaCloud interactions must support all 4 on-screen tactics (AWS mention, Q3 pressure, multi-year, cancellation-threat anti-pattern) with at least 2 dated evidence points each.
- Contact names consistent across interactions (Marcus Chen for NexaCloud, etc.).
- Use Faker for filler text but **hand-author the critical turning-point interactions** — LLMs notice generic Faker prose and the tactics will look weak.

### 7.3 Run timing

**Run the seeder at hour -3 (pre-hackathon prep), and again the night before if possible.** Hindsight needs time for Observations synthesis to stabilise — official line is 24h, actual latency is unverified. If synthesis is still warming at hour 5 of the sprint, `reflect()` may return thin Opinions — acceptable, `BRIEFING_PROMPT` will still produce tactics from raw Experiences.

Empty memory banks are disqualifying. Seed early, seed redundantly.

---

## 8. Build plan (10-hour sprint)

### 8.1 Pre-hackathon prep (hour -3 to 0 — outside the sprint budget)

| Pre-hour         | Work                                                                                                                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| -3.0 to -2.0     | Hindsight Cloud signup + `MEMHACK409` promo. Verify API key with trivial `retain()` + `reflect()` round-trip. Save response shape to a local file.                                                                                 |
| -2.5 to -2.0     | `pip install openai-agents`. Skim the Agents SDK quickstart. Verify a trivial `Agent` + `Runner.run_streamed()` round-trip emits `tool_call_item` events.                                                                          |
| -2.0 to -1.0     | Repo on GitHub. Next.js 15 App Router + Tailwind v3.4 scaffold (`npx create-next-app@latest --ts --tailwind --app`). Python 3.11 FastAPI scaffold + `/health` route. Pinned `requirements.txt` and `package.json`. `.env.example`. |
| -1.0 to 0.0      | Deploy smoke. Push scaffolds to Vercel + Railway. Verify `/health` returns 200 from the Railway URL. Verify Next.js renders on Vercel. Verify CORS allows the Vercel origin.                                                       |
| The night before | Run `seed_vendors.py` against the three Hindsight banks. Leave overnight for synthesis.                                                                                                                                            |

### 8.2 10-hour sprint build order (with pre-committed cut rules)

| Hour     | Work                                                                                                                                                                                                                         | Cut rule if behind                                                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.0–2.5  | `seeder/vendor_data.py` (30 interactions, 23+4+3). `seed_vendors.py` batch writer. Run against live Hindsight banks; verify `reflect()` returns meaningful Opinions.                                                         | At 2.0: drop to 20 interactions (17+2+1). At 2.5: **STOP and commit what you have**.                                                                        |
| 2.5–4.0  | Backend core: `main.py` + routes, `prompts.py`, `briefing.py` (with `BRIEFING_PROMPT` + OpenAI JSON-mode call), `nomemory.py` (OpenAI with `NOMEMORY_PROMPT`). Curl-test both.                                               | At 4.0: if `reflect()` returns invalid JSON, wrap in try/except, retry with OpenAI JSON mode, fall through to DEMO_MODE fixture.                            |
| 4.0–5.0  | `ingest.py` (§5.4 four-step flow) reusing `pipeline.run_briefing`. Add `retain` + `diff` step timers. Curl-test a sample note; confirm `score_diffs` appear and `pipeline_trail` has 4 steps.                                | At 5.0: if ingest is flaky, stub `/api/ingest` with canned diffs from `fixtures/demo.json` (DEMO_MODE).                                                     |
| 5.0–6.0  | Frontend wiring: `lib/api.ts` typed client, `lib/types.ts`, `VendorCard.tsx`, Dashboard page routing, red badge + inline temporal line on NexaCloud.                                                                         | At 6.0: ship minimal Tailwind if unstyled — function over polish.                                                                                           |
| 6.0–8.0  | **Briefing page hero**: `TacticCard`, `Playbook`, `AntiPatternSparkline`, `MemoryToggle`, `PipelineStatus` (~60 min), `SignalFeed` (2 items). Wire toggle to both endpoints.                                                 | At 7.5: if toggle is flaky, ship diff-as-hero and cut toggle. At 8.0: if `PipelineStatus` unwired, fake step labels with `setTimeout`, **drop ms footers**. |
| 8.0–8.5  | `PostCallForm` + `ScoreDiff` with CSS transitions + arrows. Wire to `/api/ingest`. Trigger briefing re-render on diff response.                                                                                              | At 8.5: show plain "saved" confirmation if diffs don't render.                                                                                              |
| 8.5–9.0  | **Record backup demo video** with OBS/Loom. Upload to GitHub Releases. Take 4 screenshots for the README. Verify the deployed app still works end-to-end. Re-check CORS. Write the Priya hero + $1.1M framing in the README. | —                                                                                                                                                           |
| 9.0–9.5  | Smoke-test end-to-end 3× against the **live deployment** (not localhost). Dashboard → briefing → toggle OFF → toggle ON → post-call log → diffs.                                                                             | —                                                                                                                                                           |
| 9.5–10.0 | Rehearse demo 2× following the §9 script. README polish (5 min). Hackathon submission form (5 min). **Submit with 10 min to spare.**                                                                                         | At 9.75: if anything is broken live, swap to backup video, submit without debugging.                                                                        |

**Post-submission (outside the 10-hr budget):** 400–600 word write-up + LinkedIn post (~60 min).

---

## 9. Demo script (5 minutes, 6 beats)

**Beat 1 — Cold open (0:00–0:30).**

> "This is Priya. She runs procurement at a 400-person SaaS company. Tomorrow at 10 AM she's on a call to renew NexaCloud — $380,000 annual contract, 18 days to renewal. She's done this dance 47 times this year. Every time, she walks in blind."

**Beat 2 — Dashboard (0:30–1:00).**
Open `/`. Three vendor cards. Red badge on NexaCloud: `"18 days · fiscal Q3 pressure"`. Click in.

**Beat 3 — The toggle, the hero (1:00–2:30).**

> "Here's her briefing. Memory OFF first — this is what ChatGPT gives her."
> Toggle OFF. Generic 3-bullet advice. "Anchor high." "Ask for multi-year."
> "Now watch."
> Flip ON. PipelineStatus flashes: `✓ recall 412ms ✓ synthesize 1830ms ✓ rank 87ms`. Four tactics render:

- **Mention AWS** — 0.87 confidence, 2/2 success, last worked May 2024, 3% discount + $8k support
- **Fiscal Q3 pressure** — 0.74, 3/4 success
- **Multi-year commitment** — 0.50, raised unprompted Nov 2024
- **Cancellation threat** — 0.12, AVOID (red border, descending sparkline)

**Beat 4 — Post-call log (2:30–3:30).**
Click "Log post-call notes." Type:

> "Marcus pushed back harder than expected when I mentioned AWS. Offered a 3-year commitment unprompted — 8% discount plus roadmap access."
> Submit. PipelineStatus flashes again. ScoreDiff: `Mention AWS 0.87 → 0.79 ▼`, `Multi-year commitment 0.50 → 0.68 ▲`. Playbook cross-fades; the "open with AWS mention" move flashes red, the "pivot to multi-year" move flashes green.

**Beat 5 — The dollar number (3:30–4:30).**

> "Priya just saved $23,400 on this one call. Across her 47 vendors, that's $1.1 million a year. But the real win — her memory compounds. Next year the AWS tactic has a 3rd data point. Five years from now, LEVERAGE knows Marcus better than Marcus knows himself."

**Beat 6 — Company frame (4:30–5:00).**

> "Procurement is the wedge. Sales close, legal settlements, M&A term sheets, hiring packages, partnership deals — every repeated B2B negotiation has the same memory problem. LEVERAGE is the memory layer. Powered by Hindsight. Orchestrated by the OpenAI Agents SDK."

---

## 10. Acceptance criteria (done = all of these pass)

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
- [ ] Full demo script (§9) runs live in under 5 minutes without errors

---

## 11. Risks and mitigations

| Risk                                                | Mitigation                                                                                                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hindsight Observations haven't synthesized in time  | Seed at hour -3 AND the night before. `BRIEFING_PROMPT` works on raw Experiences if Opinions are thin.                                                                                     |
| `reflect()` returns malformed JSON                  | Wrap in try/except, retry with OpenAI `response_format={"type":"json_object"}`, fall through to DEMO_MODE fixture.                                                                         |
| Agents SDK hook/event API differs from expectations | Build the PipelineStatus UI first (trusts only the trail shape, not the source). Fall back to outer `time.perf_counter()` timers in `pipeline.py`; drop ms footers if timings aren't real. |
| OpenAI rate limit / key missing `gpt-4o`            | Override `OPENAI_MODEL=gpt-4o-mini` via env. Both prompts are short enough to fit.                                                                                                         |
| Railway cold-start kills demo                       | Hit `/health` 60s before the demo; keep a curl loop warm during rehearsal.                                                                                                                 |
| Live demo fails on stage                            | Backup video recorded at hour 8.5, uploaded to GitHub Release. Swap at hour 9.75 without debugging.                                                                                        |
| CORS breaks in prod                                 | `CORS_ORIGINS` env var explicitly includes the Vercel origin. Smoke-test from the deployed frontend, never localhost.                                                                      |
| Post-call diff animation doesn't fire               | Ship plain "saved" confirmation as fallback; keep the playbook cross-fade as the visual cue instead.                                                                                       |

---

## 12. Deliverables checklist

- [ ] Public GitHub repo with MIT LICENSE and clean README
- [ ] Frontend deployed to Vercel (custom domain optional)
- [ ] Backend deployed to Railway with `/health` green
- [ ] 3 Hindsight banks seeded (NexaCloud 23, DataPipe 4, SecureNet 3)
- [ ] OpenAI Agents SDK orchestration (BriefingAgent + tools + RunHooks) wrapping briefing + ingest, visibly surfaced in the UI
- [ ] README includes: hero screenshot, Priya story, §9 demo script, $23,400 / $1.1M framing, setup instructions
- [ ] Backup demo video as a GitHub Release asset
- [ ] Hackathon submission form completed with 10 min to spare
- [ ] Post-submission: 400–600 word article + LinkedIn post

---

## 13. Open questions (flag before pre-hackathon prep ends)

- **Agents SDK quirks:** any edge cases around `Runner.run_streamed()` with JSON-schema response formats on `gpt-4o`? Any issues emitting `tool_call_output_item` for tools that return large JSON strings? Verify during pre-flight.
- **Hindsight synthesis latency:** 24h official vs actual. If possible, seed a throwaway trial bank 24h before prep begins and measure Opinions quality at T+1h, T+6h, T+24h.
- **OpenAI model access:** does the user's key have `gpt-4o`, `gpt-4o-mini`, or both? Pin via `OPENAI_MODEL` env var.
- **Demo venue:** stage or video call? Determines whether we care about projector aspect ratio (target 1366×768 through 1920×1080).

Resolve all four during the pre-hackathon prep window (hour -3 to 0). Do not resolve them during the sprint.
