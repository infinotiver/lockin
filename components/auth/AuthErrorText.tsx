// components/auth/AuthErrorText.tsx
import { Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { TYPOGRAPHY } from "@/constants/theme";

export const AuthErrorText = ({ error }: { error: string }) => {
  const colors = useColors();
  if (!error) return null;
  return (
    <Text
      style={[TYPOGRAPHY.errorText, { lineHeight: 18, color: colors.errorColor }]}
    >
      {error}
    </Text>
  );
};
