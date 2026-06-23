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
import { useState, useCallback } from "react";
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

type UITabKey = "active" | "pending" | "completed";

export default function StakesScreen() {
  const colors = useColors();
  const { getToken } = useAuth();
  const { user } = useUser();

  // 2. State now strictly accepts the UI keys
  const [activeTab, setActiveTab] = useState<UITabKey>("active");
  const [showCreate, setShowCreate] = useState(false);

  const [stakes, setStakes] = useState<Stake[]>([]);
  const [loading, setLoading] = useState(false);

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
          familyId: (user?.publicMetadata?.familyId as string) || "",
          id: q.id,
          title: q.title || "Untitled Goal",
          reward: Number(q.reward) || 0,
          status: q.status as StakeStatus,
          type: q.type,
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

  const activeStakes = stakes.filter(
    (s) => s.status === "available" || s.status === "active",
  );
  const pendingStakes = stakes.filter((s) => s.status === "completed");
  const doneStakes = stakes.filter(
    (s) =>
      s.status === "approved" ||
      s.status === "rejected" ||
      s.status === "expired",
  );

  // 3. Tab definitions now strictly adhere to TabItem<UITabKey>
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

  // 4. Record indexed safely to the UI keys
  const emptyMessages: Record<UITabKey, string> = {
    active: "No active stakes right now.",
    pending: "No stakes waiting for approval.",
    completed: "Finish a goal to see it here.",
  };

  return (
    <SafeAreaView
      style={[commonTheme.layout.flex, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
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
        onCreated={fetchStakes}
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
