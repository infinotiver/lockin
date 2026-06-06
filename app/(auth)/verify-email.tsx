import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { useState, useRef, useEffect } from "react";
import { useColors } from "@/hooks/useColors";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useSignUp } from "@clerk/clerk-expo";

const VerifyEmail = () => {
  const [code, setCode] = useState("");
  const colors = useColors();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [caretVisible, setCaretVisible] = useState(false);
  const { email } = useLocalSearchParams<{
    email: string;
  }>();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setCaretVisible((v) => !v);
    }, 500);
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

        // case "needs_second_factor":
        // case "needs_client_trust":
        //   router.push("/(auth)/mfa");
        //   break;

        // case "needs_new_password":
        //   router.push("/(auth)/reset-password");
        //   break;

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
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
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
          },
        ]}
      >
        <Text style={[styles.text, { color: colors.text }]}>
          Check your email
        </Text>
        <Text style={[styles.textMuted, { color: colors.textMuted }]}>
          {" "}
          We have sent a code to{" "}
        </Text>
        <Text style={[styles.textMuted, { color: colors.textMuted }]}>
          {email}
        </Text>
        <Pressable onPress={() => inputRef.current?.focus()}>
          <View style={styles.codeRow}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const isActive = focused && i === code.length; // ← here

              return (
                <View
                  key={i}
                  style={[
                    styles.box,
                    {
                      borderColor: isActive
                        ? colors.focusBorder
                        : colors.border,
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
          onChangeText={(val) =>
            setCode(val.replace(/[^0-9]/g, "").slice(0, 6))
          }
          keyboardType="number-pad"
          maxLength={6}
          style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {error ? (
          <Text style={[styles.errorText, { color: colors.errorColor }]}>
            {error}
          </Text>
        ) : null}
        <Pressable
          onPress={handleVerify}
          disabled={!isLoaded || loading || code.length < 6}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity:
                !isLoaded || loading || code.length < 6
                  ? 0.5
                  : pressed
                    ? 0.85
                    : 1,
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            {loading ? "Verifying..." : "Verify"}
          </Text>
        </Pressable>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Did not get the code?{" "}
          <Text style={[styles.boldText, { color: colors.text }]}>
            Check your spam folder
          </Text>
        </Text>
      </LinearGradient>
    </View>
  );
};
const styles = StyleSheet.create({
  text: {
    textAlign: "center",
    fontFamily: "JetBrainsMono_600SemiBold",
    fontSize: 20,
    padding: 8,
  },
  textMuted: {
    textAlign: "center",
    lineHeight: 5,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    padding: 10,
    borderRadius: 32,
    gap: 14,
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
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  boldText: {
    fontWeight: "600",
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  box: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  boxText: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "JetBrainsMono_600SemiBold",
  },
  caret: {
    width: 2,
    height: 24,
    borderRadius: 1,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: "JetBrainsMono_600SemiBold",
  },
});

export default VerifyEmail;
