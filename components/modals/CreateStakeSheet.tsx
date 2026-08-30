import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  InteractionManager,
} from "react-native";
import {
  useState,
  useImperativeHandle,
  useCallback,
  useMemo,
  useRef,
  forwardRef,
} from "react";
import { useAuth } from "@clerk/clerk-expo";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import type { QuestType } from "@/types/stakes";

const DateTimePickerModule =
  Platform.OS !== "web"
    ? require("@react-native-community/datetimepicker")
    : null;

const DateTimePicker = DateTimePickerModule?.default ?? null;
const DateTimePickerAndroid =
  DateTimePickerModule?.DateTimePickerAndroid ?? null;

type ScreenTimeRule = {
  type: "screen_time_limit";
  operator: "less_than";
  scope: "overall";
  limitMs: number;
};

type StakeRule = ScreenTimeRule | null;

const QUEST_TYPES: { label: string; value: QuestType }[] = [
  { label: "Screen Time", value: "screen-time" },
];

const DURATION_PRESETS = [
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
];

function parsePositiveFloat(value: string): number | null {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function encodeRule(rule: StakeRule): string | null {
  return rule ? JSON.stringify(rule) : null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;

  return `${h} hr ${m} min`;
}

type CreateStakeSheetProps = {
  onCreated?: () => void;
};

export type CreateStakeSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export const CreateStakeSheet = forwardRef(function CreateStakeSheet(
  { onCreated }: CreateStakeSheetProps,
  ref: React.Ref<CreateStakeSheetRef>,
) {
  const colors = useColors();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["90%"], []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [type, setType] = useState<QuestType>("screen-time");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [limitSeconds, setLimitSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    setTitle("");
    setDescription("");
    setReward("");
    setType("screen-time");
    setExpiresAt(null);
    setSelectedPreset(null);
    setShowDatePicker(false);
    setLimitSeconds(0);
    setError("");
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }),
    [],
  );

  const buildRule = (): StakeRule => {
    if (type !== "screen-time" || limitSeconds <= 0) return null;

    return {
      type: "screen_time_limit",
      operator: "less_than",
      scope: "overall",
      limitMs: limitSeconds * 1000,
    };
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Quest title is required.";

    const rewardNum = parsePositiveFloat(reward);
    if (!rewardNum) {
      return "Enter a valid stake amount (must be more than 0).";
    }

    if (!expiresAt) return "Pick a deadline for this stake.";

    if (expiresAt.getTime() <= Date.now()) {
      return "Deadline must be in the future.";
    }

    if (type === "screen-time" && limitSeconds <= 0) {
      return "Set a screen time limit for this stake.";
    }

    return null;
  };

  const handleSubmit = async (): Promise<void> => {
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
          expires_at: expiresAt!.toISOString(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Failed to create stake.");
        return;
      }

      onCreated?.();
      reset();
      sheetRef.current?.dismiss();
    } catch (e) {
      console.error(e);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const openDeadlinePicker = () => {
    if (Platform.OS === "web") return;

    const initial = expiresAt ?? new Date();

    if (Platform.OS === "android") {
      InteractionManager.runAfterInteractions(() => {
        DateTimePickerAndroid.open({
          value: initial,
          mode: "date",
          minimumDate: new Date(),
          onChange: (_event: any, date?: Date) => {
            if (date) {
              setExpiresAt(date);
              setSelectedPreset(null);
            }
          },
        });
      });
    } else {
      setShowDatePicker(true);
    }
  };

  const limitHours =
    limitSeconds > 0 ? String(Math.floor(limitSeconds / 3600)) : "";

  const limitMinutes =
    limitSeconds > 0 ? String(Math.floor((limitSeconds % 3600) / 60)) : "";

  const handleHoursChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    const hours = digits === "" ? 0 : parseInt(digits, 10);
    const minutes = Math.floor((limitSeconds % 3600) / 60);

    setLimitSeconds(hours * 3600 + minutes * 60);
  };

  const handleMinutesChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    const minutes = Math.min(digits === "" ? 0 : parseInt(digits, 10), 59);
    const hours = Math.floor(limitSeconds / 3600);

    setLimitSeconds(hours * 3600 + minutes * 60);
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={reset}
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
        />
      )}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.sheetContent,
          { paddingBottom: commonTheme.space.xl + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[commonTheme.text.sectionTitle, { color: colors.text }]}>
          New stake
        </Text>

        <BottomSheetTextInput
          placeholder="What's the goal?"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          autoCapitalize="sentences"
          style={[
            commonTheme.text.input,
            styles.input,
            { color: colors.text, borderColor: colors.border },
          ]}
        />

        <View style={styles.pillRow}>
          {QUEST_TYPES.map((item) => {
            const selected = type === item.value;

            return (
              <Pressable
                key={item.value}
                onPress={() => setType(item.value)}
                style={[
                  commonTheme.layout.center,
                  styles.pill,
                  {
                    backgroundColor: selected
                      ? colors.text
                      : colors.surfaceContainerHigh,
                  },
                ]}
              >
                <Text
                  style={[
                    commonTheme.text.body,
                    {
                      color: selected ? colors.background : colors.text,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {type === "screen-time" ? (
          <View style={styles.field}>
            <Text style={[commonTheme.text.label, { color: colors.textMuted }]}>
              Stay under
            </Text>

            <View style={styles.durationRow}>
              <BottomSheetTextInput
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={limitHours}
                onChangeText={handleHoursChange}
                keyboardType="numeric"
                maxLength={2}
                style={[
                  commonTheme.text.input,
                  styles.durationInput,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />

              <Text
                style={[commonTheme.text.body, { color: colors.textMuted }]}
              >
                hr
              </Text>

              <BottomSheetTextInput
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={limitMinutes}
                onChangeText={handleMinutesChange}
                keyboardType="numeric"
                maxLength={2}
                style={[
                  commonTheme.text.input,
                  styles.durationInput,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />

              <Text
                style={[commonTheme.text.body, { color: colors.textMuted }]}
              >
                min
              </Text>
            </View>

            {limitSeconds > 0 && (
              <Text
                style={[commonTheme.text.caption, { color: colors.textMuted }]}
              >
                {formatDuration(limitSeconds)} per day
              </Text>
            )}
          </View>
        ) : (
          <BottomSheetTextInput
            placeholder="Description (optional)"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            autoCapitalize="sentences"
            style={[
              commonTheme.text.input,
              styles.input,
              { color: colors.text, borderColor: colors.border },
            ]}
          />
        )}

        <View style={styles.field}>
          <Text style={[commonTheme.text.label, { color: colors.textMuted }]}>
            Deadline
          </Text>

          <View style={styles.pillRow}>
            {DURATION_PRESETS.map((preset) => {
              const selected = selectedPreset === preset.label;

              return (
                <Pressable
                  key={preset.label}
                  onPress={() => {
                    setExpiresAt(new Date(Date.now() + preset.days * 86400000));
                    setSelectedPreset(preset.label);
                  }}
                  style={[
                    commonTheme.layout.center,
                    styles.pill,
                    {
                      backgroundColor: selected
                        ? colors.surfaceContainerHigh
                        : colors.surfaceContainerLow,
                    },
                  ]}
                >
                  <Text
                    style={[
                      commonTheme.text.body,
                      {
                        color: selected ? colors.onSurfaceVariant : colors.text,
                      },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              onPress={openDeadlinePicker}
              style={[
                commonTheme.layout.center,
                styles.pill,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <Text
                style={[
                  commonTheme.text.body,
                  { color: colors.onPrimaryContainer },
                ]}
              >
                {expiresAt ? expiresAt.toLocaleDateString() : "Custom"}
              </Text>
            </Pressable>
          </View>

          {showDatePicker && Platform.OS === "ios" && (
            <View style={styles.field}>
              <DateTimePicker
                mode="date"
                display="inline"
                value={expiresAt ?? new Date()}
                minimumDate={new Date()}
                onChange={(_: any, date?: Date) => {
                  if (date) {
                    setExpiresAt(date);
                    setSelectedPreset(null);
                  }
                }}
              />

              <Button
                variant="secondary"
                size="sm"
                label="Done"
                onPress={() => setShowDatePicker(false)}
              />
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={[commonTheme.text.label, { color: colors.textMuted }]}>
            Stake amount
          </Text>

          <View style={[styles.currencyRow, { borderColor: colors.border }]}>
            <Text
              style={[commonTheme.text.amount, { color: colors.textMuted }]}
            >
              ₹
            </Text>

            <BottomSheetTextInput
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              value={reward}
              onChangeText={setReward}
              keyboardType="decimal-pad"
              style={[
                commonTheme.text.amount,
                styles.currencyInput,
                { color: colors.text },
              ]}
            />
          </View>
        </View>

        {!!error && (
          <Text style={[commonTheme.text.error, { color: colors.destructive }]}>
            {error}
          </Text>
        )}

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
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: commonTheme.space.lg,
    gap: commonTheme.space.xl,
  },

  field: {
    gap: commonTheme.space.sm,
  },

  input: {
    borderWidth: 1,
    borderRadius: commonTheme.rounded.md,
    paddingHorizontal: commonTheme.space.md,
    paddingVertical: commonTheme.space.md,
  },

  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: commonTheme.space.sm,
  },

  pill: {
    minHeight: 40,
    paddingHorizontal: commonTheme.space.lg,
    borderRadius: commonTheme.rounded.full,
  },

  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.sm,
  },

  durationInput: {
    width: 64,
    textAlign: "center",
  },

  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: commonTheme.rounded.md,
    paddingHorizontal: commonTheme.space.md,
  },

  currencyInput: {
    flex: 1,
  },
});
