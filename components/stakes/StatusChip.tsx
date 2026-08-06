import commonTheme from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import type { StakeStatus } from "@/types/stakes";
import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type GlyphName = keyof typeof Feather.glyphMap;

type StatusUI = {
  text: string;
  icon: GlyphName;
  color: string;
};

const getStatusUI = (
  status: StakeStatus,
  colors: ReturnType<typeof useColors>,
): StatusUI => {
  const map: Partial<Record<StakeStatus, StatusUI>> = {
    active: {
      text: "In progress",
      icon: "clock",
      color: colors.primary,
    },
    pending: {
      text: "In review",
      icon: "eye",
      color: colors.textMuted,
    },
    completed: {
      text: "Won",
      icon: "check-circle",
      color: colors.success ?? colors.primary,
    },
    failed: {
      text: "Failed",
      icon: "x-circle",
      color: colors.destructive,
    },
    rejected: {
      text: "Rejected",
      icon: "slash",
      color: colors.destructive,
    },
  };

  return (
    map[status] ?? {
      text: "Available",
      icon: "circle",
      color: colors.textMuted,
    }
  );
};

interface StatusChipProps {
  status: StakeStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const colors = useColors(); // Call the hook

  const statusUI = getStatusUI(status, colors);

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: colors.surface3,
          padding: commonTheme.space.sm,
          borderRadius: commonTheme.rounded.full,
        },
      ]}
    >
      <Feather name={statusUI.icon} size={14} color={statusUI.color} />

      <Text
        style={[
          styles.statusText,
          {
            color: statusUI.color,
          },
        ]}
      >
        {statusUI.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.xs,
  },
  statusText: {
    fontFamily: commonTheme.font.medium,
  },
});
