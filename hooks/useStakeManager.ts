// hooks/useStakeManager.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { runStakeChecks } from "@/lib/stakeEvaluator";
import type { Stake, CheckAction } from "@/types/stakes";

const CHECK_INTERVAL_MS = 15 * 60 * 1000;

type Options = {
  stakes: Stake[];
  onComplete?: (stakeId: string) => void;
  onFail?: (stakeId: string, message?: string) => void;
  onUnsupported?: () => void;
};

export function useStakeManager({
  stakes,
  onComplete,
  onFail,
  onUnsupported,
}: Options) {
  const { user } = useUser();
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false);
  const handledRef = useRef(new Set<string>());

  const runCheck = useCallback(async () => {
    if (!user?.id || stakes.length === 0 || checkingRef.current) return;

    checkingRef.current = true;
    setChecking(true);

    try {
      const results = await runStakeChecks(stakes, [user.id]);

      const hasUnsupported = results.some((r) => r.action === "unsupported");
      if (hasUnsupported && onUnsupported) onUnsupported();

      for (const result of results) {
        const terminalKey = `${result.stakeId}:${result.action}`;
        if (handledRef.current.has(terminalKey)) continue;

        if (result.action === "complete") {
          handledRef.current.add(terminalKey);
          onComplete?.(result.stakeId);
        } else if (result.action === "fail") {
          handledRef.current.add(terminalKey);
          onFail?.(result.stakeId, result.message);
        }
      }
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, [stakes, user?.id, onComplete, onFail, onUnsupported]);
  const runCheckRef = useRef(runCheck);
  runCheckRef.current = runCheck;

  useEffect(() => {
    runCheckRef.current();
    const interval = setInterval(
      () => runCheckRef.current(),
      CHECK_INTERVAL_MS,
    );
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") runCheckRef.current();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []); // empty deps - interval never resets so only one runCheck obj runs
  return { checking, runCheck };
}
