// components/auth/AuthFooterText.tsx
import { Text } from "react-native";
import { useColors } from "@/hooks/useColors";

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
        fontSize: 13,
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
