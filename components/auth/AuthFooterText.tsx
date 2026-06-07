// components/auth/AuthFooterText.tsx
import { Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { FONT_SIZES } from "@/constants/tokens";

type Props = {
  prompt: string;
  linkLabel: string;
  onPress: () => void;
};

export const AuthFooterText = ({ prompt, linkLabel, onPress }: Props) => {
  const colors = useColors();
  return (
    <Text
      style={{
        fontSize: FONT_SIZES.md,
        lineHeight: 18,
        color: colors.textMuted,
        textAlign: "center",
      }}
    >
      {prompt}{" "}
      <Text
        style={{
          fontWeight: "600",
          textDecorationLine: "underline",
          color: colors.text,
        }}
        onPress={onPress}
      >
        {linkLabel}
      </Text>
    </Text>
  );
};
