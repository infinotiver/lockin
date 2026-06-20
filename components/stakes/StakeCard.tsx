import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import type { Stake } from "@/types/stakes";

export default function StakeCard({ stake }: { stake: Stake }) {
  const colors = useColors();
  const errorColor = colors.errorColor || "#FF3B30";

  // 1. Determine Status UI cleanly before rendering
  let statusText = "";
  let statusIcon: keyof typeof Feather.glyphMap = "circle";
  let statusColor = colors.textMuted || colors.text;

  if (stake.status === "active") {
    statusText = stake.daysLeft ? `${stake.daysLeft} days left` : "Active";
    statusIcon = "clock";
    statusColor = (stake.daysLeft ?? 0) <= 3 ? colors.primary : colors.text;
  } else if (stake.status === "done") {
    statusText = stake.outcome === "won" ? "Completed" : "Donated";
    statusIcon = stake.outcome === "won" ? "check-circle" : "heart";
    statusColor = stake.outcome === "won" ? colors.primary : errorColor;
  } else if (stake.status === "pending") {
    statusText = "Pending approval";
    statusIcon = "loader";
    statusColor = colors.textMuted || colors.text;
  }

  return (
    <TouchableOpacity
      style={[
        commonTheme.layout.card,
        {
          backgroundColor: colors.surface2,
          padding: commonTheme.space.lg,
          gap: commonTheme.space.sm,
          borderWidth: 1,
          borderColor:
            stake.status === "active" && (stake.daysLeft ?? 0) <= 3
              ? colors.surface1
              : "transparent",
        },
      ]}
      activeOpacity={0.85}
    >
      {/* Top Row: Title & Amount */}
      <View
        style={[commonTheme.layout.rowBetween, { alignItems: "flex-start" }]}
      >
        <Text
          style={[
            commonTheme.text.cardTitle,
            { color: colors.text, flex: 1, marginRight: commonTheme.space.md },
          ]}
          numberOfLines={2}
        >
          {stake.title}
        </Text>
        <Text style={[commonTheme.text.amount, { color: colors.text }]}>
          ${stake.amount}
        </Text>
      </View>

      <Text
        style={[
          commonTheme.text.caption,
          { color: colors.textMuted || colors.text, opacity: 0.6 },
        ]}
      >
        {stake.category}
      </Text>

      {/* Spacer */}
      <View style={{ height: commonTheme.space.xs }} />

      <View
        style={[
          commonTheme.layout.rowBetween,
          {
            marginTop: commonTheme.space.xs,
            paddingTop: commonTheme.space.sm,
          },
        ]}
      >
        {/* Left: Dynamic Status */}
        <View
          style={[commonTheme.layout.row, { alignItems: "center", gap: 6 }]}
        >
          <Feather name={statusIcon} size={14} color={statusColor} />
          <Text
            style={[
              commonTheme.text.bodyStrong,
              { color: statusColor, fontSize: 13 },
            ]}
          >
            {statusText}
          </Text>
        </View>

        {/* Right: View Details Action */}
        <View
          style={[commonTheme.layout.row, { alignItems: "center", gap: 4 }]}
        >
          <Text
            style={[
              commonTheme.text.bodyStrong,
              {
                color: colors.textMuted || colors.text,
                fontSize: 13,
                opacity: 0.6,
              },
            ]}
          >
            Details
          </Text>
          <Feather
            name="chevron-right"
            size={16}
            color={colors.textMuted || colors.text}
            style={{ opacity: 0.6 }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}
