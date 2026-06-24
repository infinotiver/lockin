import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import type { Stake, StakeStatus } from "@/types/stakes";
import { router } from "expo-router";

type GlyphName = keyof typeof Feather.glyphMap;

const getStatusUI = (status: StakeStatus, colors: any) => {
  switch (status) {
    case "active":
      return { text: "In progress", icon: "clock", color: colors.primary };
    case "pending":
      return { text: "In review", icon: "eye", color: colors.text };
    case "completed":
      return { text: "Won", icon: "check-circle", color: "#34C759" };
    case "failed":
      return { text: "Failed", icon: "x-circle", color: colors.destructive };
    case "rejected":
      return { text: "Rejected", icon: "slash", color: colors.destructive };
  }
};

// 2. Zero-dependency date formatter ("2026-10-12T..." -> "Oct 12")
const formatDate = (isoDate?: string | null) => {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function StakeCard({ stake }: { stake: Stake }) {
  const colors = useColors();
  const statusUI = getStatusUI(stake.status, colors);

  const startDate = formatDate(stake.created_at);
  const dueDate = formatDate(stake.expires_at);

  return (
    <TouchableOpacity
      style={[
        commonTheme.layout.card,
        styles.cardContainer,
        { backgroundColor: colors.surface2, borderColor: colors.surface1 },
      ]}
      activeOpacity={0.85}
    >
      {/* Header Row: Category Pill & Amount */}
      <View style={commonTheme.layout.rowBetween}>
        <View style={[styles.typePill, { backgroundColor: colors.surface1 }]}>
          <Text style={[styles.typeText, { color: colors.textMuted }]}>
            {stake.type?.toUpperCase() || "QUEST"}
          </Text>
        </View>
        <Text style={[commonTheme.text.amount, { color: colors.text }]}>
          ₹{stake.reward}
        </Text>
      </View>

      {/* Body: Title & Optional 2-Line Description */}
      <View style={styles.body}>
        <Text style={[commonTheme.text.cardTitle, { color: colors.text }]}>
          {stake.title}
        </Text>
        {stake.description ? (
          <Text
            style={[styles.description, { color: colors.textMuted }]}
            numberOfLines={2}
          >
            {stake.description}
          </Text>
        ) : null}
      </View>

      {/* Timestamps Row (Auto-collapses if no dates exist) */}
      {(startDate || dueDate) && (
        <View style={styles.dateRow}>
          <Feather name="calendar" size={12} color={colors.textMuted} />
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {startDate ? `${startDate} ` : ""}
            {startDate && dueDate ? "→ " : ""}
            {dueDate ? `Due ${dueDate}` : ""}
          </Text>
        </View>
      )}

      <View style={[styles.divider, { backgroundColor: colors.surface1 }]} />

      {/* Footer Row: Status Pill (Left) & Nav Action (Right) */}
      <View style={commonTheme.layout.rowBetween}>
        <View style={[commonTheme.layout.row, styles.alignCenter, { gap: 6 }]}>
          <Feather name={statusUI.icon} size={15} color={statusUI.color} />
          <Text style={[styles.statusText, { color: statusUI.color }]}>
            {statusUI.text}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: commonTheme.space.lg,
    gap: commonTheme.space.md,
    borderWidth: 1,
  },
  typePill: {
    paddingHorizontal: commonTheme.space.sm,
    paddingVertical: 4,
    borderRadius: commonTheme.rounded.sm,
  },
  typeText: {
    fontSize: 10,
    fontFamily: commonTheme.font.bold,
    letterSpacing: 0.5,
  },
  body: {
    gap: commonTheme.space.xs,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -4,
  },
  dateText: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    width: "100%",
    opacity: 0.6,
  },
  alignCenter: {
    alignItems: "center",
  },
  statusText: {
    fontSize: 13,
    fontFamily: commonTheme.font.medium,
  },
  detailsText: {
    fontSize: 12,
  },
});
