# TactIQ Must-Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold and implement all 7 must-build features of TactIQ — a vendor negotiation intelligence agent — producing a complete, demo-ready hackathon submission.

**Architecture:** React SPA (Vite) calls a FastAPI backend over REST. Backend orchestrates Hindsight Cloud memory operations (retain/recall/reflect) via CascadeFlow workflows. Confidence-scored tactics from the Hindsight Opinions network are the visual centrepiece. All "leverage" naming has been replaced with "TactIQ".

**Tech Stack:** React 18, Vite 5, Tailwind CSS v3.4, Axios, react-router-dom | FastAPI 0.109, Hindsight Client SDK, Groq API, CascadeFlow, Faker 22, python-dotenv, uvicorn, pytest

---

## File Map

| File | Responsibility |
|------|----------------|
| `frontend/src/styles/tokens.css` | All CSS variables + font imports |
| `frontend/src/main.jsx` | React entry — imports tokens and global CSS |
| `frontend/src/App.jsx` | React Router — `/` and `/briefing/:vendor` routes |
| `frontend/src/pages/Dashboard.jsx` | 3-column vendor card grid |
| `frontend/src/pages/Briefing.jsx` | Full briefing screen — orchestrates all components |
| `frontend/src/components/TacticCard.jsx` | Confidence score card with dots and flash animation |
| `frontend/src/components/TemporalBanner.jsx` | Fiscal year urgency banner |
| `frontend/src/components/SignalFeed.jsx` | Recent signals list from recall() |
| `frontend/src/components/PostCallForm.jsx` | Post-call note logger form |
| `frontend/src/components/ScoreDiff.jsx` | Animated score diff panel |
| `backend/models.py` | Pydantic request/response models |
| `backend/score_diff.py` | Pure score diff computation — no Hindsight dependency |
| `backend/briefing.py` | Hindsight client singleton + reflect() briefing logic |
| `backend/ingest.py` | retain() + double reflect() + score diff |
| `backend/main.py` | FastAPI app, CORS, all route definitions |
| `seeder/vendor_data.py` | 53 raw interaction records for 3 vendors |
| `seeder/seed_vendors.py` | Seeder script — calls retain() for all records |
| `tests/test_models.py` | Pydantic model unit tests |
| `tests/test_score_diff.py` | Score diff logic unit tests (TDD core) |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `frontend/` (Vite project)
- Create: `backend/`, `seeder/`, `tests/`
- Create: `.env.example`, `requirements.txt`, `.gitignore` updates

- [ ] **Step 1: Scaffold Vite frontend**

Run from `/home/umyaldixit/Desktop/projects/TactIQ/`:
```bash
npm create vite@latest frontend -- --template react
cd frontend && npm install
npm install tailwindcss@3.4 postcss autoprefixer axios recharts react-router-dom
npx tailwindcss init -p
```

- [ ] **Step 2: Configure Tailwind**

Overwrite `frontend/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 3: Configure Vite proxy to backend**

Overwrite `frontend/vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 4: Replace frontend/src/index.css with Tailwind directives**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Update frontend/src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/tokens.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 6: Create backend and seeder folder structure**

Run from project root:
```bash
mkdir -p backend seeder tests
touch backend/__init__.py backend/main.py backend/briefing.py backend/ingest.py backend/models.py backend/score_diff.py
touch seeder/__init__.py seeder/seed_vendors.py seeder/vendor_data.py
touch tests/__init__.py tests/test_models.py tests/test_score_diff.py
```

- [ ] **Step 7: Create requirements.txt**

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-dotenv==1.0.0
httpx==0.26.0
groq==0.5.0
faker==22.0.0
python-dateutil==2.9.0
hindsight-client
pydantic==2.6.0
pytest==8.1.0
pytest-asyncio==0.23.0
```

- [ ] **Step 8: Create .env.example**

```bash
# copy to .env and fill in your keys — never commit .env
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=your_hindsight_key_here
GROQ_API_KEY=your_groq_key_here
CASCADEFLOW_API_KEY=your_cascadeflow_key_here
VITE_API_URL=http://localhost:8000
```

- [ ] **Step 9: Update .gitignore**

Append to `.gitignore`:
```
.env
__pycache__/
*.pyc
*.pyo
node_modules/
frontend/dist/
.venv/
venv/
.pytest_cache/
```

- [ ] **Step 10: Create Python virtual environment and install deps**

```bash
cd /home/umyaldixit/Desktop/projects/TactIQ
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
Expected: all packages install without error.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite frontend, FastAPI backend, seeder, and test structure"
```

---

## Task 2: CSS Design Tokens

**Files:**
- Create: `frontend/src/styles/tokens.css`

- [ ] **Step 1: Create tokens.css**

```bash
mkdir -p frontend/src/styles
```

Create `frontend/src/styles/tokens.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');

:root {
  /* Core backgrounds */
  --bg-base:        #0A0A0A;
  --bg-surface:     #141414;
  --bg-elevated:    #1C1C1C;
  --bg-overlay:     #242424;

  /* Orange — primary brand accent */
  --orange-500:     #F97316;
  --orange-400:     #FB923C;
  --orange-300:     #FCA56A;
  --orange-100:     #1A0F07;

  /* Grey scale */
  --grey-800:       #2A2A2A;
  --grey-700:       #3A3A3A;
  --grey-500:       #6B7280;
  --grey-400:       #9CA3AF;
  --grey-200:       #D1D5DB;
  --grey-100:       #F3F4F6;

  /* Status colours */
  --status-green:   #22C55E;
  --status-red:     #EF4444;
  --status-amber:   #F59E0B;

  /* Confidence dot colours */
  --conf-high:      #F97316;
  --conf-mid:       #F59E0B;
  --conf-low:       #3A3A3A;

  /* Cards */
  --card-bg:          var(--bg-surface);
  --card-border:      1px solid var(--grey-800);
  --card-radius:      12px;
  --card-padding:     24px;
  --card-shadow:      0 1px 3px rgba(0,0,0,0.4);

  /* Buttons — Primary */
  --btn-primary-bg:    var(--orange-500);
  --btn-primary-text:  #0A0A0A;
  --btn-primary-hover: var(--orange-400);
  --btn-radius:        8px;
  --btn-padding:       10px 20px;
  --btn-font-size:     14px;
  --btn-font-weight:   600;

  /* Inputs */
  --input-bg:           var(--bg-elevated);
  --input-border:       1px solid var(--grey-800);
  --input-focus-border: 1px solid var(--orange-500);
  --input-radius:       8px;
  --input-padding:      10px 14px;
  --input-text:         var(--grey-200);

  /* Urgent banner */
  --banner-urgent-bg:     rgba(249, 115, 22, 0.12);
  --banner-urgent-border: 1px solid rgba(249, 115, 22, 0.4);
  --banner-urgent-text:   var(--orange-300);

  /* Red alert */
  --alert-red-bg:     rgba(239, 68, 68, 0.12);
  --alert-red-border: 1px solid rgba(239, 68, 68, 0.4);
  --alert-red-text:   #EF4444;

  /* Dividers + spacing */
  --divider:   1px solid var(--grey-800);
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  32px;
  --space-2xl: 48px;

  /* Fonts */
  --font-display: 'Syne', sans-serif;
  --font-body:    'DM Sans', sans-serif;
  --font-mono:    'DM Mono', monospace;

  /* Transitions */
  --transition-fast:  150ms ease;
  --transition-base:  250ms ease;
  --transition-slow:  400ms ease;
  --score-fade-dur:   600ms ease-in-out;
}

* { box-sizing: border-box; }

