import { Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
export default function Test() {
  const colors = useColors();

  return <Text style={{ color: colors.text }}>HELLO STAKE</Text>;
}
