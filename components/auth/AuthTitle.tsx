// components/auth/AuthTitle.tsx
import { Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { FONT_SIZES, SPACING } from "@/constants/tokens";

export const AuthTitle = ({ children }: { children: string }) => {
  const colors = useColors();
  return (
    <Text
      style={{
        fontFamily: "JetBrainsMono_600SemiBold",
        fontSize: FONT_SIZES["4xl"],
        padding: SPACING.sm,
        color: colors.text,
      }}
    >
      {children}
    </Text>
  );
};
