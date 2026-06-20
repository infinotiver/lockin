// lib/screenTime.ts
import { NativeModules } from "react-native";

const { ScreenTimeModule } = NativeModules;

export type UsageReport = {
  totalMs: number;
  byApp: Record<string, number>;
  date: string;
  collectedAt: number;
};

export async function hasUsageAccess(): Promise<boolean> {
  return ScreenTimeModule.hasUsageAccess();
}

export async function openUsageAccessSettings(): Promise<void> {
  return ScreenTimeModule.openUsageAccessSettings();
}

export async function getTodayUsage(): Promise<UsageReport> {
  return ScreenTimeModule.getTodayUsage();
}

export async function getUsageForRange(
  startMs: number,
  endMs: number,
): Promise<{ packageName: string; totalMs: number; lastUsed: number }[]> {
  return ScreenTimeModule.getUsageForRange(startMs, endMs);
}

export function msToHoursAndMinutes(ms: number): string {
  const totalMins = Math.floor(ms / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
