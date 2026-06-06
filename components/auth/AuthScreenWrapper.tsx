// components/auth/AuthScreenWrapper.tsx
import { View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { AuthCard } from "./AuthCard";

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
        padding: 24,
        backgroundColor: colors.background,
      }}
    >
      <AuthCard>{children}</AuthCard>
    </View>
  );
};
