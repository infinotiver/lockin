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
import { useState, useEffect, useCallback } from "react";
import { useColors } from "@/hooks/useColors";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useFocusEffect } from "expo-router";
import commonTheme from "@/constants/theme";
import { SplitTabs, TabItem } from "@/components/ui/SplitTabs";
import type { Stake, StakeStatus } from "@/types/stakes";
import GlobalEmptyState from "@/components/stakes/EmptyState";
import StakeSection from "@/components/stakes/StakeSection";
import { CreateStakeModal } from "@/components/modals/CreateStakeModal";

const tabBarHeight = 60;

export default function StakesScreen() {
  const colors = useColors();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<StakeStatus>("active");
  const [showCreate, setShowCreate] = useState(false);

  // Dynamic fetch states
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [loading, setLoading] = useState(false);

  const translateStatus = (dbStatus: string): StakeStatus => {
    const s = (dbStatus || "").toLowerCase();
    if (s === "available" || s === "active") return "active";
    if (s === "completed" || s === "pending") return "pending";
    if (s === "approved" || s === "done") return "completed";
    return "active"; // Safe default
  };

  const translateCategory = (dbType: string): Stake["category"] => {
    const t = (dbType || "").toLowerCase();
    if (t === "screen-time") return "Screen Time";
    if (t === "study") return "Reading";
    if (t === "chore" || t === "work") return "Exercise";
    return "Custom";
  };

  const fetchStakes = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/quests`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      const body = await res.json();

      const mappedStakes: Stake[] = (body.quests || []).map((q: any): Stake => {
        let derivedDays = 0;
        if (q.expires_at) {
          const diff = new Date(q.expires_at).getTime() - Date.now();
          derivedDays = Math.max(0, Math.ceil(diff / 86400000));
        }

        return {
          familyId: user?.publicMetadata?.familyId,
          id: q.id,
          title: q.title || "Untitled Goal",
          reward: Number(q.reward) || 0,
          status: translateStatus(q.status),
          category: translateCategory(q.type),
          streak: 0,
        };
      });

      setStakes(mappedStakes);
    } catch (e) {
      console.error("[StakesScreen] Translation mapping failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStakes();
    }, []),
  );
  const activeStakes = stakes.filter((s) => s.status === "active");
  const pendingStakes = stakes.filter((s) => s.status === "pending");
  const doneStakes = stakes.filter((s) => s.status === "completed");

  const tabs: TabItem<StakeStatus>[] = [
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

  const emptyMessages: Record<StakeStatus, string> = {
    active: "No active stakes right now.",
    pending: "No stakes waiting for approval.",
    completed: "Finish a goal to see it here.",
  };

  return (
    <SafeAreaView
      style={[commonTheme.layout.flex, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={commonTheme.layout.row}>
          <Text
            style={[
              commonTheme.text.pageTitle,
              { color: colors.text, fontFamily: commonTheme.font.bold },
            ]}
          >
            Stakes
          </Text>
        </View>

        <Pressable
          style={[styles.fab, { backgroundColor: colors.surface2 }]}
          onPress={() => setShowCreate(true)}
        >
          <Feather name="plus" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <SplitTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>

      {/* Content Stack */}
      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + commonTheme.space["2xl"] + 40 },
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
        onCreated={fetchStakes} // Callback directly triggers atomic refresh window
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
  center: {
    paddingTop: commonTheme.space["2xl"],
    alignItems: "center",
  },
});
