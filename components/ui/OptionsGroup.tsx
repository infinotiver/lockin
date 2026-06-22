import { Children, ReactNode, isValidElement, cloneElement } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

type OptionsGroupProps = {
  children: ReactNode;
  label?: string;
};

export function OptionsGroup({ children, label }: OptionsGroupProps) {
  const colors = useColors();
  const childArray = Children.toArray(children);

  const injected = childArray.map((child, index) => {
    if (isValidElement(child)) {
      return cloneElement(child, {
        _showDivider: index < childArray.length - 1,
      } as any);
    }
    return child;
  });

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: colors.textMuted, paddingTop: commonTheme.space.md },
          ]}
        >
          {label.toUpperCase()}
        </Text>
      )}
      <View
        style={[
          styles.group,
          {
            backgroundColor: colors.surface2,
            borderColor: colors.border,
          },
        ]}
      >
        {injected}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: commonTheme.space.sm,
  },
  label: {
    fontSize: 12,
    fontFamily: commonTheme.font.medium,
    letterSpacing: 0.6,
    paddingHorizontal: commonTheme.space.sm,
  },
  group: {
    borderRadius: commonTheme.rounded.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