body {
  background-color: var(--bg-base);
  color: var(--grey-200);
  font-family: var(--font-body);
  margin: 0;
}
```

- [ ] **Step 2: Verify tokens applied**

```bash
cd frontend && npm run dev
```
Open http://localhost:5173 — page background must be near-black `#0A0A0A`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/tokens.css frontend/src/main.jsx
git commit -m "feat: add CSS design tokens, font imports, and global body styles"
```

---

## Task 3: Backend Models

**Files:**
- Create: `backend/models.py`
- Create: `tests/test_models.py`

- [ ] **Step 1: Write failing tests**

`tests/test_models.py`:
```python
from backend.models import Tactic, BriefingResponse, IngestRequest, ScoreDiff

def test_tactic_default_tags():
    t = Tactic(
        name="AWS mention",
        confidence=0.87,
        evidence="Two mentions, both produced discounts.",
        timing="Deploy after first price pushback.",
        successes=2,
        total_uses=2,
    )
    assert t.confidence == 0.87
    assert t.tags == []

def test_ingest_request_fields():
    req = IngestRequest(
        vendor="nexacloud",
        notes="Mentioned AWS S3.",
        outcome="Successful concession",
        timestamp="2026-04-18T10:00:00Z",
    )
    assert req.vendor == "nexacloud"

def test_score_diff_direction():
    diff = ScoreDiff(old=0.87, new=0.79, delta=-0.08, direction="down")
    assert diff.direction == "down"
    assert diff.delta == -0.08
```

- [ ] **Step 2: Run — expect failure**

```bash
source .venv/bin/activate
pytest tests/test_models.py -v
```
Expected: `ModuleNotFoundError` — models not implemented yet.

- [ ] **Step 3: Implement backend/models.py**

```python
from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class Tactic(BaseModel):
    name: str
    confidence: float
    evidence: str
    timing: str
    successes: int
    total_uses: int
    tags: List[str] = Field(default_factory=list)

class TemporalSignal(BaseModel):
    signal: str
    urgency: str
    days_remaining: int

class RecentSignal(BaseModel):
    date: str
    source: str
    summary: str
    interpretation: str

class ContractInfo(BaseModel):
    value: str
    renewal_date: str
    contact: str

class BriefingResponse(BaseModel):
    tactics: List[Tactic]
    temporal_signals: List[TemporalSignal]
    recent_signals: List[RecentSignal]
    contract: ContractInfo

class IngestRequest(BaseModel):
    vendor: str
    notes: str
    outcome: str
    timestamp: str

class ScoreDiff(BaseModel):
    old: float
    new: float
    delta: float
    direction: str

class IngestResponse(BaseModel):
    briefing: BriefingResponse
    score_diffs: Dict[str, ScoreDiff]
```

- [ ] **Step 4: Run — expect pass**

```bash
pytest tests/test_models.py -v
```
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/models.py tests/test_models.py
git commit -m "feat: add Pydantic models with tests"
```

---

## Task 4: Score Diff Logic (TDD)

The most critical backend logic. Test in isolation before Hindsight integration.

**Files:**
- Create: `backend/score_diff.py`
- Create: `tests/test_score_diff.py`

- [ ] **Step 1: Write failing tests**

`tests/test_score_diff.py`:
```python
from backend.score_diff import compute_score_diffs

def test_increase_detected():
    old = {"AWS mention": 0.87, "Fiscal year pressure": 0.74}
    new = {"AWS mention": 0.91, "Fiscal year pressure": 0.74}
    diffs = compute_score_diffs(old, new)
    assert "AWS mention" in diffs
    assert diffs["AWS mention"]["direction"] == "up"
    assert round(diffs["AWS mention"]["delta"], 2) == 0.04

def test_decrease_detected():
    old = {"AWS mention": 0.87}
    new = {"AWS mention": 0.79}
    diffs = compute_score_diffs(old, new)
    assert diffs["AWS mention"]["direction"] == "down"
    assert round(diffs["AWS mention"]["delta"], 2) == -0.08

def test_no_change_below_threshold():
    old = {"AWS mention": 0.87}
    new = {"AWS mention": 0.872}
    diffs = compute_score_diffs(old, new)
    assert "AWS mention" not in diffs

def test_new_tactic_not_in_old_is_ignored():
    old = {"AWS mention": 0.87}
    new = {"AWS mention": 0.87, "Brand new tactic": 0.50}
    diffs = compute_score_diffs(old, new)
    assert "Brand new tactic" not in diffs

def test_unchanged_tactic_excluded():
    old = {"AWS mention": 0.87, "Fiscal year pressure": 0.74}
    new = {"AWS mention": 0.87, "Fiscal year pressure": 0.74}
    diffs = compute_score_diffs(old, new)
    assert diffs == {}
```

- [ ] **Step 2: Run — expect failure**

```bash
pytest tests/test_score_diff.py -v
```
Expected: `ModuleNotFoundError`.

- [ ] **Step 3: Implement backend/score_diff.py**

```python
def compute_score_diffs(old_scores: dict, new_scores: dict) -> dict:
    diffs = {}
    for tactic, new_conf in new_scores.items():
        old_conf = old_scores.get(tactic)
        if old_conf is None:
            continue
        delta = new_conf - old_conf
        if abs(delta) <= 0.01:
            continue
        diffs[tactic] = {
            "old":       round(old_conf, 2),
            "new":       round(new_conf, 2),
            "delta":     round(delta, 2),
            "direction": "up" if delta > 0 else "down",
        }
    return diffs
```

- [ ] **Step 4: Run — expect pass**

```bash
pytest tests/test_score_diff.py -v
```
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/score_diff.py tests/test_score_diff.py
git commit -m "feat: add score diff computation with 5 passing tests"
```

---

## Task 5: Vendor Data Records

**Files:**
- Create: `seeder/vendor_data.py`

- [ ] **Step 1: Create vendor_data.py with all 53 interaction records**

`seeder/vendor_data.py`:
```python
# 53 total: NexaCloud (23) + DataPipe (16) + SecureNet (14)

