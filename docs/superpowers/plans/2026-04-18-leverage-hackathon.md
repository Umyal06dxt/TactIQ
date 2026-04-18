# LEVERAGE Hackathon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working demo of LEVERAGE — a vendor-negotiation intelligence agent with a MemoryToggle hero moment and live score diffs — powered by Hindsight Cloud (memory) and the OpenAI Agents SDK (orchestration), in a 10-hour hackathon sprint.

**Architecture:** Next.js 15 App Router (TypeScript) calls a FastAPI backend. Backend defines a `BriefingAgent` via the OpenAI Agents SDK with three function tools (`recall_memories`, `synthesize_briefing`, `rank_tactics`); `Runner.run()` executes the pipeline and a `RunHooks` subclass captures per-tool lifecycle timings into `pipeline_trail`. The agent's LLM step (gpt-4o) synthesizes tactics from Hindsight Opinions. The memory-OFF path bypasses the agent entirely and hits OpenAI directly with a constrained prompt. Frontend renders a MemoryToggle that flips between the two endpoints and a ScoreDiff that animates confidence changes after each post-call log.

**Tech Stack:** Next.js 15 + TypeScript + Tailwind v3.4, FastAPI + Python 3.11, OpenAI (`gpt-4o`), OpenAI Agents SDK (`openai-agents`), Hindsight Cloud (`hindsight-client`), Faker, Vercel (frontend), Railway (backend).

**Why OpenAI Agents SDK:** CascadeFlow (the original sponsor for orchestration) is waitlist-gated. The Agents SDK is a clean drop-in — real named SDK, first-party from OpenAI, and its `RunHooks` lifecycle (`on_tool_start` / `on_tool_end`) gives us millisecond-accurate step timings for the UI trail without a hand-rolled timer. Bonus: built-in tracing we could surface later.

**Source of truth:** `spec.md` at repo root.

---

## Pragmatism note (hackathon mode)

TDD discipline is relaxed for UI glue code — 10 hours is the whole budget. TDD is **enforced** for the two pieces of logic that must be correct:

1. The confidence formula (`briefing.confidence`)
2. The score-diff computation (`ingest.compute_diffs`)

Everything else verifies via curl, browser smoke-test, and the acceptance checklist in `spec.md §10`. Commit after every task. If you fall behind, follow the cut rules in `spec.md §8.2`.

---

## File Structure (decomposed from spec.md §3.2)

### Backend (`backend/`)

| File                       | Responsibility                                                                                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main.py`                  | FastAPI app, CORS config, route wiring, `/health`                                                                                                                                |
| `prompts.py`               | `BRIEFING_PROMPT` + `NOMEMORY_PROMPT` + `AGENT_INSTRUCTIONS` string constants                                                                                                    |
| `models.py`                | Pydantic request/response schemas                                                                                                                                                |
| `pipeline.py`              | OpenAI Agents SDK: `BriefingAgent`, function tools (`recall_memories`, `synthesize_briefing`, `rank_tactics`), `PipelineHooks(RunHooks)`, and async `run_briefing()` entry point |
| `briefing.py`              | Confidence formula + `_days_remaining` helper + thin async `build_briefing()` adapter wrapping `pipeline.run_briefing`                                                           |
| `nomemory.py`              | OpenAI-only generic-advice endpoint handler                                                                                                                                      |
| `ingest.py`                | §5.4 four-step flow (capture_old → retain → reflect → diff)                                                                                                                      |
| `fixtures/demo.json`       | DEMO_MODE canned responses for every route                                                                                                                                       |
| `requirements.txt`         | Pinned deps                                                                                                                                                                      |
| `Dockerfile`               | Railway build                                                                                                                                                                    |
| `tests/test_confidence.py` | Unit tests for confidence formula                                                                                                                                                |
| `tests/test_diffs.py`      | Unit tests for diff computation                                                                                                                                                  |

### Frontend (`frontend/src/`)

| File                                       | Responsibility                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `app/layout.tsx`                           | Root layout + Tailwind import                                                             |
| `app/page.tsx`                             | Dashboard page                                                                            |
| `app/briefing/[vendor]/page.tsx`           | Briefing page (server component wrapping the client briefing)                             |
| `app/briefing/[vendor]/BriefingClient.tsx` | Client component that owns toggle + fetch state                                           |
| `lib/api.ts`                               | Typed fetch client against backend                                                        |
| `lib/types.ts`                             | Shared TS types (Tactic, Briefing, ScoreDiff, PipelineStep) — mirrors `backend/models.py` |
| `components/VendorCard.tsx`                | Dashboard card                                                                            |
| `components/TacticCard.tsx`                | Tactic with 5-dot confidence, evidence, timing                                            |
| `components/Playbook.tsx`                  | Branching decision tree                                                                   |
| `components/AntiPatternSparkline.tsx`      | Descending red SVG sparkline                                                              |
| `components/MemoryToggle.tsx`              | Hero toggle component                                                                     |
| `components/PipelineStatus.tsx`            | Agents-SDK orchestration step trail (dark pill with live timings)                         |
| `components/SignalFeed.tsx`                | 2-item signals feed                                                                       |
| `components/PostCallForm.tsx`              | Modal form for logging post-call notes                                                    |
| `components/ScoreDiff.tsx`                 | Animated old → new display                                                                |

### Seeder (`seeder/`)

| File              | Responsibility                                                                |
| ----------------- | ----------------------------------------------------------------------------- |
| `vendor_data.py`  | Pure-Python dict of 30 interactions (23 NexaCloud + 4 DataPipe + 3 SecureNet) |
| `seed_vendors.py` | Batch writer that calls `client.retain()` for each interaction                |

---

## Hour -3 to 0 — Pre-flight (do this BEFORE the 10-hour clock starts)

### Task P1: Sponsor accounts + API key verification

**Files:** None (external signups).

- [ ] **Step 1: Create Hindsight Cloud account** — sign up at https://hindsight.vectorize.io, apply promo code `MEMHACK409`. Capture `HINDSIGHT_API_KEY` and `HINDSIGHT_API_URL`.

- [ ] **Step 2: Install + verify OpenAI Agents SDK** — `pip install openai-agents`. Skim the quickstart at https://openai.github.io/openai-agents-python/. Confirm `Agent`, `Runner`, `function_tool`, and `RunHooks` all import cleanly. No separate API key — the SDK reads `OPENAI_API_KEY`.

- [ ] **Step 3: Verify OpenAI access** — confirm your `OPENAI_API_KEY` can hit `gpt-4o`. Run:

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"ping"}]}'
```

Expected: 200 with a completion. If 404, fall back to `OPENAI_MODEL=gpt-4o-mini`.

- [ ] **Step 4: Verify Hindsight round-trip** — write a throwaway script:

```python
from hindsight_client import HindsightClient
import os
c = HindsightClient(api_key=os.environ["HINDSIGHT_API_KEY"], base_url=os.environ["HINDSIGHT_API_URL"])
c.retain(bank_id="sandbox", experience="test interaction")
print(c.reflect(bank_id="sandbox"))
```

Expected: response with Opinions/Observations shape. Save the shape to `docs/hindsight-reflect-shape.json` for reference.

- [ ] **Step 5: Verify Agents SDK round-trip with a toy 2-tool agent** — write a throwaway script:

```python
import asyncio
from agents import Agent, Runner, function_tool, RunHooks

@function_tool
def add(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b

class DebugHooks(RunHooks):
    async def on_tool_start(self, context, agent, tool):
        print(f"[start] {tool.name}")
    async def on_tool_end(self, context, agent, tool, result):
        print(f"[end]   {tool.name} -> {result}")

async def main():
    agent = Agent(name="Calc", model="gpt-4o", instructions="Use the add tool.", tools=[add])
    r = await Runner.run(agent, "What is 2 + 3?", hooks=DebugHooks())
    print("final:", r.final_output)

asyncio.run(main())
```

Expected: hooks fire (`[start] add`, `[end] add -> 5`), final output contains "5". If this doesn't work, stop — investigate before continuing.

---

### Task P2: Repo + scaffolds

**Files:**

- Create: `leverage/` GitHub repo (public, MIT)
- Create: `frontend/` via `create-next-app`
- Create: `backend/` FastAPI scaffold
- Create: `.env.example`, `README.md` (stub), `LICENSE`

- [ ] **Step 1: Create public GitHub repo `leverage`** with MIT license. Clone locally.

- [ ] **Step 2: Scaffold Next.js 15 frontend:**

```bash
cd leverage
npx create-next-app@latest frontend --ts --tailwind --app --eslint --src-dir --import-alias "@/*" --no-turbopack
```

Accept defaults except: TypeScript yes, Tailwind yes, App Router yes, `src/` dir yes.

- [ ] **Step 3: Scaffold Python backend:**

```bash
mkdir -p backend/tests backend/fixtures
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
```

Create `backend/requirements.txt`:

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
python-dotenv==1.0.0
openai>=1.50.0
openai-agents>=0.2.0
hindsight-client
faker==22.0.0
httpx==0.26.0
pytest==7.4.4
pytest-asyncio==0.23.3
```

Install: `pip install -r requirements.txt`.

- [ ] **Step 4: Write `backend/main.py` with `/health` only:**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="LEVERAGE")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}
```

- [ ] **Step 5: Smoke-test locally:**

```bash
cd backend && uvicorn main:app --reload --port 8000
# In another terminal:
curl https://set-daring-tadpole.ngrok-free.app/health
```

Expected: `{"ok":true}`.

- [ ] **Step 6: Create `.env.example` at repo root:**

```
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
DEMO_MODE=false
CORS_ORIGINS=http://localhost:3000
NEXT_PUBLIC_API_URL=https://set-daring-tadpole.ngrok-free.app
```

