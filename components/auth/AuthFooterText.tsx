// components/auth/AuthFooterText.tsx
import { Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

type Props = {
  prompt: string;
  linkLabel: string;
  onPress: () => void;
};

export const AuthFooterText = ({ prompt, linkLabel, onPress }: Props) => {
  const colors = useColors();
  return (
    <Text
      style={[
        commonTheme.text.body,
        { lineHeight: 18, color: colors.textMuted, textAlign: "center" },
      ]}
    >
      {prompt}{" "}
      <Text
        style={{
          fontFamily: commonTheme.font.strong,
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