NEXACLOUD_INTERACTIONS = [
    # --- Contract records (3) ---
    {
        "content": "NexaCloud initial 3-year enterprise contract signed January 2022. Annual value $380,000 covering cloud infrastructure, compute, and storage. Primary contact: Marcus Chen, Senior Account Executive. Renewal cycle set to January each year. SLA: 99.9% uptime with $10,000 credit per breach.",
        "context": "contract_record",
        "timestamp": "2022-01-15T09:00:00Z",
    },
    {
        "content": "NexaCloud first annual renewal completed February 2023. Contract value held at $380,000 after brief negotiation. Priya attempted to reference competitor pricing but rep diverted to product roadmap. No discount granted. Renewal signed for 12 months. Marcus Chen remained primary contact.",
        "context": "contract_record",
        "timestamp": "2023-02-01T10:00:00Z",
    },
    {
        "content": "NexaCloud second annual renewal completed January 2024. Contract maintained at $361,000 after combined 8% discount achieved through AWS competitive mention and Q3 fiscal pressure. Next renewal: December 31, 2024. Marcus Chen signed off.",
        "context": "contract_record",
        "timestamp": "2024-01-10T10:00:00Z",
    },
    # --- Call summaries (8) ---
    {
        "content": "Cancellation threat escalation, April 2022. Priya threatened full contract cancellation after a significant SLA breach. Marcus escalated to his VP, Sarah Holt. VP engagement slowed negotiations by two weeks. Final outcome: no price reduction granted, SLA credit applied per existing contract terms only. Aggressive cancellation threat backfired — rep became defensive, flexibility decreased.",
        "context": "negotiation_call",
        "timestamp": "2022-04-20T13:00:00Z",
    },
    {
        "content": "Pre-renewal call with Marcus Chen, November 2022. Priya mentioned AWS S3 as a viable alternative for object storage workloads. Marcus went quiet for approximately 30 seconds, then said he would check with the team on pricing flexibility. He called back two days later with a 5% discount offer. Interaction confirmed that AWS mention triggers internal pricing review.",
        "context": "negotiation_call",
        "timestamp": "2022-11-10T14:00:00Z",
    },
    {
        "content": "Post-renewal debrief call with Marcus Chen, February 2023. Discussed SLA performance over the past year. No pricing discussion. Marcus mentioned upcoming infrastructure investments and hinted at potential price increases for 2024. Priya noted the comment but did not negotiate — not the right moment.",
        "context": "negotiation_call",
        "timestamp": "2023-02-15T11:00:00Z",
    },
    {
        "content": "Mid-year check-in call with Marcus Chen, July 2023. Account review — usage patterns discussed. Priya asked about Q3 discount availability; Marcus said discounts are available but only when the team has a quota to close. He did not offer one unprompted. Confirmed: Q3 discounts require explicit request referencing fiscal timing — vendor never offers them first.",
        "context": "negotiation_call",
        "timestamp": "2023-07-18T14:30:00Z",
    },
    {
        "content": "Pre-renewal call with Marcus Chen, October 2023. Priya mentioned evaluating AWS S3 for 30% of workloads as part of a cost-reduction initiative. Marcus paused then said he would escalate to see what could be done before the fiscal year end. Five business days later: 5% discount offered unprompted. Second time AWS mention has produced a tangible concession. Pattern confirmed.",
        "context": "negotiation_call",
        "timestamp": "2023-10-22T15:00:00Z",
    },
    {
        "content": "Fiscal year pressure call, November 2023. Priya explicitly referenced January 31 as NexaCloud's fiscal Q3 close and asked whether end-of-quarter promotions applied to the renewal. Marcus confirmed Q3 incentive programs exist. An additional 3% discount was applied on top of the AWS-driven 5%, bringing the final contract to $361,000. Without the explicit date reference, the Q3 discount would not have been offered.",
        "context": "negotiation_call",
        "timestamp": "2023-11-14T16:00:00Z",
    },
    {
        "content": "Pre-renewal call with Marcus Chen, October 2024. Marcus unexpectedly raised the topic of a multi-year deal structure, offering a potential 10-12% discount on a 3-year commitment. This was the first time NexaCloud had proactively raised a multi-year offer in the three-year relationship. Single data point — confidence low. Priya deferred and asked for terms in writing.",
        "context": "negotiation_call",
        "timestamp": "2024-10-15T14:00:00Z",
    },
    {
        "content": "Pre-renewal call with Marcus Chen, November 2024. Priya mentioned AWS S3 Intelligent-Tiering pricing as a credible alternative for cold storage workloads. Marcus went quiet again. Two days later he emailed offering a 3% discount plus an $8,000 credit toward premium support tier upgrade. Third consecutive year AWS mention has produced a concession. Pattern confidence strengthened significantly.",
        "context": "negotiation_call",
        "timestamp": "2024-11-18T15:30:00Z",
    },
    {
        "content": "Q3 close push call, December 2024. Priya explicitly referenced January 31 fiscal deadline again. Marcus confirmed Q3 close discounts available if renewal signed before January 15. Offered an additional 2% if contract signed by December 31. Fiscal year pressure tactic confirmed for the third consecutive year. Pattern is well-established and reliable.",
        "context": "negotiation_call",
        "timestamp": "2024-12-03T10:00:00Z",
    },
    # --- Email summaries (12) ---
    {
        "content": "Email thread, December 2022. Priya requested updated pricing breakdown ahead of January renewal. Marcus replied with a revised quote showing no discounts. Priya responded referencing AWS pricing benchmarks. Marcus requested a follow-up call — signed off as wanting to make this work. Email sequence shows vendor is responsive to benchmark references even in written form.",
        "context": "email_thread",
        "timestamp": "2022-12-05T09:00:00Z",
    },
    {
        "content": "Email from Marcus Chen, February 2023. Sent NexaCloud Q2 product roadmap including new AI inference features. No pricing content. Note: vendor sends soft upsell content in the off-season before roadmap announcements.",
        "context": "email_thread",
        "timestamp": "2023-02-20T08:30:00Z",
    },
    {
        "content": "Email thread, April 2023. Priya requested SLA performance report. Marcus sent a report showing 99.91% uptime — marginally above SLA threshold. No credit due. Priya noted this as a potential future negotiating point if uptime dips again. Vendor stays meticulously just above SLA thresholds.",
        "context": "email_thread",
        "timestamp": "2023-04-10T10:00:00Z",
    },
    {
        "content": "Email from Marcus Chen, August 2023. Annual account review document shared. Contract utilisation at 78% of committed capacity. Marcus suggested a capacity expansion at a preferred rate. Priya declined. Note: vendor tracks utilisation and will pitch upgrades when headroom exists.",
        "context": "email_thread",
        "timestamp": "2023-08-15T09:00:00Z",
    },
    {
        "content": "Email thread, September 2023. Priya sent a formal RFQ to AWS and documented receipt. Forwarded the summary to Marcus noting an ongoing evaluation. Marcus replied within 24 hours requesting a call. Urgency of response confirms that documented competitive evaluation significantly increases vendor pressure.",
        "context": "email_thread",
        "timestamp": "2023-09-12T11:00:00Z",
    },
    {
        "content": "Email from Marcus Chen, October 2023 — follow-up after AWS mention call. Offered 5% discount on annual renewal if signed within 30 days. Cited a team pricing review as the reason. Discount offer arrived unsolicited after 5 business days. Pattern: AWS mention triggers internal review, discount email arrives within one week.",
        "context": "email_thread",
        "timestamp": "2023-10-27T08:00:00Z",
    },
    {
        "content": "Email thread, November 2023. Priya accepted the 5% discount offer and requested formal contract amendment. Marcus replied with a counter-proposal adding a 12-month lock-in clause. Priya pushed back — lock-in removed, discount maintained. Vendor will try to extract commitment in exchange for discounts. Reject lock-in cleanly without counter-offer.",
        "context": "email_thread",
        "timestamp": "2023-11-02T10:30:00Z",
    },
    {
        "content": "Internal email from Priya, January 2024. Contract renewal signed at $361,000. Savings of $19,000 vs baseline achieved through AWS competitive mention (5%) and Q3 fiscal pressure (3%). Total effective discount: 8% off $380,000 list price.",
        "context": "email_thread",
        "timestamp": "2024-01-10T09:00:00Z",
    },
    {
        "content": "Email from Marcus Chen, March 2024. Shared case studies of NexaCloud customers who expanded into AI features. No pricing discussion. Pattern: vendor sends soft upsell content approximately 9 months before renewal.",
        "context": "email_thread",
        "timestamp": "2024-03-18T08:00:00Z",
    },
    {
        "content": "Email thread, October 2024. Priya asked Marcus to put the multi-year proposal in writing. Marcus sent a formal proposal: 3-year term at $342,000 per year — a 10% discount. Priya did not commit — consulting legal and finance. Multi-year offer is real and documented.",
        "context": "email_thread",
        "timestamp": "2024-10-25T11:00:00Z",
    },
    {
        "content": "Email from Marcus Chen, November 2024 — post AWS mention follow-up. Offered 3% annual discount plus $8,000 support tier credit. Same pattern as October 2023: AWS mention produces discount email within 2 business days. Pattern is now confirmed across 3 separate years.",
        "context": "email_thread",
        "timestamp": "2024-11-20T08:30:00Z",
    },
    {
        "content": "Email thread, December 2024. Marcus confirmed December 31 renewal deadline and offered additional 2% if signed before year end citing Q3 quota close. Priya is currently evaluating annual renewal vs multi-year structure. Latest from Marcus: we really value this partnership and want to find a structure that works for you.",
        "context": "email_thread",
        "timestamp": "2024-12-10T10:00:00Z",
    },
]

