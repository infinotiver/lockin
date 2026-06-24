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

const QUEST_TYPES = [
  { label: "Screen Time", value: "screen-time" },

  { label: "Photo", value: "photo-verify" },
  { label: "Health (Google Fit/Apple Health)", value: "health" },
  {
    label: "Other Integrations",
    value: "integration",
  },
];

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
  const [type, setType] = useState("chore");
  const [expiresIn, setExpiresIn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Wipes state automatically whenever the modal finishes closing
  useEffect(() => {
    if (!visible) {
      setTitle("");
      setDescription("");
      setReward("");
      setType("chore");
      setExpiresIn("");
      setError("");
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Quest title is required.");
      return;
    }
    if (!reward.trim() || isNaN(Number(reward))) {
      setError("Enter a valid reward amount.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const token = await getToken();
      const expiresAt = expiresIn
        ? new Date(Date.now() + Number(expiresIn) * 86400000).toISOString()
        : null;

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/quests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          reward: Number(reward),
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

          {/* Description */}
          <FocusedInput
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            autoCapitalize="sentences"
          />

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
});
