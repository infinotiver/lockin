import { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { Receipt, HeartHandshake, ChevronRight } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { useSettlements } from "@/hooks/useSettlements";
import { AppBar } from "@/components/ui/AppBar";

const HomeScreen = () => {
  const colors = useColors();
  const router = useRouter();

  const {
    settlements,
    totalDue,
    fetchPending,
    error,
    isInitialLoad,
    settledSettlements,
    totalSettled,
    fetchSettled,
    isHistoryInitialLoad,
    historyError,
  } = useSettlements();

  useFocusEffect(
    useCallback(() => {
      fetchPending();
      fetchSettled();
    }, [fetchPending, fetchSettled]),
  );

  const hasDue = settlements.length > 0;
  const hasHistory = settledSettlements.length > 0;

  return (
    <SafeAreaView
      style={[commonTheme.layout.flex, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <AppBar title="Legacy wallet" />
      <View
        style={{
          paddingHorizontal: commonTheme.space.lg,
          paddingBottom: commonTheme.space.md,
        }}
      >
        <Button
          variant="neutral"
          size="lg"
          fullWidth
          label="Back to coin wallet"
          onPress={() => router.replace("/")}
        />
      </View>

      <View style={styles.heroWrapper}>
        <View
          style={[
            commonTheme.layout.card,
            commonTheme.layout.center,
            { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          <View
            style={[
              commonTheme.layout.row,
              commonTheme.layout.center,
              { gap: commonTheme.space.xs },
            ]}
          >
            <Text
              style={[
                commonTheme.text.amountLarge,
                { color: hasDue ? colors.destructive : colors.text },
              ]}
            >
              ₹
            </Text>
            <Text
              style={[
                commonTheme.text.amountLarge,
                { color: hasDue ? colors.destructive : colors.text },
              ]}
            >
              {totalDue}
            </Text>
          </View>

          <Text
            style={[
              commonTheme.text.caption,
              styles.centerText,
              { color: colors.textMuted },
            ]}
          >
            {isInitialLoad
              ? "Loading settlements..."
              : error
                ? `Error: ${error}`
                : hasDue
                  ? `${settlements.length} failed stake${settlements.length > 1 ? "s" : ""} pending settlement`
                  : "You're all caught up on settlements"}
          </Text>
        </View>

        <Button variant="neutral" onPress={() => router.push("/(tabs)/stakes")}>
          View Stakes
        </Button>
      </View>

      <View
        style={[styles.sheet, { backgroundColor: colors.surfaceContainerLow }]}
      >
        <ScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          {hasDue && (
            <View style={styles.section}>
              <View style={commonTheme.layout.rowBetween}>
                <View style={commonTheme.layout.row}>
                  <Receipt
                    size={commonTheme.fontSize["4xl"]}
                    color={colors.text}
                  />
                  <Text
                    style={[
                      commonTheme.text.bodyStrong,
                      styles.sectionTitle,
                      { color: colors.text },
                    ]}
                  >
                    Pending settlements
                  </Text>
                </View>
                <Text
                  style={[
                    commonTheme.text.amount,
                    { color: colors.destructive },
                  ]}
                >
                  −₹{totalDue}
                </Text>
              </View>

              {settlements.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => router.push(`/stake/${s.stake_id}`)}
                  style={[
                    commonTheme.layout.card,
                    commonTheme.layout.rowBetween,
                    { backgroundColor: colors.surfaceContainer },
                  ]}
                >
                  <View>
                    <Text
                      style={[
                        commonTheme.text.cardTitle,
                        { color: colors.destructive },
                      ]}
                    >
                      −₹{s.amount}
                    </Text>
                    <Text
                      style={[
                        commonTheme.text.caption,
                        { color: colors.textMuted },
                      ]}
                    >
                      Failed {new Date(s.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <ChevronRight
                    size={commonTheme.fontSize["5xl"]}
                    color={colors.textMuted}
                  />
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <View style={commonTheme.layout.rowBetween}>
              <View style={commonTheme.layout.row}>
                <Receipt
                  size={commonTheme.fontSize["4xl"]}
                  color={colors.text}
                />
                <Text
                  style={[
                    commonTheme.text.bodyStrong,
                    styles.sectionTitle,
                    { color: colors.text },
                  ]}
                >
                  Settlement history
                </Text>
              </View>
              {hasHistory && (
                <Text
                  style={[commonTheme.text.caption, { color: colors.accent }]}
                >
                  ₹{totalSettled} total
                </Text>
              )}
            </View>

            {isHistoryInitialLoad ? (
              <Text
                style={[commonTheme.text.caption, { color: colors.textMuted }]}
              >
                Loading history...
              </Text>
            ) : historyError ? (
              <Text
                style={[
                  commonTheme.text.caption,
                  { color: colors.destructive },
                ]}
              >
                {historyError}
              </Text>
            ) : !hasHistory ? (
              <Text
                style={[commonTheme.text.caption, { color: colors.textMuted }]}
              >
                No settlements yet — nothing forfeited so far.
              </Text>
            ) : (
              settledSettlements.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => router.push(`/stake/${s.stake_id}`)}
                  style={[
                    commonTheme.layout.card,
                    commonTheme.layout.rowBetween,
                    { backgroundColor: colors.surfaceContainerLow },
                  ]}
                >
                  <View>
                    <Text
                      style={[
                        commonTheme.text.cardTitle,
                        { color: colors.accent },
                      ]}
                    >
                      ₹{s.amount}
                    </Text>
                    <Text
                      style={[
                        commonTheme.text.caption,
                        { color: colors.textMuted },
                      ]}
                    >
                      {s.settled_at
                        ? `Settled ${new Date(s.settled_at).toLocaleDateString()}`
                        : `Created ${new Date(s.created_at).toLocaleDateString()}`}
                    </Text>
                  </View>
                  <ChevronRight
                    size={commonTheme.fontSize["5xl"]}
                    color={colors.textMuted}
                  />
                </Pressable>
              ))
            )}
          </View>

          <View
            style={[
              commonTheme.layout.card,
              { backgroundColor: colors.surfaceContainerHigh },
            ]}
          >
            <View style={commonTheme.layout.row}>
              <HeartHandshake
                size={commonTheme.fontSize["4xl"]}
                color={colors.text}
              />
              <Text
                style={[
                  commonTheme.text.bodyStrong,
                  styles.sectionTitle,
                  { color: colors.text },
                ]}
              >
                Where it goes
              </Text>
            </View>
            <Text
              style={[commonTheme.text.caption, { color: colors.textMuted }]}
            >
              Failed stakes are settled manually for now. The amount can be
              directed wherever the stake specifies: to charity/anti-charity, someone else or anywhere you specify.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  heroWrapper: {
    paddingHorizontal: commonTheme.space.lg,
    paddingBottom: commonTheme.space.lg,
    gap: commonTheme.space.lg,
  },
  centerText: {
    textAlign: "center",
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: commonTheme.rounded["2xl"],
    borderTopRightRadius: commonTheme.rounded["2xl"],
    paddingVertical: commonTheme.space.lg,
  },
  sheetContent: {
    padding: commonTheme.space.lg,
    gap: commonTheme.space.xl,
  },
  section: {
    gap: commonTheme.space.lg,
  },
  sectionTitle: {
    marginLeft: commonTheme.space.sm,
  },
});

export default HomeScreen;
