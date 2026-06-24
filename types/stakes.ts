// types/stakes.ts

export type StakeStatus =
  | "active" // running, being tracked
  | "pending" // submitted for verification (teen only, meaningless for individual)
  | "completed" // verified and won — money back
  | "failed" // missed the goal or expired unresolved
  | "rejected"; // parent said no (teen only)

export type QuestType =
  | "screen-time"
  | "photo-verify"
  | "health"
  | "peer-verify"
  | "integration";

export type Stake = {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  reward: number;
  type: QuestType;
  icon_url?: string;
  created_at: string;
  expires_at: string | null;

  // mapped from DB on fetch
  status: StakeStatus;

  // optional client-side
  daysTotal?: number;
  daysLeft?: number;
  progressPercent?: number;
  streak?: number;
  outcome?: "won" | "lost";
};
