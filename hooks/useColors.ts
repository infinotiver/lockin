import { useColorScheme } from "react-native";
import { COLOR_THEMES, type ThemeColors } from "@/constants/colors";

export function useColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === "dark" ? COLOR_THEMES.dark : COLOR_THEMES.light;
}
