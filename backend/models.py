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
    contact_email: str = ""
    industry: str = ""
    risk_level: str = "medium"
    interaction_count: int
    tactic_count: int


class VendorCreateRequest(BaseModel):
    name: str
    annual_value: int
    renewal_date: str
    contact: str
    contact_email: str = ""
    notes: str = ""
    industry: str = ""
    risk_level: str = "medium"


class VendorUpdateRequest(BaseModel):
    name: Optional[str] = None
    annual_value: Optional[int] = None
    renewal_date: Optional[str] = None
    contact: Optional[str] = None
    contact_email: Optional[str] = None
    notes: Optional[str] = None
    industry: Optional[str] = None
    risk_level: Optional[str] = None

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


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=8)
    full_name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user_id: str
    email: str


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None


# ---------------------------------------------------------------------------
# Calls
# ---------------------------------------------------------------------------

class CoachingEvent(BaseModel):
    turn: int
    suggestions: List[str]
    warnings: List[str]
    correction: Optional[str] = None
    current_tactic: Optional[str] = None


class KeyMoment(BaseModel):
    turn_index: int
    moment: str
    type: Literal["good", "missed", "correction"]


class SaveCallRequest(BaseModel):
    vendor: str
    started_at: str
    ended_at: str
    duration_secs: int
    transcript: List[str]
    coaching_shown: List[dict]
    outcome: Optional[Literal["won", "lost", "pending", "escalated"]] = None
    briefing_context: str = ""
    concessions_made: int = 0


class CallRecord(BaseModel):
    id: str
    vendor: str
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    duration_secs: Optional[int] = None
    transcript: Optional[List[str]] = None
    coaching_shown: Optional[List[dict]] = None
    outcome: Optional[str] = None
    narrative: Optional[str] = None
    adherence_score: Optional[float] = None
    tactics_used: Optional[List[str]] = None
    key_moments: Optional[List[dict]] = None
    deal_score: Optional[int] = None
    win_probability: Optional[float] = None
    concessions_made: Optional[int] = None
    savings_achieved: Optional[int] = None
    created_at: Optional[str] = None


# ---------------------------------------------------------------------------
# Gmail
# ---------------------------------------------------------------------------

class GmailEmail(BaseModel):
    id: str
    subject: str
    from_: str = Field(alias="from")
    date: str
    snippet: str

    class Config:
        populate_by_name = True
