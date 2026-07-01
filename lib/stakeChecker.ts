import { Platform } from "react-native";
import { getTodayUsage, hasUsageAccess } from "@/lib/screenTime";
import {
  markDay,
  isTodayChecked,
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
  return localDateKey(expiresAt) === today();
};

const isPastDue = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

async function evaluateScreenTimeStake(
  stake: Stake,
  clerkIds: string[],
  totalMs: number,
): Promise<CheckResult> {
  const alreadyChecked = await isTodayChecked(stake.id);
  if (alreadyChecked) {
    return {
      stakeId: stake.id,
      action: "skip",
      message: "Already checked today",
    };
  }

  // read the rule limit
  const limitMs = stake.rule?.limitMs ?? Infinity;
  const exceeded = totalMs > limitMs;
  const last = isLastDay(stake.expires_at);
  const overdue = isPastDue(stake.expires_at);

  // store today's raw usage first
  await markDay(stake.id, clerkIds, totalMs);

  if (overdue && !last) {
    return {
      stakeId: stake.id,
      action: "fail",
      message: "Stake expired unresolved",
      totalMs,
    };
  }

  if (last) {
    if (exceeded) {
      return {
        stakeId: stake.id,
        action: "fail",
        message: "Over limit on final day",
        totalMs,
      };
    }

    // check the full date range
    const completed = await allDaysPassed(
      stake.id,
      stake.created_at,
      stake.expires_at!,
      limitMs,
    );

    return {
      stakeId: stake.id,
      action: completed ? "complete" : "fail",
      message: completed ? undefined : "Historical limit violations detected",
      totalMs,
    };
  }

  return {
    stakeId: stake.id,
    action: exceeded ? "warn" : "pass",
    message: exceeded ? "Over screen time limit today" : undefined,
    totalMs,
  };
}

export async function runStakeChecks(
  stakes: Stake[],
  clerkIds: string[],
): Promise<CheckResult[]> {
  if (Platform.OS !== "android") {
    return stakes
      .filter((s) => s.status === "active" && s.type === "screen-time")
      .map((s) => ({ stakeId: s.id, action: "unsupported" as CheckAction }));
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

  let totalMs = 0;
  try {
    const usage = await getTodayUsage();
    totalMs = usage.totalMs;
  } catch (e) {
    console.error("stakeChecker: failed to get usage", e);
    return activeScreenTime.map((s) => ({
      stakeId: s.id,
      action: "skip" as CheckAction,
      message: "Failed to fetch screen time",
    }));
  }

  return Promise.all(
    activeScreenTime.map((s) => evaluateScreenTimeStake(s, clerkIds, totalMs)),
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