(The Agents SDK reads `OPENAI_API_KEY` from the environment. No extra keys needed.)

- [ ] **Step 7: Commit + push:**

```bash
git add . && git commit -m "chore: initial scaffolds (Next.js 15 + FastAPI)"
git push -u origin main
```

---

### Task P3: Deploy smoke

**Files:** Vercel + Railway dashboards, `backend/Dockerfile`.

- [ ] **Step 1: Create `backend/Dockerfile`:**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8000
EXPOSE 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
```

- [ ] **Step 2: Create Railway project** from GitHub repo, root directory `backend/`. Set env vars from `.env.example`. Deploy. Note the public URL (e.g., `https://leverage-backend.up.railway.app`).

- [ ] **Step 3: Verify Railway `/health`:**

```bash
curl https://<your-railway-domain>/health
```

Expected: `{"ok":true}`.

- [ ] **Step 4: Create Vercel project** from GitHub repo, root directory `frontend/`. Set `NEXT_PUBLIC_API_URL=https://<your-railway-domain>`. Deploy.

- [ ] **Step 5: Verify Vercel renders** — open the Vercel URL in browser, confirm default Next.js landing page renders.

- [ ] **Step 6: Update backend `CORS_ORIGINS`** on Railway to include the Vercel domain. Redeploy.

- [ ] **Step 7: Commit:**

```bash
git add backend/Dockerfile && git commit -m "chore: Railway Dockerfile" && git push
```

---

### Task P4: Seed Hindsight banks overnight

**Depends on:** Task P1, Task B1 (vendor_data.py), Task B2 (seed_vendors.py).

- [ ] **Step 1: After completing B1 + B2, run seeder against live Hindsight:**

```bash
cd seeder && python seed_vendors.py
```

Expected: 30 successful `retain()` calls. Leave overnight for Hindsight synthesis to stabilise.

---

## Hour 0.0 to 2.5 — Seeder (B1, B2)

### Task B1: Vendor data fixture

**Files:**

- Create: `seeder/vendor_data.py`
- Create: `seeder/__init__.py` (empty)

- [ ] **Step 1: Create `seeder/vendor_data.py`** with the full 30-interaction dict. Hand-author the NexaCloud tactics-supporting interactions; use Faker for filler text only.

```python
"""Synthetic vendor interactions for LEVERAGE Hindsight banks.

NexaCloud: 23 interactions (3 contracts + 8 calls + 12 emails)
DataPipe: 4 interactions
SecureNet: 3 interactions
Total: 30

Hand-authored turning-point interactions support the 4 on-screen NexaCloud tactics:
- Mention AWS (0.87, 2/2)
- Fiscal Q3 pressure (0.74, 3/4)
- Multi-year commitment (0.50)
- Cancellation threat (0.12, anti-pattern, 0/3)
"""
from datetime import datetime

NEXACLOUD = [
    # --- Contracts ---
    {"type": "contract", "date": "2022-12-31", "summary": "Initial NexaCloud contract signed. $320,000/yr, 1-year term. Negotiated by predecessor. No discount."},
    {"type": "contract", "date": "2023-12-31", "summary": "NexaCloud renewal. $350,000/yr. 2-year term negotiated by Priya. 3% discount after AWS mention (first evidence). Contact: Marcus Chen."},
    {"type": "contract", "date": "2024-12-31", "summary": "NexaCloud renewal. $380,000/yr. 3-year term would have saved 8% but not offered. Contact: Marcus Chen."},

    # --- Calls supporting AWS mention tactic (2 successful uses) ---
    {"type": "call", "date": "2023-09-15", "summary": "Pre-renewal call with Marcus. Priya mentioned exploring AWS for select workloads. Marcus offered 3% discount and $8k bundled support tier upgrade within 10 minutes. OUTCOME: Successful concession."},
    {"type": "call", "date": "2024-05-14", "summary": "Mid-contract call. Priya referenced AWS re:Invent announcements. Marcus proactively offered 3% discount extension and $8k support upgrade. OUTCOME: Successful concession."},

    # --- Calls supporting Fiscal Q3 pressure (3 of 4 successful) ---
    {"type": "call", "date": "2023-08-22", "summary": "Q3 close-of-quarter call. Priya anchored on end-of-fiscal timing. Marcus waived onboarding fee ($12k). OUTCOME: Successful concession."},
    {"type": "call", "date": "2024-08-30", "summary": "Q3 quarter-end. Priya referenced fiscal pressure. Marcus offered 2-year lock at current rate. OUTCOME: Successful concession."},
    {"type": "call", "date": "2024-09-05", "summary": "Follow-up call. Fiscal Q3 reference. Marcus countered with 'our quarter is already booked'. OUTCOME: No movement."},

    # --- Calls where multi-year was raised ---
    {"type": "call", "date": "2024-11-02", "summary": "Marcus unprompted mentioned '3-year roadmap access' during routine check-in. Priya did not commit. OUTCOME: Informational."},

    # --- Cancellation threat anti-pattern (3 failed uses) ---
    {"type": "call", "date": "2022-03-14", "summary": "Priya's predecessor threatened to cancel. Marcus escalated to NexaCloud legal. Relationship cooled for 6 months. OUTCOME: Escalated."},
    {"type": "call", "date": "2022-07-08", "summary": "Second cancellation threat. Marcus politely declined to negotiate. No movement. OUTCOME: No movement."},
    {"type": "call", "date": "2022-11-30", "summary": "Third cancellation threat on Q4 close. Marcus flagged with his manager. Priya had to walk it back. OUTCOME: No movement."},

    # --- Emails (filler + 2 roadmap hints) ---
    {"type": "email", "date": "2024-11-15", "summary": "Marcus forwarded Q1 2026 roadmap preview. Mentioned multi-year customers get early access."},
    {"type": "email", "date": "2024-10-02", "summary": "Marcus: 'Let us know if you want to talk about term extensions — we have flexibility.'"},
    {"type": "email", "date": "2024-09-20", "summary": "Standard check-in email. No negotiation content."},
    {"type": "email", "date": "2024-08-14", "summary": "Invoice reminder. Neutral tone."},
    {"type": "email", "date": "2024-07-30", "summary": "Product update announcement. CC'd Priya and 30 other accounts."},
    {"type": "email", "date": "2024-06-12", "summary": "Support ticket thread. Resolved in 2 days."},
    {"type": "email", "date": "2024-05-20", "summary": "Post-call follow-up confirming 3% discount and support tier upgrade."},
    {"type": "email", "date": "2024-04-01", "summary": "Quarterly business review invite."},
    {"type": "email", "date": "2024-02-18", "summary": "Feature request acknowledgement."},
    {"type": "email", "date": "2023-11-10", "summary": "Holiday card + renewal reminder."},
    {"type": "email", "date": "2023-06-25", "summary": "Mid-year usage report. Flags potential overage."},
    {"type": "email", "date": "2023-02-08", "summary": "Account review kickoff."},
]

DATAPIPE = [
    {"type": "contract", "date": "2023-03-15", "summary": "DataPipe initial contract. $110,000/yr. Contact: Ananya Rao."},
    {"type": "contract", "date": "2024-03-15", "summary": "DataPipe renewal. $120,000/yr. Volume commitment (500GB/month) secured 5% discount."},
    {"type": "call", "date": "2024-02-20", "summary": "Pre-renewal call. Priya committed to volume. Ananya offered 5% discount. OUTCOME: Successful concession."},
    {"type": "call", "date": "2024-01-10", "summary": "Priya mentioned considering Fivetran as alternative. Ananya was frosty, relationship chilled 2 weeks. OUTCOME: Escalated."},
]

SECURENET = [
    {"type": "contract", "date": "2023-07-01", "summary": "SecureNet contract. $80,000/yr. Contact: James Wu."},
    {"type": "call", "date": "2024-06-15", "summary": "Priya shared Okta and CrowdStrike quotes. James matched pricing to $85,000 with added MFA features. OUTCOME: Successful concession."},
    {"type": "call", "date": "2023-09-04", "summary": "Priya threatened cancellation over a SLA miss. James escalated. Relationship strained. OUTCOME: Escalated."},
]

VENDORS = {
    "nexacloud": {
        "name": "NexaCloud",
        "annual_value": 380000,
        "renewal_date": "2025-12-31",
        "contact": "Marcus Chen",
        "interactions": NEXACLOUD,
    },
    "datapipe": {
        "name": "DataPipe",
        "annual_value": 120000,
        "renewal_date": "2026-03-15",
        "contact": "Ananya Rao",
        "interactions": DATAPIPE,
    },
    "securenet": {
        "name": "SecureNet",
        "annual_value": 85000,
        "renewal_date": "2026-07-01",
        "contact": "James Wu",
        "interactions": SECURENET,
    },
}
```

- [ ] **Step 2: Commit:**

```bash
git add seeder/ && git commit -m "feat(seeder): add vendor data fixtures (30 interactions)"
```

---

### Task B2: Seeder script

**Files:**

- Create: `seeder/seed_vendors.py`

- [ ] **Step 1: Write `seeder/seed_vendors.py`:**

