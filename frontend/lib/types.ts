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
  outcome: "Successful concession" | "No movement" | "Escalated" | "Rescheduled";
  timestamp: string;
};

export type CoachingEvent = {
  turn: number;
  suggestions: string[];
  warnings: string[];
  correction: string | null;
  current_tactic: string | null;
};

export type KeyMoment = {
  turn_index: number;
  moment: string;
  type: "good" | "missed" | "correction";
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
  created_at: string | null;
};

export type EmailThread = {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
};
