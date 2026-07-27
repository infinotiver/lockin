import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import { logger } from "./logger";
import {
  getTodayUsage,
  getUsageForRange,
  hasUsageAccess,
} from "@/lib/screenTime";
import type {
  Stake,
  CheckAction,
  CheckResult,
  CheckReason,
} from "@/types/stakes";

export const localDateKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

async function markDay(
  stakeId: string,
  clerkIds: string[],
  totalMs: number,
  date: string,
) {
  await supabase.from("stake_days").upsert(
    {
      stake_id: stakeId,
      clerk_ids: clerkIds,
      date,
      total_ms: totalMs,
      checked_at: new Date().toISOString(),
    },
    { onConflict: "stake_id,date" },
  );
}

async function evaluateScreenTime(
  stake: Stake,
  clerkIds: string[],
): Promise<{
  stakeId: string;
  action: CheckAction;
  reason?: CheckReason;
  message?: string;
}> {
  const limitMs = stake.rule?.limitMs ?? Infinity;
  const todayStr = localDateKey();
  const expiresAt = stake.expires_at ? new Date(stake.expires_at) : null;
  const isExpired = expiresAt && expiresAt < new Date();
  logger.log(`Checking stake ${stake.id}`);
  logger.log("Title:", stake.title);
  logger.log("Limit:", limitMs / 60000, "minutes");
  logger.log("Created:", stake.created_at);
  logger.log("Expires:", stake.expires_at);
  const stakeStart = new Date(stake.created_at);
  let cursor = new Date(stakeStart);
  const yesterday = new Date(Date.now() - 86400000);
  logger.log(
    `Checking historical days from ${localDateKey(stakeStart)} to ${localDateKey(yesterday)}`,
  );
  let failedDate: string | null = null;
  while (localDateKey(cursor) <= localDateKey(yesterday)) {
    const targetDate = localDateKey(cursor);
    logger.log(`Checking ${targetDate}`);
    const { data } = await supabase
      .from("stake_days")
      .select("total_ms")
      .eq("stake_id", stake.id)
      .eq("date", targetDate)
      .maybeSingle();
    if (data) {
      logger.log(`${targetDate}: existing record ${data.total_ms}ms`);
    } else {
      logger.log(`${targetDate}: no record found, fetching Android usage`);
    }
    let dayTotalMs = data?.total_ms;

    if (dayTotalMs === undefined) {
      try {
        const startMs = new Date(`${targetDate}T00:00:00`).getTime();
        const endMs = new Date(`${targetDate}T23:59:59`).getTime();
        const entries = await getUsageForRange(startMs, endMs);
        dayTotalMs = entries.reduce((sum, e) => sum + e.totalMs, 0);
        logger.log(`${targetDate}: ${Math.round(dayTotalMs / 60000)} min`);
        await markDay(stake.id, clerkIds, dayTotalMs, targetDate);
        logger.log(`${targetDate}: saved to stake_days`);
      } catch {
        logger.warn(
          `${targetDate}: usage fetch failed; leaving day unrecorded for retry`,
        );
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }
    }
    if (dayTotalMs > limitMs) {
      logger.warn(
        `${targetDate}: exceeded limit (${Math.round(dayTotalMs / 60000)}min > ${Math.round(limitMs / 60000)}min)`,
      );

      // Record the first failed day but continue syncing
      if (!failedDate) {
        failedDate = targetDate;
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  // 2. Check Today's Usage
  let todayMs = 0;
  try {
    const usage = await getTodayUsage();
    todayMs = usage.totalMs;
  } catch (e) {
    return {
      stakeId: stake.id,
      action: "skip",
      reason: "fetch_failed",
      message: "Failed to fetch today's usage",
    };
  }

  await markDay(stake.id, clerkIds, todayMs, todayStr);
  if (todayMs > limitMs && !failedDate) {
    logger.warn(
      `Today exceeded limit (${Math.round(todayMs / 60000)}min > ${Math.round(limitMs / 60000)}min)`,
    );
    failedDate = todayStr;
  }
  if (failedDate) {
    // Historical-day and today's-limit failures are the same underlying
    // cause (limit_exceeded); only the display message differs by date.
    return {
      stakeId: stake.id,
      action: "fail",
      reason: "limit_exceeded",
      message:
        failedDate === todayStr
          ? "Over screen time limit today"
          : `Exceeded limit on ${failedDate}`,
    };
  }

  // 3. Evaluate Expiry
  if (isExpired) {
    return {
      stakeId: stake.id,
      action: "complete",
      reason: "expired",
      message: "Stake completed successfully",
    };
  }

  return { stakeId: stake.id, action: "pass", message: "Under limit" };
}

export async function runStakeChecks(
  stakes: Stake[],
  clerkIds: string[],
): Promise<CheckResult[]> {
  logger.log(`Running checks for ${stakes.length} stake(s)`);
  if (Platform.OS !== "android") {
    logger.warn("Unsupported platform:", Platform.OS);
    return stakes
      .filter((s) => s.status === "active" && s.type === "screen-time")
      .map((s) => ({ stakeId: s.id, action: "unsupported" as CheckAction }));
  }
  const activeStakes = stakes.filter(
    (s) => s.status === "active" && s.type === "screen-time",
  );
  if (activeStakes.length === 0) return [];
  logger.log(`Found ${activeStakes.length} active screen-time stake(s)`);

  const granted = await hasUsageAccess().catch(() => false);
  logger.log("Usage access:", granted);
  if (!granted) {
    return activeStakes.map((s) => ({
      stakeId: s.id,
      action: "fail" as CheckAction,
      reason: "permission_revoked" as CheckReason,
      message: "Permission revoked",
    }));
  }

  return Promise.all(activeStakes.map((s) => evaluateScreenTime(s, clerkIds)));
}
