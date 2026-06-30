import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useState, useCallback, useRef, useEffect } from "react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import commonTheme from "@/constants/theme";
import { SplitTabs, TabItem } from "@/components/ui/SplitTabs";
import type { Stake } from "@/types/stakes";
import GlobalEmptyState from "@/components/stakes/EmptyState";
import StakeSection from "@/components/stakes/StakeSection";
import { CreateStakeModal } from "@/components/modals/CreateStakeModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorHandler } from "@/components/ui/ErrorHandler";
import { mapStake } from "@/lib/mapStake";
import { useStakeChecker } from "@/hooks/useStakeChecker";
import { canCreateStake } from "@/lib/stakeChecker";

type UITabKey = "active" | "pending" | "completed";

const EMPTY_MESSAGES: Record<UITabKey, string> = {
  active: "No active stakes right now.",
  pending: "No stakes waiting for approval.",
  completed: "Finish a goal to see it here.",
};

// key used to track if the platform warning has been shown this session
const PLATFORM_WARN_KEY = "stakes_platform_warn_shown";

export default function StakesScreen() {
  const colors = useColors();
  const { getToken } = useAuth();
  const router = useRouter();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [activeTab, setActiveTab] = useState<UITabKey>("active");
  const [showCreate, setShowCreate] = useState(false);
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const fetchingRef = useRef(false);
  const finalizingRef = useRef(new Set<string>());
  const platformWarnShown = useRef(false);

  const [blockDialog, setBlockDialog] = useState({
    visible: false,
    message: "",
  });
  const [warnDialog, setWarnDialog] = useState({ visible: false, message: "" });
  const [infoDialog, setInfoDialog] = useState({
    visible: false,
    title: "",
    message: "",
  });

  // show platform warning once per session on non-Android
  useEffect(() => {
    if (Platform.OS !== "android" && !platformWarnShown.current) {
      platformWarnShown.current = true;
      setInfoDialog({
        visible: true,
        title: "Android only",
        message:
          "Screen time tracking is only available on Android. Stakes will be visible but automatic verification won't run on this device.",
      });
    }
  }, []);

  const fetchStakes = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setFetchError("");

    try {
      const token = await getTokenRef.current();
      if (!token) throw new Error("Missing auth token.");

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/quests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to fetch stakes.");
      }

      const body = await res.json();
      setStakes((body.quests || []).map((q: any) => mapStake(q)));
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to fetch stakes.");
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  const finalizeStake = useCallback(
    async (stakeId: string, status: "completed" | "failed") => {
      const key = `${stakeId}:${status}`;
      if (finalizingRef.current.has(key)) return;
      finalizingRef.current.add(key);

      try {
        const token = await getTokenRef.current();
        if (!token) throw new Error("Missing auth token.");

        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/quests/${stakeId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
          },
        );

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to update stake.");
        }

        await fetchStakes();

        if (status === "completed") {
          setInfoDialog({
            visible: true,
            title: "Stake complete 🎉",
            message: "You hit your goal. The reward has been marked as yours.",
          });
        }
      } catch (e) {
        setWarnDialog({
          visible: true,
          message:
            e instanceof Error ? e.message : "Failed to update stake status.",
        });
      } finally {
        finalizingRef.current.delete(key);
      }
    },
    [fetchStakes],
  );

  useFocusEffect(
    useCallback(() => {
      void fetchStakes();
    }, [fetchStakes]),
  );

  useStakeChecker({
    stakes,
    onComplete: (id) => {
      void finalizeStake(id, "completed");
    },
    onFail: (id, message) => {
      const isPermission = message?.toLowerCase().includes("usage access");
      if (isPermission) {
        setInfoDialog({
          visible: true,
          title: "Permission required",
          message:
            "Usage access was revoked. Re-enable it in Settings → Permissions to keep your stake active.",
        });
        return;
      }
      void finalizeStake(id, "failed");
      setWarnDialog({
        visible: true,
        message:
          message ??
          "You missed your goal. The stake has been marked as failed.",
      });
    },
    onWarn: (_id, message) => {
      setWarnDialog({
        visible: true,
        message: message ?? "You've exceeded today's screen time limit.",
      });
    },
    onUnsupported: (_message) => {
      // already handled by the one-time platform warning on mount
    },
    onError: (message) => {
      // only surface checker errors if there are active screen-time stakes
      const hasActiveScreenTime = stakes.some(
        (s) => s.status === "active" && s.type === "screen-time",
      );
      if (hasActiveScreenTime) {
        setWarnDialog({
          visible: true,
          message:
            message ?? "Could not run stake check. Will retry next time.",
        });
      }
    },
  });

  const activeStakes = stakes.filter((s) => s.status === "active");
  const pendingStakes = stakes.filter((s) => s.status === "pending");
  const doneStakes = stakes.filter(
    (s) =>
      s.status === "completed" ||
      s.status === "rejected" ||
      s.status === "failed",
  );

  const tabs: TabItem<UITabKey>[] = [
    { key: "active", label: "Active", count: activeStakes.length || undefined },
    {
      key: "pending",
      label: "Pending",
      count: pendingStakes.length || undefined,
    },
    { key: "completed", label: "Done", count: doneStakes.length || undefined },
  ];

  const visibleStakes =
    activeTab === "active"
      ? activeStakes
      : activeTab === "pending"
        ? pendingStakes
        : doneStakes;

  const handleFABPress = () => {
    const { allowed, reason } = canCreateStake(stakes, "screen-time");
    if (!allowed) {
      setBlockDialog({
        visible: true,
        message: reason ?? "You already have an active stake.",
      });
      return;
    }
    setShowCreate(true);
  };

  return (
    <SafeAreaView
      style={[commonTheme.layout.flex, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text
          style={[
            commonTheme.text.pageTitle,
            { color: colors.text, fontFamily: commonTheme.font.bold },
          ]}
        >
          Stakes
        </Text>
        <Pressable
          style={[styles.fab, { backgroundColor: colors.surface2 }]}
          onPress={handleFABPress}
        >
          <Feather name="plus" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Fetch error — inline, dismissable */}
      {!!fetchError && (
        <View style={styles.errorWrapper}>
          <ErrorHandler
            error={fetchError}
            type="text"
            onClear={() => setFetchError("")}
          />
        </View>
      )}

      <View style={styles.tabsWrapper}>
        <SplitTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: commonTheme.space["2xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading && stakes.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={colors.textMuted} />
          </View>
        ) : stakes.length === 0 ? (
          <GlobalEmptyState />
        ) : visibleStakes.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {EMPTY_MESSAGES[activeTab]}
            </Text>
          </View>
        ) : (
          <StakeSection
            title=""
            data={visibleStakes}
            colors={colors}
            emptyMessage={EMPTY_MESSAGES[activeTab]}
          />
        )}
      </ScrollView>

      <CreateStakeModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchStakes}
      />

      {/* Block: can't create another stake */}
      <ConfirmDialog
        visible={blockDialog.visible}
        title="One stake at a time"
        message={blockDialog.message}
        primary={{
          label: "Got it",
          onPress: () => setBlockDialog({ visible: false, message: "" }),
        }}
        secondary={{
          label: "View active",
          variant: "ghost",
          onPress: () => {
            setActiveTab("active");
            setBlockDialog({ visible: false, message: "" });
          },
        }}
        onDismiss={() => setBlockDialog({ visible: false, message: "" })}
      />

      {/* Warn: over limit or stake failed */}
      <ConfirmDialog
        visible={warnDialog.visible}
        title="Heads up"
        message={warnDialog.message}
        primary={{
          label: "Dismiss",
          onPress: () => setWarnDialog({ visible: false, message: "" }),
        }}
        secondary={{
          label: "View records",
          variant: "ghost",
          onPress: () => {
            setWarnDialog({ visible: false, message: "" });
            router.push("/(tabs)/records");
          },
        }}
        onDismiss={() => setWarnDialog({ visible: false, message: "" })}
      />

      {/* Info: platform notice, completion, permission */}
      <ConfirmDialog
        visible={infoDialog.visible}
        title={infoDialog.title}
        message={infoDialog.message}
        primary={{
          label: "Got it",
          onPress: () =>
            setInfoDialog({ visible: false, title: "", message: "" }),
        }}
        secondary={{
          label: "Settings",
          variant: "ghost",
          onPress: () => {
            setInfoDialog({ visible: false, title: "", message: "" });
            router.push("/(tabs)/settings");
          },
        }}
        onDismiss={() =>
          setInfoDialog({ visible: false, title: "", message: "" })
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: commonTheme.space.lg,
    paddingTop: commonTheme.space.sm,
    paddingBottom: commonTheme.space.md,
  },
  fab: {
    width: 40,
    height: 40,
    borderRadius: commonTheme.rounded.full,
    justifyContent: "center",
    alignItems: "center",
  },
  errorWrapper: {
    paddingHorizontal: commonTheme.space.lg,
    paddingBottom: commonTheme.space.sm,
  },
  tabsWrapper: {
    paddingHorizontal: commonTheme.space.lg,
    paddingBottom: commonTheme.space.md,
  },
  list: {
    paddingHorizontal: commonTheme.space.lg,
    gap: commonTheme.space.xl,
  },
  center: {
    paddingTop: commonTheme.space["2xl"],
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.4,
    fontFamily: commonTheme.font.body,
  },
});