```python
"""Seed Hindsight banks with synthetic vendor interactions.

Run once, ideally at hour -3 of pre-hackathon prep so Hindsight has time to synthesize.
Re-run the night before for redundancy.
"""
import os
import sys
from dotenv import load_dotenv
from hindsight_client import HindsightClient
from vendor_data import VENDORS

load_dotenv()

def main():
    api_key = os.environ.get("HINDSIGHT_API_KEY")
    base_url = os.environ.get("HINDSIGHT_API_URL", "https://api.hindsight.vectorize.io")
    if not api_key:
        print("ERROR: HINDSIGHT_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    client = HindsightClient(api_key=api_key, base_url=base_url)

    total = 0
    for bank_id, v in VENDORS.items():
        print(f"\n=== Seeding {v['name']} ({bank_id}) — {len(v['interactions'])} interactions ===")
        # Seed world facts first
        client.retain(
            bank_id=bank_id,
            experience=f"Vendor {v['name']}. Annual contract value ${v['annual_value']:,}. Renewal date {v['renewal_date']}. Primary contact {v['contact']}.",
            metadata={"type": "world_fact"},
        )
        for i, interaction in enumerate(v["interactions"], 1):
            client.retain(
                bank_id=bank_id,
                experience=interaction["summary"],
                metadata={
                    "type": interaction["type"],
                    "date": interaction["date"],
                },
            )
            print(f"  [{i}/{len(v['interactions'])}] {interaction['date']} {interaction['type']}")
            total += 1

    print(f"\nSeeded {total} interactions across {len(VENDORS)} banks.")
    print("Wait at least 6 hours for Hindsight Observations synthesis before demo.")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Dry-run against a sandbox bank** — temporarily change `bank_id` to `"sandbox"` in one vendor, run, verify `retain()` succeeds.

```bash
cd seeder && python seed_vendors.py
```

Expected: 30 successful retain calls, no errors.

- [ ] **Step 3: Verify `reflect()` returns something:**

```python
from hindsight_client import HindsightClient
import os, json
c = HindsightClient(api_key=os.environ["HINDSIGHT_API_KEY"], base_url=os.environ["HINDSIGHT_API_URL"])
print(json.dumps(c.reflect(bank_id="nexacloud"), indent=2))
```

Expected: non-empty Opinions list. If empty, wait 1 hour and retry.

- [ ] **Step 4: Commit:**

```bash
git add seeder/seed_vendors.py && git commit -m "feat(seeder): batch writer for Hindsight banks"
```

**Cut rule: at 2.0 hrs, if still struggling, drop to 20 interactions (17+2+1). At 2.5 hrs, STOP.**

---

## Hour 2.5 to 4.0 — Backend core (B3, B4, B5, B6)

### Task B3: Prompts module

**Files:**

- Create: `backend/prompts.py`

- [ ] **Step 1: Write `backend/prompts.py`** exactly as specified in `spec.md §5.3`:

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

AGENT_INSTRUCTIONS = """You are BriefingAgent. Your job: produce a negotiation
briefing for one vendor as strict JSON.

You MUST follow this exact pipeline, in order:
1. Call the `recall_memories` tool with the bank_id you were given.
2. Using ONLY the returned Hindsight data, produce the briefing JSON described below.
3. Call the `rank_tactics` tool with the JSON array of tactics to sort them.
4. Return the complete briefing JSON as your final output. No prose, no markdown.

The final output schema:
{ "tactics": [<tactic>...], "playbook": {"opening": {...}, "branches": [...]},
  "temporal_signals": [...], "recent_signals": [...] }

Each tactic MUST include: name, confidence (float 0-1), evidence (dated reference),
timing, successes, total_uses, last_used_date, is_anti_pattern. For any tactic with
confidence < 0.20 AND >= 2 failed uses, set is_anti_pattern=true and include a
history array of 4-5 {date, confidence} points showing descending trend.

Always provide 2-4 playbook branches phrased as "If <vendor_contact> says/does X".
At most one level of followup per branch.

Do not invent facts. Output valid JSON only.
"""
```

- [ ] **Step 2: Commit:**

```bash
git add backend/prompts.py && git commit -m "feat(backend): briefing + nomemory prompts"
```

---

### Task B4: Pydantic models

**Files:**

- Create: `backend/models.py`

- [ ] **Step 1: Write `backend/models.py`:**

```python
from typing import List, Optional, Literal, Dict
from pydantic import BaseModel, Field

class HistoryPoint(BaseModel):
    date: str
    confidence: float

class Tactic(BaseModel):
    name: str
    confidence: float
    evidence: str
    timing: str
    successes: int
    total_uses: int
    last_used_date: Optional[str] = None
    is_anti_pattern: bool = False
    history: Optional[List[HistoryPoint]] = None

class PlaybookMove(BaseModel):
    move: str
    rationale: str
    tactic_ref: str

class PlaybookBranch(BaseModel):
    condition: str
    move: str
    rationale: str
    tactic_ref: str
    followup: Optional[List["PlaybookBranch"]] = None

class Playbook(BaseModel):
    opening: PlaybookMove
    branches: List[PlaybookBranch]

class TemporalSignal(BaseModel):
    label: str
    severity: Literal["low", "medium", "high"]

class RecentSignal(BaseModel):
    date: str
    source: str
    summary: str
    interpretation: str

class Contract(BaseModel):
    value: int
    renewal_date: str
    days_remaining: int
    contact: str

class PipelineStep(BaseModel):
    step: str
    status: Literal["ok", "error", "skipped"]
    ms: int
    label: Optional[str] = None

class Briefing(BaseModel):
    vendor: str
    contract: Contract
    tactics: List[Tactic]
    playbook: Playbook
    temporal_signals: List[TemporalSignal]
    recent_signals: List[RecentSignal]
    pipeline_trail: List[PipelineStep]

class Vendor(BaseModel):
    bank_id: str
    name: str
    annual_value: int
    renewal_date: str
    days_remaining: int
    contact: str
    interaction_count: int
    tactic_count: int

class VendorListResponse(BaseModel):
    vendors: List[Vendor]

class IngestRequest(BaseModel):
    vendor: str
    notes: str = Field(..., min_length=20)
    outcome: Literal["Successful concession", "No movement", "Escalated", "Rescheduled"]
    timestamp: str

class ScoreDiff(BaseModel):
    old: float
    new: float
    delta: float
    direction: Literal["up", "down"]

class IngestResponse(BaseModel):
    briefing: Briefing
    score_diffs: Dict[str, ScoreDiff]
    pipeline_trail: List[PipelineStep]

class NoMemoryTactic(BaseModel):
    name: str
    advice: str

class NoMemoryResponse(BaseModel):
    vendor: str
    tactics: List[NoMemoryTactic]
```

- [ ] **Step 2: Commit:**

```bash
git add backend/models.py && git commit -m "feat(backend): Pydantic schemas"
```

---

### Task B5: Agents SDK pipeline (`pipeline.py`)

**Files:**

- Create: `backend/pipeline.py`

This module defines the `BriefingAgent` + its three function tools, the `PipelineHooks` class that captures tool-call timings, and `run_briefing()` — the async entry point used by both `/api/briefing` and `/api/ingest`.

- [ ] **Step 1: Write `backend/pipeline.py`:**

