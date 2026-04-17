# LEVERAGE — Build Specification

> Vendor Negotiation Intelligence Agent  
> Stack: Next + FastAPI + Hindsight Cloud + gpt-5-4 + CascadeFlow  
> Hackathon: CascadeFlow + Hindsight  
> Promo code: `MEMHACK409` (for $50 Hindsight Cloud credits)

---

## 1. Goal

Build a buyer-side vendor negotiation memory tool. A procurement manager clicks a vendor, sees a briefing with confidence-scored tactics drawn from past interactions, logs what happened after the call, and watches the confidence scores update live. Memory is the product — without Hindsight the app has nothing to show.

**Demo arc (two beats — both must be flawless):**

1. **Opening beat** — flip the Memory toggle OFF. Briefing collapses to generic Groq advice, empty playbook placeholder. Flip ON. Hindsight-powered briefing materialises: branching playbook, named tactics with dated evidence, anti-pattern sparkline pinned at the bottom. This is the A/B that sells Hindsight.
2. **Closing beat** — post-call log submit. Score diffs animate (green up / red down), the playbook visibly redraws in place, moves tied to changed tactics flash green/red. This is the "chess engine reevaluates" moment.

Everything else is secondary.

---

## 2. Scope

### 2.1 Must-build (P0 — ship these first, in order)

