import { useColorScheme } from "react-native";
import colors, { ColorTheme } from "@/constants/Colors";

export function useColors(): ColorTheme & { radius: number } {
  const scheme = useColorScheme();
  const palette: ColorTheme = scheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