```python
"""OpenAI Agents SDK orchestration for LEVERAGE.

A single BriefingAgent with three function tools:
  - recall_memories(bank_id)       -> JSON string of Hindsight Opinions
  - synthesize_briefing(vendor_name, memories_json) -> JSON string of tactics+playbook
  - rank_tactics(tactics_json)     -> JSON string of tactics sorted desc by confidence

The agent's AGENT_INSTRUCTIONS enforces the call order (recall -> synthesize -> rank).
PipelineHooks captures per-tool timings for the pipeline_trail UI surface.

`synthesize_briefing` makes a second OpenAI call internally using BRIEFING_PROMPT with
response_format=json_object — this keeps JSON shape reliable even if the agent's own
LLM turn tries to paraphrase. The agent is, effectively, the orchestrator; synthesis
happens inside the tool.
"""
from __future__ import annotations
import json
import os
import time
from typing import Any, List, Optional

from agents import Agent, Runner, RunHooks, function_tool
from openai import OpenAI

from prompts import AGENT_INSTRUCTIONS, BRIEFING_PROMPT
from models import PipelineStep

MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")
_openai = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

# Module-level Hindsight client reference — set by main.py at startup.
# Tools can't take arbitrary objects as parameters (args must be JSON-serializable),
# so we stash the client here.
_hindsight: Optional[Any] = None


def set_hindsight_client(client: Any) -> None:
    global _hindsight
    _hindsight = client


# --------- Tools ---------

@function_tool
def recall_memories(bank_id: str) -> str:
    """Recall Hindsight memories (Opinions, Observations, recent Experiences) for a vendor.

    Args:
        bank_id: Hindsight bank identifier (e.g., 'nexacloud', 'datapipe', 'securenet').

    Returns:
        JSON string of the recalled memory payload.
    """
    assert _hindsight is not None, "pipeline.set_hindsight_client() was never called"
    opinions = _hindsight.reflect(bank_id=bank_id)
    return json.dumps(opinions, default=str)


@function_tool
def synthesize_briefing(vendor_name: str, memories_json: str) -> str:
    """Synthesize a negotiation briefing JSON from recalled memories.

    Uses gpt-4o with BRIEFING_PROMPT in strict JSON mode.

    Args:
        vendor_name: Display name of the vendor (e.g., 'NexaCloud').
        memories_json: JSON string returned by recall_memories.

    Returns:
        JSON string with { tactics[], playbook{...}, temporal_signals[], recent_signals[] }.
    """
    user_content = f"Vendor: {vendor_name}\n\nHindsight data:\n{memories_json}"
    resp = _openai.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": BRIEFING_PROMPT},
            {"role": "user", "content": user_content},
        ],
        temperature=0.2,
    )
    return resp.choices[0].message.content or "{}"


@function_tool
def rank_tactics(tactics_json: str) -> str:
    """Sort a JSON array of tactics by confidence descending. Returns the sorted JSON."""
    tactics = json.loads(tactics_json)
    tactics.sort(key=lambda t: t.get("confidence", 0.0), reverse=True)
    return json.dumps(tactics)


# --------- Agent ---------

BRIEFING_AGENT = Agent(
    name="BriefingAgent",
    model=MODEL,
    instructions=AGENT_INSTRUCTIONS,
    tools=[recall_memories, synthesize_briefing, rank_tactics],
)


# --------- Hooks ---------

_TOOL_LABELS = {
    "recall_memories": "Recalling memories from Hindsight",
    "synthesize_briefing": "Synthesizing tactics via gpt-4o",
    "rank_tactics": "Ranking tactics by confidence",
}


class PipelineHooks(RunHooks):
    """Captures tool lifecycle events as an ordered pipeline_trail."""

    def __init__(self) -> None:
        self.steps: List[PipelineStep] = []
        self._starts: dict[str, float] = {}

    async def on_tool_start(self, context, agent, tool) -> None:
        self._starts[tool.name] = time.perf_counter()

    async def on_tool_end(self, context, agent, tool, result) -> None:
        t0 = self._starts.pop(tool.name, time.perf_counter())
        ms = int((time.perf_counter() - t0) * 1000)
        self.steps.append(PipelineStep(
            step=tool.name,
            status="ok",
            ms=ms,
            label=_TOOL_LABELS.get(tool.name, tool.name),
        ))


# --------- Entry point ---------

async def run_briefing(bank_id: str, vendor_meta: dict) -> tuple[dict, List[PipelineStep]]:
    """Run the BriefingAgent pipeline. Returns (briefing_raw_dict, pipeline_trail).

    The agent's final_output is the fully-ranked briefing JSON.
    """
    hooks = PipelineHooks()
    user_input = (
        f"Build a negotiation briefing for vendor '{vendor_meta['name']}' "
        f"(bank_id='{bank_id}'). Contact: {vendor_meta['contact']}. "
        f"Contract ${vendor_meta['annual_value']:,}/yr, renewal {vendor_meta['renewal_date']}. "
        f"Follow your instructions exactly: recall -> synthesize -> rank. "
        f"Return the complete briefing JSON as your final answer."
    )
    result = await Runner.run(BRIEFING_AGENT, input=user_input, hooks=hooks)
    raw = json.loads(result.final_output)
    return raw, hooks.steps


def extract_briefing(raw: dict, vendor_meta: dict, bank_id: str, trail: List[PipelineStep]):
    """Assemble the full Briefing Pydantic model from the agent's raw output."""
    from briefing import _days_remaining  # local import to avoid circular
    from models import Briefing
    return Briefing(
        vendor=bank_id,
        contract={
            "value": vendor_meta["annual_value"],
            "renewal_date": vendor_meta["renewal_date"],
            "days_remaining": _days_remaining(vendor_meta["renewal_date"]),
            "contact": vendor_meta["contact"],
        },
        tactics=raw.get("tactics", []),
        playbook=raw["playbook"],
        temporal_signals=raw.get("temporal_signals", []),
        recent_signals=raw.get("recent_signals", []),
        pipeline_trail=[s.model_dump() for s in trail],
    )
```

> Tracing note: the Agents SDK ships with built-in tracing that uploads traces to OpenAI's dashboard. For a private hackathon demo you may want `RUN_TRACE_DISABLED=1` in env. Not required.

- [ ] **Step 2: Commit:**

```bash
git add backend/pipeline.py && git commit -m "feat(backend): Agents SDK BriefingAgent + PipelineHooks"
```

---

### Task B6: Briefing module (with TDD on confidence formula)

**Files:**

- Create: `backend/briefing.py`
- Create: `backend/tests/__init__.py` (empty)
- Create: `backend/tests/test_confidence.py`

- [ ] **Step 1: Write the failing test for the confidence formula:**

`backend/tests/test_confidence.py`:

```python
from briefing import confidence

def test_confidence_zero_uses_returns_zero():
    assert confidence(successes=0, total_uses=0, months_since_last_use=0) == 0.0

def test_confidence_two_of_two_recent():
    # 2/2 = 1.0, recency decay at 0 months = 1.0 → 1.0
    assert confidence(successes=2, total_uses=2, months_since_last_use=0) == 1.0

def test_confidence_decay_after_twelve_months():
    # 1.0 * max(0.3, 0.9^12) = 0.9^12 ≈ 0.2824
    result = confidence(successes=2, total_uses=2, months_since_last_use=12)
    assert 0.27 < result < 0.30

def test_confidence_floors_at_0_3_factor():
    # very old: decay floor is 0.3
    # 1.0 * 0.3 = 0.3
    assert confidence(successes=10, total_uses=10, months_since_last_use=100) == 0.3

def test_confidence_anti_pattern_low_success_rate():
    # 0/3 failed anti-pattern
    result = confidence(successes=0, total_uses=3, months_since_last_use=24)
    assert result == 0.0

def test_confidence_rounds_to_two_decimals():
    result = confidence(successes=2, total_uses=3, months_since_last_use=6)
    # 2/3 * 0.9^6 = 0.6667 * 0.5314 ≈ 0.3543 → 0.35
    assert result == round(result, 2)
```

- [ ] **Step 2: Run the test, confirm it fails:**

```bash
cd backend && pytest tests/test_confidence.py -v
```

Expected: FAIL — `ModuleNotFoundError: briefing`.

- [ ] **Step 3: Write minimal `backend/briefing.py` with just the confidence formula + `_days_remaining` helper + an async `build_briefing` that calls into `pipeline.run_briefing`:**

```python
"""Briefing adapter: confidence formula + thin wrapper calling the Agents-SDK pipeline.

Heavy orchestration lives in pipeline.py. This module exists so:
  - the confidence formula has a natural home and is importable by tests
  - main.py has a stable `build_briefing(bank_id, vendor_meta)` surface
  - ingest.py can reuse `build_briefing` twice without knowing about the SDK
"""
from datetime import datetime
from models import Briefing
from pipeline import run_briefing, extract_briefing


def confidence(successes: int, total_uses: int, months_since_last_use: float) -> float:
    """Core confidence formula. Tested in test_confidence.py.

    base = successes / total_uses
    recency = max(0.3, 0.9^months_since_last_use)
    result = round(base * recency, 2)
    """
    if total_uses == 0:
        return 0.0
    base = successes / total_uses
    recency_decay = max(0.3, 0.9 ** months_since_last_use)
    return round(base * recency_decay, 2)


def _days_remaining(renewal_date: str) -> int:
    target = datetime.strptime(renewal_date, "%Y-%m-%d")
    return max(0, (target - datetime.utcnow()).days)


async def build_briefing(bank_id: str, vendor_meta: dict) -> Briefing:
    """Run the Agents SDK pipeline and assemble the final Briefing."""
    raw, trail = await run_briefing(bank_id, vendor_meta)
    return extract_briefing(raw, vendor_meta, bank_id, trail)
```

- [ ] **Step 4: Run confidence tests, confirm pass:**

```bash
cd backend && pytest tests/test_confidence.py -v
```

Expected: all 6 tests PASS. (The formula doesn't touch the pipeline — these tests don't need OpenAI or Hindsight keys.)