1. Hindsight Cloud account + env setup using promo code `MEMHACK409`
2. **Vendor seeder** — Python script seeding 3 vendors with ~53 synthetic interactions via `retain()`
3. **Vendor dashboard** — list of 3 vendors with contract value, renewal date, days remaining (red <30d), interaction count
4. **Pre-call briefing** — click vendor → `reflect()` → render tactic cards + temporal banner + recent signals
5. **Confidence score display** — tactic card with name, 5-dot rating (colour-coded), numeric score, evidence, timing
6. **Playbook (ordered script)** — branching negotiation play generated from top tactics, rendered as a decision tree above the tactic cards ("chess engine" moment — this is the demo's centre of gravity)
7. **Anti-pattern sparkline** — at least one tactic card displays a small descending sparkline showing confidence decay over time (e.g. "Cancellation threat — dropping since 2022"), red border, "AVOID" tag
8. **Before/after memory toggle** — switch on briefing screen. OFF → `POST /api/briefing/nomemory` (Groq with just vendor name, generic advice). ON → `GET /api/briefing` (Hindsight). Opens the demo; the A/B contrast is what sells Hindsight.
9. **Post-call logger** — text form → `retain()` → `reflect()` → return updated scores + diffs + redrawn playbook
10. **Live score update animation** — old → new value, green if up, red if down. Playbook visibly redraws in place.

### 2.2 Nice-to-have (P1 — only after P0 is complete)

- Confidence evolution chart (Recharts LineChart) — extends the anti-pattern sparkline into full per-tactic history
- Email ingestion parser (paste thread → Groq extract → `retain()`)
- Vendor comparison panel
- Interaction timeline

### 2.3 Out of scope (do not build)

Real email/CRM integrations, OAuth, live call transcription, multi-user auth, mobile responsive, billing pages, outbound scheduling.

---

## 3. Architecture

### 3.1 Components


| Layer         | Tech             | Version                    |
| ------------- | ---------------- | -------------------------- |
| Frontend      | Next             | Next16                     |
| Styling       | Tailwind CSS     | v3.4                       |
| HTTP client   | Axios            | v1.6                       |
| Charts        | Recharts (or inline SVG) | v2.10              |
| Backend       | Python + FastAPI | Python 3.11, FastAPI 0.109 |
| Orchestration | CascadeFlow      | per docs                   |
| Memory        | Hindsight Cloud  | `hindsight-client` pip     |
| LLM           | OpenAI           | `gpt-5-4`                  |
| Data gen      | Faker            | v22.0                      |
| Frontend host | Vercel           | free tier                  |
| Backend host  | AWS              | EC2                        |


### 3.2 Folder structure

```
leverage/
├── seeder/
│   ├── seed_vendors.py        # entry point — runs once
│   └── vendor_data.py         # 53 interaction records across 3 vendors
├── backend/
│   ├── main.py                # FastAPI app, routes, CORS
│   ├── briefing.py            # recall() + reflect() logic
│   ├── ingest.py              # retain() + score diff computation
│   ├── models.py              # Pydantic request/response schemas
│   └── prompts.py             # BRIEFING_PROMPT string
├── frontend/
│   └── src/
│       ├── App.jsx            # React Router
│       ├── api.js             # Axios client wrapper
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   └── Briefing.jsx
│       └── components/
│           ├── TacticCard.jsx
│           ├── AntiPatternSparkline.jsx
│           ├── Playbook.jsx
│           ├── MemoryToggle.jsx
│           ├── TemporalBanner.jsx
│           ├── SignalFeed.jsx
│           ├── PostCallForm.jsx
│           └── ScoreDiff.jsx
├── .env.example
├── requirements.txt
├── package.json
└── README.md
```

### 3.3 Environment variables

```bash
# .env (backend)
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=...
GROQ_API_KEY=...
CASCADEFLOW_API_KEY=...

# .env (frontend)
VITE_API_URL=http://localhost:8000
```

---

## 4. Data model

### 4.1 Memory banks (one per vendor)


| bank_id     | Vendor    | Annual value | Renewal | Contact     | Seed count |
| ----------- | --------- | ------------ | ------- | ----------- | ---------- |
| `nexacloud` | NexaCloud | $380,000     | Dec 31  | Marcus Chen | 23         |
| `datapipe`  | DataPipe  | $120,000     | Mar 15  | Ananya Rao  | 16         |
| `securenet` | SecureNet | $85,000      | Jul 1   | James Wu    | 14         |


### 4.2 Hindsight networks used

- **World facts** — contract values, renewal dates, fiscal calendars, contact names
- **Experiences** — call summaries, email summaries, contract events (raw history)
- **Observations** — auto-synthesised patterns (Hindsight derives these)
- **Opinions** — confidence-scored beliefs with evidence (this is the UI centrepiece)

### 4.3 Patterns to embed (per vendor)

**NexaCloud (primary demo vendor — 23 interactions: 3 contracts + 8 calls + 12 emails)**

- AWS mention tactic → confidence `0.87` (2 successes: Nov 2023 5% discount; May 2024 3% + $8k support tier)
- Fiscal Q3 pressure → confidence `0.74` (worked in 2022, 2023, 2024 when explicitly referenced)
- Multi-year commitment → confidence `0.50` (raised unprompted Nov 18 2024, single data point)
- Cancellation threat (2022) → confidence `0.12` (failed — flag as ineffective)

**DataPipe (16 interactions: 2 contracts + 5 calls + 9 emails)**

- Volume commitment tactic → confidence `0.68`
- Competitor mention (Fivetran) → confidence `0.15` (negative, flag to avoid)

**SecureNet (14 interactions: 2 contracts + 4 calls + 8 emails)**

- Competitive bid (Okta, CrowdStrike quotes) → confidence `0.71` (8% discount)
- Cancellation threat (2023) → confidence `0.10` (negative)

---

## 5. Backend API

### 5.1 Routes


| Method | Path                                      | Purpose                                           |
| ------ | ----------------------------------------- | ------------------------------------------------- |
| `GET`  | `/api/vendors`                            | List 3 vendors with summary stats for dashboard   |
| `GET`  | `/api/briefing?vendor={bank_id}`          | Generate briefing via `reflect()`                 |
| `POST` | `/api/ingest`                             | Log post-call note, return briefing + score diffs |
| `POST` | `/api/briefing/nomemory?vendor={bank_id}` | Groq-only briefing (no Hindsight) — powers the A/B toggle |
| `POST` | `/api/email/parse`                        | P1: parse email thread, retain summary            |


### 5.2 Response schemas

`**GET /api/briefing`** → returns shape from `BRIEFING_PROMPT`:

```json
{
  "tactics": [
    {
      "name": "string — under 10 words",
      "confidence": 0.87,
      "evidence": "string",
      "timing": "string",
      "successes": 2,
      "total_uses": 2,
      "is_anti_pattern": false,
      "history": [
        { "date": "2022-Q1", "confidence": 0.65 },
        { "date": "2023-Q2", "confidence": 0.38 },
        { "date": "2024-Q2", "confidence": 0.19 },
        { "date": "2024-Q4", "confidence": 0.12 }
      ]
    }
  ],
  "playbook": {
    "opening": {
      "move": "Reference Q3 fiscal pressure",
      "rationale": "87% historical success — worked 2022, 2023, 2024",
      "tactic_ref": "Fiscal Q3 pressure"
    },
    "branches": [
      {
        "condition": "if pushback on timeline",
        "move": "AWS benchmark pivot",
        "rationale": "$/core comparison — won 5% discount Nov 2023, 3% + $8k support tier May 2024",
        "tactic_ref": "AWS mention",
        "followup": [
          {
            "condition": "if still resistant",
            "move": "Hint multi-year commitment",
            "rationale": "Untested but hot — Marcus raised unprompted Nov 18 2024",
            "tactic_ref": "Multi-year commitment"
          }
        ]
      },
      {
        "condition": "if counter >= 8%",
        "move": "Accept and lock renewal cap",
        "rationale": "Above historical average (6.2%)",
        "tactic_ref": null
      },
      {
        "condition": "if counter < 5%",
        "move": "Silence tactic",
        "rationale": "67% average concession follow-up",
        "tactic_ref": null
      }
    ]
  },
  "temporal_signals": [
    { "signal": "string", "urgency": "high", "days_remaining": 18 }
  ],
  "recent_signals": [
    {
      "date": "Dec 3",
      "source": "email",
      "summary": "string",
      "interpretation": "string"
    }
  ],
  "contract": {
    "value": "$380k",
    "renewal_date": "Dec 31",
    "contact": "Marcus Chen"
  }
}
```

**Notes:**
- `is_anti_pattern` defaults to `false`. When `true`, the tactic card renders with red border, "AVOID" tag, and the sparkline drawn from `history`.
- `history` is only required on tactics with `is_anti_pattern: true`. 4–5 descending points minimum. Other tactics may omit it or return `null`.
- `playbook` must branch at least once (opening → one conditional move). Two or three branches is ideal for demo legibility.
- `playbook.branches[].tactic_ref` is the `name` of a tactic in `tactics[]` when the move maps to one (for score-diff highlighting after post-call log); otherwise `null`.

`**POST /api/ingest**` request:

```json
{
  "vendor": "nexacloud",
  "notes": "string",
  "outcome": "Successful concession|No movement|Escalated|Rescheduled",
  "timestamp": "ISO-8601"
}
```

`**POST /api/ingest**` response:

```json
{
  "briefing": { ...same as GET /api/briefing },
  "score_diffs": {
    "AWS mention": { "old": 0.87, "new": 0.79, "delta": -0.08, "direction": "down" },
    "Multi-year":  { "old": 0.50, "new": 0.62, "delta": +0.12, "direction": "up" }
  }
}
```

### 5.3 Briefing prompt (exact string in `prompts.py`)

```python
BRIEFING_PROMPT = '''
You are a negotiation intelligence agent briefing a procurement manager before
a vendor renewal call. Based on all stored memories for this vendor, return ONLY
a valid JSON object with this exact structure:
{
  "tactics": [
    {
      "name": "string — tactic name, under 10 words",
      "confidence": 0.87,
      "evidence": "string — what the evidence says",
      "timing": "string — when to deploy this tactic",
      "successes": 2,
      "total_uses": 2,
      "is_anti_pattern": false,
      "history": null
    }
  ],
  "playbook": {
    "opening": {
      "move": "string — opening move, under 12 words",
      "rationale": "string — one-sentence reason tied to evidence",
      "tactic_ref": "string — name of matching tactic from tactics[], or null"
    },
    "branches": [
      {
        "condition": "string — 'if <counterparty response>'",
        "move": "string — next move, under 12 words",
        "rationale": "string — one-sentence reason tied to evidence",
        "tactic_ref": "string or null",
        "followup": [
          { "condition": "string", "move": "string", "rationale": "string", "tactic_ref": "string or null" }
        ]
      }
    ]
  },
  "temporal_signals": [
    { "signal": "string", "urgency": "high", "days_remaining": 18 }
  ],
  "recent_signals": [
    { "date": "Dec 3", "source": "email", "summary": "string", "interpretation": "string" }
  ],
  "contract": { "value": "$380k", "renewal_date": "Dec 31", "contact": "Marcus Chen" }
}

Rules for tactics:
- Return at least 3 tactics sorted by confidence descending.
- For any tactic with confidence < 0.20 AND ≥ 2 failed uses across multiple years,
  set "is_anti_pattern": true and provide "history" as an array of 4–5
  {date, confidence} points showing the decay over time (earliest first, most
  recent last). Otherwise "history": null.

Rules for playbook:
- Always provide one "opening" move (highest-confidence tactic or strongest
  temporal signal).
- Always provide 2–4 "branches" covering the most likely counterparty responses.
- Each branch's "tactic_ref" must match a tactic.name in tactics[] when the
  move derives from a stored tactic; otherwise null.
- At most one level of "followup" nesting per branch. Keep the tree legible.
- Do not include branches for scenarios the memory has no evidence for.
'''
```

### 5.4 Critical flow — `POST /api/ingest` (`ingest.py`)

This is the demo-winning flow. Implementation must be exact:

```python
async def log_post_call(vendor: str, notes: str, timestamp: str):
    # 1. Capture scores BEFORE retain()
    old_result = client.reflect(bank_id=vendor, query=BRIEFING_PROMPT)
    old_briefing = json.loads(old_result.content[0].text)
    old_scores = {t['name']: t['confidence'] for t in old_briefing['tactics']}

    # 2. Store the new interaction
    client.retain(
        bank_id=vendor,
        content=notes,
        context='post_call_log',
        timestamp=timestamp,
    )

    # 3. Get updated briefing AFTER retain()
    new_result = client.reflect(bank_id=vendor, query=BRIEFING_PROMPT)
    new_briefing = json.loads(new_result.content[0].text)
    new_scores = {t['name']: t['confidence'] for t in new_briefing['tactics']}

    # 4. Compute diffs (threshold: change must exceed 0.01)
    diffs = {}
    for tactic, new_conf in new_scores.items():
        old_conf = old_scores.get(tactic)
        if old_conf is not None and abs(new_conf - old_conf) > 0.01:
            diffs[tactic] = {
                'old': round(old_conf, 2),
                'new': round(new_conf, 2),
                'delta': round(new_conf - old_conf, 2),
                'direction': 'up' if new_conf > old_conf else 'down',
            }
    return {'briefing': new_briefing, 'score_diffs': diffs}
```

---

## 6. Frontend screens

### 6.1 Dashboard (`/`)

- Header: "Leverage — your vendor memory"
- Grid of 3 vendor cards. Per card:
  - Vendor name
  - Annual contract value (`$380k` / `$120k` / `$85k`)
  - Renewal date + days remaining — **red background if <30 days**
  - "N interactions logged"
  - "M tactics tracked"
  - Button: **Generate briefing** → `/briefing/:vendor`

### 6.2 Briefing (`/briefing/:vendor`) — the money shot

- **Header bar**
  - Left: "Pre-call briefing · Leverage" + vendor name ("NexaCloud — annual renewal")
  - Right: red countdown box "Call in 4h 32m"
  - Far right: **Memory toggle** (see §6.4) — always visible in header so the A/B contrast is one click away during demo
- **Stats row (3 cards)**: Annual value · Renewal date · Interactions logged
- **Playbook panel** (section label: "Your play — generated from memory") — RENDERED ABOVE TACTIC CARDS, this is the demo's centre of gravity
  - Component: `Playbook.jsx`
  - Opening move at top, bold, large type. Rationale as subdued caption below.
  - Branches rendered as an indented decision tree using Unicode box-drawing or styled borders:
    ```
    OPENING  Reference Q3 fiscal pressure
             └ 87% historical success — worked 2022, 2023, 2024

    ├ if pushback on timeline
    │   → AWS benchmark pivot
    │     └ Won 5% Nov 2023, 3% + $8k support May 2024
    │   └ if still resistant
    │       → Hint multi-year commitment
    │         └ Untested but hot — Marcus raised unprompted Nov 18

    ├ if counter ≥ 8%
    │   → Accept and lock renewal cap

    └ if counter < 5%
        → Silence tactic  (67% avg concession follow-up)
    ```
  - Each move that has a non-null `tactic_ref` is click-highlightable and visually linked to the matching tactic card below.
  - After post-call log submit, playbook re-renders with a brief cross-fade. Any move whose underlying tactic changed confidence gets a green/red flash border.
- **Tactic cards** (section label: "Tactics in memory")
  - Sorted descending by confidence, BUT anti-pattern cards always pinned to the bottom under their own subheader "Anti-patterns — do not use"
  - Each card: name (bold), 5-dot rating, numeric score
  - Dot colours:
    - **Green** if `confidence > 0.75`
    - **Amber** if `0.50 ≤ confidence ≤ 0.75`
    - **Grey** if `confidence < 0.50`
  - Below: evidence paragraph, evidence tags, timing recommendation
  - **Anti-pattern variant** — when `is_anti_pattern: true`:
    - Red border around the card
    - "AVOID" pill (red background, white text) next to name
    - Small sparkline component (`AntiPatternSparkline.jsx`, ~120×30px, Recharts `LineChart` or inline SVG) plotting `history` points — descending line, red stroke
    - Caption under sparkline: "Confidence falling since {first history date}"
- **Temporal banner** (red background): "Fiscal year pressure window: 18 days remaining" + one explanatory sentence
- **Recent signals feed**: last 3–5 from `recall()`. Each: date, source (email/call), summary, italic interpretation
- **Footer**: memory status line + button "Log post-call notes" → post-call form

### 6.3 Post-call logger (modal or `/briefing/:vendor/log`)

- Header: "Log post-call notes — {vendor}"
- Date field (pre-populated with today)
- Outcome dropdown: Successful concession / No movement / Escalated / Rescheduled
- Notes textarea with placeholder: "What happened? What did you say? What did they say?"
- Button: **Save to memory and update tactics**
- On submit:
  1. `POST /api/ingest`
  2. Show `ScoreDiff` panel — animated lines like `AWS mention: 0.87 → 0.91 (+0.04)` in green (or red for decreases)
  3. Pause ~2s for judges to read
  4. Auto-navigate back to briefing — new playbook cross-fades in; moves tied to changed tactics flash green/red for ~800ms; new tactic scores already reflected in dot colours

### 6.4 Before/after memory toggle

- Switch on briefing screen header (always visible — see §6.2)
- Label: "Memory: ON" / "Memory: OFF". Animated thumb slider.
- OFF → calls `POST /api/briefing/nomemory` (Groq with just the vendor name and role, no Hindsight context) — renders a deliberately generic briefing: vague openers ("Build rapport"), no named tactics, no dates, no dollar deltas, empty playbook placeholder ("Memory required for play generation")
- ON → `GET /api/briefing` — full Hindsight briefing with playbook, tactics, evidence, anti-patterns
- Default state on first visit: ON. Demo opens by flipping it OFF, then ON.
- Transition: 250ms cross-fade. No full page reload.

### 6.5 Confidence evolution chart (P1)

- Recharts `LineChart`
- X: interaction dates (seeded + live)
- Y: confidence 0.0 – 1.0
- One colour-coded line per tactic
- Click point → show what interaction caused the score change

---

## 7. Seeder

### 7.1 Contract

```bash
python seeder/seed_vendors.py
```

- Reads `NEXACLOUD_INTERACTIONS`, `DATAPIPE_INTERACTIONS`, `SECURENET_INTERACTIONS` from `vendor_data.py`
- Each interaction: `{ content: str, context: str, timestamp: ISO-8601 }`
- Calls `client.retain(bank_id, content, context, timestamp)` for every record
- Prints progress per vendor and a final success line

### 7.2 Data realism requirements

- Real-sounding names, dollar amounts, dates, outcomes. Use Faker for filler only.
- Timestamps must span ~6 months leading up to demo date
- Every embedded pattern above (section 4.3) must appear in at least as many interactions as its `total_uses` implies
- Failed tactics must be present — Hindsight needs negative examples to produce low-confidence Opinions

### 7.3 Run timing

**Run the seeder ≥24 hours before the demo.** Hindsight needs time for Observations synthesis to stabilise. Empty memory banks are disqualifying.

---

## 8. Build order (recommended sequence)

1. Repo scaffold, `.env.example`, `requirements.txt`, `package.json`
2. Hindsight Cloud account, apply `MEMHACK409`, confirm keys work with a trivial `retain()` call
3. `vendor_data.py` — write the 53 interactions (longest single task — budget 2–3 hours)
4. `seed_vendors.py` — run it, verify banks populate
5. `backend/main.py` + `briefing.py` — implement `GET /api/briefing` with hardcoded `BRIEFING_PROMPT` (include playbook + anti-pattern fields). Test via curl.
6. `briefing.py` — add `POST /api/briefing/nomemory` route (Groq-only, deliberately generic output — no Hindsight calls). Test via curl.
7. Frontend Vite + Tailwind scaffold, API client, routing
8. `Dashboard.jsx` → `Briefing.jsx` skeleton with `TacticCard`, `TemporalBanner`, `SignalFeed` (static styling first, wire API second)
9. `Playbook.jsx` — render branching decision tree from `playbook` field. Static mock first, then wire.
10. `AntiPatternSparkline.jsx` — Recharts `LineChart` or inline SVG from `history` array. Anti-pattern card variant styling.
11. `MemoryToggle.jsx` — header switch that swaps between `/api/briefing` and `/api/briefing/nomemory`
12. `ingest.py` — implement the exact 4-step flow in §5.4
13. `PostCallForm.jsx` + `ScoreDiff.jsx` — animated diffs + playbook re-render cross-fade
14. **Smoke-test the full loop 5× end-to-end** — OFF → ON → log → redraw
15. Deploy: Railway (backend) + Vercel (frontend). Update `VITE_API_URL`.
16. Only now touch P1 features
17. Record demo video, write article, push final README

---

## 9. Acceptance criteria (done = all of these pass)

- `python seeder/seed_vendors.py` completes with no errors and populates 3 banks
- `GET /api/vendors` returns 3 vendors with correct stats
- `GET /api/briefing?vendor=nexacloud` returns parseable JSON matching the schema in §5.2, with ≥3 tactics sorted by confidence descending, top tactic confidence ≥ 0.80
- `POST /api/briefing/nomemory?vendor=nexacloud` returns generic Groq output with empty/placeholder playbook and no named tactics, evidence, or dates
- Dashboard renders 3 vendor cards; NexaCloud card shows red "days remaining" badge
- Briefing screen renders within 2 seconds of vendor click
- Tactic cards show correct dot colours per thresholds in §6.2
- At least one tactic in the NexaCloud briefing has `is_anti_pattern: true` and renders with red border, "AVOID" tag, and a descending sparkline
- Playbook panel renders an opening move + at least 2 branches; moves are visually linked (click-highlight) to their `tactic_ref` cards
- Memory toggle is visible in the briefing header; flipping OFF shows a visibly inferior briefing within 2 seconds; flipping ON restores the full briefing. Transition cross-fades, does not full-reload.
- Temporal banner visible with days-remaining number
- Recent signals feed shows ≥3 entries with dates, sources, and italic interpretations
- Post-call form submission triggers the full §5.4 flow
- Score diffs visibly animate old→new with green/red colour coding within 3 seconds of submit
- Playbook visibly redraws after the score diff; moves tied to changed tactics flash green/red briefly
- At least one tactic's confidence changes (direction + magnitude) per post-call log
- Full demo script (§10 in source doc) runs in ≤5 minutes with no dead time
- Repo is public, README renders, `.env.example` present, no secrets committed

---

## 10. Risks and mitigations


| Risk                                            | Mitigation                                                                                                                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reflect()` returns non-JSON or invalid JSON    | Wrap `json.loads()` in try/except; on failure, call Groq directly with the same prompt as fallback; log the raw response for debugging                                 |
| Confidence scores don't change after `retain()` | Seed stronger contradictory signal in the demo post-call note (like the §10 Beat 5 canned text — "Rep pushed back harder than before + offered multi-year unprompted") |
| Hindsight API latency blows through 2s budget   | Pre-fetch briefing on dashboard hover; show skeleton loader; cache last briefing client-side                                                                           |
| Empty memory bank at demo time                  | Re-run seeder ≥24h before; keep a backup seeded account                                                                                                                |
| Live demo fails on stage                        | Have the recorded video ready to play immediately; switch without apologising                                                                                          |


---

## 11. Deliverables checklist

- Public GitHub repo with clean commit history
- README explains product, run instructions, architecture, and Hindsight network usage
- `.env.example` present, no real keys in repo
- `requirements.txt` and `package.json` accurate
- Demo video ≤5 minutes — opens with Priya story, shows score update, ends with $23,400 number
- Article 400–600 words
- LinkedIn post drafted
- Seeder run ≥24h before demo
- Post-call → score-update flow rehearsed ≥5 times end-to-end

