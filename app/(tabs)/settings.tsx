import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { styles } from "@/constants/settings.styles";
import commonTheme from "@/constants/theme";
import { OptionsRow } from "@/components/ui/OptionsRow";
import { OptionsGroup } from "@/components/ui/OptionsGroup";

export default function SettingsScreen() {
  const colors = useColors();
  const { user } = useUser();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

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

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard value="2" label="Stakes" colors={colors} />
          <StatCard value="5" label="Completed" colors={colors} />
          <StatCard value="1" label="Streak" colors={colors} />
        </View>

        {/* Family */}
        <OptionsGroup label="Family link">
          <OptionsRow icon="heart" label="Family centre" onPress={() => {}} />
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
              onPress={() =>
                router.push("/(onboarding)/screen-time-permission")
              }
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
