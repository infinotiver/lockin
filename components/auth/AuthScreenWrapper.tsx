import { View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { AuthCard } from "./AuthCard";
import commonTheme from "@/constants/theme";
import { usePreventScreenCapture } from "expo-screen-capture";

export const AuthScreenWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const colors = useColors();
  usePreventScreenCapture();
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