- [ ] **Step 5: Integration smoke** — start uvicorn and curl a briefing to confirm the Agents SDK pipeline end-to-end. (Skip if Hindsight banks aren't seeded yet; revisit after B8.)

```bash
cd backend && uvicorn main:app --reload --port 8000 &
sleep 2
curl "https://set-daring-tadpole.ngrok-free.app/api/briefing?vendor=nexacloud" | python -m json.tool | head -60
```

Expected: JSON with ≥4 tactics, `pipeline_trail` containing `recall_memories`, `synthesize_briefing`, `rank_tactics` steps with non-zero ms.

- [ ] **Step 6: Commit:**

```bash
git add backend/briefing.py backend/tests/ && git commit -m "feat(backend): briefing adapter + confidence formula (tested)"
```

---

### Task B7: Nomemory module

**Files:**

- Create: `backend/nomemory.py`

- [ ] **Step 1: Write `backend/nomemory.py`:**

```python
"""OpenAI-only generic-advice endpoint handler."""
import json
import os
from openai import OpenAI
from prompts import NOMEMORY_PROMPT
from models import NoMemoryResponse

_openai = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")


def build_nomemory(vendor_name: str) -> NoMemoryResponse:
    resp = _openai.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": NOMEMORY_PROMPT},
            {"role": "user", "content": f"Vendor: {vendor_name}. Buyer role: procurement manager."},
        ],
        temperature=0.3,
    )
    parsed = json.loads(resp.choices[0].message.content)
    return NoMemoryResponse(vendor=vendor_name, tactics=parsed["tactics"])
```

- [ ] **Step 2: Commit:**

```bash
git add backend/nomemory.py && git commit -m "feat(backend): nomemory OpenAI endpoint handler"
```

---

### Task B8: Wire routes + vendors metadata + curl smoke test

**Files:**

- Modify: `backend/main.py`
- Create: `backend/vendors_meta.py` (thin wrapper around seeder/vendor_data for the backend)

- [ ] **Step 1: Create `backend/vendors_meta.py`** — vendor metadata without importing the full seeder (avoid circular module):

```python
"""Vendor metadata for backend routes. Kept in sync with seeder/vendor_data.py."""
VENDOR_META = {
    "nexacloud": {"name": "NexaCloud", "annual_value": 380000, "renewal_date": "2025-12-31", "contact": "Marcus Chen", "interaction_count": 23},
    "datapipe":  {"name": "DataPipe",  "annual_value": 120000, "renewal_date": "2026-03-15", "contact": "Ananya Rao",  "interaction_count": 4},
    "securenet": {"name": "SecureNet", "annual_value": 85000,  "renewal_date": "2026-07-01", "contact": "James Wu",    "interaction_count": 3},
}
```

- [ ] **Step 2: Extend `backend/main.py`** to add `/api/vendors`, `/api/briefing`, `/api/briefing/nomemory`:

```python
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os
from hindsight_client import HindsightClient

from models import VendorListResponse, Vendor, Briefing, NoMemoryResponse, IngestRequest, IngestResponse
from vendors_meta import VENDOR_META
from briefing import build_briefing, _days_remaining
from nomemory import build_nomemory
from ingest import run_ingest
from pipeline import set_hindsight_client

app = FastAPI(title="LEVERAGE")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

_hindsight = HindsightClient(
    api_key=os.environ.get("HINDSIGHT_API_KEY", ""),
    base_url=os.environ.get("HINDSIGHT_API_URL", "https://api.hindsight.vectorize.io"),
)
# Hand the client to the Agents SDK tool layer at startup.
set_hindsight_client(_hindsight)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/vendors", response_model=VendorListResponse)
def list_vendors():
    vendors = []
    for bank_id, meta in VENDOR_META.items():
        vendors.append(Vendor(
            bank_id=bank_id,
            name=meta["name"],
            annual_value=meta["annual_value"],
            renewal_date=meta["renewal_date"],
            days_remaining=_days_remaining(meta["renewal_date"]),
            contact=meta["contact"],
            interaction_count=meta["interaction_count"],
            tactic_count=4 if bank_id == "nexacloud" else 2,
        ))
    return VendorListResponse(vendors=vendors)


@app.get("/api/briefing", response_model=Briefing)
async def get_briefing(vendor: str = Query(...)):
    if vendor not in VENDOR_META:
        raise HTTPException(404, f"Unknown vendor {vendor}")
    return await build_briefing(vendor, VENDOR_META[vendor])


@app.post("/api/briefing/nomemory", response_model=NoMemoryResponse)
def get_nomemory(vendor: str = Query(...)):
    if vendor not in VENDOR_META:
        raise HTTPException(404, f"Unknown vendor {vendor}")
    return build_nomemory(VENDOR_META[vendor]["name"])


@app.post("/api/ingest", response_model=IngestResponse)
async def post_ingest(req: IngestRequest):
    if req.vendor not in VENDOR_META:
        raise HTTPException(404, f"Unknown vendor {req.vendor}")
    return await run_ingest(req, VENDOR_META[req.vendor], _hindsight)
```

> Note: this step references `ingest.run_ingest` which is created in Task B9 next. If running tasks strictly in order, temporarily stub: comment out the `/api/ingest` route and the `from ingest import run_ingest` line until B9 is done.

- [ ] **Step 3: Curl-test vendors endpoint:**

```bash
cd backend && uvicorn main:app --reload --port 8000 &
sleep 2
curl https://set-daring-tadpole.ngrok-free.app/api/vendors | python -m json.tool
```

Expected: 3 vendors with `days_remaining` computed.

- [ ] **Step 4: Curl-test briefing endpoint (requires Hindsight to have synthesized):**

```bash
curl "https://set-daring-tadpole.ngrok-free.app/api/briefing?vendor=nexacloud" | python -m json.tool
```

Expected: full Briefing JSON with ≥4 tactics, populated `pipeline_trail`, anti-pattern present.

- [ ] **Step 5: Curl-test nomemory endpoint:**

```bash
curl -X POST "https://set-daring-tadpole.ngrok-free.app/api/briefing/nomemory?vendor=nexacloud" | python -m json.tool
```

Expected: 3 generic tactics, no dates or dollar amounts.

- [ ] **Step 6: Commit:**

```bash
git add backend/ && git commit -m "feat(backend): wire /api/vendors, /api/briefing, /api/briefing/nomemory"
```

**Cut rule at hour 4.0: if `reflect()` returns invalid JSON, wrap in try/except, retry with JSON mode, fall through to `fixtures/demo.json` (DEMO_MODE).**

---

## Hour 4.0 to 5.0 — Ingest (B9)

### Task B9: Ingest module with TDD on diff computation

**Files:**

- Create: `backend/ingest.py`
- Create: `backend/tests/test_diffs.py`

- [ ] **Step 1: Write failing test for diff computation:**

`backend/tests/test_diffs.py`:

```python
from ingest import compute_diffs

def test_diffs_empty_when_nothing_changes():
    old = [{"name": "A", "confidence": 0.5}]
    new = [{"name": "A", "confidence": 0.5}]
    assert compute_diffs(old, new) == {}

def test_diffs_below_threshold_omitted():
    old = [{"name": "A", "confidence": 0.500}]
    new = [{"name": "A", "confidence": 0.505}]
    # delta 0.005 < 0.01 threshold
    assert compute_diffs(old, new) == {}

def test_diffs_up_direction():
    old = [{"name": "A", "confidence": 0.50}]
    new = [{"name": "A", "confidence": 0.68}]
    diffs = compute_diffs(old, new)
    assert "A" in diffs
    assert diffs["A"]["old"] == 0.50
    assert diffs["A"]["new"] == 0.68
    assert diffs["A"]["direction"] == "up"
    assert abs(diffs["A"]["delta"] - 0.18) < 0.001

def test_diffs_down_direction():
    old = [{"name": "AWS", "confidence": 0.87}]
    new = [{"name": "AWS", "confidence": 0.79}]
    diffs = compute_diffs(old, new)
    assert diffs["AWS"]["direction"] == "down"
    assert diffs["AWS"]["delta"] < 0

def test_diffs_new_tactic_treated_as_zero_baseline():
    old = []
    new = [{"name": "Multi-year", "confidence": 0.50}]
    diffs = compute_diffs(old, new)
    assert diffs["Multi-year"]["old"] == 0.0
    assert diffs["Multi-year"]["new"] == 0.50
    assert diffs["Multi-year"]["direction"] == "up"

def test_diffs_missing_new_tactic_omitted():
    # if a tactic disappears from new, we don't synthesize a diff for it
    old = [{"name": "Old thing", "confidence": 0.30}]
    new = []
    assert compute_diffs(old, new) == {}
```

- [ ] **Step 2: Run, confirm fail:**

```bash
cd backend && pytest tests/test_diffs.py -v
```

Expected: FAIL — `ModuleNotFoundError: ingest`.

- [ ] **Step 3: Write `backend/ingest.py`:**

```python
"""Post-call ingest flow: capture_old → retain → reflect → diff.

The capture_old and reflect steps each run the full Agents SDK BriefingAgent
(via briefing.build_briefing). Their internal tool-level trails are discarded;
the ingest response emits its own 4-step outer trail measured with
time.perf_counter() around each phase.
"""
import time
from typing import List, Dict
from briefing import build_briefing
from models import IngestRequest, IngestResponse, ScoreDiff, PipelineStep

DIFF_THRESHOLD = 0.01


def compute_diffs(old_tactics: List[dict], new_tactics: List[dict]) -> Dict[str, dict]:
    """Return {tactic_name: {old, new, delta, direction}} for tactics whose
    confidence changed by >= DIFF_THRESHOLD. New tactics baseline at 0.0."""
    old_map = {t["name"]: t["confidence"] for t in old_tactics}
    diffs: Dict[str, dict] = {}
    for t in new_tactics:
        name = t["name"]
        new_c = t["confidence"]
        old_c = old_map.get(name, 0.0)
        delta = new_c - old_c
        if abs(delta) < DIFF_THRESHOLD:
            continue
        diffs[name] = {
            "old": round(old_c, 2),
            "new": round(new_c, 2),
            "delta": round(delta, 2),
            "direction": "up" if delta > 0 else "down",
        }
    return diffs


async def run_ingest(req: IngestRequest, vendor_meta: dict, hindsight_client) -> IngestResponse:
    """Four-step §5.4 flow with outer step timings."""
    trail: List[PipelineStep] = []

    def _timed_step(name: str, label: str, ms: int, status: str = "ok") -> None:
        trail.append(PipelineStep(step=name, status=status, ms=ms, label=label))

    # 1. capture_old_scores
    t0 = time.perf_counter()
    old_briefing = await build_briefing(req.vendor, vendor_meta)
    old_tactics = [t.model_dump() for t in old_briefing.tactics]
    _timed_step("capture_old_scores", "Snapshotting current confidences", int((time.perf_counter() - t0) * 1000))

    # 2. retain
    t0 = time.perf_counter()
    hindsight_client.retain(
        bank_id=req.vendor,
        experience=req.notes,
        metadata={"outcome": req.outcome, "timestamp": req.timestamp, "type": "call"},
    )
    _timed_step("retain", "Storing new interaction in Hindsight", int((time.perf_counter() - t0) * 1000))

    # 3. reflect (re-run briefing)
    t0 = time.perf_counter()
    new_briefing = await build_briefing(req.vendor, vendor_meta)
    new_tactics = [t.model_dump() for t in new_briefing.tactics]
    _timed_step("reflect", "Re-synthesizing tactics via BriefingAgent", int((time.perf_counter() - t0) * 1000))

    # 4. diff
    t0 = time.perf_counter()
    diffs_raw = compute_diffs(old_tactics, new_tactics)
    score_diffs = {k: ScoreDiff(**v) for k, v in diffs_raw.items()}
    _timed_step("diff", "Computing score diffs", int((time.perf_counter() - t0) * 1000))

    # Replace the briefing's pipeline_trail with the ingest outer trail.
    new_briefing.pipeline_trail = trail

    return IngestResponse(briefing=new_briefing, score_diffs=score_diffs, pipeline_trail=trail)
```

- [ ] **Step 4: Run tests, confirm pass:**

```bash
cd backend && pytest tests/ -v
```

Expected: all tests PASS (6 confidence + 6 diff = 12).

- [ ] **Step 5: Uncomment the `/api/ingest` route in `main.py`** if it was stubbed in B8. Curl-test the full ingest:

```bash
curl -X POST https://set-daring-tadpole.ngrok-free.app/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "nexacloud",
    "notes": "Marcus pushed back harder than expected when I mentioned AWS. Offered a 3-year commitment unprompted — 8% discount plus roadmap access.",
    "outcome": "Successful concession",
    "timestamp": "2025-12-13T16:45:00Z"
  }' | python -m json.tool
```

Expected: `score_diffs` with at least 2 entries, `pipeline_trail` with 4 steps.

- [ ] **Step 6: Commit:**

```bash
git add backend/ingest.py backend/tests/test_diffs.py && git commit -m "feat(backend): ingest flow + diff computation (tested)"
```

**Cut rule at hour 5.0: if ingest is flaky, stub `/api/ingest` with canned `fixtures/demo.json` diffs via `DEMO_MODE=true`.**

---

## Hour 5.0 to 6.0 — Frontend wiring (F1, F2, F3)

### Task F1: Shared types + API client

**Files:**

- Create: `frontend/src/lib/types.ts`
- Create: `frontend/src/lib/api.ts`

- [ ] **Step 1: Write `frontend/src/lib/types.ts`** — mirror `backend/models.py`:

```typescript
export type HistoryPoint = { date: string; confidence: number };

export type Tactic = {
  name: string;
  confidence: number;
  evidence: string;
  timing: string;
  successes: number;
  total_uses: number;
  last_used_date: string | null;
  is_anti_pattern: boolean;
  history: HistoryPoint[] | null;
};

export type PlaybookBranch = {
  condition: string;
  move: string;
  rationale: string;
  tactic_ref: string;
  followup: PlaybookBranch[] | null;
};

export type Playbook = {
  opening: { move: string; rationale: string; tactic_ref: string };
  branches: PlaybookBranch[];
};

export type PipelineStep = {
  step: string;
  status: "ok" | "error" | "skipped";
  ms: number;
  label: string | null;
};

export type Briefing = {
  vendor: string;
  contract: {
    value: number;
    renewal_date: string;
    days_remaining: number;
    contact: string;
  };
  tactics: Tactic[];
  playbook: Playbook;
  temporal_signals: { label: string; severity: "low" | "medium" | "high" }[];
  recent_signals: {
    date: string;
    source: string;
    summary: string;
    interpretation: string;
  }[];
  pipeline_trail: PipelineStep[];
};

export type Vendor = {
  bank_id: string;
  name: string;
  annual_value: number;
  renewal_date: string;
  days_remaining: number;
  contact: string;
  interaction_count: number;
  tactic_count: number;
};

export type ScoreDiff = {
  old: number;
  new: number;
  delta: number;
  direction: "up" | "down";
};

export type IngestResponse = {
  briefing: Briefing;
  score_diffs: Record<string, ScoreDiff>;
  pipeline_trail: PipelineStep[];
};

export type NoMemoryResponse = {
  vendor: string;
  tactics: { name: string; advice: string }[];
};

export type IngestRequest = {
  vendor: string;
  notes: string;
  outcome:
    | "Successful concession"
    | "No movement"
    | "Escalated"
    | "Rescheduled";
  timestamp: string;
};
```

- [ ] **Step 2: Write `frontend/src/lib/api.ts`:**

```typescript
import type {
  Briefing,
  Vendor,
  NoMemoryResponse,
  IngestRequest,
  IngestResponse,
} from "./types";

const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://set-daring-tadpole.ngrok-free.app";

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return (await res.json()) as T;
}

export const api = {
  vendors: () => j<{ vendors: Vendor[] }>(`${BASE}/api/vendors`),
  briefing: (vendor: string) =>
    j<Briefing>(`${BASE}/api/briefing?vendor=${vendor}`),
  nomemory: (vendor: string) =>
    j<NoMemoryResponse>(`${BASE}/api/briefing/nomemory?vendor=${vendor}`, {
      method: "POST",
    }),
  ingest: (req: IngestRequest) =>
    j<IngestResponse>(`${BASE}/api/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    }),
};
```

- [ ] **Step 3: Commit:**

```bash
git add frontend/src/lib && git commit -m "feat(frontend): typed API client + shared types"
```

---

### Task F2: Dashboard page

**Files:**

- Create: `frontend/src/components/VendorCard.tsx`
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Write `frontend/src/components/VendorCard.tsx`:**

```tsx
import Link from "next/link";
import type { Vendor } from "@/lib/types";

