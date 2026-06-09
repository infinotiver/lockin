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
        Welcome back, USER
      </Text>
      <Pressable
        onPress={() => {
          router.navigate('/(auth)/sign-in')
        }}
        style={{ backgroundColor: colors.surface3, padding: 20}}
      >
      <Text style={{color: colors.text, fontSize: 20}}>Sign in page</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          router.navigate('/(onboarding)/StartOnboarding')
        }}
        style={{ backgroundColor: colors.surface3, padding: 20}}
      >
      <Text style={{color: colors.text, fontSize: 20}}>StartOnboadring page</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          router.navigate('/(onboarding)/individual')
        }}
        style={{ backgroundColor: colors.surface3, padding: 20}}
      >
      <Text style={{color: colors.text, fontSize: 20}}>individual (onboarding) page</Text>
      </Pressable>


    </ScrollView>
  );
};

export default HomeScreen;
