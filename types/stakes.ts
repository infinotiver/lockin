export type StakeStatus =
  | "available" // up coming
  | "active" // In progress
  | "completed" // Submitted proof
  | "approved" // teen's request approved (everything settled for teen)
  | "rejected" // Parent called BS (teen only)
  | "expired"; // dont have a clock???

// TODO: stake statuses can be misleading and needs reforms
export type QuestType = "chore" | "study" | "screen-time" | "work" | "shop";

export type Stake = {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  reward: number;
  status: StakeStatus;
  type: QuestType;
  iconUrl?: string;
  created_at: string;
  expires_at: string;

  // --- Optional UI   ---
  streak?: number;
  outcome?: "won" | "lost";
  charity?: string;
  daysLeft?: number;
  daysTotal?: number;
  daysCompleted?: number;
};
