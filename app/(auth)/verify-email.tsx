// app/(auth)/verify-email.tsx
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { useState, useRef, useEffect } from "react";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { useLocalSearchParams } from "expo-router";
import { useSignUp } from "@clerk/clerk-expo";
import { AuthScreenWrapper } from "@/components/auth/AuthScreenWrapper";
import { AuthTitle } from "@/components/auth/AuthTitle";
import { AuthErrorText } from "@/components/auth/AuthErrorText";
import { Button } from "@/components/ui/Button";

const VerifyEmail = () => {
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [caretVisible, setCaretVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const colors = useColors();
  const inputRef = useRef<TextInput>(null);
  const { email } = useLocalSearchParams<{ email: string }>();
  const { isLoaded, signUp, setActive } = useSignUp();

  useEffect(() => {
    const interval = setInterval(() => setCaretVisible((v) => !v), 500);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    setError("");
    if (!isLoaded) return;
    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      const status = result.status as string;

      switch (status) {
        case "complete":
          await setActive({ session: result.createdSessionId });
          break;
        case "needs_second_factor":
        case "needs_client_trust":
          setError(
            "Multi-factor authentication is required but not yet supported.",
          );
          break;
        case "needs_new_password":
          setError("Password reset required. Please contact support.");
          break;
        case "needs_identifier":
        case "needs_first_factor":
          setError("Additional verification required. Please try again.");
          break;
        default:
          setError(
            `Verification incomplete (${status ?? "unknown"}). Please try again.`,
          );
          break;
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
      <AuthTitle>Check your email</AuthTitle>

      <Text
        style={[
          commonTheme.text.body,
          styles.subtitle,
          { color: colors.textMuted },
        ]}
      >
        We sent a code to{" "}
        <Text
          style={{ color: colors.text, fontFamily: commonTheme.font.bold }}
        >
          {email}
        </Text>
      </Text>

      <Pressable onPress={() => inputRef.current?.focus()}>
        <View style={styles.codeRow}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const isActive = focused && i === code.length;
            return (
              <View
                key={i}
                style={[
                  styles.box,
                  {
                    borderColor: isActive ? colors.focusBorder : colors.border,
                  },
                ]}
              >
                {code[i] ? (
                  <Text style={[styles.boxText, { color: colors.text }]}>
                    {code[i]}
                  </Text>
                ) : isActive && caretVisible ? (
                  <View
                    style={[styles.caret, { backgroundColor: colors.text }]}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      </Pressable>

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(val) => setCode(val.replace(/[^0-9]/g, "").slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        style={styles.hiddenInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      <AuthErrorText error={error} />

      <Button
        onPress={handleVerify}
        label="Verify"
        loadingLabel="Verifying..."
        loading={loading}
        disabled={!isLoaded || code.length < 6}
        fullWidth
      />

      <Text style={[styles.footer, { color: colors.textMuted }]}>
        Didn't get the code?{" "}
        <Text
          style={{ color: colors.text, fontFamily: commonTheme.font.bold }}
        >
          Check your spam folder
        </Text>
      </Text>
    </AuthScreenWrapper>
  );
};

const styles = StyleSheet.create({
  subtitle: {
    fontSize: commonTheme.fontSize.md,
    textAlign: "center",
    lineHeight: 18,
  },
  codeRow: {
    flexDirection: "row",
    gap: commonTheme.space.sm,
  },
  box: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderRadius: commonTheme.rounded.md,
    justifyContent: "center",
    alignItems: "center",
  },
  boxText: {
    fontSize: commonTheme.fontSize["4xl"],
    fontFamily: commonTheme.font.bold,
  },
  caret: {
    width: 2,
    height: 24,
    borderRadius: 1,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  footer: {
    fontSize: commonTheme.fontSize.md,
    lineHeight: 18,
    textAlign: "center",
  },
});

export default VerifyEmail;
