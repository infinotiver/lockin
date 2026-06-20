// lib/screenTimeSync.ts
import { getTodayUsage } from "./screenTime";
import { hasUsageAccess } from "./screenTime";

export type SyncResult =
  | { status: "synced"; report: Awaited<ReturnType<typeof getTodayUsage>> }
  | { status: "permission_missing" }
  | { status: "error"; message: string };

export async function syncScreenTime(): Promise<SyncResult> {
  try {
    const granted = await hasUsageAccess();
    if (!granted) return { status: "permission_missing" };

    const report = await getTodayUsage();
    return { status: "synced", report };
  } catch (e: any) {
    return { status: "error", message: e.message ?? "Unknown error" };
  }
}
