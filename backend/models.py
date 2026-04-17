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