DATAPIPE_INTERACTIONS = [
    # --- Contract records (2) ---
    {
        "content": "DataPipe initial contract signed March 2023. Annual value $120,000 covering ETL pipeline infrastructure and data connectors. Primary contact: Jennifer Okafor, Account Manager. Renewal cycle set to March each year. Contract includes 500 GB monthly transfer allowance and 20 user seats.",
        "context": "contract_record",
        "timestamp": "2023-03-01T10:00:00Z",
    },
    {
        "content": "DataPipe first annual renewal completed April 2024. After offering a 12-month Tier 2 volume commitment, Jennifer Okafor granted 5 additional seats at no additional charge. Contract value held at $120,000. Volume commitment tactic produced an immediate concession. Next renewal: March 2025.",
        "context": "contract_record",
        "timestamp": "2024-04-01T10:00:00Z",
    },
    # --- Call summaries (5) ---
    {
        "content": "Call with Jennifer Okafor, May 2023. Priya mentioned evaluating Fivetran as an alternative integration platform. Jennifer became defensive immediately, emphasising DataPipe connector library depth and roadmap superiority. Negotiations slowed. No pricing flexibility offered. Competitor mention made the rep defensive rather than conciliatory — opposite of the NexaCloud AWS pattern.",
        "context": "negotiation_call",
        "timestamp": "2023-05-22T11:00:00Z",
    },
    {
        "content": "Follow-up call with Jennifer Okafor, June 2023. After the Fivetran mention in May, Jennifer scheduled this call to address concerns. The call was defensive and non-commercial. No pricing discussion. Lesson: competitor mention with DataPipe triggers defensive escalation, not pricing flexibility. Do not repeat this tactic.",
        "context": "negotiation_call",
        "timestamp": "2023-06-10T14:00:00Z",
    },
    {
        "content": "Mid-year check-in call with Jennifer Okafor, September 2023. Usage report shows 61% of Tier 1 capacity. Jennifer pitched a Tier 2 upgrade at a 15% volume discount. Priya deferred but noted: vendor proactively pitches higher tiers when headroom exists. Counter-move: commit to Tier 2 proactively in exchange for free seats before vendor pitches it.",
        "context": "negotiation_call",
        "timestamp": "2023-09-15T10:30:00Z",
    },
    {
        "content": "Internal pre-renewal strategy call, January 2024. Priya planned to offer a 12-month Tier 2 volume commitment in exchange for additional seats based on September learnings. Decision: do not mention Fivetran — it triggers defensiveness without producing discounts.",
        "context": "negotiation_call",
        "timestamp": "2024-01-20T09:00:00Z",
    },
    {
        "content": "Pre-renewal call with Jennifer Okafor, February 2024. Priya offered commitment to Tier 2 usage level for the coming year. Jennifer immediately offered 5 additional seats at no cost, citing that predictable volume helps capacity planning. Concession was immediate and unsolicited — volume commitment tactic fully confirmed.",
        "context": "negotiation_call",
        "timestamp": "2024-02-14T14:00:00Z",
    },
    # --- Email summaries (9) ---
    {
        "content": "Email from Jennifer Okafor, April 2023. Welcome package and onboarding documentation. No pricing content. Jennifer's communication style: responsive, detailed, metrics-focused.",
        "context": "email_thread",
        "timestamp": "2023-04-05T08:00:00Z",
    },
    {
        "content": "Email thread, May 2023 post-Fivetran mention. Jennifer sent a 12-page competitive analysis document unsolicited, comparing DataPipe vs Fivetran feature-by-feature. Tone: defensive. No pricing flexibility. Competitor mention triggers defensive documentation, not negotiation.",
        "context": "email_thread",
        "timestamp": "2023-05-25T09:00:00Z",
    },
    {
        "content": "Email from Jennifer Okafor, August 2023. Shared DataPipe H2 roadmap including new Snowflake and BigQuery connectors. No pricing discussion. Priya noted the Snowflake connector as potentially valuable justification for continued commitment.",
        "context": "email_thread",
        "timestamp": "2023-08-10T08:30:00Z",
    },
    {
        "content": "Email thread, October 2023. Priya requested a usage summary for the past 6 months. Jennifer provided detailed breakdown showing 58% of Tier 1 capacity. Jennifer noted significant headroom. Priya interpreted this as a signal that Tier 2 commitment would be viewed as generosity worth rewarding with seat expansion.",
        "context": "email_thread",
        "timestamp": "2023-10-12T10:00:00Z",
    },
    {
        "content": "Email from Priya to Jennifer, January 2024. Proposed committing to Tier 2 usage for the coming year in exchange for 5 additional seats. Jennifer replied the same day: I can make this work, let me confirm with my manager. Reply arrived within 3 hours.",
        "context": "email_thread",
        "timestamp": "2024-01-22T11:00:00Z",
    },
    {
        "content": "Email from Jennifer Okafor, January 2024. Confirmed 5 free seats in exchange for Tier 2 commitment. Manager approved same day. Jennifer's note: the volume predictability really helps us plan capacity. Tactic fully confirmed in writing with managerial approval.",
        "context": "email_thread",
        "timestamp": "2024-01-23T09:00:00Z",
    },
    {
        "content": "Email thread, February 2024. Priya requested contract amendment for Tier 2 at same annual rate with 5 bonus seats. Jennifer sent amended contract within 48 hours. Smooth and clean execution of pre-planned volume commitment tactic.",
        "context": "email_thread",
        "timestamp": "2024-02-20T10:00:00Z",
    },
    {
        "content": "Email from Jennifer Okafor, June 2024. Mid-year check-in. Usage tracking at 72% of Tier 2 — well within commitment. Jennifer offered early renewal pricing if Priya wanted to lock in for 2025 now. Priya deferred — too early in cycle.",
        "context": "email_thread",
        "timestamp": "2024-06-15T09:00:00Z",
    },
    {
        "content": "Email thread, November 2024. Jennifer sent 2025 renewal proposal at $120,000 — same rate, no uplift attempted. Renewal date March 2025. Priya plans to use volume commitment tactic again, this time requesting 8 seats instead of 5 given successful precedent.",
        "context": "email_thread",
        "timestamp": "2024-11-20T10:00:00Z",
    },
]

