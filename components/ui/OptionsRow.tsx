import { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LucideIcon, ChevronRight } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

type OptionsRowProps = {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  rightElement?: ReactNode;
  isDestructive?: boolean;
  _showDivider?: boolean;
};

export function OptionsRow({
  icon: Icon,
  label,
  onPress,
  rightElement,
  isDestructive = false,
  _showDivider = false,
}: OptionsRowProps) {
  const colors = useColors();

  const iconColor = isDestructive ? colors.destructive : colors.textMuted;
  const labelColor = isDestructive ? colors.destructive : colors.text;

  const inner = (
    <View style={styles.inner}>
      <Icon size={20} color={iconColor} />

      <Text
        style={[commonTheme.text.body, styles.label, { color: labelColor }]}
      >
        {label}
      </Text>

      <View style={styles.right}>
        {rightElement ??
          (onPress && <ChevronRight size={18} color={colors.textMuted} />)}
      </View>
    </View>
  );

  return (
    <>
      {onPress ? (
        <TouchableOpacity
          style={styles.row}
          onPress={onPress}
          activeOpacity={0.65}
        >
          {inner}
        </TouchableOpacity>
      ) : (
        <View style={styles.row}>{inner}</View>
      )}

      {_showDivider && (
        <View
          style={[styles.divider, { backgroundColor: colors.outlineVariant }]}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: commonTheme.space.lg,
    paddingHorizontal: commonTheme.space.lg,
  },

  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.md,
  },

  label: {
    flex: 1,
  },

  right: {
    alignItems: "flex-end",
  },

  divider: {
    height: 1,
  },
});
