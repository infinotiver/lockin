import { Text, View } from "react-native";
import { StyleSheet, Pressable } from "react-native"
import { LinearGradient } from "expo-linear-gradient";
import { FocusedInput } from "@/components/FocusedInput";
import { useState } from "react";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

const SignIn = () => {



  const colors = useColors();

  const [email, setEmail ] = useState('');
  const [password, setPassword ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const identifier = email.trim();

const validateForm = () => {
  if (!identifier || !password.trim()) {
    return "Email and password are required";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(identifier)) {
    return "Invalid email format";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  return null;
};

const handleSignIn = async () => {
  setError("");

  if (!isLoaded) return;

  const validationError = validateForm();

  if (validationError) {
    setError(validationError);
    return;
  }

  setLoading(true);

  try {

    const result = await signIn.create({ identifier, password })

    if (result.status === 'complete') {
      await setActive({ session: result.createdSessionId })
    } else {
      setError('Verification incomplete, please try again.')
    }

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
    <View style={[styles.container, {backgroundColor: colors.background}]}>
    <LinearGradient
      colors={[colors.surface1, colors.surface2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        {
          width: "100%",
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,

        }
      ]}
      
    >
          <Text style={[styles.text, { color: colors.text }]}>Sign In</Text>
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
            <Text style={[styles.errorText, { color: colors.errorColor }]}>
              {error}
            </Text>
          ) : null}
          <Pressable
            onPress={handleSignIn}
            disabled={!isLoaded || loading}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: colors.primary,
                opacity: !isLoaded || loading ? 0.5 : pressed ? 0.85 : 1
              }
            ]}>
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Text>
          </Pressable>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Don't have an account?{" "}
            <Text
              style={[styles.linkText, { color: colors.text }]}
              onPress={() => router.push("/(auth)/sign-up")}
            >
              Sign up
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

export default SignIn
