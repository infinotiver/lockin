import { View, Text, Pressable } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";
export default function MFA() {
  const router = useRouter();
  const colors = useColors();
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
        flex: 1,
      }}
    >
      <Text>MFA — coming soon</Text>
      {/*
       * We don't need mfa separately... Oauth will be provided in the signup page itself and why does router take me here I dont have any option to go back on a mobile on expo go...
       */}
      <Pressable
        onPress={() => {
          router.navigate("/(tabs)");
        }}
        style={{ backgroundColor: colors.surface3, padding: 20 }}
      >
        <Text style={{ color: colors.text, fontSize: 20 }}>home page</Text>
      </Pressable>
    </View>
  );
}
