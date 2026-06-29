// types/stakes.ts

// stake statuses
export type StakeStatus =
  | "active" // running, being tracked
  | "pending" // submitted for verification (teen only, meaningless for individual)
  | "completed" // verified and won — money back
  | "failed" // missed the goal or expired unresolved
  | "rejected"; // parent said no (teen only)

// type of quests/stake

export type QuestType =
  | "screen-time" // currently being implemented
  | "photo-verify" // planned
  | "health" // planned
  | "peer-verify" // planned
  | "integration"; // planed

// per day check actions on each stake
export type CheckAction =
  | "pass"
  | "warn"
  | "complete"
  | "fail"
  | "skip"
  | "unsupported";

// db schema for each day's record in supabase
// breakdown exclusion is intentional to preserve privacy
export type DayRecord = {
  date: string;
  total_ms: number;
  clerk_ids: string[];
  checked_at: string;
};

// frontend ui will use and indexed dict instead of individual entries for better handling
// eg
// {
//   "stakeId": "stake-abc",
//   "days": {
//     "2026-06-28": { "date": "2026-06-28", "total_ms": 10800000, "clerk_ids": ["user_1"] },
//     "2026-06-29": { "date": "2026-06-29", "total_ms": 4500000, "clerk_ids": ["user_1"] }
//   }
// }

export type StakeTrackingData = {
  stakeId: string;
  days: Record<string, DayRecord>;
};

// stake rule schema for screen-time
// TODO: migrate to rules for rule config and make description obsolete
// TODO: expand stake rule to more QuestTypes
export type StakeRule = {
  type: "screen_time_limit";
  operator: "less_than";
  scope: "overall";
  limitMs: number;
};

// Stake/Quest frontend type
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

  // optional client-side
  daysTotal?: number;
  daysLeft?: number;
  progressPercent?: number;
  streak?: number;
};