export function VendorCard({ v }: { v: Vendor }) {
  const urgent = v.days_remaining < 30;
  return (
    <Link
      href={`/briefing/${v.bank_id}`}
      className="block rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-xl font-semibold">{v.name}</h3>
        <span className="text-sm text-neutral-500">{v.contact}</span>
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight">
        ${v.annual_value.toLocaleString()}
        <span className="text-base font-medium text-neutral-500">/yr</span>
      </div>
      <div className="mt-4 flex gap-4 text-sm text-neutral-600">
        <span>{v.interaction_count} interactions</span>
        <span>{v.tactic_count} tactics tracked</span>
      </div>
      {urgent ? (
        <div className="mt-4 inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700 ring-1 ring-red-600/20">
          {v.days_remaining} days · fiscal Q3 pressure
        </div>
      ) : (
        <div className="mt-4 text-sm text-neutral-500">
          Renewal {v.renewal_date} · {v.days_remaining} days
        </div>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Replace `frontend/src/app/page.tsx`:**

```tsx
import { api } from "@/lib/api";
import { VendorCard } from "@/components/VendorCard";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { vendors } = await api.vendors();
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">LEVERAGE</h1>
        <p className="mt-2 text-neutral-600">
          Negotiation memory for procurement.
        </p>
      </header>
      {vendors.length === 0 ? (
        <div className="rounded-xl bg-amber-50 p-6 text-amber-900">
          No vendors. Seed the Hindsight banks before demo — see README §7.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {vendors.map((v) => (
            <VendorCard key={v.bank_id} v={v} />
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Start dev server and smoke-test:**

```bash
cd frontend && npm run dev
# Browser: http://localhost:3000
```

Expected: 3 cards render, NexaCloud shows red urgent badge (assuming renewal 2025-12-31 is within 30 days of test date — else override via manual check).

- [ ] **Step 4: Commit:**

```bash
git add frontend/src/app/page.tsx frontend/src/components/VendorCard.tsx && git commit -m "feat(frontend): dashboard with vendor cards"
```

**Cut rule at hour 6.0: if still unstyled, ship as is. Function > polish.**

---

## Hour 6.0 to 8.0 — Briefing hero (F3–F8)

### Task F3: Briefing page shell (server + client split)

**Files:**

- Create: `frontend/src/app/briefing/[vendor]/page.tsx`
- Create: `frontend/src/app/briefing/[vendor]/BriefingClient.tsx`

- [ ] **Step 1: Write the server page** — thin shell that fetches initial briefing and hands to client:

`frontend/src/app/briefing/[vendor]/page.tsx`:

```tsx
import { api } from "@/lib/api";
import { BriefingClient } from "./BriefingClient";

export const dynamic = "force-dynamic";

export default async function BriefingPage({
  params,
}: {
  params: { vendor: string };
}) {
  const initial = await api.briefing(params.vendor);
  return <BriefingClient vendor={params.vendor} initial={initial} />;
}
```

- [ ] **Step 2: Write the client shell** with toggle state + fetch logic. Component imports will be added in F4–F8:

`frontend/src/app/briefing/[vendor]/BriefingClient.tsx`:

```tsx
"use client";
import { useState, useCallback } from "react";
import type { Briefing, NoMemoryResponse, ScoreDiff } from "@/lib/types";
import { api } from "@/lib/api";
import { MemoryToggle } from "@/components/MemoryToggle";
import { PipelineStatus } from "@/components/PipelineStatus";
import { TacticCard } from "@/components/TacticCard";
import { Playbook } from "@/components/Playbook";
import { AntiPatternSparkline } from "@/components/AntiPatternSparkline";
import { SignalFeed } from "@/components/SignalFeed";
import { PostCallForm } from "@/components/PostCallForm";
import { ScoreDiff as ScoreDiffPanel } from "@/components/ScoreDiff";

export function BriefingClient({
  vendor,
  initial,
}: {
  vendor: string;
  initial: Briefing;
}) {
  const [memoryOn, setMemoryOn] = useState(true);
  const [briefing, setBriefing] = useState<Briefing>(initial);
  const [nomem, setNomem] = useState<NoMemoryResponse | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [diffs, setDiffs] = useState<Record<string, ScoreDiff> | null>(null);
  const [flashTactics, setFlashTactics] = useState<Set<string>>(new Set());

  const toggleMemory = useCallback(
    async (next: boolean) => {
      setMemoryOn(next);
      if (next) {
        const b = await api.briefing(vendor);
        setBriefing(b);
        setNomem(null);
      } else {
        const n = await api.nomemory(vendor);
        setNomem(n);
      }
    },
    [vendor],
  );

  const onSubmitLog = useCallback(
    async (notes: string, outcome: string) => {
      const res = await api.ingest({
        vendor,
        notes,
        outcome: outcome as any,
        timestamp: new Date().toISOString(),
      });
      setBriefing(res.briefing);
      setDiffs(res.score_diffs);
      setFlashTactics(new Set(Object.keys(res.score_diffs)));
      setShowForm(false);
      setTimeout(() => setFlashTactics(new Set()), 1200);
    },
    [vendor],
  );

  const antiPattern = briefing.tactics.find((t) => t.is_anti_pattern);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Temporal banner */}
      <header className="mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-bold">{vendor.toUpperCase()}</h1>
          <p className="text-neutral-600">
            Contact {briefing.contract.contact} · $
            {briefing.contract.value.toLocaleString()}/yr · Renewal{" "}
            {briefing.contract.renewal_date} ·{" "}
            <span className="text-red-700 font-medium">
              {briefing.contract.days_remaining} days
            </span>
          </p>
        </div>
        <MemoryToggle value={memoryOn} onChange={toggleMemory} />
      </header>

      <PipelineStatus trail={briefing.pipeline_trail} />

      {memoryOn ? (
        <div className="space-y-8">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {briefing.tactics
              .filter((t) => !t.is_anti_pattern)
              .map((t) => (
                <TacticCard
                  key={t.name}
                  tactic={t}
                  flash={
                    flashTactics.has(t.name)
                      ? (diffs?.[t.name]?.direction ?? null)
                      : null
                  }
                />
              ))}
          </section>
          <Playbook playbook={briefing.playbook} flashRefs={flashTactics} />
          {antiPattern && <AntiPatternSparkline tactic={antiPattern} />}
          <SignalFeed signals={briefing.recent_signals.slice(0, 2)} />
          <div>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-black px-5 py-3 text-white hover:bg-neutral-800"
            >
              Log post-call notes
            </button>
          </div>
        </div>
      ) : nomem ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-500">
            Generic advice (no memory)
          </h2>
          {nomem.tactics.map((t) => (
            <div
              key={t.name}
              className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4"
            >
              <div className="font-medium">{t.name}</div>
              <div className="text-sm text-neutral-600">{t.advice}</div>
            </div>
          ))}
          <div className="text-sm italic text-neutral-500">
            — no playbook without memory —
          </div>
        </section>
      ) : (
        <div>Loading…</div>
      )}

      {showForm && (
        <PostCallForm
          onClose={() => setShowForm(false)}
          onSubmit={onSubmitLog}
        />
      )}

      {diffs && Object.keys(diffs).length > 0 && (
        <ScoreDiffPanel diffs={diffs} onDismiss={() => setDiffs(null)} />
      )}
    </main>
  );
}
```

> Downstream tasks F4–F8 create the components referenced here. Temporarily stub any missing component (`const MemoryToggle = () => <div />`) if you want to run the page before finishing all components.

- [ ] **Step 3: Commit:**

```bash
git add frontend/src/app/briefing && git commit -m "feat(frontend): briefing page shell (server+client split)"
```

---

### Task F4: MemoryToggle (hero component)

**Files:**

- Create: `frontend/src/components/MemoryToggle.tsx`

- [ ] **Step 1: Write the component:**

```tsx
"use client";

export function MemoryToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <span
        className={`text-sm font-semibold ${value ? "text-emerald-700" : "text-neutral-500"}`}
      >
        Memory {value ? "ON" : "OFF"}
      </span>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-8 w-14 rounded-full transition-colors ${value ? "bg-emerald-500" : "bg-neutral-300"}`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${value ? "left-7" : "left-1"}`}
        />
      </button>
    </label>
  );
}
```

- [ ] **Step 2: Commit:**

```bash
git add frontend/src/components/MemoryToggle.tsx && git commit -m "feat(frontend): MemoryToggle hero component"
```

---

### Task F5: PipelineStatus trail

**Files:**

- Create: `frontend/src/components/PipelineStatus.tsx`

- [ ] **Step 1: Write the component:**

```tsx
"use client";
import type { PipelineStep } from "@/lib/types";

