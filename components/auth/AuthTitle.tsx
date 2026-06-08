// components/auth/AuthTitle.tsx
import { Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

export const AuthTitle = ({ children }: { children: string }) => {
  const colors = useColors();
  return (
    <Text
      style={[
        commonTheme.text.sectionTitle,
        { padding: commonTheme.space.sm, color: colors.text, fontFamily: commonTheme.font.monoSemibold },
      ]}
    >
      {children}
    </Text>
  );
};
