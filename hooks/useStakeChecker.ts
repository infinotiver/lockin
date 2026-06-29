import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { runStakeChecks, CheckResult } from "@/lib/stakeChecker";
import type { Stake } from "@/types/stakes";

type Options = {
  stakes: Stake[];
  onComplete?: (stakeId: string) => void;
  onFail?: (stakeId: string, message?: string) => void;
  onWarn?: (stakeId: string, message?: string) => void;
};

export function useStakeChecker({
  stakes,
  onComplete,
  onFail,
  onWarn,
}: Options) {
  const { user } = useUser();
  const clerkId = user?.id;
  const [results, setResults] = useState<CheckResult[]>([]);
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false);
  const stakesRef = useRef(stakes);
  const clerkIdsRef = useRef<string[]>([]);
  const onCompleteRef = useRef(onComplete);
  const onFailRef = useRef(onFail);
  const onWarnRef = useRef(onWarn);

  // keep the latest inputs in refs
  useEffect(() => {
    stakesRef.current = stakes;
  }, [stakes]);

  useEffect(() => {
    clerkIdsRef.current = clerkId ? [clerkId] : [];
  }, [clerkId]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onFailRef.current = onFail;
    onWarnRef.current = onWarn;
  }, [onComplete, onFail, onWarn]);

  const runCheck = useCallback(async () => {
    if (Platform.OS !== "android") return;

    const currentStakes = stakesRef.current;
    const currentClerkIds = clerkIdsRef.current;

    if (currentClerkIds.length === 0) return;
    if (currentStakes.length === 0) return;
    if (checkingRef.current) return;

    checkingRef.current = true;
    setChecking(true);

    try {
      const checkResults = await runStakeChecks(currentStakes, currentClerkIds);
      setResults(checkResults);

      for (const result of checkResults) {
        switch (result.action) {
          case "complete":
            onCompleteRef.current?.(result.stakeId);
            break;
          case "fail":
            onFailRef.current?.(result.stakeId, result.message);
            break;
          case "warn":
            onWarnRef.current?.(result.stakeId, result.message);
            break;
        }
      }
    } catch (e) {
      console.error("useStakeChecker:", e);
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (stakes.length > 0 && clerkIdsRef.current.length > 0) {
      void runCheck();
    }
  }, [runCheck, stakes, clerkId]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void runCheck();
    });
    return () => sub.remove();
  }, [runCheck]);

  return { results, checking, runCheck };
}
