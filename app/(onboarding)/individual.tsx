import {
  Platform,
  View,
  Text,
  Animated,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { Button } from "@/components/ui/Button";
import commonTheme from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { ViewWrapper } from "@/components/onboarding/ViewWrapper";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import ShareCodeModal from "@/components/share/ShareCodeModal";
import { StepStepper } from "@/components/ui/StepStepper";
import { ScreenTimePermissionModal } from "@/components/modals/ScreenTimePermissionModal";

const TOTAL_STEPS = 2;

// step 1: intro and auto family creatio
function StepOne({
  onNext,
  loading,
}: {
  onNext: () => void;
  loading: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <OnboardingTitle>Build better habits</OnboardingTitle>
        <Text
          style={[
            commonTheme.text.body,
            { color: colors.textMuted, textAlign: "center" },
          ]}
        >
          Stake money against daily milestones, build consistency, and secure
          your focus areas.
        </Text>
      </View>
      <Button
        onPress={onNext}
        variant="primary"
        label="Get Started"
        loadingLabel="Initializing family..."
        loading={loading}
        disabled={loading}
        fullWidth
      />
    </View>
  );
}

// step 2
function StepTwo({ onNext }: { onNext: () => void }) {
  const colors = useColors();
  const [showSystemModal, setShowSystemModal] = useState(false);

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <OnboardingTitle>Permissions</OnboardingTitle>
        <Text
          style={[
            commonTheme.text.body,
            { color: colors.textMuted, textAlign: "center" },
          ]}
        >
          LockIn need the following permission for tracking and limiting
          screen-time
        </Text>
      </View>

      {Platform.OS === "android" && (
        <Button
          onPress={() => setShowSystemModal(true)}
          variant="secondary"
          label="Grant Screen Time Access"
          fullWidth
        />
      )}

      {showSystemModal && (
        <ScreenTimePermissionModal
          visible={showSystemModal}
          onClose={() => setShowSystemModal(false)}
        />
      )}
    </View>
  );
}

// function StepThree({ familyCode }: { familyCode: string }) {
//   return <ShareCodeModal code={familyCode} />;
// }

export default function Individual() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { width } = useWindowDimensions();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [familyCode, setFamilyCode] = useState("");
  const [familyId, setFamilyId] = useState("");

  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateToStep = (next: number) => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      setStep(next);
      slideAnim.setValue(width);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleCreateFamily = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const derivedName = `${user?.firstName ?? "Your"}'s Family`;

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/families`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: derivedName }),
        },
      );

      if (!res.ok) {
        console.error("Automated family generation failed:", res.status);
        return;
      }

      const { family } = await res.json();
      setFamilyCode(family.code);
      setFamilyId(family.id);

      // Successfully registered unit, proceed immediately to permissions panel
      animateToStep(1);
    } catch (e) {
      console.error("[Onboarding] Automated provisioning error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishOnboarding = async () => {
    if (!familyId) return;
    setLoading(true);
    try {
      const token = await getToken();

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/user/complete-onboarding`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ familyId }),
        },
      );

      if (!res.ok) {
        console.error("Syncing completion state returned failure:", res.status);
        return;
      }

      await user?.reload();
      router.replace("/(tabs)");
    } catch (e) {
      console.error("[Onboarding] Final transaction processing failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (step < TOTAL_STEPS - 1) {
      animateToStep(step + 1);
    }
  };

  const steps = [
    <StepOne onNext={handleCreateFamily} loading={loading} />,
    <StepTwo onNext={() => animateToStep(2)} />,
    // <StepThree familyCode={familyCode} />,
  ];

  return (
    <ViewWrapper>
      <OnboardingCard>
        <Animated.View
          style={[
            styles.animatedStep,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {steps[step]}
        </Animated.View>

        <StepStepper
          total={TOTAL_STEPS}
          current={step}
          onSkip={handleSkip}
          loading={loading}
          hideSkipOnLast={true}
        />

        {step === TOTAL_STEPS - 1 && (
          <Button
            variant="primary"
            onPress={handleFinishOnboarding}
            loading={loading}
            disabled={loading}
            fullWidth
          >
            Go to home
          </Button>
        )}
      </OnboardingCard>
    </ViewWrapper>
  );
}

const styles = StyleSheet.create({
  animatedStep: {
    flex: 1,
  },
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
    marginBottom: commonTheme.space.sm,
  },
});
