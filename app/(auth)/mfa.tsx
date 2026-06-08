import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
export default function MFA() {
  const router = useRouter();
  return (
    <View
    style={{
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text>MFA — coming soon</Text>
      {
        /*
          * We don't need mfa separately... Oauth will be provided in the signup page itself and why does router take me here I dont have any option to go back on a mobile on expo go...
        */
      }
      <Pressable
        onPress={() => {
          router.navigate('/(auth)/sign-in')
        }}
      >
      <Text>Sign in page</Text>
      </Pressable>
    </View>
  );
}
