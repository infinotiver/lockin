// lib/stakeEvaluator.ts
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import {
  getTodayUsage,
  getUsageForRange,
  hasUsageAccess,
} from "@/lib/screenTime";
import type { Stake, CheckAction, CheckResult } from "@/types/stakes";

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
): Promise<{ stakeId: string; action: CheckAction; message?: string }> {
  const limitMs = stake.rule?.limitMs ?? Infinity;
  const todayStr = localDateKey();
  const expiresAt = stake.expires_at ? new Date(stake.expires_at) : null;
  const isExpired = expiresAt && expiresAt < new Date();

  // 1. Backfill previous days (Limit to last 2 days since older usage stats don't change)
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000);
  const stakeStart = new Date(stake.created_at);
  const startCursor = stakeStart > twoDaysAgo ? stakeStart : twoDaysAgo;

  let cursor = new Date(startCursor);
  const yesterday = new Date(Date.now() - 86400000);

  while (localDateKey(cursor) <= localDateKey(yesterday)) {
    const targetDate = localDateKey(cursor);
    const { data } = await supabase
      .from("stake_days")
      .select("total_ms")
      .eq("stake_id", stake.id)
      .eq("date", targetDate)
      .maybeSingle();

    let dayTotalMs = data?.total_ms;

    if (dayTotalMs === undefined) {
      try {
        const startMs = new Date(`${targetDate}T00:00:00`).getTime();
        const endMs = new Date(`${targetDate}T23:59:59`).getTime();
        const entries = await getUsageForRange(startMs, endMs);
        dayTotalMs = entries.reduce((sum, e) => sum + e.totalMs, 0);
        await markDay(stake.id, clerkIds, dayTotalMs, targetDate);
      } catch {
        dayTotalMs = 0;
        await markDay(stake.id, clerkIds, dayTotalMs, targetDate);
      }
    }

    if (dayTotalMs > limitMs) {
      return {
        stakeId: stake.id,
        action: "fail",
        message: `Exceeded limit on ${targetDate}`,
      };
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
      message: "Failed to fetch today's usage",
    };
  }

  await markDay(stake.id, clerkIds, todayMs, todayStr);

  if (todayMs > limitMs) {
    return {
      stakeId: stake.id,
      action: "fail",
      message: "Over screen time limit today",
    };
  }

  // 3. Evaluate Expiry
  if (isExpired) {
    return {
      stakeId: stake.id,
      action: "complete",
      message: "Stake completed successfully",
    };
  }

  return { stakeId: stake.id, action: "pass", message: "Under limit" };
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

  const activeStakes = stakes.filter(
    (s) => s.status === "active" && s.type === "screen-time",
  );
  if (activeStakes.length === 0) return [];

  const granted = await hasUsageAccess().catch(() => false);
  if (!granted) {
    return activeStakes.map((s) => ({
      stakeId: s.id,
      action: "fail" as CheckAction,
      message: "Permission revoked",
    }));
  }

  return Promise.all(activeStakes.map((s) => evaluateScreenTime(s, clerkIds)));
}
