import { View, Text, Pressable } from "react-native";
import { useAuth } from "@clerk/clerk-expo";

export default function TeenHome() {
  const { signOut } = useAuth();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Teen Home</Text>
      <Pressable onPress={() => signOut()}>
        <Text>Sign out</Text>
      </Pressable>
    </View>
  );
}
