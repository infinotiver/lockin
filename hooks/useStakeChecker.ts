import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { runStakeChecks, CheckResult } from "@/lib/stakeChecker";
import type { Stake } from "@/types/stakes";

const CHECK_INTERVAL_MS = 15 * 60 * 1000;

type Options = {
  stakes: Stake[];
  onComplete?: (stakeId: string) => void;
  onFail?: (stakeId: string, message?: string) => void;
  onWarn?: (stakeId: string, message?: string) => void;
  onUnsupported?: (message: string) => void;
  onError?: (message: string) => void;
};

export function useStakeChecker({
  stakes,
  onComplete,
  onFail,
  onWarn,
  onUnsupported,
  onError,
}: Options) {
  const { user } = useUser();
  const clerkId = user?.id;
  const [results, setResults] = useState<CheckResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkingRef = useRef(false);
  const stakesRef = useRef(stakes);
  const clerkIdsRef = useRef<string[]>([]);
  const onCompleteRef = useRef(onComplete);
  const onFailRef = useRef(onFail);
  const onWarnRef = useRef(onWarn);
  const onUnsupportedRef = useRef(onUnsupported);
  const onErrorRef = useRef(onError);
  const unsupportedNotifiedRef = useRef(false);
  const handledTerminalRef = useRef(new Set<string>());

  const activeStakeKey = stakes
    .filter((s) => s.status === "active" && s.type === "screen-time")
    .map((s) => `${s.id}:${s.status}:${s.expires_at}:${s.rule?.limitMs ?? ""}`)
    .sort()
    .join("|");

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
    onUnsupportedRef.current = onUnsupported;
    onErrorRef.current = onError;
  }, [onComplete, onFail, onWarn, onUnsupported, onError]);

  const runCheck = useCallback(async () => {
    const currentStakes = stakesRef.current;
    const currentClerkIds = clerkIdsRef.current;

    if (currentStakes.length === 0) return;
    if (currentClerkIds.length === 0) return;
    if (checkingRef.current) return;

    checkingRef.current = true;
    setChecking(true);
    setError(null);

    try {
      const checkResults = await runStakeChecks(currentStakes, currentClerkIds);
      setResults(checkResults);

      const unsupportedResults = checkResults.filter(
        (result) => result.action === "unsupported",
      );

      if (unsupportedResults.length > 0) {
        const message = "screen-time stakes are android only.";
        setError(message);

        if (!unsupportedNotifiedRef.current) {
          unsupportedNotifiedRef.current = true;
          onUnsupportedRef.current?.(message);
        }
      } else {
        unsupportedNotifiedRef.current = false;
      }

      for (const result of checkResults) {
        const terminalKey = `${result.stakeId}:${result.action}:${result.message ?? ""}`;

        switch (result.action) {
          case "complete":
            if (handledTerminalRef.current.has(terminalKey)) break;
            handledTerminalRef.current.add(terminalKey);
            onCompleteRef.current?.(result.stakeId);
            break;
          case "fail":
            if (handledTerminalRef.current.has(terminalKey)) break;
            handledTerminalRef.current.add(terminalKey);
            onFailRef.current?.(result.stakeId, result.message);
            break;
          case "warn":
            onWarnRef.current?.(result.stakeId, result.message);
            break;
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "stake check failed.";
      setError(message);
      onErrorRef.current?.(message);
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, []);

  // check when active screen-time stakes change
  useEffect(() => {
    if (activeStakeKey && clerkId) {
      void runCheck();
    }
  }, [runCheck, activeStakeKey, clerkId]);

  // recheck on foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void runCheck();
    });
    return () => sub.remove();
  }, [runCheck]);

  // regular android polling
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (!activeStakeKey || !clerkId) return;

    const interval = setInterval(() => {
      void runCheck();
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [runCheck, clerkId, activeStakeKey]);

  return { results, checking, error, runCheck };
}
