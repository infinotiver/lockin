import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import type { Stake } from "@/types/stakes";
import { router } from "expo-router";
import { formatDateTime, formatDuration } from "@/lib/timeParser";
import { StatusChip } from "./StatusChip";
type GlyphName = keyof typeof Feather.glyphMap;

const getRuleDescription = (stake: Stake): string | null => {
  const rule =
    stake.rule ??
    (typeof stake.description === "object" ? stake.description : undefined);

  if (rule?.type === "screen_time_limit") {
    const duration = formatDuration(rule.limitMs || 0);
    const scope = rule.scope || "app";
    return `${duration} daily limit on ${scope}`;
  }

  return typeof stake.description === "string" ? stake.description : null;
};

export default function StakeCard({ stake }: { stake: Stake }) {
  const colors = useColors();

  const dueDateTime = formatDateTime(stake.expires_at);
  const ruleText = getRuleDescription(stake);

  return (
    <Pressable
      onPress={() => {
        router.push({
          pathname: "/stake/[id]",
          params: {
            id: String(stake.id),
          },
        });
      }}
    >
      <View
        style={[
          styles.cardContainer,
          {
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.rowBetween}>
          <View style={styles.textColumn}>
            {stake.type && (
              <Text
                style={[
                  commonTheme.text.caption,
                  {
                    color: colors.textMuted,
                    marginBottom: 2,
                  },
                ]}
              >
                {stake.type.toUpperCase()}
              </Text>
            )}

            <Text
              style={[
                commonTheme.text.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {stake.title}
            </Text>
          </View>

          <Text
            style={[
              commonTheme.text.amountLarge,
              {
                color: colors.text,
              },
            ]}
          >
            ₹{stake.reward}
          </Text>
        </View>

        {ruleText && (
          <Text
            style={[
              styles.description,
              {
                color: colors.textMuted,
              },
            ]}
            numberOfLines={1}
          >
            {ruleText}
          </Text>
        )}

        <View
          style={[
            styles.rowBetween,
            {
              paddingTop: commonTheme.space.sm,
            },
          ]}
        >
          <StatusChip status={stake.status} />
          {dueDateTime && (
            <Text
              style={[
                commonTheme.text.caption,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Due {dueDateTime}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: commonTheme.space.md,
    borderRadius: commonTheme.rounded.lg,
    gap: commonTheme.space.xs,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textColumn: {
    flex: 1,
    paddingRight: commonTheme.space.md,
  },
  description: {
    fontSize: commonTheme.fontSize.lg,
    lineHeight: 20,
  },
});
