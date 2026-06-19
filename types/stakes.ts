export type StakeStatus = "active" | "pending" | "done";

export type Stake = {
  id: string;
  title: string;
  amount: number;
  status: StakeStatus;
  category: "Screen Time" | "Exercise" | "Reading" | "Custom";
  role: "Teen" | "Parent";
  daysTotal: number;
  daysCompleted: number;
  streak: number;
  progressPercent: number;
  daysLeft?: number;
  outcome?: "won" | "lost";
  charity?: string;
};
