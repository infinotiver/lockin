import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";

// Temporary implementation of settling stakes/quests until we can integrate irl payment gateways like razorpay with app but that is very complicated and would require real dedication but this is just a hobby project
export function useSettlements() {
  const { getToken, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [settledSettlements, setSettledSettlements] = useState<Settlement[]>(
    [],
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isHistoryInitialLoad, setIsHistoryInitialLoad] = useState(true);

  useEffect(() => {
    setSettlements([]);
    setSettledSettlements([]);
    setError(null);
    setHistoryError(null);
    setLoading(false);
    setHistoryLoading(false);
    setIsInitialLoad(Boolean(userId));
    setIsHistoryInitialLoad(Boolean(userId));
  }, [userId]);

  const fetchPending = useCallback(async () => {
    // Fetch pending settlements for user by specifying the optional status param
    if (!userId) {
      setSettlements([]);
      setError(null);
      setIsInitialLoad(false);
      return;
    }
    const requestUserId = userId;
    setLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (userIdRef.current !== requestUserId) return;

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/settlements?status=pending`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch settlements: ${res.status}`);
      }
      const { settlements } = await res.json();
      if (userIdRef.current !== requestUserId) return;

      setSettlements(Array.isArray(settlements) ? settlements : []);
    } catch (err) {
      if (userIdRef.current !== requestUserId) return;

      setError(
        err instanceof Error ? err.message : "Failed to fetch settlements",
      );
      setSettlements([]); // Safely retain an array on error
    } finally {
      if (userIdRef.current === requestUserId) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, [userId]);

  // Fetch settled (completed) settlements — same shape as fetchPending, just
  // a different status filter, for the wallet history section.
  const fetchSettled = useCallback(async () => {
    if (!userId) {
      setSettledSettlements([]);
      setHistoryError(null);
      setIsHistoryInitialLoad(false);
      return;
    }
    const requestUserId = userId;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const token = await getTokenRef.current();
      if (userIdRef.current !== requestUserId) return;

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/settlements?status=settled`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch settlement history: ${res.status}`);
      }
      const { settlements } = await res.json();
      if (userIdRef.current !== requestUserId) return;

      setSettledSettlements(Array.isArray(settlements) ? settlements : []);
    } catch (err) {
      if (userIdRef.current !== requestUserId) return;

      setHistoryError(
        err instanceof Error
          ? err.message
          : "Failed to fetch settlement history",
      );
      setSettledSettlements([]);
    } finally {
      if (userIdRef.current === requestUserId) {
        setHistoryLoading(false);
        setIsHistoryInitialLoad(false);
      }
    }
  }, [userId]);

  const markSettled = useCallback(
    // marks a pending settlement record as settled
    async (settlementId: string, note?: string) => {
      const token = await getTokenRef.current();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/settlements/${settlementId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "settled", note }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to mark settlement as settled");
      }
      // optimistic removal — settled items drop out of the pending list
      setSettlements((prev) => prev.filter((s) => s.id !== settlementId));
    },
    [],
  );

  const totalDue = settlements.reduce((sum, s) => sum + s.amount, 0); // calc total due amount (for the homepage and stuff)
  const totalSettled = settledSettlements.reduce((sum, s) => sum + s.amount, 0); // total ever settled, for wallet history summary

  const fetchForStake = useCallback(
    async (stakeId: string) => {
      if (!userId) return null;
      const token = await getTokenRef.current();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/settlements?userId=${userId}&stakeId=${stakeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const { settlements } = await res.json();
      return settlements[0] ?? null; // unique constraint on stake_id means at most one row
    },
    [userId],
  );

  return {
    settlements,
    totalDue,
    loading,
    error,
    isInitialLoad,
    fetchPending,
    fetchForStake,
    markSettled,
    settledSettlements,
    totalSettled,
    historyLoading,
    historyError,
    isHistoryInitialLoad,
    fetchSettled,
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
  settled_at?: string | null;
};
