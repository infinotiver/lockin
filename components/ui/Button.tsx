// components/ui/Button.tsx
import { Pressable, Text, ActivityIndicator, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  onPress: () => void;
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
};

const SIZE: Record<
  ButtonSize,
  { height: number; fontSize: number; px: number }
> = {
  sm: {
    height: 36,
    fontSize: commonTheme.fontSize.md,
    px: commonTheme.space.md,
  },
  md: {
    height: 44,
    fontSize: commonTheme.fontSize.lg,
    px: commonTheme.space.lg,
  },
  lg: {
    height: 52,
    fontSize: commonTheme.fontSize["2xl"],
    px: commonTheme.space.xl,
  },
};

export const Button = ({
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
  monospace,
}: ButtonProps) => {
  const colors = useColors();
  const isDisabled = disabled || loading;
  const { height, fontSize, px } = SIZE[size];

  const VARIANT: Record<
    ButtonVariant,
    { bg: string; border: number; borderColor: string; text: string }
  > = {
    primary: {
      bg: colors.accent,
      border: 0,
      borderColor: "transparent",
      text: colors.onAccent,
    },
    secondary: {
      bg: colors.surface3,
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
      bg: colors.errorColor,
      border: 0,
      borderColor: "transparent",
      text: "#fff",
    },
  };

  const { bg, border, borderColor, text } = VARIANT[variant] ?? VARIANT.primary;
  const content = loading && loadingLabel ? loadingLabel : (children ?? label);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        height,
        paddingHorizontal: px,
        borderRadius: commonTheme.rounded["full"],
        borderWidth: border,
        borderColor,
        backgroundColor: bg,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: commonTheme.space.sm,
        alignSelf: fullWidth ? "stretch" : "auto",
        opacity: isDisabled ? 0.45 : pressed ? 0.82 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator size="small" color={text} />
      ) : leftIcon ? (
        <View>{leftIcon}</View>
      ) : null}

      {typeof content === "string" ? (
        <Text
          style={[
            commonTheme.text.button,
            {
              fontSize,
              color: text,

              ...(monospace && {
                fontFamily: commonTheme.font.monoBold,
                color: text,
              }),
            },
          ]}
        >
          {content}
        </Text>
      ) : (
        content
      )}

      {!loading && rightIcon && <View>{rightIcon}</View>}
    </Pressable>
  );
};
