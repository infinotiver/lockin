import { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

type OptionsRowProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
  rightElement?: ReactNode;
  isDestructive?: boolean;
  _showDivider?: boolean; // injected by OptionsGroup, don't pass manually
};

export function OptionsRow({
  icon,
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
      <Feather name={icon} size={20} color={iconColor} style={styles.icon} />
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <View style={styles.right}>
        {rightElement ??
          (onPress && (
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          ))}
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
        <View style={[styles.divider, { backgroundColor: colors.surface3 }]} />
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
  icon: {
    width: 22,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontFamily: commonTheme.font.body,
  },
  right: {
    alignItems: "flex-end",
  },
  divider: {
    height: 2,
  },
});
