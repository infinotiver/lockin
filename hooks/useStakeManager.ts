// hooks/useStakeManager.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { runStakeChecks } from "@/lib/stakeEvaluator";
import type { Stake, CheckAction } from "@/types/stakes";
import { logger } from "@/lib/logger";

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const MAX_TIMEOUT_MS = 2_147_483_647;

type Options = {
  stakes: Stake[];
  onComplete?: (stakeId: string) => Promise<void> | void;
  onFail?: (stakeId: string, message?: string) => Promise<void> | void;
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
  const isMountedRef = useRef(true);

  const runCheck = useCallback(async () => {
    if (!user?.id || stakes.length === 0 || checkingRef.current) return;

    checkingRef.current = true;
    setChecking(true);

    try {
      const results = await runStakeChecks(stakes, [user.id]);

      const hasUnsupported = results.some((r) => r.action === "unsupported");
      if (hasUnsupported && onUnsupported) onUnsupported();

      for (const result of results) {
        const terminalKey = `${result.stakeId}:${result.action}:${result.reason ?? "none"}`;
        if (handledRef.current.has(terminalKey)) continue;

        try {
          if (result.action === "complete") {
            await onComplete?.(result.stakeId);
     
            handledRef.current.add(terminalKey);
          } else if (result.action === "fail") {
            await onFail?.(result.stakeId, result.message);
    
            if (result.reason !== "permission_revoked") {
              handledRef.current.add(terminalKey);
            }
          }
        } catch (e) {
          logger.warn(`Failed to finalize ${terminalKey}:`, e);
        }
      }
    } finally {
      checkingRef.current = false;
      if (isMountedRef.current) setChecking(false);
    }
  }, [stakes, user?.id, onComplete, onFail, onUnsupported]);

  const runCheckRef = useRef(runCheck);
  runCheckRef.current = runCheck;

  useEffect(() => {
    isMountedRef.current = true;
    runCheckRef.current();

    const interval = setInterval(
      () => runCheckRef.current(),
      CHECK_INTERVAL_MS,
    );
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") runCheckRef.current();
    });

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  useEffect(() => {
    const nextExpiryMs = stakes
      .filter((stake) => stake.status === "active" && stake.type === "screen-time")
      .map((stake) =>
        stake.expires_at ? new Date(stake.expires_at).getTime() : Number.NaN,
      )
      .filter(Number.isFinite)
      .sort((left, right) => left - right)[0];

    if (nextExpiryMs === undefined) return;

    // The regular interval can be almost 15 minutes late. Scheduling the nearest
    // deadline separately lets an active app finalize a stake as soon as its
    // evaluation window closes; `checkingRef` handles timer/interval overlap.
    const delayMs = Math.min(
      Math.max(0, nextExpiryMs - Date.now()) + 250,
      MAX_TIMEOUT_MS,
    );
    const timeout = setTimeout(() => runCheckRef.current(), delayMs);

    return () => clearTimeout(timeout);
  }, [stakes]);

  return { checking, runCheck };
}
