import { getTodayUsage, hasUsageAccess, UsageReport } from "./screenTime";

export type SyncResult =
  | { status: "synced"; report: UsageReport }
  | { status: "permission_missing" }
  | { status: "error"; message: string };

export async function syncScreenTime(): Promise<SyncResult> {
  const permissionGranted = await hasUsageAccess();
  if (!permissionGranted) {
    return { status: "permission_missing" };
  }

  const report = await getTodayUsage();
  // TODO: send report to server once backend ingest endpoint is ready
  return { status: "synced", report };
}
