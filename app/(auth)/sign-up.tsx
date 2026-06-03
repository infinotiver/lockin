import { Text, View, TextInput, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FocusedInput } from "@/components/FocusedInput";
import { useColors } from "@/hooks/useColors";
import { useState } from "react";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

const SignUp = () => {
  const colors = useColors();
  const { isLoaded, signUp } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateForm = () => {
    if (!email.trim() || !password.trim())
      return "Email and password are required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Invalid email format";
    if (password.length < 8) return "Password must be at least 8 characters";
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
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification();
      router.push("/(auth)/verify-email");
    } catch (e: any) {
      setError(
        e.errors?.[0]?.longMessage ||
          e.errors?.[0]?.message ||
          "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.surface1, colors.surface2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: colors.border }]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Sign Up</Text>
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
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        ) : null}
        <Pressable
          onPress={handleSignUp}
          disabled={!isLoaded || loading}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: !isLoaded || loading ? 0.5 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            {loading ? "Creating account..." : "Create Account"}
          </Text>
        </Pressable>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Already have an account?{" "}
          <Text
            style={[styles.linkText, { color: colors.text }]}
            onPress={() => router.push("/(auth)/sign-in")}
          >
            Sign in
          </Text>
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    padding: 16,
    borderRadius: 32,
    borderWidth: 1,
    gap: 14,
  },
  title: { fontFamily: "JetBrainsMono_600SemiBold", fontSize: 20, padding: 8 },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { fontSize: 15, fontWeight: "600", letterSpacing: -0.2 },
  footerText: { fontSize: 13, lineHeight: 18, textAlign: "center" },
  linkText: { fontWeight: "600", textDecorationLine: "underline" },
  errorText: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: "JetBrainsMono_600SemiBold",
  },
});

export default SignUp;
