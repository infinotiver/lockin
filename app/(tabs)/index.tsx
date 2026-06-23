import { useState } from "react";
import { Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const HomeScreen = () => {
  const colors = useColors();
  const router = useRouter();
  const [showPermModal, setShowPermModal] = useState(false);

  return (
    <SafeAreaView
      style={[commonTheme.layout.flex, { backgroundColor: colors.background }]}
      edges={["top"]}
    ></SafeAreaView>
  );
};

export default HomeScreen;
