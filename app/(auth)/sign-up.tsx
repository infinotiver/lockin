// app/(auth)/sign-up.tsx
import { useState } from "react";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { FocusedInput } from "@/components/FocusedInput";
import { AuthScreenWrapper } from "@/components/auth/AuthScreenWrapper";
import { AuthTitle } from "@/components/auth/AuthTitle";
import { AuthErrorText } from "@/components/auth/AuthErrorText";
import { AuthFooterText } from "@/components/auth/AuthFooterText";
import { Button } from "@/components/ui/Button";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { isLoaded, signUp } = useSignUp();
  const router = useRouter();

  const validateForm = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return "First name is required";
    if (trimmedName.length < 3)
      return "Name must be at least 3 characters";
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
      });
      await signUp.prepareEmailAddressVerification();
      router.push({
        pathname: "/(auth)/verify-email",
        params: { email: email.trim() },
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
      <AuthTitle>Sign Up</AuthTitle>
      <FocusedInput
        placeholder="First Name"
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
      <AuthErrorText error={error} />
      <Button
        onPress={handleSignUp}
        variant="primary"
        size="lg"
        label="Create Account"
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
