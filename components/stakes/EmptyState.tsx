import commonTheme from "@/constants/theme";
import { View, Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
export default function GlobalEmptyState() {
  const colors = useColors();

  return (
    <View style={[commonTheme.layout.flex, commonTheme.layout.center]}>
      <Feather
        name="target"
        size={48}
        color={colors.textMuted || colors.text}
        style={{ marginBottom: commonTheme.space.md, opacity: 0.3 }}
      />
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
        Tap the + button below to create your first goal and put something on
        the line.
      </Text>
    </View>
  );
}
