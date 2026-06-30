import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useState, useCallback, useRef } from "react";
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
import { mapStake } from "@/lib/mapStake";
import { useStakeChecker } from "@/hooks/useStakeChecker";
import { canCreateStake } from "@/lib/stakeChecker";

type UITabKey = "active" | "pending" | "completed";

const EMPTY_MESSAGES: Record<UITabKey, string> = {
  active: "No active stakes right now.",
  pending: "No stakes waiting for approval.",
  completed: "Finish a goal to see it here.",
};

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

  const fetchingRef = useRef(false);
  const finalizingRef = useRef(new Set<string>());

  // dialog state
  const [blockDialog, setBlockDialog] = useState({
    visible: false,
    message: "",
  });
  const [warnDialog, setWarnDialog] = useState({ visible: false, message: "" });

  const fetchStakes = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const token = await getTokenRef.current();
      if (!token) {
        throw new Error("Missing auth token.");
      }

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
      const message =
        e instanceof Error ? e.message : "Failed to fetch stakes.";
      console.log(message);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  const finalizeStake = useCallback(
    async (stakeId: string, status: "completed" | "failed") => {
      const finalizeKey = `${stakeId}:${status}`;
      if (finalizingRef.current.has(finalizeKey)) return;
      finalizingRef.current.add(finalizeKey);

      try {
        const token = await getTokenRef.current();
        if (!token) {
          throw new Error("Missing auth token.");
        }

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
        const body = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(body?.error ?? "Failed to update stake status.");
        }

        await fetchStakes();
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to update stake status.";
        console.log(message);
      } finally {
        finalizingRef.current.delete(finalizeKey);
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
      if (message?.toLowerCase().includes("usage access permission")) {
        setWarnDialog({
          visible: true,
          message: "Usage access is required to check this stake.",
        });
        return;
      }

      void finalizeStake(id, "failed");
      console.log("Stake failed", message ?? "You missed your goal.");
    },
    onWarn: (_id, message) => {
      setWarnDialog({
        visible: true,
        message: message ?? "You've exceeded today's screen time limit.",
      });
    },
    onUnsupported: (message) => {
      console.log("Screen time unavailable", message);
    },
    onError: (message) => {
      console.log("Stake checker error", message);
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

      <ConfirmDialog
        visible={blockDialog.visible}
        title="Can't create stake"
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
