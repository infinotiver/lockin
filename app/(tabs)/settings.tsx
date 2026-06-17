import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { styles } from "@/constants/settings.styles";
import commonTheme from "@/constants/theme";

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
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingBottom: commonTheme.space.xl,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text
          style={[
            commonTheme.text.sectionTitle,

            {
              color: colors.text,
              paddingHorizontal: commonTheme.space.sm,
              paddingBottom: commonTheme.space.lg,
              fontFamily: commonTheme.font.monoBold,
            },
          ]}
        >
          Settings
        </Text>
        {/* Profile Card Header */}
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
          <Feather
            name="chevron-right"
            size={20}
            color={colors.text}
            style={styles.chevron}
          />
        </TouchableOpacity>

        {/* Section: Family Link */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>
          Family link
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface2 }]}>
          <SettingsRow
            icon="heart"
            label="Family centre"
            colors={colors}
            onPress={() => {}}
          />
          <SectionDivider colors={colors} />
          <SettingsRow
            icon="user-plus"
            label="Invite member"
            colors={colors}
            onPress={() => {}}
          />
          <SectionDivider colors={colors} />
        </View>

        {/* Section: Permissions & About */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>
          Permissions
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface2 }]}>
          <SettingsRow
            icon="check-square"
            label="Screen time access"
            colors={colors}
            onPress={() => router.push("/(onboarding)/screen-time-permission")}
          />
          <SectionDivider colors={colors} />
          {/* <SettingsRow
            icon="info"
            label="About us"
            colors={colors}
            onPress={() => {}}
          /> */}
          <SectionDivider colors={colors} />
        </View>

        {/* Section: Danger Zone */}
        <View
          style={[
            styles.cardGroup,
            {
              backgroundColor: colors.surface2,
              marginTop: commonTheme.space.lg,
            },
          ]}
        >
          <SettingsRow
            icon="log-out"
            label="Sign out"
            colors={colors}
            onPress={handleSignOut}
            isDestructive
          />
        </View>
      </ScrollView>
    </View>
  );
}
function SettingsRow({
  icon,
  label,
  onPress,
  colors,
  rightElement,
  isDestructive = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
  colors: any;
  rightElement?: React.ReactNode;
  isDestructive?: boolean;
}) {
  const content = (
    <>
      <Feather
        name={icon}
        size={20}
        color={isDestructive ? "#FF3B30" : colors.textMuted}
        style={styles.rowIcon}
      />
      <Text
        style={[
          styles.rowLabel,
          { color: isDestructive ? "#FF3B30" : colors.text },
        ]}
      >
        {label}
      </Text>
      <View style={styles.rowRight}>
        {rightElement
          ? rightElement
          : onPress && (
              <Feather
                name="chevron-right"
                size={18}
                color={colors.text}
                style={styles.chevron}
              />
            )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.row} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

function SectionDivider({ colors }: { colors: any }) {
  return (
    <View style={[styles.separator, { backgroundColor: colors.border }]} />
  );
}
