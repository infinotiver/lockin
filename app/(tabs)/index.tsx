import { Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

const HomeScreen = () => {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScrollView
      style={[commonTheme.layout.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={commonTheme.layout.card}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[commonTheme.text.sectionTitle, { color: colors.text }]}>
        Dev Mode (Remove all following direct links before production)
      </Text>
      <Pressable
        onPress={() => {
          router.navigate("/(auth)/sign-in");
        }}
        style={{
          backgroundColor: colors.surface3,
          padding: 20,
          borderRadius: commonTheme.rounded.lg,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 20 }}>Sign in page</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          router.navigate("/(onboarding)/StartOnboarding");
        }}
        style={{
          backgroundColor: colors.surface3,
          padding: 20,
          borderRadius: commonTheme.rounded.lg,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 20 }}>
          StartOnboarding page
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {}}
        style={{
          backgroundColor: colors.surface3,
          padding: 20,
          borderRadius: commonTheme.rounded.lg,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 20 }}>
          individual (onboarding) page
        </Text>
      </Pressable>

      <Pressable
        onPress={() => {
          router.navigate("/(onboarding)/screen-time-permission");
        }}
        style={{
          backgroundColor: colors.surface3,
          padding: 20,
          borderRadius: commonTheme.rounded.lg,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 20 }}>
          Screen time auth page (android only)
        </Text>
      </Pressable>
    </ScrollView>
  );
};

export default HomeScreen;
