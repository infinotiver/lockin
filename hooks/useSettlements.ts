import { useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-expo";

// Temporary implementation of settling stakes/quests until we can integrate irl payment gateways like razorpay with app but that is very complicated and would require real dedication but this is just a hobby project

export function useSettlements() {
  const { getToken, userId } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    // Fetch pending settlements for user by specifying the optional status param
    if (!userId) return; // no response if user not logged (safeguard)
    setLoading(true);
    const token = await getToken();
    const res = await fetch(
      `/api/settlements?userId=${userId}&status=pending`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const { settlements } = await res.json();
    setSettlements(settlements);
    setLoading(false);
  }, [userId, getToken]);

  const markSettled = useCallback(
    // marks a pending settlement record as settled
    async (settlementId: string, note?: string) => {
      const token = await getToken();
      const res = await fetch(`/api/settlements/${settlementId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error("Failed to mark settlement as settled");
      // optimistic removal — settled items drop out of the pending list
      setSettlements((prev) => prev.filter((s) => s.id !== settlementId));
    },
    [getToken],
  );

  const totalDue = settlements.reduce((sum, s) => sum + s.amount, 0); // calc total due amount (for the homepage and stuff)

  const fetchForStake = useCallback(
    async (stakeId: string) => {
      if (!userId) return null;
      const token = await getToken();
      const res = await fetch(
        `/api/settlements?userId=${userId}&stakeId=${stakeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const { settlements } = await res.json();
      return settlements[0] ?? null; // unique constraint on stake_id means at most one row
    },
    [userId, getToken],
  );

  return {
    settlements,
    totalDue,
    loading,
    fetchPending,
    fetchForStake,
    markSettled,
  };
}

// types

export type Settlement = {
  id: string;
  stake_id: string;
  amount: number;
  status: "pending" | "settled";
  note: string | null;
  created_at: string;
};
