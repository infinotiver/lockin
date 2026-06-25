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

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
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
      bg: colors.surface1,
      border: 1,
      borderColor: colors.border,
      text: colors.text,
    },
    ghost: {
      bg: "transparent",
      border: 0,
      borderColor: "transparent",
      text: colors.textMuted,
    },
    destructive: {
      bg: colors.destructive,
      border: 0,
      borderColor: "transparent",
      text: "#fff",
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
          borderRadius: commonTheme.rounded.full,
          borderWidth: border,
          borderColor,
          backgroundColor: bg,
          alignSelf: fullWidth ? "stretch" : "auto",
          opacity: isDisabled ? 0.45 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {/* Left: spinner or icon */}
      {loading ? (
        <ActivityIndicator size="small" color={text} />
      ) : leftIcon ? (
        <View>{leftIcon}</View>
      ) : null}

      {/* Label */}
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

      {/* Right icon */}
      {!loading && rightIcon ? <View>{rightIcon}</View> : null}
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
