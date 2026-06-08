// components/auth/AuthScreenWrapper.tsx
import { View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { AuthCard } from "./AuthCard";
import commonTheme from "@/constants/theme";

export const AuthScreenWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const colors = useColors();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: commonTheme.space.xl,
        backgroundColor: colors.background,
      }}
    >
      <AuthCard>{children}</AuthCard>
    </View>
  );
};
