// components/auth/AuthErrorText.tsx
import { Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

export const AuthErrorText = ({ error }: { error: string }) => {
  const colors = useColors();
  if (!error) return null;
  return (
    <Text
      style={[commonTheme.text.error, { lineHeight: 18, color: colors.errorColor }]}
    >
      {error}
    </Text>
  );
};