SECURENET_INTERACTIONS = [
    # --- Contract records (2) ---
    {
        "content": "SecureNet initial contract signed June 2022. Annual value $85,000 covering identity management, SSO, and endpoint security monitoring. Primary contact: David Reyes, Enterprise Account Executive. Renewal cycle set to June each year.",
        "context": "contract_record",
        "timestamp": "2022-06-01T10:00:00Z",
    },
    {
        "content": "SecureNet second annual renewal completed July 2024. Priya submitted formal quotes from Okta and CrowdStrike before the negotiation call. David Reyes matched with an 8% discount, bringing the annual contract to $78,200. Competitive bid tactic worked cleanly and without escalation. David acknowledged the alternative quotes explicitly in his approval email.",
        "context": "contract_record",
        "timestamp": "2024-07-01T10:00:00Z",
    },
    # --- Call summaries (4) ---
    {
        "content": "Pre-renewal call with David Reyes, May 2023. Priya threatened full contract cancellation citing executive budget pressure. David escalated to VP Carol Singh. VP engagement added two weeks to the process. Final outcome: contract renewed at $86,200 — slight increase due to tier repackaging. Cancellation threat produced the opposite of the desired result with SecureNet.",
        "context": "negotiation_call",
        "timestamp": "2023-05-15T14:00:00Z",
    },
    {
        "content": "Post-escalation call with VP Carol Singh, June 2023. Carol reframed the pricing as a tier alignment correction and presented a repackaged contract at $86,200. Tone was firm. No negotiation room offered. Priya accepted to close the cycle. Post-mortem: cancellation threats with SecureNet trigger VP escalation, which produces defensive repackaging at a higher price.",
        "context": "negotiation_call",
        "timestamp": "2023-06-02T11:00:00Z",
    },
    {
        "content": "Internal pre-renewal strategy call, April 2024. Priya planned to submit formal competitive quotes from Okta and CrowdStrike before any negotiation call with David. Decision: do not use cancellation threat — it backfired badly in 2023. Use documented competitive bids only.",
        "context": "negotiation_call",
        "timestamp": "2024-04-10T09:00:00Z",
    },
    {
        "content": "Pre-renewal call with David Reyes, May 2024. Priya had already submitted formal Okta and CrowdStrike quotes showing equivalent functionality at $78,000 to $81,000 per year. David requested 48 hours to respond. Called back with an 8% discount offer — $78,200 final. Competitive bid tactic produced an immediate, clean concession without any escalation.",
        "context": "negotiation_call",
        "timestamp": "2024-05-20T14:00:00Z",
    },
    # --- Email summaries (8) ---
    {
        "content": "Email from David Reyes, July 2022. Welcome and onboarding documentation. David's communication style: formal, structured, responds within 24 hours. Notes Priya as a strategic account.",
        "context": "email_thread",
        "timestamp": "2022-07-05T08:00:00Z",
    },
    {
        "content": "Email thread, March 2023. Priya requested a pricing review. David replied that current pricing was market standard and offered a product tour of new features instead. Priya declined. David deflects pricing conversations with product demonstrations — noted for future calls.",
        "context": "email_thread",
        "timestamp": "2023-03-15T09:00:00Z",
    },
    {
        "content": "Email thread, May 2023 post-cancellation threat. David sent a formal escalation notice noting VP involvement. Tone shifted to transactional. No pricing flexibility signalled. The change in tone from collaborative to formal was a clear warning sign that the tactic was backfiring.",
        "context": "email_thread",
        "timestamp": "2023-05-20T10:00:00Z",
    },
    {
        "content": "Email from VP Carol Singh, June 2023. Sent repackaged contract at $86,200 with a note explaining tier alignment. Tone was firm, no negotiation room offered. Priya signed to close the cycle. Total cost of the failed cancellation threat: $1,200 above previous contract value.",
        "context": "email_thread",
        "timestamp": "2023-06-05T09:00:00Z",
    },
    {
        "content": "Email from Priya, April 2024. Sent formal RFQs to Okta and CrowdStrike and documented receipt. Forwarded quote summaries to David as due diligence documentation ahead of renewal discussions. David replied asking for a call to understand the evaluation criteria. His urgency was immediate.",
        "context": "email_thread",
        "timestamp": "2024-04-22T11:00:00Z",
    },
    {
        "content": "Email from David Reyes, May 2024 post-renewal call. Offered 8% discount bringing annual contract to $78,200. David's note: we have taken the competitive alternatives you have shared into serious consideration. Competitive bid tactic confirmed in writing — formal quotes produced a documented, clean discount offer.",
        "context": "email_thread",
        "timestamp": "2024-05-22T09:00:00Z",
    },
    {
        "content": "Email thread, June 2024. Priya accepted the 8% discount. Contract signed at $78,200. David's follow-up: looking forward to continuing the partnership. Smooth close — no lock-in clauses attempted by vendor, discount accepted cleanly.",
        "context": "email_thread",
        "timestamp": "2024-06-10T10:00:00Z",
    },
    {
        "content": "Email from David Reyes, November 2024. Early renewal outreach for June 2025. Proposed same $78,200 rate. Priya plans to request formal Okta and CrowdStrike quotes again before responding — competitive bid tactic to be repeated given its clear success in 2024.",
        "context": "email_thread",
        "timestamp": "2024-11-15T09:00:00Z",
    },
]
```

- [ ] **Step 2: Verify record counts**

```bash
python3 -c "
import sys; sys.path.insert(0, '.')
from seeder.vendor_data import NEXACLOUD_INTERACTIONS, DATAPIPE_INTERACTIONS, SECURENET_INTERACTIONS
print(f'NexaCloud: {len(NEXACLOUD_INTERACTIONS)}')
print(f'DataPipe:  {len(DATAPIPE_INTERACTIONS)}')
print(f'SecureNet: {len(SECURENET_INTERACTIONS)}')
print(f'Total:     {len(NEXACLOUD_INTERACTIONS) + len(DATAPIPE_INTERACTIONS) + len(SECURENET_INTERACTIONS)}')
"
```
Expected:
```
NexaCloud: 23
DataPipe:  16
SecureNet: 14
Total:     53
```

- [ ] **Step 3: Commit**

```bash
git add seeder/vendor_data.py
git commit -m "feat: add 53 synthetic vendor interaction records with embedded tactic patterns"
```

---

## Task 6: Seeder Script

**Files:**
- Create: `seeder/seed_vendors.py`

- [ ] **Step 1: Create seed_vendors.py**

```python
# seeder/seed_vendors.py
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from seeder.vendor_data import (
    NEXACLOUD_INTERACTIONS,
    DATAPIPE_INTERACTIONS,
    SECURENET_INTERACTIONS,
)
from hindsight_client import Hindsight

client = Hindsight(
    base_url=os.getenv('HINDSIGHT_API_URL'),
    api_key=os.getenv('HINDSIGHT_API_KEY'),
)

ALL_VENDORS = [
    ('nexacloud', NEXACLOUD_INTERACTIONS),
    ('datapipe',  DATAPIPE_INTERACTIONS),
    ('securenet', SECURENET_INTERACTIONS),
]

def seed_all():
    for bank_id, interactions in ALL_VENDORS:
        print(f'Seeding {bank_id} ({len(interactions)} interactions)...')
        for record in interactions:
            client.retain(
                bank_id=bank_id,
                content=record['content'],
                context=record.get('context', 'interaction'),
                timestamp=record['timestamp'],
            )
        print(f'  ✓ Done.')
    print('All vendors seeded successfully.')

if __name__ == '__main__':
    seed_all()
```

- [ ] **Step 2: Verify Hindsight auth (requires real .env)**

Copy `.env.example` to `.env` and fill in `HINDSIGHT_API_KEY` and `HINDSIGHT_API_URL`, then:
```bash
source .venv/bin/activate
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()
from hindsight_client import Hindsight
client = Hindsight(base_url=os.getenv('HINDSIGHT_API_URL'), api_key=os.getenv('HINDSIGHT_API_KEY'))
result = client.recall(bank_id='test', query='test')
print('Auth OK')
"
```
Expected: prints `Auth OK` with no exception.

- [ ] **Step 3: Run seeder (run at least 24 hours before demo)**

```bash
python3 seeder/seed_vendors.py
```
Expected:
```
Seeding nexacloud (23 interactions)...
  ✓ Done.
Seeding datapipe (16 interactions)...
  ✓ Done.
Seeding securenet (14 interactions)...
  ✓ Done.
All vendors seeded successfully.
```

- [ ] **Step 4: Commit**

```bash
git add seeder/seed_vendors.py
git commit -m "feat: add vendor seeder script"
```

---

## Task 7: Backend — Briefing Endpoint

**Files:**
- Create: `backend/briefing.py`
- Create: `backend/main.py`

- [ ] **Step 1: Implement backend/briefing.py**

```python
# backend/briefing.py
import json
import os
from dotenv import load_dotenv
from hindsight_client import Hindsight

load_dotenv()

