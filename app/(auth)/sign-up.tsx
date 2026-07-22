import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

import { FocusedInput } from "@/components/FocusedInput";
import { AuthScreenWrapper } from "@/components/auth/AuthScreenWrapper";
import { AuthTitle } from "@/components/auth/AuthTitle";
import { AuthFooterText } from "@/components/auth/AuthFooterText";
import { Button } from "@/components/ui/Button";
import { ErrorHandler } from "@/components/ui/ErrorHandler";

type Role = "individual" | "teen";

const ROLES: { value: Role; label: string }[] = [
  {
    value: "individual",
    label: "Individual",
  },
  {
    value: "teen",
    label: "Teen",
  },
];

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("individual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { isLoaded, signUp } = useSignUp();
  const router = useRouter();
  const colors = useColors();

  const validateForm = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return "First name is required";
    if (trimmedName.length < 3) return "Name must be at least 3 characters";
    if (!/^[\p{L}\s]+$/u.test(trimmedName))
      return "Name can only contain letters and spaces";
    if (!email.trim() || !password.trim())
      return "Email and password are required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
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
      await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName: name.trim(),
        unsafeMetadata: { role },
      });
      await signUp.prepareEmailAddressVerification();
      router.push({
        pathname: "/(auth)/verify-email",
        params: { email: email.trim(), role },
      });
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
    <AuthScreenWrapper>
      <View style={styles.headerContainer}>
        <AuthTitle>Get Started</AuthTitle>
        <Text style={{ color: colors.textMuted }}>
          Create a account on LockIn
        </Text>
      </View>

      <FocusedInput
        placeholder="First name"
        autoCapitalize="words"
        onChangeText={setName}
      />

      <FocusedInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
      />

      <FocusedInput
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
        onChangeText={setPassword}
      />

      <View style={styles.roleGroup}>
        {ROLES.map((r) => {
          const isSelected = role === r.value;

          return (
            <Pressable
              key={r.value}
              onPress={() => setRole(r.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.roleCard,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.surface1,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  {
                    color: isSelected ? colors.onPrimary : colors.text,
                    fontFamily: commonTheme.font.semibold,
                  },
                ]}
              >
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ErrorHandler error={error} type="text" onClear={() => setError("")} />

      <Button
        onPress={handleSignUp}
        variant="primary"
        size="lg"
        label="Join LockIn"
        loadingLabel="Creating account..."
        loading={loading}
        disabled={!isLoaded}
        fullWidth
      />

      <AuthFooterText
        prompt="Already have an account?"
        linkLabel="Sign in"
        onPress={() => router.push("/(auth)/sign-in")}
      />
    </AuthScreenWrapper>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: commonTheme.space.md,
    gap: commonTheme.space.sm,
  },
  roleGroup: {
    flexDirection: "row",
    gap: commonTheme.space.sm,
    marginVertical: commonTheme.space.md,
  },
  roleCard: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: commonTheme.rounded.xl,
    padding: commonTheme.space.md,
    gap: commonTheme.space.xs,
  },
});
