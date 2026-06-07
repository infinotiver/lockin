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
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[TYPOGRAPHY.sectionTitle, { color: colors.text }]}>
          Welcome back, USER
        </Text>
      </View>

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

        <View style={styles.cardActions}>
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

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  header: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  balanceCard: {
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  cardActions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  activityList: {
    gap: SPACING.sm,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  activityText: {
    flex: 1,
    gap: SPACING.xs,
  },
});

export default HomeScreen;
