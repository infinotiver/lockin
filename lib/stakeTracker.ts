import { supabase } from "@/lib/supabase";
import type { DayRecord, StakeTrackingData } from "@/types/stakes";

export function localDateKey(value: Date | string = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const today = () => localDateKey();

// read stake day rows
export async function getTracking(stakeId: string): Promise<StakeTrackingData> {
  const { data, error } = await supabase
    .from("stake_days")
    .select("date, total_ms, clerk_ids, checked_at")
    .eq("stake_id", stakeId);

  if (error) {
    console.error("stakeTracker.getTracking:", error.message);
    return { stakeId, days: {} };
  }

  const days: Record<string, DayRecord> = {};
  for (const row of data ?? []) {
    days[row.date] = {
      date: row.date,
      total_ms: row.total_ms,
      clerk_ids: row.clerk_ids,
      checked_at: row.checked_at,
    };
  }

  return { stakeId, days };
}

// write today's raw screen time
export async function markDay(
  stakeId: string,
  clerkIds: string[],
  totalMs: number,
): Promise<void> {
  const { error } = await supabase.from("stake_days").upsert(
    {
      stake_id: stakeId,
      clerk_ids: clerkIds,
      date: today(),
      total_ms: totalMs,
      checked_at: new Date().toISOString(),
    },
    { onConflict: "stake_id,date" },
  );

  if (error) {
    console.error("stakeTracker.markDay:", error.message);
  }
}

// check if today already has a record
export async function isTodayChecked(stakeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("stake_days")
    .select("id")
    .eq("stake_id", stakeId)
    .eq("date", today())
    .maybeSingle();

  if (error) return false;
  return !!data;
}

// derive pass/fail for a day
export function dayPassed(record: DayRecord, limitMs: number): boolean {
  return record.total_ms <= limitMs;
}

// check every local day in range
export async function allDaysPassed(
  stakeId: string,
  startDate: string,
  expiresAt: string,
  limitMs: number,
): Promise<boolean> {
  const start = new Date(startDate);
  const end = new Date(expiresAt);
  const expectedDates: string[] = [];

  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endKey = localDateKey(end);
  while (localDateKey(d) <= endKey) {
    expectedDates.push(localDateKey(d));
    d.setDate(d.getDate() + 1);
  }

  const { data, error } = await supabase
    .from("stake_days")
    .select("date, total_ms")
    .eq("stake_id", stakeId)
    .in("date", expectedDates);

  if (error || !data) return false;

  // every day must exist and stay under limit
  return expectedDates.every((date) => {
    const row = data.find((r) => r.date === date);
    if (!row) return false;
    return dayPassed(row as DayRecord, limitMs);
  });
}
