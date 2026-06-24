import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import type { Stake, StakeStatus } from "@/types/stakes";

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
    default:
      return { text: "Available", icon: "circle", color: colors.textMuted };
  }
};

const formatDate = (isoDate?: string | null) => {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatDuration = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
};

export default function StakeCard({ stake }: { stake: Stake }) {
  const colors = useColors();
  const statusUI = getStatusUI(stake.status, colors);

  const startDate = formatDate(stake.created_at);
  const dueDate = formatDate(stake.expires_at);

  const isScreenTimeRule =
    typeof stake.description === "object" &&
    stake.description?.type === "screen_time_limit";

  return (
    <View
      style={[
        commonTheme.layout.card,
        styles.cardContainer,
        { backgroundColor: colors.surface2, borderColor: colors.surface1 },
      ]}
    >
      <View
        style={[commonTheme.layout.rowBetween, { alignItems: "flex-start" }]}
      >
        <View style={styles.leftColumn}>
          <View style={[{ paddingBottom: commonTheme.space.xs }]}>
            <Text
              style={[commonTheme.text.caption, { color: colors.textMuted }]}
            >
              {stake.type?.toUpperCase() || "QUEST"}
            </Text>
          </View>

          <Text
            style={[
              commonTheme.text.sectionTitle,
              { color: colors.text, marginTop: commonTheme.space.xs },
            ]}
          >
            {stake.title}
          </Text>
          {isScreenTimeRule && (
            <Text
              style={[
                commonTheme.text.sectionTitle,
                {
                  color: colors.textMuted,
                  marginVertical: commonTheme.space.sm,
                },
              ]}
            >
              <Text style={{ color: colors.accent }}>
                {formatDuration(stake.description.limitMs)}
              </Text>{" "}
              max {stake.description.scope}/day till{" "}
              <Text style={{ color: colors.accent }}> {dueDate}</Text>
            </Text>
          )}
        </View>

        <View style={styles.rightColumn}>
          <Text
            style={[
              commonTheme.text.amountLarge,
              { color: colors.text, textAlign: "right" },
            ]}
          >
            ₹{stake.reward}
          </Text>
        </View>
      </View>

      {typeof stake.description === "string" && stake.description ? (
        <Text
          style={[styles.description, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {stake.description}
        </Text>
      ) : null}

      <View style={commonTheme.layout.rowBetween}>
        <View style={[commonTheme.layout.row, styles.alignCenter, { gap: 6 }]}>
          <Feather
            name={statusUI?.icon as GlyphName}
            size={14}
            color={statusUI?.color}
          />
          <Text style={[styles.statusText, { color: statusUI?.color }]}>
            {statusUI?.text}
          </Text>
        </View>

        {(startDate || dueDate) && (
          <View style={styles.dateRow}>
            <Feather name="calendar" size={12} color={colors.textMuted} />
            <Text
              style={[commonTheme.text.bodyStrong, { color: colors.textMuted }]}
            >
              {startDate && dueDate ? `${startDate} → ` : ""}
              {dueDate ? `${dueDate}` : startDate || ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: commonTheme.space.md,
    gap: commonTheme.space.sm,
    borderWidth: 1,
  },
  leftColumn: {
    flex: 1,
    alignItems: "flex-start",
    marginRight: commonTheme.space.md,
  },
  rightColumn: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },

  metricSubtitle: {
    fontSize: 12,
    fontFamily: commonTheme.font.medium,
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 16,
    marginTop: -2,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  alignCenter: {
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontFamily: commonTheme.font.medium,
  },
});
