import { View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { commonTheme } from "@/constants/theme";

export const ViewWrapper = ({ children }: { children: React.ReactNode }) => {
  const colors = useColors();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: commonTheme.space.xl,
        gap: commonTheme.space["2xl"],
        backgroundColor: colors.background,
        width: "100%",
      }}
    >
      {children}
    </View>
  );
};
