import { View, Text, Pressable, StyleSheet } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

export type AppBarAction = {
  key: string;
  icon?: LucideIcon;
  label?: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

type AppBarProps = {
  title: string;
  leftActions?: AppBarAction[];
  rightActions?: AppBarAction[];
};

function AppBarActionButton({ action }: { action: AppBarAction }) {
  const colors = useColors();
  const Icon = action.icon;
  if (!Icon && !action.label) return null;
  return (
    <Pressable
      style={styles.action}
      onPress={action.onPress}
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel ?? action.label}
    >
      {Icon && <Icon size={commonTheme.fontSize["5xl"]} color={colors.text} />}
      {action.label && (
        <Text
          style={[
            commonTheme.text.body,
            { color: colors.text, fontFamily: commonTheme.font.semibold },
          ]}
        >
          {action.label}
        </Text>
      )}
    </Pressable>
  );
}

export function AppBar({
  title,
  leftActions = [],
  rightActions = [],
}: AppBarProps) {
  const colors = useColors();
  return (
    <View style={[styles.appBar]}>
      <View style={[commonTheme.layout.row, styles.side]}>
        {leftActions.map((action) => (
          <AppBarActionButton key={action.key} action={action} />
        ))}
      </View>
      <Text
        style={[commonTheme.text.pageTitle, { color: colors.text }]}
      >
        {title}
      </Text>
      <View style={[commonTheme.layout.row, styles.side, styles.sideRight]}>
        {rightActions.map((action) => (
          <AppBarActionButton key={action.key} action={action} />
        ))}
      </View>
    </View>
  );
}

const TOUCH_TARGET = 40;

const styles = StyleSheet.create({
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: commonTheme.space.xl,
    marginBottom: commonTheme.space.sm,
  },
  side: {
    minWidth: TOUCH_TARGET,
    gap: commonTheme.space.sm,
  },
  sideRight: {
    justifyContent: "flex-end",
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.xs,
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    justifyContent: "center",
  },
});
