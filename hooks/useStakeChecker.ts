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

type CheckLog = {
  timestamp: string;
  message: string;
  type: "info" | "success" | "warn" | "error";
};

const log = (
  logs: React.RefObject<CheckLog[]>,
  type: CheckLog["type"],
  message: string,
) => {
  const entry: CheckLog = {
    timestamp: new Date().toISOString(),
    message,
    type,
  };
  logs.current = [entry, ...logs.current].slice(0, 50); // keep last 50
  if (__DEV__) {
    console.log(`[StakeChecker] ${type} ${message}`);
  }
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
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

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
  const logs = useRef<CheckLog[]>([]);

  const activeStakeKey = stakes
    .filter((s) => s.status === "active" && s.type === "screen-time")
    .map((s) => `${s.id}:${s.status}:${s.expires_at}:${s.rule?.limitMs ?? ""}`)
    .sort()
    .join("|");

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

    const activeScreenTimeStakes = currentStakes.filter(
      (s) => s.status === "active" && s.type === "screen-time",
    );

    log(
      logs,
      "info",
      `Running check for ${activeScreenTimeStakes.length} active screen-time stake(s)`,
    );

    try {
      const checkResults = await runStakeChecks(currentStakes, currentClerkIds);
      setResults(checkResults);

      const now = new Date().toISOString();
      setLastCheckedAt(now);
      log(
        logs,
        "success",
        `Check complete at ${now} — ${checkResults.length} result(s)`,
      );

      // log each result
      for (const result of checkResults) {
        switch (result.action) {
          case "pass":
            log(
              logs,
              "success",
              `Stake ${result.stakeId} — day passed (${result.totalMs ? Math.round(result.totalMs / 60000) + "min" : "n/a"})`,
            );
            break;
          case "warn":
            log(
              logs,
              "warn",
              `Stake ${result.stakeId} — over limit today (${result.message})`,
            );
            break;
          case "complete":
            log(logs, "success", `Stake ${result.stakeId} — COMPLETED 🎉`);
            break;
          case "fail":
            log(
              logs,
              "error",
              `Stake ${result.stakeId} — failed: ${result.message}`,
            );
            break;
          case "skip":
            log(
              logs,
              "info",
              `Stake ${result.stakeId} — skipped: ${result.message}`,
            );
            break;
          case "unsupported":
            log(logs, "warn", `Stake ${result.stakeId} — unsupported platform`);
            break;
        }
      }

      // handle unsupported — notify once per session
      const unsupportedResults = checkResults.filter(
        (r) => r.action === "unsupported",
      );
      if (unsupportedResults.length > 0 && !unsupportedNotifiedRef.current) {
        unsupportedNotifiedRef.current = true;
        onUnsupportedRef.current?.("Screen-time stakes are Android only.");
      } else if (unsupportedResults.length === 0) {
        unsupportedNotifiedRef.current = false;
      }

      // dispatch terminal callbacks — deduplicated
      for (const result of checkResults) {
        const terminalKey = `${result.stakeId}:${result.action}:${result.message ?? ""}`;

        switch (result.action) {
          case "complete":
            if (handledTerminalRef.current.has(terminalKey)) break;
            handledTerminalRef.current.add(terminalKey);
            log(
              logs,
              "info",
              `Dispatching onComplete for stake ${result.stakeId}`,
            );
            onCompleteRef.current?.(result.stakeId);
            break;
          case "fail":
            if (handledTerminalRef.current.has(terminalKey)) break;
            handledTerminalRef.current.add(terminalKey);
            log(logs, "info", `Dispatching onFail for stake ${result.stakeId}`);
            onFailRef.current?.(result.stakeId, result.message);
            break;
          case "warn":
            onWarnRef.current?.(result.stakeId, result.message);
            break;
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Stake check failed.";
      setError(message);
      log(logs, "error", `Check threw: ${message}`);
      onErrorRef.current?.(message);
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, []);

  // run when active screen-time stakes change
  useEffect(() => {
    if (activeStakeKey && clerkId) {
      log(logs, "info", "Active stakes changed — triggering check");
      void runCheck();
    }
  }, [runCheck, activeStakeKey, clerkId]);

  // recheck on foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        log(logs, "info", "App foregrounded — triggering check");
        void runCheck();
      }
    });
    return () => sub.remove();
  }, [runCheck]);

  // regular android polling
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (!activeStakeKey || !clerkId) return;

    log(
      logs,
      "info",
      `Starting poll interval (${CHECK_INTERVAL_MS / 60000}min)`,
    );
    const interval = setInterval(() => {
      log(logs, "info", "Poll interval fired — triggering check");
      void runCheck();
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [runCheck, clerkId, activeStakeKey]);

  return {
    results,
    checking,
    error,
    lastCheckedAt,
    logs: logs.current,
    runCheck,
  };
}
