export type StakeStatus =
  | "available" // up coming
  | "active" // In progress
  | "completed" // Submitted proof
  | "approved" // teen's request approved (teen only)
  | "rejected" // Parent called BS (teen only)
  | "expired"; // dont have a clock???

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

  // --- Optional UI   ---
  streak?: number;
  outcome?: "won" | "lost";
  charity?: string;
  daysLeft?: number;
  daysTotal?: number;
  daysCompleted?: number;
};
