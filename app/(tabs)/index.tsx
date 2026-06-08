import { Text, ScrollView } from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

const HomeScreen = () => {
  const colors = useColors();

  return (
    <ScrollView
      style={[commonTheme.layout.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={commonTheme.layout.card}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[commonTheme.text.sectionTitle, { color: colors.text }]}>
        Welcome back, USER
      </Text>
    </ScrollView>
  );
};

export default HomeScreen;
