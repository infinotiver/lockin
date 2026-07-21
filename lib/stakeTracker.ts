import { supabase } from "@/lib/supabase";
import type { DayRecord, StakeTrackingData } from "@/types/stakes";

export function localDateKey(value: Date | string = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export const today = () => localDateKey();

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

// returns the DayRecord if exists, null if not
export async function getDayRecord(
  stakeId: string,
  date: string,
): Promise<DayRecord | null> {
  const { data, error } = await supabase
    .from("stake_days")
    .select("date, total_ms, clerk_ids, checked_at")
    .eq("stake_id", stakeId)
    .eq("date", date)
    .maybeSingle();

  if (error || !data) return null;
  return data as DayRecord;
}

export async function markDay(
  stakeId: string,
  clerkIds: string[],
  totalMs: number,
  date: string = today(),
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

  if (error) {
    console.error("stakeTracker.markDay:", error.message);
  }
}

export function dayPassed(record: DayRecord, limitMs: number): boolean {
  return record.total_ms <= limitMs;
}

// returns dates in [startDate, endDate] that have no stake_days row
export async function getMissingDates(
  stakeId: string,
  startDate: string,
  endDate: string,
): Promise<string[]> {
  const cursor = new Date(startDate);
  const end = new Date(endDate);
  const all: string[] = [];

  while (localDateKey(cursor) <= localDateKey(end)) {
    all.push(localDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const { data, error } = await supabase
    .from("stake_days")
    .select("date")
    .eq("stake_id", stakeId)
    .in("date", all);

  if (error) return all; // conservative: treat all as missing

  const existing = new Set((data ?? []).map((r) => r.date));
  return all.filter((d) => !existing.has(d));
}

export async function allDaysPassed(
  stakeId: string,
  startDate: string,
  expiresAt: string,
  limitMs: number,
): Promise<boolean> {
  const cursor = new Date(startDate);
  const end = new Date(expiresAt);
  const expected: string[] = [];

  while (localDateKey(cursor) <= localDateKey(end)) {
    expected.push(localDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const { data, error } = await supabase
    .from("stake_days")
    .select("date, total_ms")
    .eq("stake_id", stakeId)
    .in("date", expected);

  if (error || !data) return false;

  return expected.every((date) => {
    const row = data.find((r) => r.date === date);
    return !!row && row.total_ms <= limitMs;
  });
}
