import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Image,
  RefreshControl,
  ScrollView,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Coins, Plus, SwordsIcon, TrophyIcon } from "lucide-react-native";
import { useState, useCallback, useRef, useEffect } from "react";
import { useColors } from "@/hooks/useColors";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import commonTheme from "@/constants/theme";
import { AppBar } from "@/components/ui/AppBar";
import { SplitTabs, TabItem } from "@/components/ui/SplitTabs";
import GlobalEmptyState from "@/components/stakes/EmptyState";
import StakeSection from "@/components/stakes/StakeSection";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorHandler } from "@/components/ui/ErrorHandler";
import { useStakeManagerContext } from "@/contexts/StakeManagerContext";
import { CreateStakeSheet } from "@/components/modals/CreateStakeSheet";
import type { CreateStakeSheetRef } from "@/components/modals/CreateStakeSheet";
import { MAX_ACTIVE_COIN_STAKES } from "@/constants/coinEconomy";
import { useCoins } from "@/contexts/CoinsContext";

type UITabKey = "active" | "completed";

const EMPTY_MESSAGES: Record<UITabKey, string> = {
  active: "No active stakes right now.",
  completed: "Finish a goal to see it here.",
};

export default function StakesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { balance } = useCoins();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const { user } = useUser();

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
  const [platformWarnShown, setPlatformWarnShown] = useState(false);

  const [blockDialog, setBlockDialog] = useState({
    visible: false,
    message: "",
  });

  const [familyName, setFamilyName] = useState<string>("");
  const [familyCode, setFamilyCode] = useState<string>("");
  const [loadingFamily, setLoadingFamily] = useState<boolean>(false);
  const [familyLoadError, setFamilyLoadError] = useState(false);

  const [stakesCount, setStakesCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);

    try {
      await fetchStakes();
    } finally {
      setRefreshing(false);
    }
  }, [fetchStakes]);

  useEffect(() => {
    if (Platform.OS !== "android" && !platformWarnShown) {
      setPlatformWarnShown(true);
      setInfoDialog({
        visible: true,
        title: "Android only",
        message:
          "Screen time tracking is only available on Android. Stakes will be visible but automatic verification won't run on this device.",
      });
    }
  }, [platformWarnShown, setInfoDialog]);

  useFocusEffect(
    useCallback(() => {
      void fetchStakes();
    }, [fetchStakes]),
  );

  const activeStakes = stakes.filter(
    (s) => s.status === "active" || s.status === "pending",
  );

  const doneStakes = stakes.filter(
    (s) =>
      s.status === "completed" ||
      s.status === "rejected" ||
      s.status === "failed",
  );

  const tabs: TabItem<UITabKey>[] = [
    {
      key: "active",
      label: "Active",
      count: activeStakes.length || undefined,
    },
    {
      key: "completed",
      label: "Past",
      count: doneStakes.length || undefined,
    },
  ];

  const visibleStakes = activeTab === "active" ? activeStakes : doneStakes;

  const handleFABPress = (): void => {
    const activeCoinStakeCount = activeStakes.filter(
      (stake) => stake.wagerCoins !== undefined,
    ).length;

    if (activeCoinStakeCount >= MAX_ACTIVE_COIN_STAKES) {
      setBlockDialog({
        visible: true,
        message: `You can run ${MAX_ACTIVE_COIN_STAKES} coin stakes at once. Complete one before creating another.`,
      });
      return;
    }

    createSheetRef.current?.present();
  };

  const initials = user?.firstName?.[0]?.toUpperCase() ?? "U";

  const loadSettingsContext = async () => {
    const familyId = user?.publicMetadata?.familyId;

    if (!familyId) {
      setFamilyName("");
      setFamilyCode("");
      setStakesCount(0);
      setCompletedCount(0);
      setFamilyLoadError(false);
      return;
    }

    setLoadingFamily(true);
    setFamilyLoadError(false);

    try {
      const token = await getToken();

      const familyRes = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/families`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (familyRes.ok) {
        const data = await familyRes.json();
        setFamilyName(data.family?.name || "");
        setFamilyCode(data.family?.code || "");
      } else {
        setFamilyName("");
        setFamilyCode("");
        setFamilyLoadError(true);
      }

      const questsRes = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/quests`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (questsRes.ok) {
        const body = await questsRes.json();
        const rawQuests: any[] = body.quests || [];

        const activeStakes = rawQuests.filter(
          (q) => q.status === "available" || q.status === "active",
        );

        const finishedStakes = rawQuests.filter(
          (q) => q.status === "completed" || q.status === "approved",
        );

        setStakesCount(activeStakes.length);
        setCompletedCount(finishedStakes.length);
      }
    } catch (e) {
      console.error("[SettingsScreen] Context aggregation failed:", e);
    } finally {
      setLoadingFamily(false);
    }
  };

  useEffect(() => {
    loadSettingsContext();
  }, [user?.publicMetadata?.familyId]);

  return (
    <SafeAreaView
      style={[commonTheme.layout.flex, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <AppBar title="LockIn" />

      <View style={styles.profileSection}>
        {user?.imageUrl ? (
          <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              commonTheme.layout.center,
              { backgroundColor: colors.surfaceContainerHigh },
            ]}
          >
            <Text style={[commonTheme.text.cardTitle, { color: colors.text }]}>
              {initials}
            </Text>
          </View>
        )}

        <Text
          style={[commonTheme.text.sectionTitle, { color: colors.textMuted }]}
        >
          {user?.firstName ? `Hey, ${user.firstName}` : "Welcome back"}
        </Text>

        <View style={styles.statsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${balance === null ? "Balance loading" : `${balance.toLocaleString()} coins`}. Open wallet`}
            onPress={() => router.push("/")}
            style={({ pressed }) => [
              styles.statPill,
              {
                backgroundColor: pressed
                  ? colors.surfaceContainerHighest
                  : colors.surfaceContainerHigh,
              },
            ]}
          >
            <Coins size={commonTheme.fontSize["3xl"]} color={colors.primary} />
            <Text style={[commonTheme.text.bodyStrong, { color: colors.text }]}>
              Coins
            </Text>
            <Text
              numberOfLines={1}
              style={[commonTheme.text.bodyStrong, { color: colors.primary }]}
            >
              {balance === null ? "..." : balance.toLocaleString()}
            </Text>
          </Pressable>


          <View
            style={[
              styles.statPill,
              { backgroundColor: colors.surfaceContainerHigh },
            ]}
          >
            <TrophyIcon
              size={commonTheme.fontSize["3xl"]}
              color={colors.primary}
            />
            <Text style={[commonTheme.text.bodyStrong, { color: colors.text }]}>
              Won
            </Text>
            <Text
              style={[commonTheme.text.bodyStrong, { color: colors.primary }]}
            >
              {completedCount}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[styles.sheet, { backgroundColor: colors.surfaceContainerLow }]}
      >
        {!!fetchError && (
          <View style={styles.errorWrapper}>
            <ErrorHandler error={fetchError} type="text" onClear={() => {}} />
          </View>
        )}

        <View style={styles.controlsRow}>
          <View style={commonTheme.layout.flex}>
            <SplitTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </View>

          <Pressable
            style={[
              commonTheme.layout.row,
              commonTheme.layout.center,
              styles.createButton,
              {
                backgroundColor: colors.primary,
                gap: commonTheme.space.xs,
              },
            ]}
            onPress={handleFABPress}
          >
            <Plus
              size={commonTheme.fontSize["3xl"]}
              color={colors.background}
            />

            <Text
              style={[
                commonTheme.text.bodyStrong,
                { color: colors.background },
              ]}
            >
              Create
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom:
                64 + Math.max(insets.bottom, 16) + commonTheme.space.sm,
            },
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
              <Text
                style={[commonTheme.text.caption, { color: colors.textMuted }]}
              >
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
      </View>

      <CreateStakeSheet
        ref={createSheetRef}
        onCreated={fetchStakes}
        activeCoinStakeCount={
          activeStakes.filter((stake) => stake.wagerCoins !== undefined).length
        }
      />

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
  profileSection: {
    alignItems: "center",
    paddingHorizontal: commonTheme.space.xl,
    paddingBottom: commonTheme.space.xl,
    gap: commonTheme.space.sm,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: commonTheme.rounded.full,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: commonTheme.space.sm,
    paddingTop: commonTheme.space.xs,
  },

  statPill: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: commonTheme.space.sm,
    minHeight: 40,
    paddingHorizontal: commonTheme.space.md,
    borderRadius: commonTheme.rounded.full,
  },
  createButton: {
    alignSelf: "flex-end",
    paddingHorizontal: commonTheme.space.lg,
    paddingVertical: commonTheme.space.md,
    borderRadius: commonTheme.rounded.full,
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: commonTheme.rounded["2xl"],
    borderTopRightRadius: commonTheme.rounded["2xl"],
    paddingTop: commonTheme.space.xl,
  },

  errorWrapper: {
    paddingHorizontal: commonTheme.space.xl,
    paddingBottom: commonTheme.space.md,
  },

  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.md,
    paddingHorizontal: commonTheme.space.xl,
    paddingBottom: commonTheme.space.xl,
  },

  list: {
    paddingHorizontal: commonTheme.space.xl,
    gap: commonTheme.space.xl,
  },

  center: {
    paddingTop: commonTheme.space["2xl"],
    alignItems: "center",
  },
});
