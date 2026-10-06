import { Platform } from "react-native";
import { logger } from "./logger";
import { getUsageForRange, hasUsageAccess } from "@/lib/screenTime";
import { parseISODate } from "@/lib/timeParser";
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
  totalMs: number,
  date: string,
  getToken: () => Promise<string | null>,
): Promise<{ frozen: boolean; awarded: boolean }> {
  const token = await getToken();
  if (!token) throw new Error("Missing auth token");
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/days/${stakeId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ totalMs, date }),
  });
  if (!response.ok) throw new Error("Failed to save daily usage");
  const result = await response.json();
  return { frozen: result.frozen === true, awarded: result.awarded === true };
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

export function dateKeyInTimezone(date: Date, timezone?: string): string {
  if (!timezone) return localDateKey(date);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function nextDateKey(dateKey: string): string {
  const next = new Date(`${dateKey}T12:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

function startOfDayInTimezone(dateKey: string, timezone: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcMidnight = Date.UTC(year, month - 1, day);
  let guess = utcMidnight;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(guess));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const represented = Date.UTC(
      Number(values.year), Number(values.month) - 1, Number(values.day),
      Number(values.hour), Number(values.minute), Number(values.second),
    );
    guess = utcMidnight - (represented - guess);
  }
  return guess;
}

async function evaluateScreenTime(
  stake: Stake,
  getToken: () => Promise<string | null>,
): Promise<CheckResult> {
  const limitMs = stake.rule?.limitMs ?? Infinity;
  const now = new Date();
  const stakeStart = parseISODate(stake.created_at);
  const expiresAt = parseISODate(stake.expires_at);
  const isExpired = Boolean(expiresAt && expiresAt.getTime() <= now.getTime());

  if (!stakeStart) {
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
  const timezone = stake.coinTimezone;
  const getDateKey = (date: Date) => dateKeyInTimezone(date, timezone);
  const evaluationEndKey = getDateKey(evaluationEnd);
  let targetDate = getDateKey(stakeStart);
  let failedDate: string | null = null;
  let coinsChanged = false;

  while (targetDate <= evaluationEndKey) {
    const localDate = new Date(`${targetDate}T12:00:00`);
    const rangeStart = Math.max(
      timezone
        ? startOfDayInTimezone(targetDate, timezone)
        : startOfLocalDay(localDate),
      stakeStart.getTime(),
    );
    const rangeEnd = Math.min(
      timezone
        ? startOfDayInTimezone(nextDateKey(targetDate), timezone) - 1
        : endOfLocalDay(localDate),
      evaluationEnd.getTime(),
    );

    try {
      const entries = await getUsageForRange(rangeStart, rangeEnd);
      const dayTotalMs = entries.reduce(
        (sum, entry) => sum + entry.totalMs,
        0,
      );
      const dayResult = await markDay(stake.id, dayTotalMs, targetDate, getToken);
      coinsChanged ||= dayResult.awarded;

      if (dayTotalMs > limitMs && !dayResult.frozen && !failedDate) {
        logger.warn(
          `${targetDate}: exceeded limit (${Math.round(dayTotalMs / 60000)}min > ${Math.round(limitMs / 60000)}min)`,
        );
        failedDate = targetDate;
      }
    } catch {
      if (failedDate) {
        return {
          stakeId: stake.id,
          action: "fail",
          reason: "limit_exceeded",
          message: `Exceeded limit on ${failedDate}`,
          coinsChanged,
        };
      }
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
        coinsChanged,
      };
    }

    targetDate = nextDateKey(targetDate);
  }

  if (failedDate) {
    return {
      stakeId: stake.id,
      action: "fail",
      reason: "limit_exceeded",
      message: `Exceeded limit on ${failedDate}`,
      coinsChanged,
    };
  }

  if (isExpired) {
    return {
      stakeId: stake.id,
      action: "complete",
      reason: "expired",
      message: "Stake completed successfully",
      coinsChanged,
    };
  }

  return { stakeId: stake.id, action: "pass", message: "Under limit", coinsChanged };
}

export async function runStakeChecks(
  stakes: Stake[],
  getToken: () => Promise<string | null>,
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

  return Promise.all(activeStakes.map((stake) => evaluateScreenTime(stake, getToken)));
}
