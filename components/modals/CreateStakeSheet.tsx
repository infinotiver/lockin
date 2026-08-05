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

// No web implementation exists for this native module; only load it on native.
// Only the "date" mode is used here (see openDeadlinePicker) — the deadline
// picker was already linked and working, so this keeps using it as-is.
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
  // { label: "Photo", value: "photo-verify" },
  // { label: "Health", value: "health" },
  // { label: "Integration", value: "integration" },
];

const DURATION_PRESETS = [
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
];

// Returns a finite amount > 0, or null if unusable.
function parsePositiveFloat(value: string): number | null {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Serializes a rule into the description field's existing JSON-string encoding.
function encodeRule(rule: StakeRule): string | null {
  if (!rule) return null;
  return JSON.stringify(rule);
}

// Formats seconds as a compact "Xhr Ymin" string.
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [limitSeconds, setLimitSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clears form state after a successful create or sheet dismissal.
  const reset = useCallback((): void => {
    setTitle("");
    setDescription("");
    setReward("");
    setType("screen-time");
    setExpiresAt(null);
    setShowDatePicker(false);
    setLimitSeconds(0);
    setError("");
  }, []);

  // BottomSheetModal already exposes present/dismiss on its own ref; this
  // just narrows the surface the parent screen sees to those two methods.
  useImperativeHandle(
    ref,
    () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }),
    [],
  );

  // Builds the evaluator rule for screen-time stakes only.
  const buildRule = (): StakeRule => {
    if (type !== "screen-time" || limitSeconds <= 0) return null;
    return {
      type: "screen_time_limit",
      operator: "less_than",
      scope: "overall",
      limitMs: limitSeconds * 1000,
    };
  };

  // Returns a user-facing error, or null if the form can be submitted.
  const validate = (): string | null => {
    if (!title.trim()) return "Quest title is required.";

    const rewardNum = parsePositiveFloat(reward);
    if (!rewardNum) return "Enter a valid stake amount (must be more than 0).";

    if (!expiresAt) return "Pick a deadline for this stake.";
    if (expiresAt.getTime() <= Date.now())
      return "Deadline must be in the future.";

    if (type === "screen-time" && limitSeconds <= 0)
      return "Set a screen time limit for this stake.";

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

  // Android's DateTimePicker has no real inline mode — it's a bridge to a
  // native dialog, not a React-tree view — so it's driven imperatively.
  // iOS renders an actual inline calendar, so that path stays state-driven.
  // runAfterInteractions avoids a FragmentManager crash that can happen if
  // .open() fires while the sheet/activity is still mid-transition.
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
            if (date) setExpiresAt(date);
          },
        });
      });
    } else {
      setShowDatePicker(true);
    }
  };

  // Keeps the hour/minute text fields in sync with limitSeconds without
  // clamping mid-typing (e.g. typing "1" then "2" for "12" shouldn't reset).
  const limitHours =
    limitSeconds > 0 ? String(Math.floor(limitSeconds / 3600)) : "";
  const limitMinutes =
    limitSeconds > 0 ? String(Math.floor((limitSeconds % 3600) / 60)) : "";

  const handleHoursChange = (v: string) => {
    const digits = v.replace(/[^0-9]/g, "");
    const h = digits === "" ? 0 : parseInt(digits, 10);
    const m = Math.floor((limitSeconds % 3600) / 60);
    setLimitSeconds(h * 3600 + m * 60);
  };

  const handleMinutesChange = (v: string) => {
    const digits = v.replace(/[^0-9]/g, "");
    const raw = digits === "" ? 0 : parseInt(digits, 10);
    const m = Math.min(raw, 59);
    const h = Math.floor(limitSeconds / 3600);
    setLimitSeconds(h * 3600 + m * 60);
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
            styles.input,
            { color: colors.text, borderColor: colors.border },
          ]}
        />

        <View style={styles.pillRow}>
          {QUEST_TYPES.map((t) => {
            const isSelected = type === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => setType(t.value)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected ? colors.text : colors.surface1,
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
        </View>

        {type === "screen-time" ? (
          <View style={{ gap: commonTheme.space.sm }}>
            <Text
              style={{
                color: colors.textMuted,
                fontWeight: commonTheme.fontWeight.semibold,
              }}
            >
              Stay under
            </Text>
            <View style={[styles.durationRow]}>
              <BottomSheetTextInput
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={limitHours}
                onChangeText={handleHoursChange}
                keyboardType="numeric"
                maxLength={2}
                style={[
                  styles.input,
                  styles.durationInput,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
              <Text style={{ color: colors.textMuted }}>hr</Text>
              <BottomSheetTextInput
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={limitMinutes}
                onChangeText={handleMinutesChange}
                keyboardType="numeric"
                maxLength={2}
                style={[
                  styles.input,
                  styles.durationInput,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
              <Text style={{ color: colors.textMuted }}>min</Text>
            </View>
            {limitSeconds > 0 && (
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
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
              styles.input,
              { color: colors.text, borderColor: colors.border },
            ]}
          />
        )}

        <View style={{ gap: commonTheme.space.sm }}>
          <Text
            style={{
              color: colors.textMuted,
              fontWeight: commonTheme.fontWeight.semibold,
            }}
          >
            Deadline
          </Text>
          <View style={styles.pillRow}>
            {DURATION_PRESETS.map((p) => {
              const target = new Date(Date.now() + p.days * 86400000);
              const isSelected =
                expiresAt &&
                Math.abs(expiresAt.getTime() - target.getTime()) < 60000;
              return (
                <Pressable
                  key={p.label}
                  onPress={() => setExpiresAt(target)}
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
                    }}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={openDeadlinePicker}
              style={[styles.pill, { backgroundColor: colors.text }]}
            >
              <Text style={{ color: colors.surface1 }}>
                {expiresAt &&
                !DURATION_PRESETS.some(
                  (p) =>
                    Math.abs(
                      expiresAt.getTime() - (Date.now() + p.days * 86400000),
                    ) < 60000,
                )
                  ? expiresAt.toLocaleDateString()
                  : "Custom"}
              </Text>
            </Pressable>
          </View>
          {/* iOS only — Android is driven entirely by openDeadlinePicker's imperative dialog */}
          {showDatePicker && Platform.OS === "ios" && (
            <View style={{ gap: commonTheme.space.sm }}>
              <DateTimePicker
                mode="date"
                display="inline"
                value={expiresAt ?? new Date()}
                minimumDate={new Date()}
                onChange={(_: any, date?: Date) => {
                  if (date) setExpiresAt(date);
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

        <View style={{ gap: commonTheme.space.sm }}>
          <Text
            style={{
              color: colors.textMuted,
              fontWeight: commonTheme.fontWeight.semibold,
            }}
          >
            Stake amount
          </Text>
          <View style={[styles.currencyRow, { borderColor: colors.border }]}>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: commonTheme.fontSize.md,
              }}
            >
              ₹
            </Text>
            <BottomSheetTextInput
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              value={reward}
              onChangeText={setReward}
              keyboardType="decimal-pad"
              style={[styles.currencyInput, { color: colors.text }]}
            />
          </View>
        </View>

        {!!error && (
          <Text style={[styles.error, { color: colors.destructive }]}>
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
    gap: commonTheme.space.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: commonTheme.rounded.md,
    paddingHorizontal: commonTheme.space.md,
    paddingVertical: commonTheme.space.sm,
    fontSize: 16,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: commonTheme.space.sm,
  },
  pill: {
    paddingHorizontal: commonTheme.space.lg,
    paddingVertical: commonTheme.space.sm,
    borderRadius: commonTheme.rounded.lg,
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
    gap: commonTheme.space.xs,
  },
  currencyInput: {
    flex: 1,
    paddingVertical: commonTheme.space.sm,
    fontSize: 16,
  },
  error: {
    fontSize: 13,
    textAlign: "center",
  },
});
