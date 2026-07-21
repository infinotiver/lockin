// types/stakes.ts

export const validStatuses = [
  "active",
  "pending",
  "completed",
  "failed",
  "rejected",
] as const;

export type StakeStatus = (typeof validStatuses)[number];

export type QuestType =
  | "screen-time"
  | "photo-verify"
  | "health"
  | "peer-verify"
  | "integration";

export type CheckAction =
  | "pass"
  | "warn"
  | "complete"
  | "fail"
  | "skip"
  | "unsupported";
export type CheckResult = {
  stakeId: string;
  action: CheckAction;
  message?: string;
  totalMs?: number;
};

export type DayRecord = {
  date: string;
  total_ms: number;
  clerk_ids: string[];
  checked_at: string;
};

export type StakeRule = {
  type: "screen_time_limit";
  operator: "less_than";
  scope: "overall";
  limitMs: number;
};

export type Stake = {
  id: string;
  familyId: string;
  title: string;
  description?: StakeRule | string;
  rule?: StakeRule;
  reward: number;
  type: QuestType;
  icon_url?: string;
  created_at: string;
  expires_at: string | null;
  status: StakeStatus;

  daysTotal?: number;
  daysLeft?: number;
  progressPercent?: number;
  streak?: number;
};
