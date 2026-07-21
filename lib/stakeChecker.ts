import { Platform } from "react-native";
import {
  getTodayUsage,
  getUsageForRange,
  hasUsageAccess,
} from "@/lib/screenTime";
import {
  markDay,
  getDayRecord,
  getMissingDates,
  allDaysPassed,
  today,
  localDateKey,
} from "@/lib/stakeTracker";
import type { Stake, CheckAction } from "@/types/stakes";

export type CheckResult = {
  stakeId: string;
  action: CheckAction;
  message?: string;
  totalMs?: number;
};

const isLastDay = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false;
  return localDateKey(new Date(expiresAt)) === today();
};

const isPastDue = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

// ─── Backfill days the user missed by not opening the app ────────────────────

async function backfillMissingDays(
  stake: Stake,
  clerkIds: string[],
): Promise<void> {
  const stakeStart = localDateKey(new Date(stake.created_at));
  const yesterday = localDateKey(new Date(Date.now() - 86400000));

  if (stakeStart > yesterday) return;

  const missing = await getMissingDates(stake.id, stakeStart, yesterday);
  if (missing.length === 0) return;

  console.log(
    `[stakeChecker] Backfilling ${missing.length} missing day(s) for stake ${stake.id}`,
  );

  for (const date of missing) {
    const startMs = new Date(`${date}T00:00:00`).getTime();
    const endMs = new Date(`${date}T23:59:59`).getTime();

    try {
      console.log(date, {
        start: new Date(startMs).toISOString(),
        end: new Date(endMs).toISOString(),
      });
      const entries = await getUsageForRange(startMs, endMs);
      const totalMs = entries.reduce((sum, e) => sum + e.totalMs, 0);

      await markDay(stake.id, clerkIds, totalMs, date);

      console.log(
        `[stakeChecker] Backfilled ${date}: ${Math.round(totalMs / 60000)}min`,
      );
    } catch (e) {
      // if we can't get data for a past day, write 0 — that day will be evaluated
      // as failed if the limit is > 0, which is the safe/conservative outcome
      await markDay(stake.id, clerkIds, 0, date);
      console.warn(`[stakeChecker] Backfill failed for ${date}, wrote 0ms`);
    }
  }
}

async function evaluateScreenTimeStake(
  stake: Stake,
  clerkIds: string[],
  totalMsToday: number,
): Promise<CheckResult> {
  const limitMs = stake.rule?.limitMs ?? Infinity;

  // backfill any missed days first
  await backfillMissingDays(stake, clerkIds);

  // check if today already has a record — don't overwrite if already saved
  await markDay(stake.id, clerkIds, totalMsToday);
  const existingToday = await getDayRecord(stake.id, today());

  // use existing record if present (more accurate than re-fetching)
  const todayMs = existingToday?.total_ms ?? totalMsToday;
  const exceeded = todayMs > limitMs;
  const last = isLastDay(stake.expires_at);
  const overdue = isPastDue(stake.expires_at);

  if (overdue && !last) {
    return {
      stakeId: stake.id,
      action: "fail",
      message: "Stake expired unresolved",
      totalMs: todayMs,
    };
  }

  if (last) {
    if (exceeded) {
      return {
        stakeId: stake.id,
        action: "fail",
        message: "Over limit on final day",
        totalMs: todayMs,
      };
    }

    const completed = await allDaysPassed(
      stake.id,
      stake.created_at,
      stake.expires_at!,
      limitMs,
    );

    return {
      stakeId: stake.id,
      action: completed ? "complete" : "fail",
      message: completed ? undefined : "Some days exceeded the limit",
      totalMs: todayMs,
    };
  }

  return {
    stakeId: stake.id,
    action: exceeded ? "warn" : "pass",
    message: exceeded ? "Over screen time limit today" : undefined,
    totalMs: todayMs,
  };
}

export async function runStakeChecks(
  stakes: Stake[],
  clerkIds: string[],
): Promise<CheckResult[]> {
  if (Platform.OS !== "android") {
    return stakes
      .filter((s) => s.status === "active" && s.type === "screen-time")
      .map((s) => ({
        stakeId: s.id,
        action: "unsupported" as CheckAction,
      }));
  }

  const activeScreenTime = stakes.filter(
    (s) => s.status === "active" && s.type === "screen-time",
  );

  if (activeScreenTime.length === 0) return [];

  let granted = false;

  try {
    granted = await hasUsageAccess();
  } catch {
    granted = false;
  }

  if (!granted) {
    return activeScreenTime.map((s) => ({
      stakeId: s.id,
      action: "fail" as CheckAction,
      message: "Usage access permission was revoked",
    }));
  }

  // single fetch for all stakes
  let totalMsToday = 0;

  try {
    const usage = await getTodayUsage();
    totalMsToday = usage.totalMs;
  } catch (e) {
    console.error("stakeChecker: failed to get today usage", e);

    return activeScreenTime.map((s) => ({
      stakeId: s.id,
      action: "skip" as CheckAction,
      message: "Failed to fetch screen time",
    }));
  }

  return Promise.all(
    activeScreenTime.map((s) =>
      evaluateScreenTimeStake(s, clerkIds, totalMsToday),
    ),
  );
}

export function canCreateStake(
  stakes: Stake[],
  type: string,
): { allowed: boolean; reason?: string } {
  const active = stakes.filter((s) => s.status === "active" && s.type === type);

  if (active.length > 0) {
    return {
      allowed: false,
      reason: `You already have an active ${type} stake. Complete it before creating another.`,
    };
  }

  return { allowed: true };
}