client = Hindsight(
    base_url=os.getenv('HINDSIGHT_API_URL'),
    api_key=os.getenv('HINDSIGHT_API_KEY'),
)

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

async def generate_briefing(vendor: str) -> dict:
    reflect_result = client.reflect(bank_id=vendor, query=BRIEFING_PROMPT)
    return json.loads(reflect_result.content[0].text)
```

- [ ] **Step 2: Create a stub backend/ingest.py so main.py can import it**

```python
# backend/ingest.py — stub; full implementation in Task 8
async def log_post_call(vendor: str, notes: str, outcome: str, timestamp: str) -> dict:
    raise NotImplementedError("Implement in Task 8")
```

- [ ] **Step 3: Implement backend/main.py**

```python
# backend/main.py
import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.models import IngestRequest
from backend.briefing import generate_briefing
from backend.ingest import log_post_call

load_dotenv()

app = FastAPI(title="TactIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", os.getenv("FRONTEND_URL", "")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/briefing")
async def get_briefing(vendor: str = Query(..., description="Vendor bank_id")):
    try:
        return await generate_briefing(vendor)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ingest")
async def post_ingest(body: IngestRequest):
    try:
        return await log_post_call(body.vendor, body.notes, body.outcome, body.timestamp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

- [ ] **Step 4: Start backend and smoke-test the briefing endpoint**

```bash
source .venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```
In another terminal:
```bash
curl "http://localhost:8000/api/briefing?vendor=nexacloud"
```
Expected: JSON with `tactics`, `temporal_signals`, `recent_signals`, `contract` keys.

- [ ] **Step 5: Commit**

```bash
git add backend/briefing.py backend/ingest.py backend/main.py
git commit -m "feat: add FastAPI app and briefing endpoint"
```

---

## Task 8: Backend — Ingest Endpoint

**Files:**
- Modify: `backend/ingest.py` (replace stub from Task 7)

- [ ] **Step 1: Implement backend/ingest.py** (replaces the stub)

```python
# backend/ingest.py
import json
from backend.briefing import client, BRIEFING_PROMPT
from backend.score_diff import compute_score_diffs

async def log_post_call(vendor: str, notes: str, outcome: str, timestamp: str) -> dict:
    # Capture scores BEFORE retain()
    old_result = client.reflect(bank_id=vendor, query=BRIEFING_PROMPT)
    old_briefing = json.loads(old_result.content[0].text)
    old_scores = {t['name']: t['confidence'] for t in old_briefing['tactics']}

    # Store the new interaction
    content = f"Outcome: {outcome}. Notes: {notes}"
    client.retain(bank_id=vendor, content=content, context='post_call_log', timestamp=timestamp)

    # Get updated briefing AFTER retain()
    new_result = client.reflect(bank_id=vendor, query=BRIEFING_PROMPT)
    new_briefing = json.loads(new_result.content[0].text)
    new_scores = {t['name']: t['confidence'] for t in new_briefing['tactics']}

    score_diffs = compute_score_diffs(old_scores, new_scores)

    return {'briefing': new_briefing, 'score_diffs': score_diffs}
```

- [ ] **Step 2: Smoke-test the ingest endpoint**

With backend running:
```bash
curl -X POST http://localhost:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"vendor":"nexacloud","notes":"Mentioned AWS S3 Intelligent-Tiering. Rep went quiet.","outcome":"Successful concession","timestamp":"2026-04-18T10:00:00Z"}'
```
Expected: JSON with `briefing` and `score_diffs` keys.

- [ ] **Step 3: Commit**

```bash
git add backend/ingest.py
git commit -m "feat: add ingest endpoint — retain() then double reflect() with score diffs"
```

---

## Task 9: TacticCard Component

**Files:**
- Create: `frontend/src/components/TacticCard.jsx`

- [ ] **Step 1: Create TacticCard.jsx**

```jsx
// frontend/src/components/TacticCard.jsx
import { useState, useEffect } from 'react'

function ConfidenceDots({ confidence }) {
  const filled = Math.round(confidence * 5)
  const color =
    confidence > 0.75 ? 'var(--conf-high)'
    : confidence >= 0.5 ? 'var(--conf-mid)'
    : 'var(--conf-low)'
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 8, height: 8,
            borderRadius: '50%',
            backgroundColor: i < filled ? color : 'var(--grey-800)',
            display: 'inline-block',
          }}
        />
      ))}
    </div>
  )
}

export default function TacticCard({
  name, confidence, evidence, timing, successes, total_uses,
  tags = [], animateIn = false, delay = 0, flashDirection = null,
}) {
  const [visible, setVisible] = useState(!animateIn)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (animateIn) {
      const t = setTimeout(() => setVisible(true), delay)
      return () => clearTimeout(t)
    }
  }, [animateIn, delay])

  useEffect(() => {
    if (flashDirection) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 600)
      return () => clearTimeout(t)
    }
  }, [flashDirection])

  const scoreColor =
    confidence > 0.75 ? 'var(--orange-500)'
    : confidence >= 0.5 ? 'var(--status-amber)'
    : 'var(--grey-500)'

  const borderColor = flash
    ? (flashDirection === 'up' ? 'var(--status-green)' : 'var(--status-red)')
    : 'var(--grey-800)'

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--card-radius)',
      padding: 'var(--card-padding)',
      opacity: visible ? 1 : 0,
      transition: 'opacity var(--transition-slow), border-color 0.6s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--grey-100)' }}>
          {name}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, color: scoreColor }}>
          {confidence.toFixed(2)}
        </span>
      </div>

      <ConfidenceDots confidence={confidence} />

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--grey-400)', margin: '12px 0 8px' }}>
        {evidence}
      </p>

      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {tags.map((tag) => (
            <span key={tag} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--grey-800)',
              color: 'var(--grey-400)', fontSize: 11, padding: '2px 8px', borderRadius: 4,
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--grey-500)', fontStyle: 'italic', margin: '0 0 8px' }}>
        {timing}
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--grey-500)', margin: 0 }}>
        {successes}/{total_uses} successful
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Manual smoke test**

Temporarily add to `frontend/src/App.jsx`:
```jsx
import TacticCard from './components/TacticCard'
// inside return:
<TacticCard name="AWS mention" confidence={0.87} evidence="Two mentions, both produced discounts." timing="Deploy after first price pushback." successes={2} total_uses={2} animateIn delay={0} />
<TacticCard name="Fiscal year" confidence={0.62} evidence="Works mid-range." timing="Reference Jan 31." successes={1} total_uses={2} />
<TacticCard name="Cancellation" confidence={0.12} evidence="Backfired in 2022." timing="Do not use." successes={0} total_uses={1} />
```
Run `cd frontend && npm run dev`. Verify: first card has orange score and 4 orange dots, second has amber score and 3 amber dots, third has grey score and 1 grey dot.

- [ ] **Step 3: Remove the smoke test code and commit**

```bash
git add frontend/src/components/TacticCard.jsx
git commit -m "feat: add TacticCard with confidence dots and flash animation"
```

---

## Task 10: TemporalBanner + SignalFeed

**Files:**
- Create: `frontend/src/components/TemporalBanner.jsx`
- Create: `frontend/src/components/SignalFeed.jsx`

- [ ] **Step 1: Create TemporalBanner.jsx**

```jsx
// frontend/src/components/TemporalBanner.jsx
export default function TemporalBanner({ signal }) {
  if (!signal) return null
  return (
    <div style={{
      background: 'var(--banner-urgent-bg)',
      border: 'var(--banner-urgent-border)',
      borderLeft: '3px solid var(--orange-500)',
      borderRadius: 8,
      padding: '16px 20px',
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 16 }}>⏳</span>
      <div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--orange-300)', margin: '0 0 4px', fontWeight: 600 }}>
          {signal.signal}: {signal.days_remaining} days remaining
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--grey-400)', margin: 0 }}>
          {signal.urgency === 'high'
            ? 'Act now — this window closes soon and may not reopen until next fiscal cycle.'
            : 'Monitor this signal and raise it proactively on the next call.'}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create SignalFeed.jsx**

```jsx
// frontend/src/components/SignalFeed.jsx
export default function SignalFeed({ signals = [] }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--grey-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Recent signals
      </p>
      {signals.map((s, i) => (
        <div key={i}>
          <div style={{ padding: '12px 0' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--grey-500)' }}>{s.date}</span>
              <span style={{ background: 'var(--bg-elevated)', color: 'var(--grey-400)', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>
                {s.source}
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--grey-200)', margin: '0 0 4px' }}>{s.summary}</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--grey-500)', fontStyle: 'italic', margin: 0, paddingLeft: 8 }}>
              {s.interpretation}
            </p>
          </div>
          {i < signals.length - 1 && <div style={{ height: 1, background: 'var(--grey-800)' }} />}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/TemporalBanner.jsx frontend/src/components/SignalFeed.jsx
git commit -m "feat: add TemporalBanner and SignalFeed components"
```

---

## Task 11: PostCallForm + ScoreDiff

**Files:**
- Create: `frontend/src/components/PostCallForm.jsx`
- Create: `frontend/src/components/ScoreDiff.jsx`

- [ ] **Step 1: Create PostCallForm.jsx**

```jsx
// frontend/src/components/PostCallForm.jsx
import { useState } from 'react'
import axios from 'axios'

const inputStyle = {
  background: 'var(--input-bg)',
  border: 'var(--input-border)',
  borderRadius: 'var(--input-radius)',
  padding: 'var(--input-padding)',
  color: 'var(--input-text)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
}

export default function PostCallForm({ vendor, onSuccess }) {
  const [notes, setNotes] = useState('')
  const [outcome, setOutcome] = useState('Successful concession')
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post('/api/ingest', {
        vendor,
        notes,
        outcome,
        timestamp: new Date().toISOString(),
      })
      onSuccess(res.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--card-bg)', border: 'var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--grey-100)', margin: '0 0 24px' }}>
        Log post-call notes — {vendor}
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input type="date" defaultValue={today} style={inputStyle} readOnly />
        <select value={outcome} onChange={(e) => setOutcome(e.target.value)} style={inputStyle}>
          <option>Successful concession</option>
          <option>No movement</option>
          <option>Escalated</option>
          <option>Rescheduled</option>
        </select>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What happened? What did you say? What did they say?"
          style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }}
          required
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            border: 'none',
            borderRadius: 'var(--btn-radius)',
            padding: 'var(--btn-padding)',
            fontSize: 'var(--btn-font-size)',
            fontWeight: 'var(--btn-font-weight)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--btn-primary-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--btn-primary-bg)' }}
        >
          {loading ? 'Saving to memory…' : 'Save to memory and update tactics'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Create ScoreDiff.jsx**

```jsx
// frontend/src/components/ScoreDiff.jsx
import { useEffect, useState } from 'react'

export default function ScoreDiff({ diffs }) {
  const [visible, setVisible] = useState(false)
  const entries = Object.entries(diffs || {})

  useEffect(() => {
    if (entries.length > 0) {
      requestAnimationFrame(() => setVisible(true))
    }
  }, [diffs])

  if (!entries.length) return null

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: 'var(--card-border)',
      borderRadius: 'var(--card-radius)',
      padding: '16px 20px',
      marginBottom: 16,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-12px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--grey-500)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
        Tactic score updates
      </p>
      {entries.map(([tactic, diff]) => {
        const isUp = diff.direction === 'up'
        const color = isUp ? 'var(--status-green)' : 'var(--status-red)'
        return (
          <div key={tactic} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', fontFamily: 'var(--font-body)', fontSize: 14 }}>
            <span style={{ color: 'var(--grey-200)', flex: 1 }}>{tactic}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--grey-500)', textDecoration: 'line-through' }}>
              {diff.old.toFixed(2)}
            </span>
            <span style={{ color }}>{isUp ? '↑' : '↓'}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color, fontWeight: 700 }}>{diff.new.toFixed(2)}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color }}>
              {isUp ? '+' : ''}{diff.delta.toFixed(2)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PostCallForm.jsx frontend/src/components/ScoreDiff.jsx
git commit -m "feat: add PostCallForm and ScoreDiff animation components"
```

---

## Task 12: Dashboard Page

**Files:**
- Create: `frontend/src/pages/Dashboard.jsx`

- [ ] **Step 1: Create Dashboard.jsx**

```jsx
// frontend/src/pages/Dashboard.jsx
import { useNavigate } from 'react-router-dom'

const VENDORS = [
  {
    id: 'nexacloud',
    name: 'NexaCloud',
    category: 'Cloud Infrastructure',
    value: '$380,000',
    renewalDate: 'Dec 31, 2024',
    daysRemaining: 13,
    interactions: 23,
    tactics: 4,
  },
  {
    id: 'datapipe',
    name: 'DataPipe',
    category: 'Data Pipeline',
    value: '$120,000',
    renewalDate: 'Mar 1, 2025',
    daysRemaining: 73,
    interactions: 16,
    tactics: 2,
  },
  {
    id: 'securenet',
    name: 'SecureNet',
    category: 'Security & Identity',
    value: '$85,000',
    renewalDate: 'Jun 1, 2025',
    daysRemaining: 164,
    interactions: 14,
    tactics: 2,
  },
]

function DaysBadge({ days }) {
  const urgent = days <= 30
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontFamily: 'var(--font-body)',
      background: urgent ? 'var(--alert-red-bg)' : 'var(--bg-elevated)',
      border: urgent ? 'var(--alert-red-border)' : '1px solid var(--grey-800)',
      color: urgent ? 'var(--alert-red-text)' : 'var(--grey-500)',
    }}>
      {days} days remaining
    </span>
  )
}

