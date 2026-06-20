import { Children, ReactNode } from "react";
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
    if (child && typeof child === "object" && "props" in child) {
      return {
        ...(child as any),
        props: {
          ...(child as any).props,
          _showDivider: index < childArray.length - 1,
        },
      };
    }
    return child;
  });

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text
          style={[
            {
              color: colors.textMuted,
              paddingLeft: commonTheme.space.xs,
              paddingTop: commonTheme.space.sm,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.group,
          {
            backgroundColor: colors.surface2,
            borderColor: colors.border ?? colors.surface2,
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
    paddingHorizontal: commonTheme.space.md,
  },
  group: {
    borderRadius: commonTheme.rounded.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
