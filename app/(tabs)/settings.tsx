import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { styles } from "@/constants/settings.styles";
import commonTheme from "@/constants/theme";
import { OptionsRow } from "@/components/ui/OptionsRow";
import { OptionsGroup } from "@/components/ui/OptionsGroup";
import { ScreenTimePermissionModal } from "@/components/modals/ScreenTimePermissionModal";
import { InfoModal } from "@/components/modals/InfoModal";
import { ViewFamilyModal } from "@/components/modals/ViewFamilyModal";
import type { Stake } from "@/types/stakes";

export default function SettingsScreen() {
  const colors = useColors();
  const { user } = useUser();
  const { signOut, getToken } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);

  const [familyName, setFamilyName] = useState<string>("");
  const [loadingFamily, setLoadingFamily] = useState<boolean>(false);

  // Real data state trackers
  const [stakesCount, setStakesCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      console.error("Sign out failed:", e);
      setIsSigningOut(false);
    }
  };

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";

  const loadSettingsContext = async () => {
    const familyId = user?.publicMetadata?.familyId;
    if (!familyId) return;

    setLoadingFamily(true);
    try {
      const token = await getToken();

      // 1. Fetch Family Meta Context
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
      }

      // 2. Fetch Quests Dataset to derive live user metrics
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

        // Active stakes: Quests currently running on the board
        const activeStakes = rawQuests.filter(
          (q) => q.status === "available" || q.status === "active",
        );

        // Completed stakes: Finalized, paid out, or review-passed milestones
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
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: commonTheme.space["2xl"] },
        ]}
      >
        <Text
          style={[
            commonTheme.text.pageTitle,
            {
              color: colors.text,
              paddingHorizontal: commonTheme.space.sm,
              paddingBottom: commonTheme.space.lg,
            },
          ]}
        >
          Settings
        </Text>

        {/* Profile Card */}
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: colors.surface2 }]}
        >
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatarFallback,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.text }]}>
              {user?.fullName ?? "User"}
            </Text>
            <Text
              style={[styles.email, { color: colors.text }]}
              numberOfLines={1}
            >
              {user?.primaryEmailAddress?.emailAddress ?? "No email"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Stats Grid using real-time dataset boundaries */}
        <View style={styles.statsContainer}>
          <StatCard value={stakesCount} label="Stakes" colors={colors} />
          <StatCard value={completedCount} label="Completed" colors={colors} />
          <StatCard value="1" label="Streak" colors={colors} />
        </View>

        {/* Family */}
        <OptionsGroup label="Family link">
          <OptionsRow
            icon="heart"
            label={
              familyName ||
              (loadingFamily ? "Loading..." : "No Family Attached")
            }
            onPress={() => setShowFamilyModal(true)}
          />
          <OptionsRow
            icon="user-plus"
            label="Invite member"
            onPress={() => {}}
          />
        </OptionsGroup>

        {/* Permissions — only render group if on Android */}
        {Platform.OS === "android" && (
          <OptionsGroup label="Permissions">
            <OptionsRow
              icon="check-square"
              label="Screen time access"
              onPress={() => setShowPermModal(true)}
            />
            <OptionsRow
              icon="info"
              label="How does it work"
              onPress={() => setShowInfoModal(true)}
            />
          </OptionsGroup>
        )}

        {/* Danger zone */}
        <OptionsGroup label="Danger zone">
          <OptionsRow
            icon="log-out"
            label="Sign out"
            onPress={handleSignOut}
            isDestructive
          />
        </OptionsGroup>

        {showPermModal && (
          <ScreenTimePermissionModal
            visible={showPermModal}
            onClose={() => setShowPermModal(false)}
          />
        )}
        <InfoModal
          visible={showInfoModal}
          onClose={() => setShowInfoModal(false)}
        />
        <ViewFamilyModal
          visible={showFamilyModal}
          onClose={() => setShowFamilyModal(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  value,
  label,
  colors,
}: {
  value: string | number;
  label: string;
  colors: any;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface2 }]}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text
        style={[styles.statLabel, { color: colors.textMuted || colors.text }]}
      >
        {label}
      </Text>
    </View>
  );
}
