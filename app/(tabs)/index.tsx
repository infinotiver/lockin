import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  LAYOUT,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  TYPE_SCALE,
  FONTS,
} from "@/constants/theme";
import { Button } from "@/components/ui/Button";
const HomeScreen = () => {
  const colors = useColors();

  return (
    <ScrollView
      style={[LAYOUT.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={LAYOUT.card}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[TYPOGRAPHY.sectionTitle, { color: colors.text }]}>
        Welcome back, USER
      </Text>

      <View
        style={[
          LAYOUT.card,
          { borderColor: colors.border, backgroundColor: colors.surface3 },
        ]}
      >
        <Text style={{ color: colors.textMuted }}>Your stash</Text>

        <Text
          style={[
            TYPOGRAPHY.sectionTitle,
            {
              fontSize: TYPE_SCALE["9xl"],
              color: colors.text,
              fontFamily: FONTS.extraBold,
            },
          ]}
        >
          ₹1234.56
        </Text>

        <View style={LAYOUT.card}>
          <Text style={{ color: colors.text }}>
            Earn up to <Text style={{ color: colors.accent }}>₹20 more</Text>{" "}
            from 1 active stake
          </Text>
        </View>
        <View style={[LAYOUT.flex, LAYOUT.row, { gap: SPACING.md }]}>
          <Button onPress={() => console.log("yet to implement")} size="sm">
            Stakes
          </Button>
          <Button
            onPress={() => console.log("yet to implement")}
            size="sm"
            variant="secondary"
          >
            Reports
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
