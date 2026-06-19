import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import type { Stake } from "@/types/stakes";
import GlobalEmptyState from "@/components/stakes/EmptyState";
import StakeSection from "@/components/stakes/StakeSection";
const STAKES: Stake[] = []; // [TODO] fetch from backend

export default function StakesScreen() {
  const colors = useColors();

  const activeStakes = STAKES.filter((s) => s.status === "active");
  const pendingStakes = STAKES.filter((s) => s.status === "pending");
  const doneStakes = STAKES.filter((s) => s.status === "done");

  const almostDoneCount = activeStakes.filter(
    (s) => s.daysLeft !== undefined && s.daysLeft <= 3,
  ).length;

  let tabBarHeight = 60;

  return (
    <SafeAreaView
      style={[commonTheme.layout.flex, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            commonTheme.layout.row,
            { alignItems: "center", gap: commonTheme.space.md },
          ]}
        >
          <Text
            style={[
              commonTheme.text.pageTitle,
              {
                color: colors.text,
                paddingHorizontal: commonTheme.space.sm,
                fontFamily: commonTheme.font.bold,
              },
            ]}
          >
            Stakes
          </Text>
          {almostDoneCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.surface2 }]}>
              <Feather name="clock" size={12} color={colors.text} />
              <Text style={[commonTheme.text.label, { color: colors.text }]}>
                {almostDoneCount} ending soon
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + commonTheme.space["2xl"] + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {STAKES.length === 0 ? (
          <GlobalEmptyState />
        ) : (
          <>
            <StakeSection
              title="Active"
              data={activeStakes}
              colors={colors}
              emptyMessage="No active stakes right now."
            />
            <StakeSection
              title="Pending Approval"
              data={pendingStakes}
              colors={colors}
              emptyMessage="No pending stakes."
            />
            <StakeSection
              title="Completed"
              data={doneStakes}
              colors={colors}
              emptyMessage="Finish a goal to see it here."
            />
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={[
          styles.fab,
          {
            backgroundColor: colors.surface2,
            bottom: tabBarHeight + commonTheme.space.lg,
          },
        ]}
        onPress={() => {}}
      >
        <Feather name="plus" size={24} color={colors.text} />
      </Pressable>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: commonTheme.space.lg,
    paddingTop: commonTheme.space.sm,
    paddingBottom: commonTheme.space.lg,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.xs,
    paddingHorizontal: commonTheme.space.md,
    paddingVertical: commonTheme.space.xs,
    borderRadius: commonTheme.rounded.full,
  },
  list: {
    paddingHorizontal: commonTheme.space.lg,
    gap: commonTheme.space.xl, // Space between sections
  },

  fab: {
    position: "absolute",
    right: commonTheme.space.lg,
    width: 56,
    height: 56,
    borderRadius: commonTheme.rounded.full,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});
