// components/auth/AuthTitle.tsx
import { Text } from "react-native";
import { useColors } from "@/hooks/useColors";

export const AuthTitle = ({ children }: { children: string }) => {
  const colors = useColors();
  return (
    <Text
      style={{
        fontFamily: "JetBrainsMono_600SemiBold",
        fontSize: 20,
        padding: 8,
        color: colors.text,
      }}
    >
      {children}
    </Text>
  );
};
