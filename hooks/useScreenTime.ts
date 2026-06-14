import { useState, useEffect, useCallback } from "react";
import { Platform, AppState } from "react-native";
import {
  hasUsageAccess,
  getTodayUsage,
  openUsageAccessSettings,
  UsageReport,
  msToHoursAndMinutes,
} from "@/lib/screenTime";
import { syncScreenTime } from "@/lib/screenTimeSync";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "localhost:8081";

type ScreenTimeState = {
  permissionGranted: boolean | null; // null = not yet checked
  report: UsageReport | null;
  formattedTotal: string;
  loading: boolean;
  error: string | null;
};

export function useScreenTime() {
  const [state, setState] = useState<ScreenTimeState>({
    permissionGranted: null,
    report: null,
    formattedTotal: "—",
    loading: true,
    error: null,
  });

  const checkPermission = useCallback(async () => {
    if (Platform.OS !== "android") return;
    const granted = await hasUsageAccess();
    setState((s) => ({ ...s, permissionGranted: granted }));
    return granted;
  }, []);

  const requestPermission = useCallback(async () => {
    await openUsageAccessSettings();
    // Poll after user returns from settings
    const interval = setInterval(async () => {
      const granted = await hasUsageAccess();
      if (granted) {
        clearInterval(interval);
        setState((s) => ({ ...s, permissionGranted: true }));
      }
    }, 1000);
    // Stop polling after 60s
    setTimeout(() => clearInterval(interval), 60_000);
  }, []);

  const sync = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const result = await syncScreenTime(); // TODO implement sync

    if (result.status === "synced") {
      setState((s) => ({
        ...s,
        loading: false,
        report: result.report,
        formattedTotal: msToHoursAndMinutes(result.report.totalMs),
        permissionGranted: true,
      }));
    } else if (result.status === "permission_missing") {
      setState((s) => ({ ...s, loading: false, permissionGranted: false }));
    } else {
      setState((s) => ({ ...s, loading: false, error: result.message }));
    }
  }, []);

  // Check permission + sync on mount and when app foregrounds
  useEffect(() => {
    if (Platform.OS !== "android") return;
    sync();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });
    return () => sub.remove();
  }, [sync]);

  return {
    ...state,
    checkPermission,
    requestPermission,
    sync,
  };
}
