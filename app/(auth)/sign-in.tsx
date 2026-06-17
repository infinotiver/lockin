import { useState } from "react";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { AuthScreenWrapper } from "@/components/auth/AuthScreenWrapper";
import { AuthTitle } from "@/components/auth/AuthTitle";
import { AuthFooterText } from "@/components/auth/AuthFooterText";
import { ErrorHandler } from "@/components/ui/ErrorHandler";
import { Button } from "@/components/ui/Button";
import { useColors } from "@/hooks/useColors";
import { FocusedInput } from "@/components/FocusedInput";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const identifier = email.trim();
  const colors = useColors();

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
      const result = await signIn.create({ identifier, password });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        setError(`Verification incomplete, please try again. ${result.status}`);
      }
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
      <AuthTitle>Sign In</AuthTitle>

      <FocusedInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
        selectionColor={colors.selected}
      />

      <FocusedInput
        secureTextEntry
        placeholder="Password"
        autoCapitalize="none"
        onChangeText={setPassword}
        selectionColor={colors.selected}
      />

      <ErrorHandler error={error} type="modal" onClear={() => setError("")} />

      <Button
        onPress={handleSignIn}
        variant="primary"
        size="lg"
        label="Sign in"
        loadingLabel="Signing in..."
        loading={loading}
        disabled={!isLoaded}
        fullWidth
        monospace
      />

      <AuthFooterText
        prompt="Don't have an account?"
        linkLabel="Sign up"
        onPress={() => router.push("/(auth)/sign-up")}
      />
    </AuthScreenWrapper>
  );
};

export default SignIn;
