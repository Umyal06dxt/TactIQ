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
  contract: { value: number; renewal_date: string; days_remaining: number; contact: string };
  tactics: Tactic[];
  playbook: Playbook;
  temporal_signals: { label: string; severity: "low" | "medium" | "high" }[];
  recent_signals: { date: string; source: string; summary: string; interpretation: string }[];
  pipeline_trail: PipelineStep[];
};

export type Vendor = {
  bank_id: string;
  name: string;
  annual_value: number;
  renewal_date: string;
  days_remaining: number;
  contact: string;
  contact_email: string;
  industry: string;
  risk_level: "low" | "medium" | "high";
  interaction_count: number;
  tactic_count: number;
};

export type VendorCreateRequest = {
  name: string;
  annual_value: number;
  renewal_date: string;
  contact: string;
  contact_email?: string;
  notes?: string;
  industry?: string;
  risk_level?: "low" | "medium" | "high";
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
  outcome: "Successful concession" | "No movement" | "Escalated" | "Rescheduled";
  timestamp: string;
};

export type CoachingEvent = {
  turn: number;
  suggestions: string[];
  warnings: string[];
  correction: string | null;
  current_tactic: string | null;
  win_probability?: number;
  concession_alert?: string | null;
  deal_momentum?: "positive" | "neutral" | "negative";
  coach_note?: string | null;
};

export type KeyMoment = {
  turn_index: number;
  moment: string;
  type: "good" | "missed" | "correction" | "anchor" | "concession";
};

export type CallRecord = {
  id: string;
  vendor: string;
  started_at: string | null;
  ended_at: string | null;
  duration_secs: number | null;
  transcript: string[] | null;
  coaching_shown: CoachingEvent[] | null;
  outcome: "won" | "lost" | "pending" | "escalated" | null;
  narrative: string | null;
  adherence_score: number | null;
  tactics_used: string[] | null;
  key_moments: KeyMoment[] | null;
  deal_score: number | null;
  win_probability: number | null;
  concessions_made: number | null;
  savings_achieved: number | null;
  created_at: string | null;
};

export type EmailThread = {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
};

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export type TacticStat = { name: string; uses: number };
export type WeeklyPoint = { week: string; calls: number; wins: number };
export type AdherencePoint = { date: string; score: number | null; outcome: string | null };

export type VendorAnalytics = {
  vendor: string;
  total_calls: number;
  win_rate: number | null;
  recent_win_rate: number | null;
  avg_adherence: number | null;
  avg_duration_secs: number | null;
  total_savings: number;
  avg_deal_score: number | null;
  top_tactics: TacticStat[];
  weekly_trend: WeeklyPoint[];
  adherence_trend: AdherencePoint[];
  outcome_distribution: { won: number; lost: number; pending: number; escalated: number };
};

export type VendorRanking = {
  vendor: string;
  calls: number;
  won: number;
  decided: number;
  win_rate: number | null;
  avg_adherence: number | null;
  savings: number;
};

export type DealInFlight = {
  id: string | null;
  vendor: string;
  outcome: "pending" | "escalated";
  created_at: string | null;
  narrative: string;
  deal_score: number | null;
};

export type PortfolioAnalytics = {
  total_calls: number;
  total_vendors: number;
  portfolio_win_rate: number | null;
  total_savings: number;
  avg_adherence: number | null;
  vendor_rankings: VendorRanking[];
  weekly_trend: WeeklyPoint[];
  top_global_tactics: TacticStat[];
  deals_in_flight: DealInFlight[];
};
