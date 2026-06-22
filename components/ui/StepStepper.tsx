import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

type StepStepperProps = {
  total: number;
  current: number;
  onSkip?: () => void;
  skipLabel?: string;
  loading?: boolean;
  hideSkipOnLast?: boolean;
};

export function StepStepper({
  total,
  current,
  onSkip,
  skipLabel = "Skip",
  loading = false,
  hideSkipOnLast = true,
}: StepStepperProps) {
  const colors = useColors();
  const isLast = current === total - 1;

  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: i === current ? 20 : 8,
                backgroundColor: i === current ? colors.accent : colors.border,
              },
            ]}
          />
        ))}
      </View>

      {onSkip && !(hideSkipOnLast && isLast) && (
        <Pressable
          onPress={loading ? undefined : onSkip}
          disabled={loading}
          hitSlop={12}
        >
          <Text
            style={[
              styles.skipText,
              { color: loading ? colors.border : colors.textMuted },
            ]}
          >
            {skipLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: commonTheme.space.sm,
    borderTopWidth: 1,
  },
  dots: {
    flexDirection: "row",
    gap: commonTheme.space.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  skipText: {
    fontSize: 14,
    fontFamily: commonTheme.font.body,
  },
});
