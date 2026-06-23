import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { SplitTabs, TabItem } from "@/components/ui/SplitTabs";
import type { Stake, StakeStatus } from "@/types/stakes";
import GlobalEmptyState from "@/components/stakes/EmptyState";
import StakeSection from "@/components/stakes/StakeSection";
import { CreateStakeModal } from "@/components/modals/CreateStakeModal";
const STAKE_TABS: TabItem<StakeStatus>[] = [
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "done", label: "Done" },
];

const STAKES: Stake[] = []; // [TODO] fetch from backend

export default function StakesScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<StakeStatus>("active");
  const [showCreate, setShowCreate] = useState(false);
  const activeStakes = STAKES.filter((s) => s.status === "active");
  const pendingStakes = STAKES.filter((s) => s.status === "pending");
  const doneStakes = STAKES.filter((s) => s.status === "done");

  const almostDoneCount = activeStakes.filter(
    (s) => s.daysLeft !== undefined && s.daysLeft <= 3,
  ).length;

  const tabBarHeight = 60;

  // Build tabs with counts
  const tabs: TabItem<StakeStatus>[] = [
    { key: "active", label: "Active", count: activeStakes.length || undefined },
    {
      key: "pending",
      label: "Pending",
      count: pendingStakes.length || undefined,
    },
    { key: "done", label: "Done", count: doneStakes.length || undefined },
  ];

  const visibleStakes =
    activeTab === "active"
      ? activeStakes
      : activeTab === "pending"
        ? pendingStakes
        : doneStakes;

  const emptyMessages: Record<StakeStatus, string> = {
    active: "No active stakes right now.",
    pending: "No stakes waiting for approval.",
    done: "Finish a goal to see it here.",
    // failed: "No failed stakes.",
  };

  return (
    <SafeAreaView
      style={[commonTheme.layout.flex, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={commonTheme.layout.row}>
          <Text
            style={[
              commonTheme.text.pageTitle,
              {
                color: colors.text,
                fontFamily: commonTheme.font.bold,
              },
            ]}
          >
            Stakes
          </Text>

          {almostDoneCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.surface2 }]}>
              <Feather name="clock" size={11} color={colors.text} />
              <Text style={[commonTheme.text.label, { color: colors.text }]}>
                {almostDoneCount} ending soon
              </Text>
            </View>
          )}
        </View>

        <Pressable
          style={[styles.fab, { backgroundColor: colors.surface2 }]}
          onPress={() => setShowCreate(true)}
        >
          <Feather name="plus" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabsWrapper}>
        <SplitTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>

      {/* ── Content ── */}
      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + commonTheme.space["2xl"] + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {STAKES.length === 0 ? (
          <GlobalEmptyState />
        ) : visibleStakes.length === 0 ? (
          <View style={styles.inlineEmpty}>
            <Text style={[styles.inlineEmptyText, { color: colors.text }]}>
              {emptyMessages[activeTab]}
            </Text>
          </View>
        ) : (
          <StakeSection
            title=""
            data={visibleStakes}
            colors={colors}
            emptyMessage={emptyMessages[activeTab]}
          />
        )}
      </ScrollView>
      <CreateStakeModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        familyId={"yourFamilyId"}
        onCreated={() => {
          // refetch stakes
        }}
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
    gap: commonTheme.space.md,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.xs,
    paddingHorizontal: commonTheme.space.md,
    paddingVertical: commonTheme.space.xs,
    borderRadius: commonTheme.rounded.full,
    marginLeft: commonTheme.space.sm,
  },
  tabsWrapper: {
    paddingHorizontal: commonTheme.space.lg,
    paddingBottom: commonTheme.space.md,
  },
  list: {
    paddingHorizontal: commonTheme.space.lg,
    gap: commonTheme.space.xl,
  },
  fab: {
    width: 40,
    height: 40,
    borderRadius: commonTheme.rounded.full,
    justifyContent: "center",
    alignItems: "center",
  },
  inlineEmpty: {
    paddingTop: commonTheme.space["2xl"],
    alignItems: "center",
  },
  inlineEmptyText: {
    fontSize: 14,
    opacity: 0.4,
    fontFamily: commonTheme.font.body,
  },
});
