import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { useState, useRef, useEffect } from "react";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { useLocalSearchParams } from "expo-router";
import { useSignUp, useAuth } from "@clerk/clerk-expo";
import { AuthScreenWrapper } from "@/components/auth/AuthScreenWrapper";
import { AuthTitle } from "@/components/auth/AuthTitle";
import { Button } from "@/components/ui/Button";
import { ErrorHandler } from "@/components/ui/ErrorHandler";

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [caretVisible, setCaretVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const colors = useColors();
  const inputRef = useRef<TextInput>(null);

  const { email, role } = useLocalSearchParams<{
    email: string;
    role: "individual" | "teen";
  }>();

  const { isLoaded, signUp, setActive } = useSignUp();
  const { getToken } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => {
      setCaretVisible((v) => !v);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const setRoleOnServer = async () => {
    const token = await getToken();
    if (!token) throw new Error("Missing auth token");

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/user/role`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: role ?? "individual" }),
      },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || `Role sync failed (${res.status})`);
    }
  };

  const handleVerify = async () => {
    setError("");
    if (!isLoaded) return;

    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status !== "complete") {
        setError(`Verification incomplete (${result.status}).`);
        return;
      }

      await setActive({ session: result.createdSessionId });

      await setRoleOnServer();
    } catch (e: any) {
      setError(e.errors?.[0]?.message || e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenWrapper>
      <AuthTitle>Check your email</AuthTitle>

      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        We sent a code to{" "}
        <Text style={{ color: colors.text, fontFamily: commonTheme.font.bold }}>
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

      <ErrorHandler error={error} type="modal" onClear={() => setError("")} />

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
        <Text style={{ color: colors.text, fontFamily: commonTheme.font.bold }}>
          Check your spam folder
        </Text>
      </Text>
    </AuthScreenWrapper>
  );
}

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
