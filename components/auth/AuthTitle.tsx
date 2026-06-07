// components/auth/AuthTitle.tsx
import { Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { SPACING, TYPOGRAPHY } from "@/constants/theme";

export const AuthTitle = ({ children }: { children: string }) => {
  const colors = useColors();
  return (
    <Text
      style={[TYPOGRAPHY.sectionTitle, { padding: SPACING.sm, color: colors.text }]}
    >
      {children}
    </Text>
  );
};
