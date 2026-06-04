import { Text, View } from "@/components/Themed"
import { TextInput } from "react-native"
import { StyleSheet, Pressable } from "react-native"
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColor } from "@/components/Themed";
import { FocusedInput } from "@/components/FocusedInput";
import { useState } from "react";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

const SignUp = () => {
  const surface1 = useThemeColor({}, "surface1");
  const surface2 = useThemeColor({}, "surface2");
  const border = useThemeColor({}, "border");
  const textMuted = useThemeColor({}, "textMuted")
  const text = useThemeColor({}, "text")
  const primary = useThemeColor({}, "primary")
  const onPrimary = useThemeColor({}, "onPrimary")
  const errorColor = useThemeColor({}, "error");

  const [email, setEmail ] = useState('');
  const [password, setPassword ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { isLoaded, signUp } = useSignUp()
  const router = useRouter() 

const validateForm = () => {
  if (!email.trim() || !password.trim()) {
    return "Email and password are required";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  return null;
};

const handleSignUp = async () => {
  setError("");

  if (!isLoaded) return;

  const validationError = validateForm();

  if (validationError) {
    setError(validationError);
    return;
  }

  setLoading(true);

  try {
    await signUp.create({
      emailAddress: email,
      password,
    });

    await signUp.prepareEmailAddressVerification();

    router.push("/(auth)/verify-email");
  } catch (e: any) {
    setError(
      e.errors?.[0]?.longMessage ||
      e.errors?.[0]?.message ||
      "Something went wrong."
    );
  } finally {
    setLoading(false);
  }
};

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
            onChangeText={setEmail}
          />
          <FocusedInput 
            placeholder="Password"
            secureTextEntry 
            onChangeText={setPassword}
          />
          {error ? (
            <Text style={[styles.errorText, { color: errorColor }]}>
              {error}
            </Text>
          ) : null}
          <Pressable
            onPress={handleSignUp}
            disabled={!isLoaded || loading}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: primary,
                opacity: !isLoaded || loading ? 0.5 : pressed ? 0.85 : 1
              }
            ]}>
            <Text style={[styles.buttonText, { color: onPrimary }]}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Text>
          </Pressable>
          <Text style={[styles.footerText, { color: textMuted }]}>
            Already have an account?{" "}
            <Text
              style={[styles.linkText, { color: text }]}
              onPress={() => router.push("/(auth)/sign-in")}
            >
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
  errorText: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: "JetBrainsMono_600SemiBold"
  },

})

export default SignUp
