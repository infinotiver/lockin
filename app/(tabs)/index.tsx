import { useColors } from "@/hooks/useColors";
import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function HomeScreen() {
  const colors = useColors();
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}
