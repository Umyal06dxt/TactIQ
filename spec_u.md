# LEVERAGE — Master Build Specification
### Vendor Negotiation Intelligence Agent
**Hackathon:** CascadeFlow + Hindsight Hackathon
**Stack:** React 18 + Vite · FastAPI · Hindsight Cloud · Groq (qwen3-32b)
**Promo Code:** `MEMHACK409` — $50 free Hindsight Cloud credits

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [UI Design System](#2-ui-design-system)
3. [System Architecture](#3-system-architecture)
4. [Section 4.1 — Must-Build Features](#4-section-41--must-build-features)
5. [Section 4.2 — Nice-to-Have Features](#5-section-42--nice-to-have-features)
6. [Section 4.3 — Out of Scope](#6-section-43--out-of-scope)
7. [Folder Structure](#7-folder-structure)
8. [Environment Variables](#8-environment-variables)
9. [Acceptance Checklists](#9-acceptance-checklists)

---

## 1. Product Overview

Leverage is an AI-powered negotiation intelligence agent that gives procurement managers complete institutional memory before, during, and after every vendor renewal call. It remembers every email, every call outcome, every concession — and uses Hindsight's Opinions network to produce confidence-scored tactics that improve with every new interaction.

**Core insight:** Every tool on the market helps sellers remember buyers. Nobody helps buyers remember vendors. Leverage is the first buyer-side vendor negotiation memory tool.

**The one-liner:** Know your vendor's pressure points before every renewal call — with confidence scores that get sharper over time.

**Memory is the product.** Remove Hindsight from Leverage and there is nothing left. The agent cannot score tactics without experience data. It cannot detect fiscal-year timing without temporal memory. It cannot surface the pattern "AWS mention produces concession" without a history of past calls. Memory is not a feature of Leverage — memory is the entire product.

---

## 2. UI Design System

All UI components must strictly follow this design system. No deviation in colours, typography, or spacing conventions.

### 2.1 Colour Palette

```css
:root {
  /* ── Core backgrounds ── */
  --bg-base:        #0A0A0A;   /* Page background — near-black */
  --bg-surface:     #141414;   /* Card and panel backgrounds */
  --bg-elevated:    #1C1C1C;   /* Hover states, inputs, dropdowns */
  --bg-overlay:     #242424;   /* Modals, tooltips, floating layers */

  /* ── Orange — primary brand accent ── */
  --orange-500:     #F97316;   /* Primary CTA buttons, active states */
  --orange-400:     #FB923C;   /* Hover state for orange buttons */
  --orange-300:     #FCA56A;   /* Subtle orange highlights */
  --orange-100:     #1A0F07;   /* Low-emphasis orange tinted backgrounds */

  /* ── Grey scale ── */
  --grey-800:       #2A2A2A;   /* Dividers, card borders */
  --grey-700:       #3A3A3A;   /* Inactive tabs, disabled UI */
  --grey-500:       #6B7280;   /* Secondary text, metadata */
  --grey-400:       #9CA3AF;   /* Body text, descriptions */
  --grey-200:       #D1D5DB;   /* Primary body text */
  --grey-100:       #F3F4F6;   /* Headings and high-emphasis text */

  /* ── Status colours ── */
  --status-green:   #22C55E;   /* Score up, successful concession */
  --status-red:     #EF4444;   /* Score down, urgent deadline, failed tactic */
  --status-amber:   #F59E0B;   /* Mid-range confidence, warnings */

  /* ── Confidence dot colours ── */
  --conf-high:      #F97316;   /* > 0.75 — orange */
  --conf-mid:       #F59E0B;   /* 0.50–0.75 — amber */
  --conf-low:       #3A3A3A;   /* < 0.50 — dark grey */
}
```

### 2.2 Typography

```css
/* Import via Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');

:root {
  --font-display: 'Syne', sans-serif;       /* Headings, vendor names, large numerics */
  --font-body:    'DM Sans', sans-serif;    /* Body text, labels, paragraphs */
  --font-mono:    'DM Mono', monospace;     /* Confidence scores, timestamps, code */
}
```

| Element              | Font         | Size    | Weight | Colour          |
|----------------------|--------------|---------|--------|-----------------|
| Page title           | Syne         | 28px    | 800    | `--grey-100`    |
| Section heading      | Syne         | 20px    | 700    | `--grey-100`    |
| Card title           | Syne         | 16px    | 600    | `--grey-100`    |
| Body text            | DM Sans      | 14px    | 400    | `--grey-400`    |
| Label / metadata     | DM Sans      | 12px    | 500    | `--grey-500`    |
| Confidence score     | DM Mono      | 22px    | 500    | `--orange-500`  |
| Timestamps           | DM Mono      | 12px    | 400    | `--grey-500`    |
| CTA button text      | DM Sans      | 14px    | 600    | `#0A0A0A`       |

### 2.3 Component Tokens

```css
:root {
  /* Cards */
  --card-bg:          var(--bg-surface);
  --card-border:      1px solid var(--grey-800);
  --card-radius:      12px;
  --card-padding:     24px;
  --card-shadow:      0 1px 3px rgba(0,0,0,0.4);

  /* Buttons — Primary (orange) */
  --btn-primary-bg:   var(--orange-500);
  --btn-primary-text: #0A0A0A;
  --btn-primary-hover:var(--orange-400);
  --btn-radius:       8px;
  --btn-padding:      10px 20px;
  --btn-font-size:    14px;
  --btn-font-weight:  600;

  /* Inputs */
  --input-bg:         var(--bg-elevated);
  --input-border:     1px solid var(--grey-800);
  --input-focus-border: 1px solid var(--orange-500);
  --input-radius:     8px;
  --input-padding:    10px 14px;
  --input-text:       var(--grey-200);

  /* Urgent / Alert banner */
  --banner-urgent-bg: rgba(249, 115, 22, 0.12);
  --banner-urgent-border: 1px solid rgba(249, 115, 22, 0.4);
  --banner-urgent-text: var(--orange-300);

  /* Red alert (deadline < 30 days) */
  --alert-red-bg:     rgba(239, 68, 68, 0.12);
  --alert-red-border: 1px solid rgba(239, 68, 68, 0.4);
  --alert-red-text:   #EF4444;

  /* Dividers */
  --divider:          1px solid var(--grey-800);

  /* Spacing scale */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  32px;
  --space-2xl: 48px;
}
```

### 2.4 Layout Rules

- **Max content width:** `1200px`, centred with `margin: 0 auto`
- **Page padding:** `24px` horizontal on all screens
- **Grid columns:** Dashboard uses a `3-column CSS grid` at `≥1024px`, `2-column` at `≥640px`, `1-column` below
- **Briefing layout:** `2-column` — left column (tactic cards + temporal banner, `60%`), right column (signals feed + contract stats, `40%`)
- **Card gap:** `16px` between all grid cards
- **Section spacing:** `40px` vertical between major sections

### 2.5 Animation Tokens

```css
:root {
  --transition-fast:   150ms ease;
  --transition-base:   250ms ease;
  --transition-slow:   400ms ease;
  --score-fade-dur:    600ms ease-in-out;
}
```

- All interactive elements (`button`, `card hover`) use `var(--transition-base)`
- Score update animation: old value fades out over `300ms`, new value fades in over `300ms` with a simultaneous colour flash
- Score increase: value flashes `--status-green` for `600ms` before settling to `--orange-500`
- Score decrease: value flashes `--status-red` for `600ms` before settling to `--orange-500`
- Tactic cards animate in on page load with a staggered `opacity: 0 → 1` delay of `80ms` per card

---

## 3. System Architecture

### 3.1 Component Overview

| Component       | Technology                  | Version      | Purpose                                           |
|-----------------|-----------------------------|--------------|---------------------------------------------------|
| Frontend        | React + Vite                | React 18, Vite 5 | Vendor dashboard, briefing UI, post-call logger |
| Styling         | Tailwind CSS (+ CSS vars)   | v3.4         | All UI styling, with custom CSS variables layered on top |
| HTTP client     | Axios                       | v1.6         | Frontend-to-backend API calls                    |
| Charts          | Recharts                    | v2.10        | Confidence evolution line chart (Section 4.2)    |
| Backend         | Python + FastAPI            | Python 3.11, FastAPI 0.109 | API server — orchestrates all Hindsight and Groq calls |
| Memory          | Hindsight Cloud             | MEMHACK409   | All 4 memory networks: World, Experiences, Observations, Opinions |
| Hindsight SDK   | hindsight-client            | latest pip   | Python SDK for `retain()` / `recall()` / `reflect()` |
| LLM             | OpenAI API                    | GPT-5.4    | Fast LLM inference via Hindsight `reflect()`     |
| Orchestration   | CascadeFlow                 | as per docs  | Agent workflow management (required by hackathon)|
| Data generation | Faker                       | v22.0        | Realistic synthetic names and companies in seeder |
| Frontend host   | Vercel                      | free tier    | One-click deploy from GitHub                     |
| Backend host    | Railway                     | free tier    | FastAPI server hosting                           |

### 3.2 Data Flow — Briefing Generation

```
User clicks "Generate briefing" for NexaCloud
  → Frontend: GET /api/briefing?vendor=nexacloud
    → Backend triggers CascadeFlow briefing workflow
      → CascadeFlow: recall(bank_id='nexacloud', query='negotiation tactics and patterns')
      → CascadeFlow: reflect(bank_id='nexacloud', query=BRIEFING_PROMPT)
        → Hindsight reasons over: World + Experiences + Observations + Opinions
        → Returns structured JSON: { tactics[], temporal_signals[], recent_signals[], contract{} }
    → Backend passes JSON to frontend
  → Frontend renders: tactic cards, confidence dots, temporal banner, signal feed
```

### 3.3 Data Flow — Post-Call Ingestion

```
User fills post-call form, clicks "Save to memory"
  → Frontend: POST /api/ingest { vendor, notes, outcome, timestamp }
    → Backend: capture old_scores via reflect() BEFORE retain()
    → Backend: retain(bank_id, content=notes, timestamp=timestamp)
      → Hindsight: extracts facts, updates entity graph, triggers observation synthesis
    → Backend: reflect() again → new_scores
    → Backend: compute diffs { tactic_name: { old, new, delta, direction } }
    → Returns: { briefing: new_briefing, score_diffs: diffs }
  → Frontend: animates score changes (green ↑ / red ↓)
  → Frontend: auto-navigates to updated briefing screen
```

### 3.4 Hindsight Memory Networks

| Network      | What it stores                                | Leverage usage                                       | Example content                                                                |
|--------------|-----------------------------------------------|------------------------------------------------------|--------------------------------------------------------------------------------|
| World        | Objective facts about vendors and the world   | Contract values, renewal dates, fiscal calendars, vendor contacts | NexaCloud annual contract: $380,000. Fiscal Q3 ends Jan 31 each year.     |
| Experiences  | Raw interaction history — calls, emails, events | Every call summary, email outcome, contract event logged via `retain()` | May 15 2024: Called Marcus Chen. Mentioned AWS S3. Returned with 3% decrease. |
| Observations | Patterns synthesised from many experiences    | Vendor behavioural tendencies Hindsight derives automatically | NexaCloud shows pricing flexibility when competitive alternatives are raised.  |
| Opinions     | Confidence-scored beliefs with evidence links | Tactic confidence scores shown in briefing UI. Evolve after each `retain()` | Tactic: AWS mention. Confidence: 0.87. Evidence: 2 successful deployments.    |

> **The Opinions network is unique to Hindsight.** No other memory system tracks confidence scores with evidence links that evolve automatically. Make it the visual centrepiece of every screen.

### 3.5 Memory Bank Structure

| bank_id    | Vendor     | Annual value | Primary use in demo                                                           |
|------------|------------|--------------|-------------------------------------------------------------------------------|
| nexacloud  | NexaCloud  | $380,000     | Primary demo vendor. Fully seeded. Used for all briefing and post-call demos. |
| datapipe   | DataPipe   | $120,000     | Secondary vendor on dashboard. Demonstrates system breadth.                  |
| securenet  | SecureNet  | $85,000      | Secondary vendor. Contains one failed tactic as a negative learning example. |

---

## 4. Section 4.1 — Must-Build Features

> **These seven features must be built first, in this exact order.**
> Do not begin anything in Sections 4.2 or 4.3 until every item below works end-to-end.
> These seven features constitute a complete, submittable hackathon project.

---

### Feature 1 — Hindsight Cloud Account Setup

**What to do:**
- Create a Hindsight Cloud account at the Hindsight platform
- Apply promo code `MEMHACK409` to receive $50 free credits
- Confirm all four memory networks are accessible: World, Experiences, Observations, Opinions
- Store credentials in `.env` file using the provided `.env.example` template (see Section 8)
- Verify the Python SDK (`hindsight-client`) installs and authenticates correctly before writing any other backend code

**Definition of done:** `client.recall(bank_id='test', query='test')` runs without an authentication error.

---

### Feature 2 — Vendor Data Seeder Script

**Files:** `seeder/seed_vendors.py`, `seeder/vendor_data.py`

**What it does:**
Generates 6 months of realistic synthetic interaction history for all 3 vendors and calls `retain()` for each interaction record. This pre-populates all Hindsight memory banks so the agent appears experienced from the first click on demo day.

**Run timing:** Execute this script at least **24 hours before the demo**, not the morning of. An empty or thin memory bank produces low-quality briefings and is disqualifying.

**Vendor seed targets:**

| Vendor     | bank_id   | Interaction count | Breakdown                                               |
|------------|-----------|-------------------|---------------------------------------------------------|
| NexaCloud  | nexacloud | 23                | 3 contract records, 8 call summaries, 12 email summaries |
| DataPipe   | datapipe  | 16                | 2 contract records, 5 calls, 9 emails                   |
| SecureNet  | securenet | 14                | 2 contract records, 4 calls, 8 emails                   |

**NexaCloud patterns to embed in seed data:**

| Tactic                    | History to embed                                                                                                   | Target confidence |
|---------------------------|--------------------------------------------------------------------------------------------------------------------|-------------------|
| AWS mention               | Nov 2023: mentioned AWS S3 → rep went quiet → returned with 5% discount. May 2024: mentioned AWS again → 3% decrease + $8k support tier | 0.87 |
| Fiscal year pressure      | Q3 close discounts available in 2022, 2023, and 2024 — but only when Priya explicitly referenced the date. Rep never offered unprompted. | 0.74 |
| Multi-year commitment     | Marcus raised multi-year deal structure unprompted on Nov 18, 2024. First time in 3 years. Single data point.      | 0.50              |
| Cancellation threat (fail)| 2022: Priya threatened to cancel entirely → rep escalated to VP → final deal was same price                        | 0.12              |

**DataPipe patterns to embed:**
- Volume commitment — offering a 12-month usage tier produced 5 free seats. Target confidence: `0.68`
- Competitor mention (fail) — mentioning Fivetran made rep defensive, negotiations slowed. Target confidence: `0.15`

**SecureNet patterns to embed:**
- Competitive bid — submitting quotes from Okta and CrowdStrike produced 8% discount. Target confidence: `0.71`
- Cancellation threat (fail) — escalated to VP in 2023, final price slightly higher due to tier repackaging. Target confidence: `0.10`

**Each interaction record in `vendor_data.py` must have:**
```python
{
  'content':   'string — detailed narrative of the interaction (2–5 sentences minimum)',
  'context':   'string — e.g. negotiation_call / email_thread / contract_record / post_call_log',
  'timestamp': 'ISO 8601 string — e.g. 2024-05-15T14:00:00Z'
}
```
> Always pass `timestamp`. It is required for temporal reasoning. Without timestamps, Hindsight cannot detect the fiscal-year pressure pattern.

**Seeder script pattern:**
```python
# seeder/seed_vendors.py
from hindsight_client import Hindsight
import os
from vendor_data import NEXACLOUD_INTERACTIONS, DATAPIPE_INTERACTIONS, SECURENET_INTERACTIONS

client = Hindsight(base_url=os.getenv('HINDSIGHT_API_URL'))

ALL_VENDORS = [
    ('nexacloud', NEXACLOUD_INTERACTIONS),
    ('datapipe',  DATAPIPE_INTERACTIONS),
    ('securenet', SECURENET_INTERACTIONS),
]

for bank_id, interactions in ALL_VENDORS:
    print(f'Seeding {bank_id} ({len(interactions)} interactions)...')
    for i in interactions:
        client.retain(
            bank_id=bank_id,
            content=i['content'],
            context=i.get('context', 'interaction'),
            timestamp=i['timestamp']
        )
    print(f'  ✓ Done.')

print('All vendors seeded successfully.')
```

**Definition of done:** Script completes with no errors. `reflect()` called on `nexacloud` returns at least 3 tactics with meaningful confidence scores.

---

### Feature 3 — Vendor Dashboard

**File:** `frontend/src/pages/Dashboard.jsx`

**Purpose:** Landing screen. Shows all 3 vendors at a glance. NexaCloud must be visually flagged as the urgent upcoming renewal.

**Layout:** 3-column CSS grid at `≥1024px`, 2-column at `≥640px`, 1-column below. Card gap: `16px`. Page max-width: `1200px`.

**Page header:**
- Left: logotype `LEVERAGE` in `--font-display`, weight 800, `--grey-100`, with a small orange dot `●` before the text
- Right: subtitle `Vendor Negotiation Intelligence` in `--font-body`, `--grey-500`
- Below header: a `1px` horizontal rule in `--grey-800`

**Each vendor card contains:**

| Element                    | Detail                                                                           |
|----------------------------|----------------------------------------------------------------------------------|
| Vendor name                | `--font-display`, 18px, weight 700, `--grey-100`                                |
| Service category label     | `--font-body`, 12px, `--grey-500` — e.g. "Cloud Infrastructure"                |
| Annual contract value      | `--font-mono`, 28px, weight 500, `--orange-500` — e.g. `$380,000`              |
| Renewal date               | `--font-body`, 13px, `--grey-400`                                               |
| Days remaining             | Badge pill — if `≤ 30 days`: background `--alert-red-bg`, border `--alert-red-border`, text `--alert-red-text`. If `> 30 days`: background `--bg-elevated`, text `--grey-500` |
| Interactions in memory     | `--font-body`, 13px, `--grey-400` — e.g. "23 interactions logged"               |
| Tactics tracked            | `--font-body`, 13px, `--grey-400` — e.g. "3 tactics tracked"                   |
| "Generate briefing" button | Full-width, `--btn-primary-bg`, `--btn-primary-text`, `--btn-radius`            |

**Card styling:**
- Background: `--card-bg`
- Border: `--card-border`
- Border radius: `--card-radius`
- Padding: `--card-padding`
- On hover: border colour transitions to `--orange-500` over `--transition-base`; subtle `box-shadow: 0 0 0 1px var(--orange-500)`

**Definition of done:** Dashboard renders all 3 cards. NexaCloud shows a red days-remaining badge. Clicking "Generate briefing" navigates to the briefing screen.

---

### Feature 4 — Pre-Call Briefing Generator

**Files:** `frontend/src/pages/Briefing.jsx`, `backend/briefing.py`

**Purpose:** The centrepiece screen of the entire product. When a user clicks "Generate briefing", the backend calls `reflect()` and the frontend renders the full structured briefing. Polish every element of this screen.

**API endpoint:** `GET /api/briefing?vendor=nexacloud`

**Backend logic (`briefing.py`):**
1. Receive vendor query parameter
2. Trigger CascadeFlow briefing workflow
3. Call `recall(bank_id=vendor, query='recent vendor behaviour and negotiation signals', limit=5)` — used for the Recent Signals feed
4. Call `reflect(bank_id=vendor, query=BRIEFING_PROMPT)` — used for everything else
5. Parse the JSON response
6. Return structured payload to frontend

**`BRIEFING_PROMPT` (use exactly):**
```python
BRIEFING_PROMPT = '''
You are a negotiation intelligence agent briefing a procurement manager
before a vendor renewal call. Based on all stored memories for this vendor,
return ONLY a valid JSON object with this exact structure:
{
  "tactics": [
    {
      "name": "string — tactic name, under 10 words",
      "confidence": 0.87,
      "evidence": "string — what the evidence says",
      "timing": "string — when to deploy this tactic",
      "successes": 2,
      "total_uses": 2
    }
  ],
  "temporal_signals": [
    { "signal": "string", "urgency": "high", "days_remaining": 18 }
  ],
  "recent_signals": [
    { "date": "Dec 3", "source": "email", "summary": "string", "interpretation": "string" }
  ],
  "contract": { "value": "$380k", "renewal_date": "Dec 31", "contact": "Marcus Chen" }
}
'''
```

**Screen layout — top to bottom:**

**Header bar:**
- Left: `Pre-call briefing · LEVERAGE` in `--font-display`, `--grey-100` · `NexaCloud — annual renewal` in `--grey-500`
- Right: countdown timer — `Call in 4h 32m` in a badge with background `--alert-red-bg`, border `--alert-red-border`, text `--alert-red-text`, `--font-mono`

**Stats row — 3 metric cards side by side:**

| Metric            | Value     | Font             | Colour         |
|-------------------|-----------|------------------|----------------|
| Annual value      | $380k     | DM Mono, 24px    | `--orange-500` |
| Renewal date      | Dec 31    | DM Mono, 24px    | `--grey-200`   |
| Interactions logged | 23      | DM Mono, 24px    | `--grey-200`   |

Each metric card: background `--bg-surface`, border `--card-border`, radius `8px`, padding `16px 20px`. Label above value in `--font-body`, 11px, `--grey-500`, uppercase, letter-spacing `0.08em`.

**Tactic cards section:**
- Section label: `Recommended tactics — from Hindsight memory` in `--font-body`, 12px, `--grey-500`, uppercase, letter-spacing `0.08em`
- Render 3 tactic cards in descending confidence order
- Animate in with staggered `opacity: 0 → 1`, `80ms` delay per card

**Each tactic card:**

| Element             | Specification                                                                         |
|---------------------|---------------------------------------------------------------------------------------|
| Tactic name         | `--font-display`, 15px, weight 600, `--grey-100`                                     |
| Confidence score    | `--font-mono`, 22px, weight 500, `--orange-500` — displayed as `0.87`               |
| 5-dot rating        | 5 circle dots `●`. Filled dots coloured by confidence tier (see below). Dot size 8px, gap 4px |
| Evidence paragraph  | `--font-body`, 13px, `--grey-400`, max 2 sentences                                  |
| Evidence tags       | Small rounded pills, background `--bg-elevated`, border `--grey-800`, text `--grey-400`, font 11px |
| Timing line         | `--font-body`, 12px, `--grey-500`, italic — e.g. "Deploy after first price pushback" |

**Confidence dot colour rules:**

| Confidence range | Dot colour         | Numeric label colour |
|------------------|--------------------|----------------------|
| > 0.75           | `--conf-high` (orange) | `--orange-500`   |
| 0.50 – 0.75      | `--conf-mid` (amber)   | `--status-amber` |
| < 0.50           | `--conf-low` (dark grey) | `--grey-500`   |

**Number of filled dots calculation:** `Math.round(confidence * 5)` dots filled, remainder unfilled (colour `--grey-800`).

**Temporal intelligence banner:**
- Full-width banner below tactic cards
- Background: `--banner-urgent-bg`
- Border: `--banner-urgent-border`
- Left edge: `3px solid --orange-500` (left border accent)
- Icon: `⏳` or clock SVG in `--orange-400`, 16px
- Heading: `Fiscal year pressure window: 18 days remaining` in `--font-display`, 14px, `--orange-300`
- Body: one sentence explaining the pattern in `--font-body`, 13px, `--grey-400`
- Border radius: `8px`
- Padding: `16px 20px`

**Recent signals feed:**
- Section label: `Recent signals` in `--font-body`, 12px, `--grey-500`, uppercase
- List of 3–5 signals sourced from `recall()`
- Each signal entry:
  - Date: `--font-mono`, 11px, `--grey-500`
  - Source badge: `email` or `call` — pill, background `--bg-elevated`, text `--grey-400`, 11px
  - Summary: `--font-body`, 13px, `--grey-200`
  - Agent interpretation: `--font-body`, 12px, `--grey-500`, italic, indented `8px`
  - Separated by `1px` divider in `--grey-800`

**Footer:**
- Left: `23 interactions · 3 tactics · last updated Dec 3` in `--font-body`, 12px, `--grey-500`
- Right: button `Log post-call notes` — `--btn-primary-bg`, navigates to post-call form

**Definition of done:** Briefing screen loads within 3 seconds of clicking. All tactic cards render with correct confidence colours. Temporal banner displays. Signals feed populates from `recall()`.

---

### Feature 5 — Confidence Score Display

**File:** `frontend/src/components/TacticCard.jsx`

This is a standalone reusable component used by the briefing screen and the score diff panel. All visual rules for confidence scores are defined in Section 4.1 Feature 4 above and must be implemented here.

**Props interface:**
```typescript
interface TacticCardProps {
  name:       string;       // Tactic name
  confidence: number;       // 0.0 – 1.0
  evidence:   string;       // Evidence description
  timing:     string;       // Deployment timing note
  successes:  number;       // Successful deployments
  total_uses: number;       // Total deployments
  tags?:      string[];     // Optional evidence tags
  animateIn?: boolean;      // Trigger stagger animation on mount
  delay?:     number;       // Stagger delay in ms
}
```

**Definition of done:** Card renders correctly for all three confidence tiers. Dot colours match the specified ranges. Score is displayed in `--font-mono`.

---

### Feature 6 — Post-Call Note Logger

**Files:** `frontend/src/components/PostCallForm.jsx`, `backend/ingest.py`

**Purpose:** Simple, fast form for logging what happened on a call. The submit action triggers memory update and the live score animation — this is the most important demo moment.

**API endpoint:** `POST /api/ingest`
```json
{ "vendor": "nexacloud", "notes": "string", "outcome": "string", "timestamp": "ISO 8601" }
```

**Screen layout:**

| Element            | Specification                                                                           |
|--------------------|-----------------------------------------------------------------------------------------|
| Page header        | `Log post-call notes — NexaCloud` in `--font-display`, 20px, `--grey-100`             |
| Date field         | Pre-populated with today's date. Input styled with `--input-bg`, `--input-border`. Focus ring: `--orange-500` |
| Outcome dropdown   | Options: `Successful concession` / `No movement` / `Escalated` / `Rescheduled`. Same input styling. |
| Notes textarea     | Min-height `140px`. Placeholder: *"What happened? What did you say? What did they say?"* Same input styling. |
| Submit button      | Full-width. Label: `Save to memory and update tactics`. `--btn-primary-bg`. On loading state: label changes to `Saving to memory…` with a spinner. |

**Backend logic (`ingest.py`):**
```python
async def log_post_call(vendor: str, notes: str, timestamp: str):
    # Step 1: capture scores BEFORE retain()
    old_result = client.reflect(bank_id=vendor, query=BRIEFING_PROMPT)
    old_briefing = json.loads(old_result.content[0].text)
    old_scores = { t['name']: t['confidence'] for t in old_briefing['tactics'] }

    # Step 2: store the new interaction
    client.retain(bank_id=vendor, content=notes, context='post_call_log', timestamp=timestamp)

    # Step 3: get updated briefing AFTER retain()
    new_result = client.reflect(bank_id=vendor, query=BRIEFING_PROMPT)
    new_briefing = json.loads(new_result.content[0].text)
    new_scores = { t['name']: t['confidence'] for t in new_briefing['tactics'] }

    # Step 4: compute diffs
    diffs = {}
    for tactic, new_conf in new_scores.items():
        old_conf = old_scores.get(tactic)
        if old_conf is not None and abs(new_conf - old_conf) > 0.01:
            diffs[tactic] = {
                'old':       round(old_conf, 2),
                'new':       round(new_conf, 2),
                'delta':     round(new_conf - old_conf, 2),
                'direction': 'up' if new_conf > old_conf else 'down'
            }

    return { 'briefing': new_briefing, 'score_diffs': diffs }
```

**Definition of done:** Form submits, `retain()` is called, `reflect()` runs twice, score diffs are returned to the frontend.

---

### Feature 7 — Live Score Update Animation

**File:** `frontend/src/components/ScoreDiff.jsx`

**Purpose:** The single most important demo moment. After post-call notes are submitted, confidence scores visibly update on screen in real time. Judges will remember this. Build it, polish it, test it 10 times.

**Triggered by:** Successful response from `POST /api/ingest` containing a `score_diffs` object.

**Visual behaviour:**

1. A score diff panel appears **above** the tactic cards with a smooth `slideDown` animation
2. For each tactic with a diff `> 0.01`, display one diff row:
   - Tactic name in `--font-body`, 14px, `--grey-200`
   - Old score: `--font-mono`, `--grey-500`, strikethrough
   - Arrow: `↑` in `--status-green` if up, `↓` in `--status-red` if down
   - New score: `--font-mono`, new colour (green if up, red if down), bold
   - Delta: `+0.04` or `−0.08` in smaller text, same colour as direction
3. Simultaneously, on the tactic card itself:
   - Old confidence number fades out over `300ms`
   - New confidence number fades in over `300ms`
   - Card flashes a `1px` border in `--status-green` or `--status-red` for `600ms` then transitions back to `--grey-800`
4. After `2 seconds`, automatically navigate to the updated briefing screen

**Example rendered output:**
```
AWS mention          0.87 → 0.79  ↓ −0.08    (shown in red)
Multi-year commitment 0.50 → 0.62  ↑ +0.12   (shown in green)
```

**Definition of done:** Score diff panel appears, values animate, colours are correct, briefing auto-refreshes with new scores.

---

## 5. Section 4.2 — Nice-to-Have Features

> **Begin only after every item in Section 4.1 is complete and working end-to-end.**
> Build in the order listed. Each feature meaningfully improves the demo but the submission is complete without them.

---

### Feature 1 — Before/After Memory Toggle

**File:** `frontend/src/pages/Briefing.jsx` (extends existing)

**Purpose:** A toggle on the briefing screen that switches between two modes. The contrast between the two outputs immediately communicates the value of memory to any judge watching.

| Mode | Label         | Data source                            | Output                                                       |
|------|---------------|----------------------------------------|--------------------------------------------------------------|
| OFF  | Groq only     | Direct Groq call, vendor name only     | Generic, non-specific, non-evidence-based advice             |
| ON   | Hindsight-powered | Full `reflect()` output           | Confidence-scored, evidence-grounded, personalised briefing  |

**Without memory example:**
> "Research the vendor before calling. Ask about their pricing flexibility and what discounts they've offered to similar customers."

**With memory:** Full tactic cards with confidence scores, temporal banner, and recent signals.

**Toggle UI:**
- Positioned in the top-right of the briefing screen header area
- Two-state toggle button: `Groq Only` ↔ `Hindsight Memory`
- Active state: `--btn-primary-bg` (orange). Inactive: `--bg-elevated`
- When switching modes, briefing content area fades out over `200ms` and new content fades in over `300ms`

**Implementation:** When toggled OFF, call Groq directly with only vendor name and no Hindsight context. Use the same structured JSON prompt but without any memory context. Side-by-side or animated toggle both acceptable.

---

### Feature 2 — Tactic Confidence Evolution Chart

**File:** `frontend/src/components/ConfidenceChart.jsx`

**Library:** Recharts v2 `LineChart` component

**Chart specification:**

| Property        | Value                                                           |
|-----------------|-----------------------------------------------------------------|
| X axis          | Dates of all logged interactions (seeded + live)               |
| Y axis          | Confidence score `0.0` to `1.0`, gridlines at `0.25` intervals |
| Lines           | One line per tactic, colour-coded to match tactic card colours  |
| Line for high-confidence tactics | `--conf-high` (orange) |
| Line for mid-confidence tactics  | `--conf-mid` (amber)   |
| Line for low-confidence tactics  | `--conf-low` (grey)    |
| Data points     | Clickable — on click, shows tooltip: what interaction caused this score change |
| Background      | `--bg-surface`                                                  |
| Grid colour     | `--grey-800`                                                    |
| Axis text       | `--grey-500`, `--font-mono`, 11px                              |

**Purpose:** Visually demonstrates that the agent learns over time — confidence lines starting lower and rising with each confirmed tactic.

---

### Feature 3 — Email Ingestion Parser

**File:** `frontend/src/components/EmailParser.jsx` + extends `backend/ingest.py`

**UI elements:**

| Element             | Specification                                                              |
|---------------------|----------------------------------------------------------------------------|
| Section label       | `Parse email thread` in `--font-display`, 16px                           |
| Textarea            | Full-width. Placeholder: *"Paste a raw email thread here…"* Min-height `120px`. Input styling from design system. |
| Submit button       | `Parse and add to memory` — `--btn-primary-bg`. Loading state: `Extracting facts…` |
| Confirmation message | After success: `Memory updated — N new facts extracted and stored` in `--status-green`, `--font-body`, 13px |

**Backend flow:**
1. Receive raw email text from frontend
2. Send to Groq: *"Extract negotiation-relevant facts from this email thread. Return a concise summary of who said what, any pricing discussed, any commitments made, and any signals about vendor flexibility. Plain text, 3–5 sentences: [text]"*
3. Groq returns structured summary
4. Call `retain(bank_id, content=summary, context='email_thread', timestamp=datetime.utcnow().isoformat())`
5. Return `{ facts_extracted: N, confirmation: "Memory updated" }` to frontend

---

### Feature 4 — Vendor Comparison Panel

**File:** `frontend/src/components/VendorComparison.jsx`

**Purpose:** Side-by-side view of all 3 vendors' top tactic and confidence score. Demonstrates breadth of the memory system.

**Layout:** 3-column grid, one column per vendor. Card styling follows the design system.

**Each panel contains:**
- Vendor name in `--font-display`
- Top tactic name
- Confidence score of top tactic (with dot indicator and `--font-mono` numeric)
- Renewal date and days remaining badge

**Placement:** As a section on the Dashboard below the vendor cards, or as a secondary tab.

---

### Feature 5 — Interaction Timeline

**File:** `frontend/src/components/InteractionTimeline.jsx`

**Purpose:** Chronological list of all retained memories for a vendor showing how the agent's understanding has accumulated over time.

**Each entry:**

| Element           | Specification                                                        |
|-------------------|----------------------------------------------------------------------|
| Date              | `--font-mono`, 11px, `--grey-500`                                   |
| Interaction type  | Badge pill — `call` / `email` / `contract` — background `--bg-elevated`, text `--grey-400` |
| Content summary   | `--font-body`, 13px, `--grey-300`, max 3 lines                     |
| Tactic/signal tags | Small orange pills if the interaction contributed to a tactic score |
| Divider           | `1px` line in `--grey-800` between entries                          |

**Placement:** Collapsible panel or secondary tab on the briefing screen.

---

### Nice-to-Have Build Order & Estimates

| Priority | Feature                     | Estimated effort | Demo impact                                  |
|----------|-----------------------------|------------------|----------------------------------------------|
| 1        | Before/After Memory Toggle  | ~2 hours         | Very high — instantly proves memory value    |
| 2        | Confidence Evolution Chart  | ~2 hours         | High — visually proves the agent learns      |
| 3        | Email Ingestion Parser      | ~1.5 hours       | Medium — adds live data credibility          |
| 4        | Vendor Comparison Panel     | ~1 hour          | Medium — shows system breadth                |
| 5        | Interaction Timeline        | ~1.5 hours       | Lower — informational, not demo-critical     |

---

## 6. Section 4.3 — Out of Scope

> **Do not build, prototype, or partially start anything in this section.**
> Every hour spent here is an hour taken from polishing the must-build list and rehearsing the demo.

If any of the following is suggested during the build — by a teammate or your own instincts — the answer is: **not in scope for this submission.**

### Decision rule

Before adding any feature not in Sections 4.1 or 4.2, ask:

> **"Does this feature directly improve the confidence score update demo moment?"**

If the answer is no — do not build it.

---

| Feature                             | Why it is excluded                                                                                                                                                 |
|-------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Real email / CRM integration (OAuth, API keys, live pipelines) | Requires auth infrastructure and error handling that adds days of work with zero demo impact. The paste-based email parser in 4.2 delivers the same narrative value. |
| Live call assistant with microphone and real-time transcription | Real-time audio pipelines are fragile in demo conditions. A single mic issue or latency spike kills the demo. The post-call logger communicates the same memory-update story without the risk. |
| Multi-user authentication or account management | Auth adds complexity with zero judging value. Judges evaluate the memory system, not a login page. A single hardcoded user context is sufficient. |
| Mobile-responsive design or native app | Judges view demos on laptops. Desktop layout is sufficient and faster to polish. |
| Billing, subscription management, or pricing pages | This is a hackathon prototype. Commercial infrastructure is irrelevant to judging criteria and signals misplaced priorities. |
| Automated email scheduling or outbound features | Leverage is a buyer-side intelligence tool, not an outbound automation platform. Adding outbound features contradicts the core positioning and muddies the demo narrative. |

---

## 7. Folder Structure

```
leverage/
├── seeder/
│   ├── seed_vendors.py          # Run this first — generates + seeds all data
│   └── vendor_data.py           # The 53 raw interaction records
├── backend/
│   ├── main.py                  # FastAPI app + all route definitions
│   ├── briefing.py              # recall() + reflect() logic
│   ├── ingest.py                # retain() + score diff logic
│   └── models.py                # Pydantic request/response models
├── frontend/
│   └── src/
│       ├── App.jsx              # Routing
│       ├── styles/
│       │   └── tokens.css       # All CSS variables from Section 2
│       ├── pages/
│       │   ├── Dashboard.jsx    # Vendor list page
│       │   └── Briefing.jsx     # Briefing page (the money shot)
│       └── components/
│           ├── TacticCard.jsx   # Confidence score card
│           ├── TemporalBanner.jsx # Fiscal year warning
│           ├── SignalFeed.jsx   # Recent signals list
│           ├── PostCallForm.jsx # Note logger
│           ├── ScoreDiff.jsx    # Animated score update
│           ├── ConfidenceChart.jsx  # (4.2) Recharts evolution chart
│           ├── ToggleMemory.jsx     # (4.2) Before/after toggle
│           ├── EmailParser.jsx      # (4.2) Email ingestion
│           ├── VendorComparison.jsx # (4.2) Comparison panel
│           └── InteractionTimeline.jsx # (4.2) Chronological timeline
├── .env.example
├── requirements.txt
├── package.json
└── README.md
```

---

## 8. Environment Variables

```bash
# .env.example — copy to .env and fill in your keys
# Never commit real keys to the repository

HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=your_hindsight_key_here
GROQ_API_KEY=your_groq_key_here
CASCADEFLOW_API_KEY=your_cascadeflow_key_here
VITE_API_URL=http://localhost:8000    # Local dev — change to Railway URL when deploying
```

**Install commands:**

```bash
# Backend
pip install hindsight-client fastapi uvicorn python-dotenv groq faker python-dateutil httpx

# Frontend
npm create vite@latest leverage -- --template react
cd leverage
npm install tailwindcss axios recharts
npx tailwindcss init
```

---

## 9. Acceptance Checklists

### Section 4.1 — Must-Build Acceptance Criteria

- [ ] Hindsight account active, promo code `MEMHACK409` applied, SDK authenticates without error
- [ ] Seeder script runs to completion with no errors across all 3 vendors
- [ ] `reflect()` on `nexacloud` returns at least 3 tactics with confidence scores above `0.50`
- [ ] Dashboard renders all 3 vendor cards; NexaCloud shows a red days-remaining badge
- [ ] "Generate briefing" button navigates to briefing screen and loads within 3 seconds
- [ ] All tactic cards render with correct confidence dot colours for all three tiers
- [ ] Confidence scores display in `--font-mono` with correct `--orange-500` colour
- [ ] Temporal banner appears with `--banner-urgent-bg` background and `--orange-500` left border
- [ ] Recent signals feed populates from `recall()` with at least 3 entries
- [ ] Post-call form renders with all 4 fields; submit triggers loading state
- [ ] `retain()` is called on submit, followed by `reflect()`, and `score_diffs` are returned
- [ ] Score diff animation plays; green for increases, red for decreases, with correct directional arrows
- [ ] Briefing auto-refreshes to new scores after post-call log submission
- [ ] Full flow (dashboard → briefing → post-call log → updated briefing) works end-to-end without errors

### Section 4.2 — Nice-to-Have Acceptance Criteria

- [ ] Toggle switches cleanly between Groq-only and Hindsight-powered modes; contrast is clearly visible
- [ ] Confidence evolution chart renders with correct axes, one colour-coded line per tactic
- [ ] Chart data points are clickable and display tooltips explaining the score change
- [ ] Email parser successfully extracts facts via Groq and calls `retain()`; confirmation message displays
- [ ] Vendor comparison panel shows top tactic and score for all 3 vendors side by side
- [ ] Interaction timeline lists all seeded interactions in chronological order with correct metadata

### Demo Day Checklist

- [ ] Seeder script run at least 24 hours before demo — all 3 memory banks populated
- [ ] All 3 briefing endpoints tested manually — each returns a valid structured JSON response
- [ ] Post-call log → score update flow tested end-to-end at least 5 times
- [ ] Demo video uploaded, link working, playable without login, under 5 minutes
- [ ] GitHub repo is public, README renders correctly, no broken links, no real API keys committed
- [ ] Browser tabs open and ready: dashboard + NexaCloud briefing pre-loaded
- [ ] Each demo beat memorised — no reading from notes during presentation
- [ ] Backup plan ready: if live demo fails, switch to video immediately without apologising

---

*Final reminder: judges remember one story and one wow moment.*
*Make Priya's story vivid. Make the confidence score update flawless. Everything else is secondary.*