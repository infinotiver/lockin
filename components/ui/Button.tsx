import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "neutral"
  | "ghost"
  | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  onPress?: () => void;
  children?: React.ReactNode;
  label?: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  monospace?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const SIZE: Record<
  ButtonSize,
  { height: number; fontSize: number; px: number }
> = {
  sm: {
    height: 36,
    fontSize: commonTheme.fontSize.sm,
    px: commonTheme.space.md,
  },
  md: {
    height: 44,
    fontSize: commonTheme.fontSize.md,
    px: commonTheme.space.lg,
  },
  lg: {
    height: 52,
    fontSize: commonTheme.fontSize.lg,
    px: commonTheme.space.xl,
  },
};

const PRESS_STATE_LAYER_OPACITY = "1F"; // hex alpha ≈ 12%

export function Button({
  onPress,
  children,
  label,
  loadingLabel,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
  monospace = false,
  style,
  textStyle,
}: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;
  const { height, fontSize, px } = SIZE[size];

  const variants: Record<
    ButtonVariant,
    { bg: string; border: number; borderColor: string; text: string }
  > = {
    primary: {
      bg: colors.primary,
      border: 0,
      borderColor: "transparent",
      text: colors.onPrimary,
    },

    secondary: {
      bg: colors.secondaryContainer,
      border: 1,
      borderColor: colors.outlineVariant,
      text: colors.onSecondaryContainer,
    },

    neutral: {
      bg: colors.surfaceContainerHigh,
      border: 0,
      borderColor: colors.outlineVariant,
      text: colors.onSurface,
    },
    ghost: {
      bg: "transparent",
      border: 0,
      borderColor: "transparent",
      text: colors.textMuted,
    },

    destructive: {
      bg: colors.error,
      border: 0,
      borderColor: "transparent",
      text: colors.onError,
    },
  };
  const { bg, border, borderColor, text } = variants[variant];
  const displayContent =
    loading && loadingLabel ? loadingLabel : (children ?? label);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          paddingHorizontal: px,
          borderRadius: commonTheme.rounded.lg,
          borderWidth: border,
          borderColor,
          backgroundColor: bg,
          alignSelf: fullWidth ? "stretch" : "auto",

          opacity: isDisabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {({ pressed }) => (
        <>
          {pressed && !isDisabled && (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: text + PRESS_STATE_LAYER_OPACITY,
                  borderRadius: commonTheme.rounded.lg,
                },
              ]}
            />
          )}

          {loading ? (
            <ActivityIndicator size="small" color={text} />
          ) : leftIcon ? (
            <View>{leftIcon}</View>
          ) : null}

          {typeof displayContent === "string" ? (
            <Text
              style={[
                commonTheme.text.button,
                {
                  fontSize,
                  color: text,
                  fontFamily: monospace
                    ? commonTheme.font.monoBold
                    : commonTheme.font.bold,
                },
                textStyle,
              ]}
              numberOfLines={1}
            >
              {displayContent}
            </Text>
          ) : (
            displayContent
          )}

          {!loading && rightIcon ? <View>{rightIcon}</View> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: commonTheme.space.sm,
  },
});
