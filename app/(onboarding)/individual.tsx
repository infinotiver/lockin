import {
  Platform,
  View,
  Text,
  Animated,
  Pressable,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { FocusedInput } from "@/components/FocusedInput";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useUser, useAuth } from "@clerk/clerk-expo";
import commonTheme from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { ViewWrapper } from "@/components/onboarding/ViewWrapper";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import * as Clipboard from "expo-clipboard";
import ShareCodeModal from "@/components/share/ShareCodeModal";
import { Picker } from "@react-native-picker/picker";
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

      <View style={styles.row}>
        <FocusedInput
          placeholder="Quest title"
          value={questTitle}
          onChangeText={setQuestTitle}
          autoCapitalize="sentences"
          style={{ flex: 1 }}
        />
        <View
          style={[
            styles.pickerWrapper,
            { borderColor: colors.border, backgroundColor: colors.surface1 },
          ]}
        >
          <Picker
            selectedValue={questType}
            onValueChange={setQuestType}
            style={{ color: colors.text }}
            dropdownIconColor={colors.textMuted}
          >
            {QUEST_TYPES.map((t) => (
              <Picker.Item
                key={t.value}
                label={t.label}
                value={t.value}
                color={colors.text}
              />
            ))}
          </Picker>
        </View>
      </View>

      <FocusedInput
        placeholder="Description (optional)"
        value={questDescription}
        onChangeText={setQuestDescription}
        autoCapitalize="sentences"
      />

      <View style={styles.row}>
        <FocusedInput
          placeholder="Expire in (days)"
          value={questExpiresAt}
          onChangeText={setQuestExpiresAt}
          keyboardType="numeric"
          style={{ flex: 1 }}
        />
        <View
          style={[
            styles.rewardWrapper,
            { borderColor: colors.border, backgroundColor: colors.surface1 },
          ]}
        >
          <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>
            ₹
          </Text>
          <FocusedInput
            placeholder="Reward"
            value={questReward}
            onChangeText={setQuestReward}
            keyboardType="numeric"
            style={{
              flex: 1,
              borderWidth: 0,
              paddingHorizontal: 0,
              backgroundColor: "transparent",
            }}
          />
        </View>
      </View>

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
    try {
      const token = await getToken();
      await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/user/complete-onboarding`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      await user?.reload();
    } catch (e) {
      console.error("complete-onboarding error:", e);
    }
    router.replace("/(tabs)");
  };

  const handleSkip = () => {
    if (step < TOTAL_STEPS - 1) {
      animateToStep(step + 1);
    }
    // no-op on last step — skip is hidden there via hideSkipOnLast
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
      setFamilyCode(family.code);
      setFamilyId(family.id);
      animateToStep(1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
          title: questTitle,
          description: questDescription,
          reward: questReward,
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
            fullWidth
            // style={{ marginTop: commonTheme.space.md }}
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
    gap: commonTheme.space.md,
    justifyContent: "center",
  },
  stepHeader: {
    gap: commonTheme.space.xs,
  },
  row: {
    flexDirection: "row",
    gap: commonTheme.space.md,
  },
  pickerWrapper: {
    flex: 0.8,
    height: 50,
    borderWidth: 1,
    borderRadius: commonTheme.rounded.xl,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: commonTheme.space.md,
  },
  rewardWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: commonTheme.rounded.xl,
    paddingHorizontal: commonTheme.space.lg,
    height: 50,
    gap: commonTheme.space.sm,
  },
});
