import { useState } from "react";
import { Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ScreenTimePermissionModal } from "@/components/modals/ScreenTimePermissionModal";

const HomeScreen = () => {
  const colors = useColors();
  const router = useRouter();
  const [showPermModal, setShowPermModal] = useState(false);

  return (
    <SafeAreaView
      style={[commonTheme.layout.flex, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {__DEV__ && (
        <ScrollView
          style={[
            commonTheme.layout.flex,
            { backgroundColor: colors.background },
          ]}
          contentContainerStyle={commonTheme.layout.card}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={[
              commonTheme.text.sectionTitle,
              commonTheme.layout.flex,
              { color: colors.text },
            ]}
          >
            <Feather name="info" size={20} /> Dev Mode
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
            <Text style={{ color: colors.text, fontSize: 20 }}>
              Sign in page
            </Text>
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
            onPress={() => setShowPermModal(true)}
            style={{
              backgroundColor: colors.surface3,
              padding: 20,
              borderRadius: commonTheme.rounded.lg,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 20 }}>
              Test Screen Time Modal (Android)
            </Text>
          </Pressable>
        </ScrollView>
      )}

      <ScreenTimePermissionModal
        visible={showPermModal}
        onClose={() => setShowPermModal(false)}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
