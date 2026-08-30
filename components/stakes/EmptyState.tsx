import commonTheme from "@/constants/theme";
import { View, Text } from "react-native";
import { useColors } from "@/hooks/useColors";
export default function GlobalEmptyState() {
  const colors = useColors();

  return (
    <View
      style={[
        commonTheme.layout.flex,
        commonTheme.layout.center,
      ]}
    >
      <Text style={[commonTheme.text.cardTitle, { color: colors.text }]}>
        No Stakes Yet
      </Text>
      <Text
        style={[
          commonTheme.text.body,
          {
            color: colors.textMuted,
            opacity: 0.6,
            textAlign: "center",
            marginTop: commonTheme.space.sm,
          },
        ]}
      >
        Tap the + button to create your first goal and put something on the
        line.
      </Text>
    </View>
  );
}
