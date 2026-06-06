// components/ui/Button.tsx
import { Pressable, Text, ActivityIndicator, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

type SizeConfig = {
  height: number;
  fontSize: number;
  paddingHorizontal: number;
};
type VariantConfig = {
  backgroundColor: string;
  borderWidth: number;
  borderColor: string;
  textColor: string;
};

type ButtonProps = {
  onPress: () => void;
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const SIZE: Record<ButtonSize, SizeConfig> = {
  sm: { height: 36, fontSize: 13, paddingHorizontal: 14 },
  md: { height: 44, fontSize: 15, paddingHorizontal: 18 },
  lg: { height: 52, fontSize: 16, paddingHorizontal: 22 },
};

export const Button = ({
  onPress,
  label,
  loadingLabel,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
}: ButtonProps) => {
  const colors = useColors();
  const isDisabled = disabled || loading;
  const { height, fontSize, paddingHorizontal } = SIZE[size];

  const VARIANT: Record<ButtonVariant, VariantConfig> = {
    primary: {
      backgroundColor: colors.accent,
      borderWidth: 0,
      borderColor: "transparent",
      textColor: colors.onAccent,
    },
    secondary: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: colors.border,
      textColor: colors.text,
    },
    ghost: {
      backgroundColor: "transparent",
      borderWidth: 0,
      borderColor: "transparent",
      textColor: colors.text,
    },
    destructive: {
      backgroundColor: colors.errorColor,
      borderWidth: 0,
      borderColor: "transparent",
      textColor: colors.onDestructive,
    },
  };

  const { backgroundColor, borderWidth, borderColor, textColor } =
    VARIANT[variant] ?? VARIANT.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        height,
        paddingHorizontal,
        borderRadius: 12,
        borderWidth,
        borderColor,
        backgroundColor,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        alignSelf: fullWidth ? "stretch" : "auto",
        opacity: isDisabled ? 0.45 : pressed ? 0.82 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : leftIcon ? (
        <View>{leftIcon}</View>
      ) : null}
      <Text
        style={{
          fontSize,
          fontWeight: "600",
          letterSpacing: -0.2,
          color: textColor,
        }}
      >
        {loading && loadingLabel ? loadingLabel : label}
      </Text>
      {!loading && rightIcon && <View>{rightIcon}</View>}
    </Pressable>
  );
};
