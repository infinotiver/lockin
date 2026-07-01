import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { FocusedInput } from "@/components/FocusedInput";
import { AuthScreenWrapper } from "@/components/auth/AuthScreenWrapper";
import { AuthTitle } from "@/components/auth/AuthTitle";
import { AuthFooterText } from "@/components/auth/AuthFooterText";
import { Button } from "@/components/ui/Button";
import { ErrorHandler } from "@/components/ui/ErrorHandler";
import commonTheme from "@/constants/theme";

type Role = "individual" | "teen";

const ROLES: { value: Role; label: string; description: string }[] = [
  {
    value: "individual",
    label: "Individual",
    description: "Set goals, stake money, build habits solo or with family.",
  },
  {
    value: "teen",
    label: "Teen",
    description: "Join a family, complete quests, earn your allowance.",
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
        unsafeMetadata: { role }, // stored in publicMetadata via Clerk webhook or backend
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
      <AuthTitle>Create account</AuthTitle>

      <FocusedInput
        placeholder="First name"
        autoCapitalize="words"
        onChangeText={setName}
        selectionColor={colors.selected}
      />
      <FocusedInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
        selectionColor={colors.selected}
      />
      <FocusedInput
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
        onChangeText={setPassword}
        selectionColor={colors.selected}
      />

      {/* Role selector */}
      <View style={styles.roleGroup}>
        {ROLES.map((r) => {
          const isSelected = role === r.value;
          return (
            <Pressable
              key={r.value}
              onPress={() => setRole(r.value)}
              accessibilityRole={"radio"}
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${r.label}. ${r.description}`}
              style={[
                styles.roleCard,
                {
                  backgroundColor: isSelected
                    ? colors.surface1
                    : colors.background,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.roleTop}>
                <View
                  style={[
                    styles.roleRadio,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.roleRadioDot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.roleLabel,
                    {
                      color: colors.text,
                      fontFamily: isSelected
                        ? commonTheme.font.bold
                        : commonTheme.font.body,
                    },
                  ]}
                >
                  {r.label}
                </Text>
              </View>
              <Text
                style={[styles.roleDescription, { color: colors.textMuted }]}
              >
                {r.description}
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
        label="Create account"
        loadingLabel="Creating account..."
        loading={loading}
        disabled={!isLoaded}
        fullWidth
        monospace
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
  roleGroup: {
    gap: commonTheme.space.sm,
  },
  roleCard: {
    borderWidth: 1,
    borderRadius: commonTheme.rounded.lg,
    padding: commonTheme.space.md,
    gap: commonTheme.space.xs,
  },
  roleTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.sm,
  },
  roleRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  roleRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roleLabel: {
    fontSize: 15,
  },
  roleDescription: {
    fontSize: 13,
    lineHeight: 18,
    paddingLeft: 18 + commonTheme.space.sm,
  },
});
