import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import { logger } from "./logger";
import { getUsageForRange, hasUsageAccess } from "@/lib/screenTime";
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
): Promise<void> {
  const { error } = await supabase.from("stake_days").upsert(
    {
      stake_id: stakeId,
      clerk_ids: clerkIds,
      date,
      total_ms: totalMs,
      checked_at: new Date().toISOString(),
    },
    { onConflict: "stake_id,date" },
  );

  if (error) throw error;
}

function startOfLocalDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

function endOfLocalDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  ).getTime();
}

async function evaluateScreenTime(
  stake: Stake,
  clerkIds: string[],
): Promise<CheckResult> {
  const limitMs = stake.rule?.limitMs ?? Infinity;
  const now = new Date();
  const stakeStart = new Date(stake.created_at);
  const expiresAt = stake.expires_at ? new Date(stake.expires_at) : null;
  const isExpired = Boolean(expiresAt && expiresAt.getTime() <= now.getTime());

  if (Number.isNaN(stakeStart.getTime())) {
    return {
      stakeId: stake.id,
      action: "skip",
      reason: "fetch_failed",
      message: "Stake has an invalid creation date",
    };
  }

  // An expired stake is checked only up to its deadline. This prevents usage
  // recorded after expiry from altering the result or its daily record.
  const evaluationEnd = isExpired && expiresAt ? expiresAt : now;
  const cursor = new Date(
    stakeStart.getFullYear(),
    stakeStart.getMonth(),
    stakeStart.getDate(),
  );
  const evaluationEndKey = localDateKey(evaluationEnd);
  let failedDate: string | null = null;

  while (localDateKey(cursor) <= evaluationEndKey) {
    const targetDate = localDateKey(cursor);
    const rangeStart = Math.max(startOfLocalDay(cursor), stakeStart.getTime());
    const rangeEnd = Math.min(endOfLocalDay(cursor), evaluationEnd.getTime());

    try {
      const entries = await getUsageForRange(rangeStart, rangeEnd);
      const dayTotalMs = entries.reduce(
        (sum, entry) => sum + entry.totalMs,
        0,
      );
      await markDay(stake.id, clerkIds, dayTotalMs, targetDate);

      if (dayTotalMs > limitMs && !failedDate) {
        logger.warn(
          `${targetDate}: exceeded limit (${Math.round(dayTotalMs / 60000)}min > ${Math.round(limitMs / 60000)}min)`,
        );
        failedDate = targetDate;
      }
    } catch {
      // A failed read must not turn into a completion: leave the stake active so
      // the next scheduled check can verify the missing interval.
      logger.warn(
        `${targetDate}: usage fetch failed; leaving day unrecorded for retry`,
      );
      return {
        stakeId: stake.id,
        action: "skip",
        reason: "fetch_failed",
        message: `Failed to fetch usage for ${targetDate}`,
      };
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (failedDate) {
    return {
      stakeId: stake.id,
      action: "fail",
      reason: "limit_exceeded",
      message: `Exceeded limit on ${failedDate}`,
    };
  }

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
  if (Platform.OS !== "android") {
    logger.warn("Unsupported platform:", Platform.OS);
    return stakes
      .filter((stake) => stake.status === "active" && stake.type === "screen-time")
      .map((stake) => ({
        stakeId: stake.id,
        action: "unsupported" as CheckAction,
      }));
  }

  const activeStakes = stakes.filter(
    (stake) => stake.status === "active" && stake.type === "screen-time",
  );
  if (activeStakes.length === 0) return [];

  const granted = await hasUsageAccess().catch(() => false);

  if (!granted) {
    return activeStakes.map((stake) => ({
      stakeId: stake.id,
      action: "fail" as CheckAction,
      reason: "permission_revoked" as CheckReason,
      message: "Permission revoked",
    }));
  }

  return Promise.all(activeStakes.map((stake) => evaluateScreenTime(stake, clerkIds)));
}
