import { Lock, LockOpen, Snowflake, type LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import type { StakeStatus } from "@/types/stakes";

type Props = {
  wager: number;
  status: StakeStatus;
  bonusRate: number;
  atRisk?: boolean;
  frozen?: boolean;
};

export function VaultCard({
  wager,
  status,
  bonusRate,
  atRisk = false,
  frozen = false,
}: Props) {
  const colors = useColors();
  const won = status === "completed";
  const lost = status === "failed";
  const Icon: LucideIcon = frozen ? Snowflake : won ? LockOpen : Lock;
  const color = frozen || atRisk
    ? colors.tertiary
    : won
      ? colors.success
      : lost
        ? colors.error
        : colors.primary;
  const label = frozen
    ? "Freeze used today"
    : atRisk && status === "active"
      ? "Close to the limit"
      : won
        ? `+${wager + Math.floor(wager * bonusRate)} coins`
        : lost
          ? `${wager} coins burned`
          : `${wager} coins locked`;

  return (
    <View
      accessible
      accessibilityLabel={`Vault, ${wager} coins ${lost ? "burned" : "locked"}${atRisk ? ", close to the limit" : ""}${frozen ? ", freeze used today" : ""}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: commonTheme.space.md,
        padding: commonTheme.space.lg,
        borderRadius: commonTheme.rounded.lg,
        backgroundColor: frozen || atRisk
          ? colors.tertiaryContainer
          : colors.surfaceContainerLow,
      }}
    >
      <Icon size={commonTheme.fontSize["2xl"]} color={color} />
      <Text
        style={[
          commonTheme.text.bodyStrong,
          { color: frozen || atRisk ? colors.onTertiaryContainer : colors.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