function VendorCard({ vendor }) {
  const navigate = useNavigate()
  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--grey-800)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
        transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--orange-500)'
        e.currentTarget.style.boxShadow = '0 0 0 1px var(--orange-500)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--grey-800)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--grey-100)', margin: '0 0 4px' }}>
        {vendor.name}
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--grey-500)', margin: '0 0 12px' }}>
        {vendor.category}
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 500, color: 'var(--orange-500)', margin: '0 0 8px' }}>
        {vendor.value}
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--grey-400)', margin: '0 0 8px' }}>
        Renewal: {vendor.renewalDate}
      </p>
      <div style={{ marginBottom: 12 }}>
        <DaysBadge days={vendor.daysRemaining} />
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--grey-400)', margin: '0 0 4px' }}>
        {vendor.interactions} interactions logged
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--grey-400)', margin: '0 0 16px' }}>
        {vendor.tactics} tactics tracked
      </p>
      <button
        onClick={() => navigate(`/briefing/${vendor.id}`)}
        style={{
          width: '100%',
          background: 'var(--btn-primary-bg)',
          color: 'var(--btn-primary-text)',
          border: 'none',
          borderRadius: 'var(--btn-radius)',
          padding: 'var(--btn-padding)',
          fontSize: 'var(--btn-font-size)',
          fontWeight: 'var(--btn-font-weight)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--btn-primary-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--btn-primary-bg)')}
      >
        Generate briefing
      </button>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--grey-100)', margin: 0 }}>
          <span style={{ color: 'var(--orange-500)' }}>●</span> TACTIQ
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--grey-500)', margin: 0 }}>
          Vendor Negotiation Intelligence
        </p>
      </div>
      <div style={{ height: 1, background: 'var(--grey-800)', marginBottom: 40 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {VENDORS.map((v) => <VendorCard key={v.id} vendor={v} />)}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify dashboard renders**

```bash
cd frontend && npm run dev
```
Open http://localhost:5173. Verify: 3 vendor cards in grid, NexaCloud shows red "13 days remaining" badge, DataPipe and SecureNet show grey badges.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Dashboard.jsx
git commit -m "feat: add vendor dashboard with 3-column grid and urgency badges"
```

---

## Task 13: Briefing Page

**Files:**
- Create: `frontend/src/pages/Briefing.jsx`

- [ ] **Step 1: Create Briefing.jsx**

```jsx
// frontend/src/pages/Briefing.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import TacticCard from '../components/TacticCard'
import TemporalBanner from '../components/TemporalBanner'
import SignalFeed from '../components/SignalFeed'
import ScoreDiff from '../components/ScoreDiff'
import PostCallForm from '../components/PostCallForm'

const CONTRACT_META = {
  nexacloud: { value: '$380k', contact: 'Marcus Chen',     renewal: 'Dec 31',  interactions: 23 },
  datapipe:  { value: '$120k', contact: 'Jennifer Okafor', renewal: 'Mar 1',   interactions: 16 },
  securenet: { value: '$85k',  contact: 'David Reyes',     renewal: 'Jun 1',   interactions: 14 },
}

export default function Briefing() {
  const { vendor } = useParams()
  const navigate = useNavigate()
  const [briefing, setBriefing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scoreDiffs, setScoreDiffs] = useState({})
  const [showForm, setShowForm] = useState(false)
  const meta = CONTRACT_META[vendor] || {}

  const fetchBriefing = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/briefing?vendor=${vendor}`)
      setBriefing(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBriefing() }, [vendor])

  const handlePostCallSuccess = (data) => {
    setScoreDiffs(data.score_diffs || {})
    setBriefing(data.briefing)
    setShowForm(false)
    setTimeout(() => navigate(`/briefing/${vendor}`), 2000)
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, color: 'var(--grey-400)', fontFamily: 'var(--font-body)' }}>
        Generating briefing…
      </div>
    )
  }

  if (!briefing) return null

  const tactics = (briefing.tactics || []).sort((a, b) => b.confidence - a.confidence)
  const topSignal = (briefing.temporal_signals || [])[0]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--grey-100)' }}>
            Pre-call briefing · TACTIQ
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--grey-500)', marginLeft: 12 }}>
            {vendor} — annual renewal
          </span>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          background: 'var(--alert-red-bg)',
          border: 'var(--alert-red-border)',
          color: 'var(--alert-red-text)',
          padding: '6px 12px',
          borderRadius: 8,
          fontSize: 13,
        }}>
          Renewal: {meta.renewal}
        </span>
      </div>

      <div style={{ height: 1, background: 'var(--grey-800)', marginBottom: 24 }} />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Annual value',        value: meta.value,                orange: true },
          { label: 'Renewal date',        value: meta.renewal,              orange: false },
          { label: 'Interactions logged', value: String(meta.interactions), orange: false },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--bg-surface)', border: 'var(--card-border)', borderRadius: 8, padding: '16px 20px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--grey-500)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
              {s.label}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 24, color: s.orange ? 'var(--orange-500)' : 'var(--grey-200)', margin: 0 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <ScoreDiff diffs={scoreDiffs} />

      {/* Tactic cards */}
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--grey-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Recommended tactics — from Hindsight memory
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {tactics.map((t, i) => (
          <TacticCard
            key={t.name}
            {...t}
            animateIn
            delay={i * 80}
            flashDirection={scoreDiffs[t.name]?.direction ?? null}
          />
        ))}
      </div>

      {/* Temporal banner */}
      {topSignal && <div style={{ marginBottom: 24 }}><TemporalBanner signal={topSignal} /></div>}

      {/* Signals feed */}
      <div style={{ marginBottom: 32 }}>
        <SignalFeed signals={briefing.recent_signals || []} />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--grey-800)', paddingTop: 16 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--grey-500)' }}>
          {tactics.length} tactics · last updated today
        </span>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            border: 'none',
            borderRadius: 'var(--btn-radius)',
            padding: 'var(--btn-padding)',
            fontSize: 'var(--btn-font-size)',
            fontWeight: 'var(--btn-font-weight)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--btn-primary-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--btn-primary-bg)')}
        >
          Log post-call notes
        </button>
      </div>

      {showForm && (
        <div style={{ marginTop: 24 }}>
          <PostCallForm vendor={vendor} onSuccess={handlePostCallSuccess} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Briefing.jsx
git commit -m "feat: add briefing page — tactic cards, temporal banner, signals, post-call form"
```

---

## Task 14: App.jsx Routing

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Replace App.jsx with routing**

```jsx
// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Briefing from './pages/Briefing'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/briefing/:vendor" element={<Briefing />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Run full backend + frontend stack**

Terminal 1:
```bash
source .venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```
Terminal 2:
```bash
cd frontend && npm run dev
```

- [ ] **Step 3: Manual end-to-end flow test**

Walk through:
1. http://localhost:5173 — 3 vendor cards render, NexaCloud has red badge ✓
2. Click "Generate briefing" on NexaCloud → navigates to `/briefing/nexacloud` ✓
3. Briefing loads in < 3 seconds ✓
4. Tactic cards render: AWS mention ≥ 0.75 (orange), Fiscal year 0.50–0.75 (amber), Cancellation threat < 0.50 (grey) ✓
5. Temporal banner visible with orange left border ✓
6. Signals feed shows ≥ 3 entries ✓
7. Click "Log post-call notes" → form appears ✓
8. Fill notes, submit → ScoreDiff panel slides in with arrows ✓
9. After 2 seconds, briefing auto-refreshes ✓

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: wire React Router — dashboard and briefing routes complete"
```

---

## Task 15: Final Tests + Acceptance Check

- [ ] **Step 1: Run all backend tests**

```bash
source .venv/bin/activate
pytest tests/ -v
```
Expected: All 8 tests PASS (3 model tests + 5 score diff tests).

- [ ] **Step 2: Work through Section 4.1 acceptance checklist from spec.md**

Confirm every item:
- [ ] Seeder ran successfully, no errors
- [ ] `reflect()` on `nexacloud` returns ≥ 3 tactics with confidence > 0.50
- [ ] Dashboard renders all 3 cards; NexaCloud shows red days-remaining badge
- [ ] "Generate briefing" navigates and loads within 3 seconds
- [ ] All 3 confidence tiers render with correct dot colours
- [ ] Scores display in `--font-mono` with `--orange-500` colour
- [ ] Temporal banner shows with `--banner-urgent-bg` and `--orange-500` left border
- [ ] Signals feed populates from `recall()` with ≥ 3 entries
- [ ] Post-call form renders with all 4 fields; submit triggers loading state
- [ ] `retain()` → `reflect()` → `score_diffs` returned correctly
- [ ] Score diff animation: green ↑ / red ↓ with correct arrows
- [ ] Briefing auto-refreshes after submission
- [ ] Full flow (dashboard → briefing → post-call → updated briefing) works end-to-end

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete all 7 must-build features — TactIQ hackathon submission ready"
```

---

## Quick-Start Reference

```bash
# Install Python deps
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt

# Install frontend deps
cd frontend && npm install

# Run seeder (24+ hours before demo)
python3 seeder/seed_vendors.py

# Start backend
source .venv/bin/activate && uvicorn backend.main:app --reload --port 8000

# Start frontend (separate terminal)
cd frontend && npm run dev

# Run tests
source .venv/bin/activate && pytest tests/ -v
```
