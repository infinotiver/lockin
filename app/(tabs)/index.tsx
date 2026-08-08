import { useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { useSettlements } from "@/hooks/useSettlements";
import { OptionsGroup } from "@/components/ui/OptionsGroup";
import { OptionsRow } from "@/components/ui/OptionsRow";

const HomeScreen = () => {
  const colors = useColors();
  const router = useRouter();
  const { user } = useUser();
  const { settlements, totalDue, fetchPending } = useSettlements();

  const fetchPendingRef = useRef(fetchPending);
  fetchPendingRef.current = fetchPending;

  useFocusEffect(
    useCallback(() => {
      fetchPendingRef.current();
    }, []),
  );

  const hasDue = settlements.length > 0;

  return (
    <SafeAreaView
      style={[commonTheme.layout.flex, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[commonTheme.text.sectionTitle, { color: colors.text }]}>
            {user?.firstName ? `Hey, ${user.firstName}` : "Welcome back"}
          </Text>
        </View>

        <View
          style={[
            commonTheme.layout.card,
            { backgroundColor: colors.surface2 },
          ]}
        >
          <Text style={[commonTheme.text.sectionTitle, { color: colors.text }]}>
            At stake
          </Text>
          <Text style={[commonTheme.text.amountLarge, { color: colors.text }]}>
            ₹{totalDue}
          </Text>

          <Text style={[styles.dueSubtext, { color: colors.textMuted }]}>
            {hasDue
              ? `${settlements.length} failed stake${settlements.length > 1 ? "s" : ""} pending settlement`
              : "You're all caught up on settlements"}
          </Text>

          {hasDue && (
            <View style={styles.settlementList}>
              {settlements.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => router.push(`/stake/${s.stake_id}`)}
                  style={[styles.settlementRow, { borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.text }}>₹{s.amount}</Text>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: commonTheme.fontSize.sm,
                    }}
                  >
                    Failed {new Date(s.created_at).toLocaleDateString()}
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={{ marginTop: commonTheme.space.sm }}>
          <Button
            variant="primary"
            onPress={() => router.push("/(tabs)/stakes")}
          >
            View Stakes
          </Button>
        </View>

        <OptionsGroup label="Get Started">
          <OptionsRow
            icon="book-open"
            label="Getting started guide"
            onPress={() =>
              Linking.openURL(
                "https://github.com/infinotiver/lockin#getting-started",
              )
            }
          />
        </OptionsGroup>

        <OptionsGroup label="More">
          <OptionsRow
            icon="map"
            label="Roadmap"
            onPress={() =>
              Linking.openURL("https://github.com/infinotiver/lockin#roadmap")
            }
          />
          <OptionsRow
            icon="message-square"
            label="Send feedback"
            onPress={() =>
              Linking.openURL("https://github.com/infinotiver/lockin/issues")
            }
          />
        </OptionsGroup>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: { padding: commonTheme.space.md, gap: commonTheme.space.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dueSubtext: { fontSize: commonTheme.fontSize.sm },
  settlementList: {
    marginTop: commonTheme.space.sm,
    gap: commonTheme.space.xs,
  },
  settlementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: commonTheme.space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default HomeScreen;
