import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

type StepStepperProps = {
  total: number;
  current: number;
  onSkip?: () => void; // Optional
  skipLabel?: string; // Optional
  loading?: boolean; // Optional
  hideSkipOnLast?: boolean; // Optional
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

  const shouldShowSkip = onSkip && !(hideSkipOnLast && isLast);

  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      {/* Step Tracker Dots */}
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: i === current ? 20 : 8,
                backgroundColor:
                  i === current ? colors.accent : colors.surface3,
              },
            ]}
          />
        ))}
      </View>

      {shouldShowSkip ? (
        <Pressable
          onPress={loading ? undefined : onSkip}
          disabled={loading}
          hitSlop={12}
        >
          <Text
            style={[
              styles.actionText,
              { color: loading ? colors.border : colors.textMuted },
            ]}
          >
            {skipLabel}
          </Text>
        </Pressable>
      ) : (
        /* Fallback label when field/step is required to maintain UI grid balance */
        <Text style={[styles.actionText, { color: colors.textMuted }]}>
          {current + 1} / {total}
        </Text>
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
  actionText: {
    fontSize: 14,
    fontFamily: commonTheme.font.body,
  },
});
