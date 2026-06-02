import { Text, View } from "@/components/Themed"
import { TextInput } from "react-native"
import { StyleSheet, Pressable } from "react-native"
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColor } from "@/components/Themed";
import { FocusedInput } from "@/components/FocusedInput";

const SignUp = () => {
  const surface1 = useThemeColor({}, "surface1");
  const surface2 = useThemeColor({}, "surface2");
  const border = useThemeColor({}, "border");
  const textMuted = useThemeColor({}, "textMuted")
  const text = useThemeColor({}, "text")
  const primary = useThemeColor({}, "primary")
  const onPrimary = useThemeColor({}, "onPrimary")
  return (
    <View style={styles.container}>
    <LinearGradient
      colors={[surface1, surface2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        {
          width: "100%",
          padding: 16,
          borderWidth: 1,
          borderColor: border,

        }
      ]}
      
    >
          <Text style={[styles.text, {}]}>Sign Up</Text>
          <FocusedInput 
            placeholder="Email" 
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FocusedInput 
            placeholder="Password" 
            secureTextEntry 
          />
          <Pressable 
            style={({ pressed }) => [
              styles.button, 
              { backgroundColor: primary, opacity: pressed ? 0.85 : 1 }
            ]}>
            <Text style={[styles.buttonText, { color: onPrimary }]}>
              Create Account
            </Text>
          </Pressable>
          <Text style={[styles.footerText, { color: textMuted }]}>
            Already have an account?{" "}
            <Text style={[styles.linkText, { color: text }]}>
              Sign in
            </Text>
          </Text>
    </LinearGradient>
    </View>
  )
}
const styles = StyleSheet.create({
  text: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontSize: 20,
    padding: 8
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    padding: 10,
    borderRadius: 32,
    gap: 14
  },
  input: {
    // padding: 24,
    borderWidth: 1,
    // borderRadius: 12,
    // color: '#fff',
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  footer: {
    backgroundColor: "transparent",
    alignItems: "center",
    marginTop: 4,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
  },
  linkText: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },
})

export default SignUp
