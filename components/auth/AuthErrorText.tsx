// components/auth/AuthErrorText.tsx
import { Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { FONT_SIZES } from "@/constants/tokens";

export const AuthErrorText = ({ error }: { error: string }) => {
  const colors = useColors();
  if (!error) return null;
  return (
    <Text
      style={{
        fontSize: FONT_SIZES.lg,
        lineHeight: 18,
        fontFamily: "JetBrainsMono_600SemiBold",
        color: colors.errorColor,
      }}
    >
      {error}
    </Text>
  );
};