export function PipelineStatus({ trail }: { trail: PipelineStep[] }) {
  if (!trail?.length) return null;
  return (
    <div className="mb-8 rounded-lg border border-neutral-200 bg-neutral-900 p-4 font-mono text-sm text-neutral-100">
      <div className="mb-2 text-xs uppercase tracking-widest text-neutral-400">
        Agents SDK Pipeline
      </div>
      {trail.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <span
            className={
              s.status === "ok"
                ? "text-emerald-400"
                : s.status === "error"
                  ? "text-red-400"
                  : "text-neutral-500"
            }
          >
            {s.status === "ok" ? "✓" : s.status === "error" ? "✗" : "·"}
          </span>
          <span className="text-neutral-200">{s.step}</span>
          {s.label && <span className="text-neutral-400">— {s.label}</span>}
          <span className="ml-auto tabular-nums text-neutral-400">
            {s.ms} ms
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit:**

```bash
git add frontend/src/components/PipelineStatus.tsx && git commit -m "feat(frontend): PipelineStatus orchestration trail"
```

---

### Task F6: TacticCard + Playbook + AntiPatternSparkline + SignalFeed

**Files:**

- Create: `frontend/src/components/TacticCard.tsx`
- Create: `frontend/src/components/Playbook.tsx`
- Create: `frontend/src/components/AntiPatternSparkline.tsx`
- Create: `frontend/src/components/SignalFeed.tsx`

- [ ] **Step 1: `frontend/src/components/TacticCard.tsx`:**

```tsx
"use client";
import type { Tactic } from "@/lib/types";

function dotColor(c: number, anti: boolean) {
  if (anti) return "bg-red-500";
  if (c >= 0.7) return "bg-emerald-500";
  if (c >= 0.4) return "bg-amber-500";
  return "bg-neutral-400";
}

export function TacticCard({
  tactic: t,
  flash,
}: {
  tactic: Tactic;
  flash: "up" | "down" | null;
}) {
  const filled = Math.round(t.confidence * 5);
  const flashBg =
    flash === "up"
      ? "ring-2 ring-emerald-400 bg-emerald-50"
      : flash === "down"
        ? "ring-2 ring-red-400 bg-red-50"
        : "";
  return (
    <div
      className={`rounded-xl border p-5 transition-all duration-500 ${t.is_anti_pattern ? "border-red-500 bg-red-50" : "border-neutral-200 bg-white"} ${flashBg}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t.name}</h3>
        {t.is_anti_pattern && (
          <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            AVOID
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${i < filled ? dotColor(t.confidence, t.is_anti_pattern) : "bg-neutral-200"}`}
          />
        ))}
        <span className="ml-2 text-sm tabular-nums text-neutral-600">
          {t.confidence.toFixed(2)}
        </span>
        <span className="ml-3 text-xs text-neutral-500">
          {t.successes} for {t.total_uses}
        </span>
      </div>
      <p className="mt-3 text-sm text-neutral-700">{t.evidence}</p>
      <p className="mt-2 text-xs italic text-neutral-500">{t.timing}</p>
    </div>
  );
}
```

- [ ] **Step 2: `frontend/src/components/Playbook.tsx`:**

```tsx
"use client";
import type { Playbook as PB, PlaybookBranch } from "@/lib/types";

function Branch({
  b,
  flashRefs,
  depth = 0,
}: {
  b: PlaybookBranch;
  flashRefs: Set<string>;
  depth?: number;
}) {
  const flash = flashRefs.has(b.tactic_ref);
  // Inline style for depth indent — Tailwind JIT can't parse `ml-${n}` template strings.
  return (
    <div
      style={{ marginLeft: `${depth * 16}px` }}
      className={`border-l-2 pl-4 py-2 transition-colors duration-700 ${flash ? "border-emerald-500 bg-emerald-50" : "border-neutral-200"}`}
    >
      <div className="text-xs uppercase tracking-wide text-neutral-500">
        {b.condition}
      </div>
      <div className="mt-1 font-medium">{b.move}</div>
      <div className="text-sm text-neutral-600">{b.rationale}</div>
      {b.followup?.map((f, i) => (
        <Branch key={i} b={f} flashRefs={flashRefs} depth={depth + 1} />
      ))}
    </div>
  );
}

export function Playbook({
  playbook,
  flashRefs,
}: {
  playbook: PB;
  flashRefs: Set<string>;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6">
      <h3 className="mb-4 font-semibold">Playbook</h3>
      <div
        className={`rounded-lg p-3 transition-colors duration-700 ${flashRefs.has(playbook.opening.tactic_ref) ? "bg-emerald-50" : "bg-neutral-50"}`}
      >
        <div className="text-xs uppercase tracking-wide text-neutral-500">
          Opening
        </div>
        <div className="font-medium">{playbook.opening.move}</div>
        <div className="text-sm text-neutral-600">
          {playbook.opening.rationale}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {playbook.branches.map((b, i) => (
          <Branch key={i} b={b} flashRefs={flashRefs} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: `frontend/src/components/AntiPatternSparkline.tsx`:**

```tsx
"use client";
import type { Tactic } from "@/lib/types";

export function AntiPatternSparkline({ tactic }: { tactic: Tactic }) {
  const pts = tactic.history ?? [];
  if (pts.length < 2) return null;
  const w = 320,
    h = 60;
  const max = Math.max(...pts.map((p) => p.confidence));
  const min = Math.min(...pts.map((p) => p.confidence));
  const range = Math.max(0.01, max - min);
  const path = pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - ((p.confidence - min) / range) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <section className="rounded-xl border-2 border-red-500 bg-red-50 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
              AVOID
            </span>
            <h3 className="font-semibold">{tactic.name}</h3>
          </div>
          <p className="mt-1 text-sm text-neutral-700">{tactic.evidence}</p>
        </div>
        <svg width={w} height={h} className="text-red-600">
          <path d={path} fill="none" stroke="currentColor" strokeWidth={2} />
          {pts.map((p, i) => {
            const x = (i / (pts.length - 1)) * w;
            const y = h - ((p.confidence - min) / range) * h;
            return <circle key={i} cx={x} cy={y} r={3} fill="currentColor" />;
          })}
        </svg>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: `frontend/src/components/SignalFeed.tsx`:**

```tsx
"use client";
import type { Briefing } from "@/lib/types";

export function SignalFeed({
  signals,
}: {
  signals: Briefing["recent_signals"];
}) {
  if (!signals.length) return null;
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6">
      <h3 className="mb-3 font-semibold">Recent signals</h3>
      <ul className="space-y-3">
        {signals.map((s, i) => (
          <li key={i} className="border-l-2 border-neutral-200 pl-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              {s.date} · {s.source}
            </div>
            <div className="font-medium">{s.summary}</div>
            <div className="text-sm italic text-neutral-600">
              {s.interpretation}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Browser smoke-test** — `http://localhost:3000/briefing/nexacloud`. Confirm tactics, playbook, sparkline, signals all render.

- [ ] **Step 6: Commit:**

```bash
git add frontend/src/components && git commit -m "feat(frontend): TacticCard + Playbook + AntiPatternSparkline + SignalFeed"
```

---

### Task F7: Toggle wiring smoke

**Files:** none (tests existing integration).

- [ ] **Step 1: Browser test OFF → ON** — flip MemoryToggle. Verify:
  - OFF shows 3 generic bullets + "no playbook" placeholder
  - ON shows full briefing with PipelineStatus trail populated

- [ ] **Step 2: If broken, inspect network tab** — confirm `/api/briefing` and `/api/briefing/nomemory` both 200. Fix CORS if needed.

**Cut rule at hour 7.5: if the toggle is flaky, drop it and ship diff-as-hero instead. Keep PipelineStatus either way.**

---

## Hour 8.0 to 8.5 — Post-call form + score diff (F8)

### Task F8: PostCallForm + ScoreDiff panel

**Files:**

- Create: `frontend/src/components/PostCallForm.tsx`
- Create: `frontend/src/components/ScoreDiff.tsx`

- [ ] **Step 1: `frontend/src/components/PostCallForm.tsx`:**

```tsx
"use client";
import { useState } from "react";

const OUTCOMES = [
  "Successful concession",
  "No movement",
  "Escalated",
  "Rescheduled",
] as const;

export function PostCallForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (notes: string, outcome: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number]>(
    "Successful concession",
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notes.length < 20) return;
    setLoading(true);
    try {
      await onSubmit(notes, outcome);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
      >
        <h3 className="mb-4 text-xl font-semibold">Log post-call notes</h3>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium">Outcome</span>
          <select
            value={outcome}
            onChange={(e) =>
              setOutcome(e.target.value as (typeof OUTCOMES)[number])
            }
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          >
            {OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder="What happened on the call? Who said what?"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
          <span className="text-xs text-neutral-500">
            {notes.length}/20 min chars
          </span>
        </label>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={notes.length < 20 || loading}
            className="rounded-lg bg-black px-5 py-2 text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: `frontend/src/components/ScoreDiff.tsx`:**

```tsx
"use client";
import { useEffect } from "react";
import type { ScoreDiff } from "@/lib/types";

export function ScoreDiff({
  diffs,
  onDismiss,
}: {
  diffs: Record<string, ScoreDiff>;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 rounded-xl border border-neutral-200 bg-white p-5 shadow-xl">
      <h3 className="mb-3 text-sm font-semibold">Score updates</h3>
      <ul className="space-y-2">
        {Object.entries(diffs).map(([name, d]) => (
          <li key={name} className="flex items-center justify-between text-sm">
            <span className="font-medium">{name}</span>
            <span
              className={`tabular-nums ${d.direction === "up" ? "text-emerald-600" : "text-red-600"}`}
            >
              {d.old.toFixed(2)} → {d.new.toFixed(2)}{" "}
              {d.direction === "up" ? "▲" : "▼"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Browser smoke-test** — flip toggle ON, click "Log post-call notes", paste the canonical Priya note:

> "Marcus pushed back harder than expected when I mentioned AWS. Offered a 3-year commitment unprompted — 8% discount plus roadmap access."

Submit. Expected: modal closes, ScoreDiff panel appears bottom-right for 4s, the "Mention AWS" TacticCard flashes red, the "Multi-year commitment" TacticCard flashes green, playbook cross-fades.

- [ ] **Step 4: Commit:**

```bash
git add frontend/src/components/PostCallForm.tsx frontend/src/components/ScoreDiff.tsx && git commit -m "feat(frontend): PostCallForm + ScoreDiff panel"
```

**Cut rule at hour 8.5: if diffs don't render, show plain "Saved ✓" confirmation instead.**

---

## Hour 8.5 to 9.0 — Deploy + backup video (F9, D1)

### Task D1: Production deploy + backup video

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Push and verify Vercel auto-deploy:**

```bash
git push
```

Watch Vercel dashboard. Open deployed URL, run the full Priya flow end-to-end against production.

- [ ] **Step 2: Verify Railway is hot:**

```bash
curl https://<railway-domain>/health
curl "https://<railway-domain>/api/briefing?vendor=nexacloud" | python -m json.tool
```

Expected: both 200.

- [ ] **Step 3: Record backup demo video** — use OBS or Loom. Follow `spec.md §9` (the 6-beat script) on the **live deployment**. Target 4:30–5:00 minutes. Include:
  - Dashboard → NexaCloud card with red badge
  - Briefing with MemoryToggle OFF → ON, PipelineStatus trail visible
  - PostCallForm submit with the canonical note, ScoreDiff + flashes
  - Priya dollar-number frame

- [ ] **Step 4: Upload video to GitHub Releases** — create a release `v1.0.0-hackathon`, upload video as asset. Get the direct URL.

- [ ] **Step 5: Write `README.md`:**

````markdown
# LEVERAGE

Vendor Negotiation Intelligence Agent.
Memory is the product — powered by Hindsight Cloud, orchestrated by the OpenAI Agents SDK.

## Demo

- Live: https://<vercel-url>
- Backup video: https://github.com/<you>/leverage/releases/tag/v1.0.0-hackathon

## The Priya Story

Priya runs procurement at a 400-person SaaS. She renews 47 vendors a year. Every call, she walked in blind — until LEVERAGE. One $380k NexaCloud call, $23,400 saved, $1.1M/year across her portfolio. Procurement is the wedge; sales, legal, M&A, hiring are next.

## Stack

- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind v3.4 on Vercel
- Backend: FastAPI + Python 3.11 on Railway
- Memory: Hindsight Cloud
- Orchestration: OpenAI Agents SDK (`openai-agents`) — `BriefingAgent` with `recall_memories`, `synthesize_briefing`, `rank_tactics` tools
- LLM: OpenAI gpt-4o

## Run locally

```bash
# Backend
cd backend && python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env  # fill in keys
uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm install
echo "NEXT_PUBLIC_API_URL=https://set-daring-tadpole.ngrok-free.app" > .env.local
npm run dev
```
````

## Seed Hindsight banks

Run at least 6 hours before demo.

```bash
cd seeder && python seed_vendors.py
```

## Demo script

See `spec.md §9` for the 6-beat, 5-minute demo script.

````

- [ ] **Step 6: Commit:**

```bash
git add README.md && git commit -m "docs: README with Priya story, stack, and run instructions"
git push
````

---

## Hour 9.0 to 10.0 — Rehearsal + submission (R1)

### Task R1: Smoke-test, rehearse, submit

**Files:** none.

- [ ] **Step 1: Smoke-test live 3×** — Dashboard → briefing → toggle OFF → toggle ON → post-call log → diffs. Full loop, three times. Any failure → fix immediately or swap to DEMO_MODE env var on Railway (`DEMO_MODE=true`).

- [ ] **Step 2: Rehearse demo 2×** — follow `spec.md §9` word-for-word. Time yourself. Target 4:30–4:45 to leave buffer.

- [ ] **Step 3: Submit** — fill out the hackathon submission form with:
  - Live URL
  - Backup video URL from GitHub Releases
  - GitHub repo URL
  - `spec.md` + this plan as supporting docs

Target submission time: **hour 9:50**, leaving 10 min buffer.

**Cut rule at hour 9:45: if anything is broken live, submit the backup video and don't debug.**

---

## Acceptance verification (run before submitting)

Execute every check in `spec.md §10`:

- [ ] `/api/vendors` returns exactly 3 vendors
- [ ] `GET /api/briefing?vendor=nexacloud` returns ≥4 tactics + 1 anti-pattern + non-empty `pipeline_trail`
- [ ] `POST /api/briefing/nomemory` returns exactly 3 generic tactics (no dates, no dollars)
- [ ] `POST /api/ingest` returns `score_diffs` with ≥2 entries after the canonical Priya note
- [ ] MemoryToggle flips cleanly with 300ms cross-fade
- [ ] PipelineStatus trail renders on briefing load (3 steps) AND ingest (4 steps)
- [ ] AntiPatternSparkline renders descending red line with AVOID tag
- [ ] ScoreDiff shows old → new with up/down arrow + CSS transition
- [ ] Vercel + Railway deploys both green
- [ ] Backup video uploaded to GitHub Release
- [ ] §9 demo script runs live in under 5 minutes

---

## Post-submission (outside 10-hr budget, ~60 min)

- [ ] **Write a 400–600 word article** about the build. Focus: the MemoryToggle hero moment, the Agents SDK `PipelineStatus` trail, the $23,400 number. Publish on Dev.to or personal blog.
- [ ] **LinkedIn post** — screenshot + 1-paragraph narrative + link to live demo.
