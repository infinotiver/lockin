// app/(onboarding)/individual.tsx
import { Platform } from "react-native";
import { View, Text, Animated, Pressable, Dimensions } from "react-native";
import { Button } from "@/components/ui/Button";
import { FocusedInput } from "@/components/FocusedInput";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import commonTheme from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { ViewWrapper } from "@/components/onboarding/ViewWrapper";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { useAuth } from "@clerk/clerk-expo";
import * as Clipboard from "expo-clipboard";
import ShareCodeModal from "@/components/share/ShareCodeModal";
import { Picker } from "@react-native-picker/picker";
const TOTAL_STEPS = 3;
const { width } = Dimensions.get("window");

type Colors = ReturnType<typeof useColors>;

const QUEST_TYPES = [
  { label: "Chore", value: "chore" },
  { label: "Study", value: "study" },
  { label: "Screen-time", value: "screen-time" },
  { label: "Work", value: "work" },
  { label: "Shop", value: "shop" },
];

const StepOne = ({
  familyName,
  setFamilyName,
  defaultFamilyName,
  onNext,
  loading,
  colors,
}: {
  familyName: string;
  setFamilyName: (v: string) => void;
  defaultFamilyName: string;
  onNext: () => void;
  loading: boolean;
  colors: Colors;
}) => (
  <View
    style={{ flex: 1, gap: commonTheme.space.md, justifyContent: "center" }}
  >
    <View style={{ gap: commonTheme.space.xs }}>
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
      label="Create Family"
      loadingLabel="Creating..."
      loading={loading}
      disabled={loading}
      fullWidth
    />
  </View>
);

const StepTwo = ({
  loading,
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
  colors,
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
  colors: Colors;
  loading: boolean;
}) => (
  <View
    style={{ flex: 1, gap: commonTheme.space.md, justifyContent: "center" }}
  >
    <View style={{ gap: commonTheme.space.xs }}>
      <OnboardingTitle>Add your first quest</OnboardingTitle>
      <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>
        Quests are tasks your teens can complete to earn rewards.
      </Text>
    </View>

    {/* Title + Type row */}
    <View style={{ flexDirection: "row", gap: commonTheme.space.md }}>
      <FocusedInput
        placeholder="Quest title"
        value={questTitle}
        onChangeText={setQuestTitle}
        autoCapitalize="sentences"
        style={{ flex: 1 }}
      />
      <View
        style={{
          flex: 0.8,
          height: 50,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: commonTheme.rounded.xl,
          backgroundColor: colors.surface1,
          justifyContent: "center",
          overflow: "hidden",
          padding: commonTheme.space.md,
        }}
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

    {/* Description */}
    <FocusedInput
      placeholder="Description"
      value={questDescription}
      onChangeText={setQuestDescription}
      autoCapitalize="sentences"
    />

    {/* Expire By + Reward row */}
    <View style={{ flexDirection: "row", gap: commonTheme.space.md }}>
      <FocusedInput
        placeholder="Expire in (days)"
        value={questExpiresAt}
        onChangeText={setQuestExpiresAt}
        keyboardType="numeric"
        style={{ flex: 1 }}
      />
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface1,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: commonTheme.rounded.xl,
          paddingHorizontal: commonTheme.space.lg,
          height: 50,
          gap: commonTheme.space.sm,
        }}
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
      label="Add Quest"
      loadingLabel="Adding..."
      loading={loading}
      disabled={loading}
      fullWidth
    />
  </View>
);

const StepThree = ({
  onNext,
  familyCode,
  copied,
  onCopy,
  onShare,
  colors,
}: {
  onNext: () => void;
  familyCode: string;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
  colors: Colors;
}) => <ShareCodeModal code={familyCode} />;

const Individual = () => {
  const router = useRouter();
  const colors = useColors();
  const { user } = useUser();

  const [step, setStep] = useState(0);
  const [familyName, setFamilyName] = useState("");
  const [questTitle, setQuestTitle] = useState("");
  const [questDescription, setQuestDescription] = useState("");
  const [questReward, setQuestReward] = useState("");
  const [questType, setQuestType] = useState("chore");
  const [questExpiresAt, setQuestExpiresAt] = useState("");

  const [familyCode, setFamilyCode] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const defaultFamilyName = `${user?.firstName ?? "Your"}'s Family`;

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(familyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (Platform.OS === "web") {
      // fallback for web
      await Clipboard.setStringAsync(`yourapp://join?code=${familyCode}`);
      alert("Link copied to clipboard!");
      return;
    }
    // Sharing.shareAsync(`yourapp://join?code=${familyCode}`)
  };

  const handleAddQuest = async () => {
    // if no family yet (user skipped step 1), just skip ahead
    console.log(
      "Calling:",
      `${process.env.EXPO_PUBLIC_API_URL}/api/${familyId}/quests`,
    );
    if (!familyId) {
      handleNext();
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();

      // convert days to an ISO timestamp
      const expiresAt = questExpiresAt
        ? new Date(
            Date.now() + Number(questExpiresAt) * 24 * 60 * 60 * 1000,
          ).toISOString()
        : null;

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/quests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          familyId, // ← in body now
          title: questTitle,
          description: questDescription,
          reward: questReward,
          type: questType,
          expires_at: expiresAt,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        console.error("Create quest error:", res.status, body);
        return;
      }

      animateToStep(2); // move to invite step
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
          body: JSON.stringify({ name: familyName }),
        },
      );

      if (!res.ok) {
        const body = await res.json();
        console.error("Create family error:", res.status, body);
        return;
      }

      const { family } = await res.json();
      setFamilyCode(family.code);
      setFamilyId(family.id);
      animateToStep(1); // move to quest step
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // set default family name once user loads, but only if the user hasn't typed anything
  useEffect(() => {
    if (user?.firstName && !familyName) {
      setFamilyName(`${user.firstName}'s Family`);
    }
  }, [user?.firstName]);

  const animateToStep = (next: number) => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 280,
      useNativeDriver: false,
    }).start(() => {
      setStep(next);
      slideAnim.setValue(width);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: false,
      }).start();
    });
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) animateToStep(step + 1);
    else router.replace("/(tabs)");
  };

  const handleSkip = () => {
    if (step < TOTAL_STEPS - 1) animateToStep(step + 1);
    else router.replace("/(tabs)");
  };

  const steps = [
    <StepOne
      familyName={familyName}
      setFamilyName={setFamilyName}
      defaultFamilyName={defaultFamilyName}
      onNext={handleCreateFamily}
      loading={loading}
      colors={colors}
    />,
    <StepTwo
      loading={loading}
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
      colors={colors}
    />,
    <StepThree
      onNext={handleNext}
      familyCode={familyCode}
      copied={copied}
      onCopy={handleCopy}
      onShare={handleShare}
      colors={colors}
    />,
  ];

  return (
    <ViewWrapper>
      <OnboardingCard>
        <Animated.View
          style={{ flex: 1, transform: [{ translateX: slideAnim }] }}
        >
          {steps[step]}
        </Animated.View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: commonTheme.space.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", gap: commonTheme.space.sm }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === step ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === step ? colors.accent : colors.border,
                }}
              />
            ))}
          </View>
          <Pressable
            onPress={loading ? undefined : handleSkip}
            disabled={loading}
          >
            <Text
              style={[
                commonTheme.text.body,
                {
                  color: loading ? colors.border : colors.textMuted,
                },
              ]}
            >
              Skip
            </Text>
          </Pressable>
        </View>
      </OnboardingCard>
    </ViewWrapper>
  );
};

export default Individual;
