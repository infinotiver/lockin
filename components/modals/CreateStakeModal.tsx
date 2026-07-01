import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { Button } from "@/components/ui/Button";
import { FocusedInput } from "@/components/FocusedInput";
import { BaseModal } from "@/components/ui/BaseModal";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import type { QuestType } from "@/types/stakes";

type ScreenTimeRule = {
  type: "screen_time_limit";
  operator: "less_than";
  scope: "overall"; // later, per_app
  limitMs: number;
};
type StakeRule = ScreenTimeRule | null;
const QUEST_TYPES: { label: string; value: QuestType }[] = [
  { label: "Screen Time", value: "screen-time" },
  { label: "Photo", value: "photo-verify" },
  { label: "Health", value: "health" },
  { label: "Integration", value: "integration" },
];

// validation

function parsePositiveInt(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parsePositiveFloat(value: string): number | null {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// rule encode/decode

function encodeRule(rule: StakeRule): string | null {
  if (!rule) return null;
  return JSON.stringify(rule);
}

// screen time rule builder

function ScreenTimeRuleBuilder({
  hours,
  setHours,
  mins,
  setMins,
  colors,
}: {
  hours: string;
  setHours: (v: string) => void;
  mins: string;
  setMins: (v: string) => void;
  colors: any;
}) {
  return (
    <View style={{ gap: commonTheme.space.sm }}>
      <Text
        style={{
          color: colors.textMuted,
          fontWeight: commonTheme.fontWeight.semibold,
        }}
      >
        Screen time less than
      </Text>
      <View style={styles.ruleInputs}>
        <View style={styles.ruleInputGroup}>
          <FocusedInput
            placeholder="0"
            value={hours}
            onChangeText={setHours}
            keyboardType="numeric"
            style={styles.ruleInput}
          />
          <Text style={[styles.ruleUnit, { color: colors.textMuted }]}>hr</Text>
        </View>
        <Text style={[styles.ruleSep, { color: colors.textMuted }]}>:</Text>
        <View style={styles.ruleInputGroup}>
          <FocusedInput
            placeholder="0"
            value={mins}
            onChangeText={setMins}
            keyboardType="numeric"
            style={styles.ruleInput}
          />
          <Text style={[styles.ruleUnit, { color: colors.textMuted }]}>
            min
          </Text>
        </View>
      </View>
    </View>
  );
}
type CreateStakeModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export function CreateStakeModal({
  visible,
  onClose,
  onCreated,
}: CreateStakeModalProps) {
  const colors = useColors();
  const { getToken } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [type, setType] = useState("screen-time");
  const [expiresIn, setExpiresIn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // screen-time rule fields
  const [ruleHours, setRuleHours] = useState("");
  const [ruleMins, setRuleMins] = useState("");

  // Wipes state automatically whenever the modal finishes closing
  useEffect(() => {
    if (!visible) {
      setTitle("");
      setDescription("");
      setReward("");
      setType("screen-time");
      setExpiresIn("");
      setError("");
      setRuleHours("");
      setRuleMins("");
    }
  }, [visible]);

  const buildRule = (): StakeRule => {
    if (type !== "screen-time") return null;
    const h = parseFloat(ruleHours) || 0;
    const m = parseFloat(ruleMins) || 0;
    const limitMs = (h * 60 + m) * 60000;
    if (limitMs <= 0) return null;
    return {
      type: "screen_time_limit",
      operator: "less_than",
      scope: "overall",
      limitMs,
    };
  };

  const validate = (): string | null => {
    if (!title.trim()) {
      return "Quest title is required.";
    }

    const rewardNum = parsePositiveFloat(reward);
    if (!rewardNum) return "Enter a valid stake amount (must be more than 0).";

    const daysNum = parsePositiveInt(expiresIn);
    if (!daysNum) return "Enter a valid duration in days (must be at least 1).";

    if (type === "screen-time") {
      const h = parseFloat(ruleHours) || 0;
      const m = parseFloat(ruleMins) || 0;
      if (h === 0 && m === 0)
        return "Set a screen time limit for this stake/quest.";
      if (m >= 60) return "Minutes must be less than 60";
    }
    return null;
  };
  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);

    try {
      const token = await getToken();
      const rule = buildRule();
      const descriptionPayload = rule
        ? encodeRule(rule)
        : description.trim() || null;
      const daysNum = parsePositiveInt(expiresIn) as number;
      const expiresAt = new Date(Date.now() + daysNum * 86400000).toISOString();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/quests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: descriptionPayload,
          reward: parsePositiveFloat(reward),
          type,
          expires_at: expiresAt,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body?.error ?? "Failed to create stake.");
        return;
      }

      onCreated?.();

      onClose();
    } catch (e) {
      console.error(e);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal visible={visible} onClose={onClose} title="New stake">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <FocusedInput
            placeholder="What's the goal?"
            value={title}
            onChangeText={setTitle}
            autoCapitalize="sentences"
          />

          {/* Category Pill Strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillContainer}
          >
            {QUEST_TYPES.map((t) => {
              const isSelected = type === t.value;
              return (
                <Pressable
                  key={t.value}
                  onPress={() => setType(t.value)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isSelected
                        ? colors.text
                        : colors.surface1,
                    },
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

          {type === "screen-time" ? (
            <ScreenTimeRuleBuilder
              hours={ruleHours}
              setHours={setRuleHours}
              mins={ruleMins}
              setMins={setRuleMins}
              colors={colors}
            />
          ) : (
            <FocusedInput
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
              autoCapitalize="sentences"
            />
          )}

          {/* Duration */}
          <FocusedInput
            placeholder="Duration (days)"
            value={expiresIn}
            onChangeText={setExpiresIn}
            keyboardType="numeric"
          />

          {/* Reward */}
          <FocusedInput
            placeholder="Reward amount"
            value={reward}
            onChangeText={setReward}
            keyboardType="numeric"
          />

          {/* Error */}
          {!!error && (
            <Text style={[styles.error, { color: colors.destructive }]}>
              {error}
            </Text>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="primary"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              loadingLabel="Creating..."
              fullWidth
            >
              Create stake
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: commonTheme.space.lg,
    // paddingBottom: commonTheme.space.xl,
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
  error: {
    fontSize: 13,
    textAlign: "center",
  },
  actions: {
    marginTop: commonTheme.space.md,
  },
  ruleInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.sm,
  },
  ruleInputGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.xs,
  },
  ruleInput: {
    flex: 1,
  },
  ruleUnit: {
    width: 28,
  },
  ruleSep: {
    fontWeight: commonTheme.fontWeight.medium,
  },
});
