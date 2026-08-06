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
import { useFocusEffect } from "expo-router";
import commonTheme from "@/constants/theme";
import { SplitTabs, TabItem } from "@/components/ui/SplitTabs";
import type { Stake } from "@/types/stakes";
import GlobalEmptyState from "@/components/stakes/EmptyState";
import StakeSection from "@/components/stakes/StakeSection";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorHandler } from "@/components/ui/ErrorHandler";
import { RefreshControl } from "react-native";
import { useStakeManagerContext } from "@/contexts/StakeManagerContext";
import { CreateStakeSheet } from "@/components/modals/CreateStakeSheet";
import type { CreateStakeSheetRef } from "@/components/modals/CreateStakeSheet";

type UITabKey = "active" | "pending" | "completed";

const EMPTY_MESSAGES: Record<UITabKey, string> = {
  active: "No active stakes right now.",
  pending: "No stakes waiting for approval.",
  completed: "Finish a goal to see it here.",
};

export default function StakesScreen() {
  const colors = useColors();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [activeTab, setActiveTab] = useState<UITabKey>("active");
  const createSheetRef = useRef<CreateStakeSheetRef>(null);
  const {
    stakes,
    loading,
    fetchError,
    fetchStakes,
    infoDialog,
    setInfoDialog,
  } = useStakeManagerContext();

  const [refreshing, setRefreshing] = useState(false);

  /**
   * Runs the pull-to-refresh request and always releases the native spinner.
   *
   * @returns A promise that resolves when the shared fetch operation settles.
   */
  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      await fetchStakes();
    } finally {
      setRefreshing(false);
    }
  }, [fetchStakes]);
  const platformWarnShown = useRef(false);

  const [blockDialog, setBlockDialog] = useState({
    visible: false,
    message: "",
  });

  // This warning is local to the list route, but the ref prevents development
  // re-renders from repeatedly interrupting the user with the same limitation.
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

  useFocusEffect(
    useCallback(() => {
      void fetchStakes();
    }, [fetchStakes]),
  );

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

  /**
   * Opens the creation sheet only when it cannot create a second active
   * screen-time evaluator for the same user.
   *
   * @returns Nothing; the blocking case is communicated through `blockDialog`.
   */
  const handleFABPress = (): void => {
    const hasActiveScreenTime = activeStakes.some(
      (s) => s.type === "screen-time",
    );

    if (hasActiveScreenTime) {
      setBlockDialog({
        visible: true,
        message:
          "You already have an active screen-time stake. Complete it before creating another.",
      });
      return;
    }
    createSheetRef.current?.present();
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

      {/* The provider owns retry/error state, so this screen only renders it. */}
      {!!fetchError && (
        <View style={styles.errorWrapper}>
          <ErrorHandler error={fetchError} type="text" onClear={() => {}} />
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.textMuted}
            progressBackgroundColor={colors.surface3}
            colors={[colors.primary]}
          />
        }
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

      <CreateStakeSheet ref={createSheetRef} onCreated={fetchStakes} />

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
