import { NativeModules, Platform } from "react-native";

const { ScreenTimeModule } = NativeModules;

export type UsageReport = {
  byApp: Record<string, number>; // packageName → ms
  totalMs: number;
  collectedAt: number; // unix ms
  date: string; // 'yyyy-MM-dd'
};

export type UsageEntry = {
  packageName: string;
  totalMs: number;
  lastUsed: number;
};

function assertAndroid() {
  if (Platform.OS !== "android") {
    throw new Error("ScreenTimeModule is Android-only in phase 1");
  }
}

export async function hasUsageAccess(): Promise<boolean> {
  assertAndroid();
  return ScreenTimeModule.hasUsageAccess();
}

export async function openUsageAccessSettings(): Promise<void> {
  assertAndroid();
  await ScreenTimeModule.openUsageAccessSettings();
}

export async function getTodayUsage(): Promise<UsageReport> {
  assertAndroid();
  return ScreenTimeModule.getTodayUsage();
}

export async function getUsageForRange(
  startMs: number,
  endMs: number,
): Promise<UsageEntry[]> {
  assertAndroid();
  return ScreenTimeModule.getUsageForRange(startMs, endMs);
}

export function msToMinutes(ms: number): number {
  return Math.round(ms / 60_000);
}

export function msToHoursAndMinutes(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
