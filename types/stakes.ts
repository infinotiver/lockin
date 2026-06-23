export type StakeStatus = "active" | "pending" | "completed";

export type Stake = {
  id: string;
  title: string;
  amount: number;
  status: StakeStatus;
  category: "Screen Time" | "Exercise" | "Reading" | "Custom";
  daysTotal: number;
  daysCompleted: number;
  streak: number;
  progressPercent: number;
  daysLeft?: number;
  outcome?: "won" | "lost";
  charity?: string;
};
