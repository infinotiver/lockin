export type StakeStatus = "active" | "pending" | "completed";

export type Stake = {
  familyId: string;
  id: string;
  title: string;
  description?: string;
  reward: number;
  status: StakeStatus;
  category: "Screen Time" | "Exercise" | "Reading" | "Custom";
  streak: number;
  outcome?: "won" | "lost";
  charity?: string;
};

//  family_id: familyId,
//       title: title.trim(),
//       description: description?.trim() ?? null,
//       reward: parsedReward,
//       type,
//       status: "available",
//       expires_at: expires_at ?? null,
