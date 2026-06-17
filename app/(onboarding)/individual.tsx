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

import { Copy, Check } from "lucide-react-native";
import ShareCodeModal from "@/components/share/ShareCodeModal";

const TOTAL_STEPS = 3;
const { width } = Dimensions.get("window");

type Colors = ReturnType<typeof useColors>;

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
  questTitle,
  setQuestTitle,
  questDescription,
  setQuestDescription,
  questReward,
  setQuestReward,
  onNext,
  colors,
}: {
  questTitle: string;
  setQuestTitle: (v: string) => void;
  questDescription: string;
  setQuestDescription: (v: string) => void;
  questReward: string;
  setQuestReward: (v: string) => void;
  onNext: () => void;
  colors: Colors;
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
    <FocusedInput
      placeholder="Quest title"
      value={questTitle}
      onChangeText={setQuestTitle}
      autoCapitalize="sentences"
    />
    <FocusedInput
      placeholder="Description"
      value={questDescription}
      onChangeText={setQuestDescription}
      autoCapitalize="sentences"
    />
    <View
      style={{
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
        placeholder="Reward amount"
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
    <Button onPress={onNext} variant="primary" label="Add Quest" fullWidth />
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
      questTitle={questTitle}
      setQuestTitle={setQuestTitle}
      questDescription={questDescription}
      setQuestDescription={setQuestDescription}
      questReward={questReward}
      setQuestReward={setQuestReward}
      onNext={handleNext}
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
