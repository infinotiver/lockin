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
            commonTheme.text.label,
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
            backgroundColor: colors.surfaceContainer,
            borderColor: colors.outlineVariant,
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
    gap: commonTheme.space.lg,
  },
  group: {
    borderRadius: commonTheme.rounded.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
});
