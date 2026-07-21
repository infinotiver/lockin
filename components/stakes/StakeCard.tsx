import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import type { Stake, StakeStatus } from "@/types/stakes";
import { router } from "expo-router";

type GlyphName = keyof typeof Feather.glyphMap;
type StatusUI = { text: string; icon: GlyphName; color: string };

const formatDuration = (ms: number): string => {
  if (!ms) return "0m";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
};

const formatDate = (isoDate?: string | null) => {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getStatusUI = (status: StakeStatus, colors: any): StatusUI => {
  const map: Record<string, StatusUI> = {
    active: { text: "In progress", icon: "clock", color: colors.primary },
    pending: { text: "In review", icon: "eye", color: colors.textMuted },
    completed: {
      text: "Won",
      icon: "check-circle",
      color: colors.success || colors.primary,
    },
    failed: { text: "Failed", icon: "x-circle", color: colors.destructive },
    rejected: { text: "Rejected", icon: "slash", color: colors.destructive },
  };

  return (
    map[status] || {
      text: "Available",
      icon: "circle",
      color: colors.textMuted,
    }
  );
};

const getRuleDescription = (stake: Stake): string | null => {
  const isScreenTime =
    stake.rule?.type === "screen_time_limit" ||
    (typeof stake.description === "object" &&
      stake.description?.type === "screen_time_limit");

  if (isScreenTime && stake.rule) {
    const duration = formatDuration(stake.rule.limitMs || 0);
    const scope = stake.rule.scope || "app";
    return `${duration} daily limit on ${scope}`;
  }

  return typeof stake.description === "string" ? stake.description : null;
};

export default function StakeCard({ stake }: { stake: Stake }) {
  const colors = useColors();
  const statusUI = getStatusUI(stake.status, colors);

  const dueDate = formatDate(stake.expires_at);
  const ruleText = getRuleDescription(stake);

  return (
    <Pressable
      onPress={() => {
        router.push({
          pathname: "/stake/[id]",
          params: { id: String(stake.id) },
        });
      }}
    >
      <View
        style={[
          styles.cardContainer,
          {
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.rowBetween}>
          <View style={styles.textColumn}>
            {stake.type && (
              <Text
                style={[
                  commonTheme.text.caption,
                  { color: colors.textMuted, marginBottom: 2 },
                ]}
              >
                {stake.type.toUpperCase()}
              </Text>
            )}
            <Text
              style={[commonTheme.text.sectionTitle, { color: colors.text }]}
            >
              {stake.title}
            </Text>
          </View>

          <Text style={[commonTheme.text.amountLarge, { color: colors.text }]}>
            ₹{stake.reward}
          </Text>
        </View>

        {ruleText && (
          <Text
            style={[styles.description, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {ruleText}
          </Text>
        )}

        <View style={[styles.rowBetween, { marginTop: commonTheme.space.sm }]}>
          <View style={styles.statusBadge}>
            <Feather name={statusUI.icon} size={14} color={statusUI.color} />
            <Text style={[styles.statusText, { color: statusUI.color }]}>
              {statusUI.text}
            </Text>
          </View>

          {dueDate && (
            <Text
              style={[commonTheme.text.caption, { color: colors.textMuted }]}
            >
              Due {dueDate}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: commonTheme.space.md,
    borderRadius: commonTheme.rounded.lg,
    gap: commonTheme.space.xs,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  textColumn: {
    flex: 1,
    paddingRight: commonTheme.space.md,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontFamily: commonTheme.font.medium,
  },
});
