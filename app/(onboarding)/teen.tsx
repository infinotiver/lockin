import { View, Text, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { Button } from "@/components/ui/Button";
import { FocusedInput } from "@/components/FocusedInput";
import commonTheme from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { ViewWrapper } from "@/components/onboarding/ViewWrapper";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { StepStepper } from "@/components/ui/StepStepper";

const TOTAL_STEPS = 1;

export default function TeenOnboarding() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFinishOnboarding = async () => {
    const cleanCode = inviteCode.trim().toUpperCase();

    if (!cleanCode) {
      setError("Please enter your family's invite code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication expired. Please sign in again.");
        return;
      }
      const joinRes = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/families/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code: cleanCode }),
        },
      );

      const joinBody = await joinRes.json();
      if (!joinRes.ok) {
        const msg = joinBody?.error ?? "";
        // TODO: this is a quick fix, better option is to update backend API
        // treat duplicate membership as success
        if (msg.toLowerCase().includes("already") || joinRes.status === 409) {
          // continue as success path
        } else {
          setError(msg || "Failed to verify invite code.");
          return;
        }
      }

      const resolvedFamilyId = joinBody.family_id;

      if (!resolvedFamilyId) {
        setError("System failed to resolve household mapping.");
        setLoading(false);
        return;
      }

      // Promote that newly acquired family_id into Clerk publicMetadata
      const completeRes = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/user/complete-onboarding`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ familyId: resolvedFamilyId }),
        },
      );

      if (!completeRes.ok) {
        setError("Failed to finalize account setup. Please try again.");
        setLoading(false);
        return;
      }

      // Refresh Clerk's local cache so RootLayout lets us through the door
      await user?.reload();
      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
      setError("Network connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewWrapper>
      <OnboardingCard>
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <OnboardingTitle>Welcome to LockIn</OnboardingTitle>
            <Text
              style={[
                commonTheme.text.body,
                { color: colors.textMuted, textAlign: "center" },
              ]}
            >
              Enter the unique invite code provided by your parent to sync your
              daily quests and rewards.
            </Text>
          </View>

          {/* Invite Code Input Gateway */}
          <View style={styles.inputGroup}>
            <FocusedInput
              placeholder="Enter family code"
              value={inviteCode}
              onChangeText={(text) => {
                setInviteCode(text.toUpperCase());
                if (error) setError(""); // Clear error state on typing
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
            />
            {!!error && (
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            )}
          </View>
        </View>

        <StepStepper
          total={TOTAL_STEPS}
          current={0}
          onSkip={() => {}}
          loading={loading}
          hideSkipOnLast={true}
        />

        <Button
          variant="primary"
          onPress={handleFinishOnboarding}
          loading={loading}
          disabled={loading || !inviteCode.trim()}
          fullWidth
        >
          Go to home
        </Button>
      </OnboardingCard>
    </ViewWrapper>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
    gap: commonTheme.space.xl,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: commonTheme.space.md,
  },
  stepHeader: {
    gap: commonTheme.space.sm,
    alignItems: "center",
  },
  inputGroup: {
    width: "100%",
    gap: commonTheme.space.xs,
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
    fontFamily: commonTheme.font.medium,
  },
});
