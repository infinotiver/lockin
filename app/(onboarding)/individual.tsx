import {
  Platform,
  View,
  Text,
  Animated,
  Pressable,
  useWindowDimensions,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { Button } from "@/components/ui/Button";
import { FocusedInput } from "@/components/FocusedInput";
import commonTheme from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { ViewWrapper } from "@/components/onboarding/ViewWrapper";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import ShareCodeModal from "@/components/share/ShareCodeModal";
import { StepStepper } from "@/components/ui/StepStepper";

const TOTAL_STEPS = 3;

const QUEST_TYPES = [
  { label: "Chore", value: "chore" },
  { label: "Study", value: "study" },
  { label: "Screen-time", value: "screen-time" },
  { label: "Work", value: "work" },
  { label: "Shop", value: "shop" },
];

// ─── Steps ────────────────────────────────────────────────────────────────────

function StepOne({
  familyName,
  setFamilyName,
  defaultFamilyName,
  onNext,
  loading,
}: {
  familyName: string;
  setFamilyName: (v: string) => void;
  defaultFamilyName: string;
  onNext: () => void;
  loading: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <OnboardingTitle>Create your family</OnboardingTitle>
        <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>
          Give your family a name to get started.
        </Text>
      </View>
      <FocusedInput
        placeholder={defaultFamilyName}
        value={familyName}
        onChangeText={setFamilyName}
        autoCapitalize="words"
        selectTextOnFocus
        selectionColor={colors.selected}
      />
      <Button
        onPress={onNext}
        variant="primary"
        label="Create family"
        loadingLabel="Creating..."
        loading={loading}
        disabled={loading}
        fullWidth
      />
    </View>
  );
}

function StepTwo({
  questTitle,
  setQuestTitle,
  questDescription,
  setQuestDescription,
  questReward,
  setQuestReward,
  questType,
  setQuestType,
  questExpiresAt,
  setQuestExpiresAt,
  onNext,
  loading,
}: {
  questTitle: string;
  setQuestTitle: (v: string) => void;
  questDescription: string;
  setQuestDescription: (v: string) => void;
  questReward: string;
  setQuestReward: (v: string) => void;
  questType: string;
  setQuestType: (v: string) => void;
  questExpiresAt: string;
  setQuestExpiresAt: (v: string) => void;
  onNext: () => void;
  loading: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <OnboardingTitle>Add your first quest</OnboardingTitle>
        <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>
          Stake money to build your habit
        </Text>
      </View>

      {/* Title */}
      <FocusedInput
        placeholder="Quest title"
        value={questTitle}
        onChangeText={setQuestTitle}
        autoCapitalize="sentences"
      />

      {/* Horizontal Category Pill Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillContainer}
        keyboardShouldPersistTaps="handled"
      >
        {QUEST_TYPES.map((t) => {
          const isSelected = questType === t.value;
          return (
            <Pressable
              key={t.value}
              onPress={() => setQuestType(t.value)}
              style={[
                styles.pill,
                { backgroundColor: isSelected ? colors.text : colors.surface1 },
              ]}
            >
              <Text
                style={{
                  color: isSelected ? colors.surface1 : colors.text,
                  fontWeight: isSelected ? "600" : "400",
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Description */}
      <FocusedInput
        placeholder="Description (optional)"
        value={questDescription}
        onChangeText={setQuestDescription}
        autoCapitalize="sentences"
      />

      {/* Duration */}
      <FocusedInput
        placeholder="Expire in (days)"
        value={questExpiresAt}
        onChangeText={setQuestExpiresAt}
        keyboardType="numeric"
      />

      <FocusedInput
        placeholder="Reward amount"
        value={questReward}
        onChangeText={setQuestReward}
        keyboardType="numeric"
      />

      <Button
        onPress={onNext}
        variant="primary"
        label="Add quest"
        loadingLabel="Adding..."
        loading={loading}
        disabled={loading}
        fullWidth
      />
    </View>
  );
}

function StepThree({ familyCode }: { familyCode: string }) {
  return <ShareCodeModal code={familyCode} />;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Individual() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { width } = useWindowDimensions();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [familyName, setFamilyName] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [familyId, setFamilyId] = useState("");

  const [questTitle, setQuestTitle] = useState("");
  const [questDescription, setQuestDescription] = useState("");
  const [questReward, setQuestReward] = useState("");
  const [questType, setQuestType] = useState("chore");
  const [questExpiresAt, setQuestExpiresAt] = useState("");

  const slideAnim = useRef(new Animated.Value(0)).current;
  const defaultFamilyName = `${user?.firstName ?? "Your"}'s Family`;

  useEffect(() => {
    if (user?.firstName && !familyName) {
      setFamilyName(`${user.firstName}'s Family`);
    }
  }, [user?.firstName]);

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

  const handleFinish = async () => {
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
        console.error("complete-onboarding route response error:", res.status);
        return;
      }

      await user?.reload();
      router.replace("/(tabs)");
    } catch (e) {
      console.error("complete-onboarding error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (step < TOTAL_STEPS - 1) {
      animateToStep(step + 1);
    }
  };

  const handleCreateFamily = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/families`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: familyName || defaultFamilyName }),
        },
      );
      if (!res.ok) {
        console.error("Create family error:", res.status, await res.json());
        return;
      }
      const { family } = await res.json();
      setSelectedFamilyData(family.code, family.id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const setSelectedFamilyData = (code: string, id: string) => {
    setFamilyCode(code);
    setFamilyId(id);
    animateToStep(1);
  };

  const handleAddQuest = async () => {
    if (!familyId) {
      animateToStep(2);
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      const expiresAt = questExpiresAt
        ? new Date(Date.now() + Number(questExpiresAt) * 86400000).toISOString()
        : null;

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/quests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          familyId,
          title: questTitle.trim(),
          description: questDescription.trim(),
          reward: Number(questReward),
          type: questType,
          expires_at: expiresAt,
        }),
      });
      if (!res.ok) {
        console.error("Create quest error:", res.status, await res.json());
        return;
      }
      animateToStep(2);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    <StepOne
      familyName={familyName}
      setFamilyName={setFamilyName}
      defaultFamilyName={defaultFamilyName}
      onNext={handleCreateFamily}
      loading={loading}
    />,
    <StepTwo
      questTitle={questTitle}
      setQuestTitle={setQuestTitle}
      questDescription={questDescription}
      setQuestDescription={setQuestDescription}
      questReward={questReward}
      setQuestReward={setQuestReward}
      questType={questType}
      setQuestType={setQuestType}
      questExpiresAt={questExpiresAt}
      setQuestExpiresAt={setQuestExpiresAt}
      onNext={handleAddQuest}
      loading={loading}
    />,
    <StepThree familyCode={familyCode} />,
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
            onPress={handleFinish}
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
    gap: commonTheme.space.lg,
    justifyContent: "center",
  },
  stepHeader: {
    gap: commonTheme.space.xs,
    marginBottom: commonTheme.space.xs,
  },
  pillContainer: {
    gap: commonTheme.space.sm,
    paddingVertical: commonTheme.space.xs,
  },
  pill: {
    paddingHorizontal: commonTheme.space.lg,
    paddingVertical: commonTheme.space.sm,
    borderRadius: commonTheme.rounded.lg,
    borderWidth: 1,
    borderColor: "transparent",
  },
});
