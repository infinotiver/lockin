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
import { CalendarDays, Coins, Timer } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import type { QuestType } from "@/types/stakes";
import { useCoins } from "@/contexts/CoinsContext";
import {
  getWinBonus,
  MAX_ACTIVE_COIN_STAKES,
  WAGER_MAX,
  WAGER_MIN,
} from "@/constants/coinEconomy";

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
type ActiveField = "limit" | "deadline" | "wager";

const MINUTE = 60;
const HOUR = 3600;
const DAY_MS = 86400000;

const QUEST_TYPES: { label: string; value: QuestType }[] = [
  { label: "Screen Time", value: "screen-time" },
];

const LIMIT_PRESETS = [
  { label: "1h", seconds: HOUR },
  { label: "2h", seconds: 2 * HOUR },
  { label: "3h", seconds: 3 * HOUR },
  { label: "4h", seconds: 4 * HOUR },
];

const DURATION_PRESETS = [
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
];

const WAGER_PRESETS = [10, 25, 50, 100];

function makeRequestId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    return (char === "x" ? value : (value & 3) | 8).toString(16);
  });
}

function encodeRule(rule: StakeRule): string | null {
  return rule ? JSON.stringify(rule) : null;
}

function formatLimit(seconds: number): string {
  const h = Math.floor(seconds / HOUR);
  const m = Math.floor((seconds % HOUR) / MINUTE);

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;

  return `${h}h ${m}m`;
}

function formatDeadline(date: Date): string {
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function Chip({
  label,
  selected,
  onPress,
  mono,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  mono?: boolean;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={[
        commonTheme.layout.center,
        styles.chip,
        {
          backgroundColor: selected
            ? colors.primaryContainer
            : colors.surfaceContainerHigh,
        },
      ]}
    >
      <Text
        style={[
          commonTheme.text.body,
          { color: selected ? colors.onPrimaryContainer : colors.text },
          mono && { fontFamily: commonTheme.font.mono },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Tile({
  label,
  value,
  filled,
  active,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  filled: boolean;
  active: boolean;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tile,
        {
          backgroundColor: active
            ? colors.surfaceContainerHigh
            : colors.surfaceContainerLow,
        },
      ]}
    >
      <View style={styles.tileHeader}>
        {icon}
        <Text style={[commonTheme.text.caption, { color: colors.textMuted }]}>
          {label}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        style={[
          commonTheme.text.bodyStrong,
          {
            color: filled ? colors.text : colors.textMuted,
            fontFamily: commonTheme.font.monoSemibold,
          },
        ]}
      >
        {value}
      </Text>
    </Pressable>
  );
}

type CreateStakeSheetProps = {
  onCreated?: () => void;
  activeCoinStakeCount: number;
};

export type CreateStakeSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export const CreateStakeSheet = forwardRef(function CreateStakeSheet(
  { onCreated, activeCoinStakeCount }: CreateStakeSheetProps,
  ref: React.Ref<CreateStakeSheetRef>,
) {
  const colors = useColors();
  const { getToken } = useAuth();
  const { balance, status: coinStatus, refresh: refreshCoins } = useCoins();
  const insets = useSafeAreaInsets();

  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["90%"], []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [wagerCoins, setWagerCoins] = useState("");
  const [type, setType] = useState<QuestType>("screen-time");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [limitSeconds, setLimitSeconds] = useState(0);
  const [active, setActive] = useState<ActiveField>("limit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(makeRequestId());

  const reset = useCallback(() => {
    setTitle("");
    setDescription("");
    setWagerCoins("");
    setType("screen-time");
    setExpiresAt(null);
    setSelectedPreset(null);
    setShowDatePicker(false);
    setLimitSeconds(0);
    setActive("limit");
    setError("");
    requestIdRef.current = makeRequestId();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      present: () => {
        requestIdRef.current = makeRequestId();
        sheetRef.current?.present();
      },
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

  const wagerError = (): string | null => {
    if (!wagerCoins) return null;
    const wager = Number(wagerCoins);
    if (!Number.isInteger(wager) || wager < WAGER_MIN)
      return `Minimum ${WAGER_MIN} coins`;
    if (balance === null || wager > balance)
      return `You have ${balance ?? 0} coins`;
    if (wager > WAGER_MAX) return `Maximum ${WAGER_MAX} coins`;
    if (activeCoinStakeCount >= MAX_ACTIVE_COIN_STAKES) {
      return "Complete your active coin stake before creating another";
    }
    return null;
  };

  const wagerErr = wagerError();

  const validate = (): { message: string; field?: ActiveField } | null => {
    if (!title.trim()) return { message: "Quest title is required." };

    if (type === "screen-time" && limitSeconds <= 0) {
      return {
        message: "Set a screen time limit for this stake.",
        field: "limit",
      };
    }

    if (!expiresAt) {
      return { message: "Pick a deadline for this stake.", field: "deadline" };
    }

    if (expiresAt.getTime() <= Date.now()) {
      return { message: "Deadline must be in the future.", field: "deadline" };
    }

    if (wagerErr) return { message: wagerErr, field: "wager" };
    if (!wagerCoins)
      return { message: `Minimum ${WAGER_MIN} coins`, field: "wager" };

    return null;
  };

  const handleSubmit = async (): Promise<void> => {
    const invalid = validate();

    if (invalid) {
      setError(invalid.message);
      if (invalid.field) setActive(invalid.field);
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
          reward: 0,
          wagerCoins: Number(wagerCoins),
          clientRequestId: requestIdRef.current,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          type,
          expires_at: expiresAt!.toISOString(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(
          body?.error === "stake_cap"
            ? "Complete your active coin stake before creating another."
            : body?.error ?? "Failed to create stake.",
        );
        return;
      }

      onCreated?.();
      await refreshCoins();
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
    limitSeconds > 0 ? String(Math.floor(limitSeconds / HOUR)) : "";

  const limitMinutes =
    limitSeconds > 0 ? String(Math.floor((limitSeconds % HOUR) / MINUTE)) : "";

  const handleHoursChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    const hours = digits === "" ? 0 : parseInt(digits, 10);
    const minutes = Math.floor((limitSeconds % HOUR) / MINUTE);

    setLimitSeconds(hours * HOUR + minutes * MINUTE);
  };

  const handleMinutesChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    const minutes = Math.min(digits === "" ? 0 : parseInt(digits, 10), 59);
    const hours = Math.floor(limitSeconds / HOUR);

    setLimitSeconds(hours * HOUR + minutes * MINUTE);
  };

  const wagerCap = Math.min(balance ?? 0, WAGER_MAX);
  const wagerPresets = WAGER_PRESETS.filter(
    (value) => value >= WAGER_MIN && value < wagerCap,
  );
  const stakeDays = Math.max(
    1,
    Math.ceil(((expiresAt?.getTime() ?? Date.now()) - Date.now()) / DAY_MS),
  );
  const showOutcome = !!wagerCoins && !wagerErr;

  const inputStyle = [
    commonTheme.text.input,
    styles.input,
    { color: colors.text, backgroundColor: colors.surfaceContainerHigh },
  ];

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
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          style={[
            commonTheme.text.input,
            styles.input,
            { color: colors.text, backgroundColor: colors.surfaceContainerLow },
          ]}
        />

        {QUEST_TYPES.length > 1 && (
          <View style={styles.chipRow}>
            {QUEST_TYPES.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={type === item.value}
                onPress={() => setType(item.value)}
              />
            ))}
          </View>
        )}

        {type !== "screen-time" && (
          <BottomSheetTextInput
            placeholder="Description (optional)"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            autoCapitalize="sentences"
            style={[
              commonTheme.text.input,
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surfaceContainerLow,
              },
            ]}
          />
        )}

        <View style={styles.tileRow}>
          {type === "screen-time" && (
            <Tile
              label="Daily limit"
              value={limitSeconds > 0 ? formatLimit(limitSeconds) : "—"}
              filled={limitSeconds > 0}
              active={active === "limit"}
              icon={
                <Timer
                  size={commonTheme.fontSize.xl}
                  color={active === "limit" ? colors.primary : colors.textMuted}
                />
              }
              onPress={() => setActive("limit")}
            />
          )}
          <Tile
            label="Deadline"
            value={expiresAt ? formatDeadline(expiresAt) : "—"}
            filled={!!expiresAt}
            active={active === "deadline"}
            icon={
              <CalendarDays
                size={commonTheme.fontSize.xl}
                color={
                  active === "deadline" ? colors.primary : colors.textMuted
                }
              />
            }
            onPress={() => setActive("deadline")}
          />
          <Tile
            label="Wager"
            value={wagerCoins || "—"}
            filled={!!wagerCoins}
            active={active === "wager"}
            icon={
              <Coins
                size={commonTheme.fontSize.xl}
                color={active === "wager" ? colors.primary : colors.textMuted}
              />
            }
            onPress={() => setActive("wager")}
          />
        </View>

        <View
          style={[
            styles.panel,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          {active === "limit" && type === "screen-time" && (
            <>
              <View style={styles.chipRow}>
                {LIMIT_PRESETS.map((preset) => (
                  <Chip
                    key={preset.label}
                    label={preset.label}
                    mono
                    selected={limitSeconds === preset.seconds}
                    onPress={() => setLimitSeconds(preset.seconds)}
                  />
                ))}
              </View>

              <Text
                style={[commonTheme.text.label, { color: colors.textMuted }]}
              >
                Custom
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
                    ...inputStyle,
                    styles.durationInput,
                    { fontFamily: commonTheme.font.mono },
                  ]}
                />
                <Text
                  style={[commonTheme.text.body, { color: colors.textMuted }]}
                >
                  h
                </Text>
                <BottomSheetTextInput
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={limitMinutes}
                  onChangeText={handleMinutesChange}
                  keyboardType="numeric"
                  maxLength={2}
                  style={[
                    ...inputStyle,
                    styles.durationInput,
                    { fontFamily: commonTheme.font.mono },
                  ]}
                />
                <Text
                  style={[commonTheme.text.body, { color: colors.textMuted }]}
                >
                  m
                </Text>
              </View>
            </>
          )}

          {active === "deadline" && (
            <>
              <View style={styles.chipRow}>
                {DURATION_PRESETS.map((preset) => (
                  <Chip
                    key={preset.label}
                    label={preset.label}
                    selected={selectedPreset === preset.label}
                    onPress={() => {
                      setExpiresAt(new Date(Date.now() + preset.days * DAY_MS));
                      setSelectedPreset(preset.label);
                    }}
                  />
                ))}
                <Chip
                  label="Custom"
                  selected={!!expiresAt && !selectedPreset}
                  onPress={openDeadlinePicker}
                />
              </View>

              {showDatePicker && Platform.OS === "ios" && (
                <View style={styles.panelInner}>
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
            </>
          )}

          {active === "wager" && (
            <>
              <BottomSheetTextInput
                placeholder="10"
                placeholderTextColor={colors.textMuted}
                value={wagerCoins}
                onChangeText={(value) =>
                  setWagerCoins(value.replace(/\D/g, "").slice(0, 3))
                }
                keyboardType="number-pad"
                maxLength={3}
                editable={
                  balance !== null && balance > 0 && coinStatus === "ready"
                }
                style={[
                  commonTheme.text.amount,
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceContainerHigh,
                    fontFamily: commonTheme.font.mono,
                  },
                ]}
              />

              {balance === 0 ? (
                <Text
                  style={[
                    commonTheme.text.caption,
                    { color: colors.textMuted },
                  ]}
                >
                  You&apos;re out of coins. Finish a stake to earn more.
                </Text>
              ) : (
                <>
                  {wagerCap >= WAGER_MIN && (
                    <View style={styles.chipRow}>
                      {wagerPresets.map((value) => (
                        <Chip
                          key={value}
                          label={String(value)}
                          mono
                          selected={wagerCoins === String(value)}
                          onPress={() => setWagerCoins(String(value))}
                        />
                      ))}
                      <Chip
                        label="Max"
                        mono
                        selected={wagerCoins === String(wagerCap)}
                        onPress={() => setWagerCoins(String(wagerCap))}
                      />
                    </View>
                  )}
                  {!!wagerErr && (
                    <Text
                      style={[
                        commonTheme.text.caption,
                        { color: colors.error },
                      ]}
                    >
                      {wagerErr}
                    </Text>
                  )}
                </>
              )}
            </>
          )}
        </View>

        {showOutcome && (
          <View
            style={[
              styles.outcome,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <View style={styles.outcomeRow}>
              <Text
                style={[commonTheme.text.body, { color: colors.textMuted }]}
              >
                Win
              </Text>
              <Text
                style={[
                  commonTheme.text.bodyStrong,
                  {
                    color: colors.secondary,
                    fontFamily: commonTheme.font.monoSemibold,
                  },
                ]}
              >
                {wagerCoins} + {getWinBonus(Number(wagerCoins), stakeDays)}
              </Text>
            </View>
            <View style={styles.outcomeRow}>
              <Text
                style={[commonTheme.text.body, { color: colors.textMuted }]}
              >
                Miss
              </Text>
              <Text
                style={[
                  commonTheme.text.bodyStrong,
                  {
                    color: colors.error,
                    fontFamily: commonTheme.font.monoSemibold,
                  },
                ]}
              >
                −{wagerCoins}
              </Text>
            </View>
          </View>
        )}

        {!!error && (
          <Text style={[commonTheme.text.error, { color: colors.destructive }]}>
            {error}
          </Text>
        )}

        <Button
          variant="primary"
          onPress={handleSubmit}
          loading={loading}
          disabled={
            loading || coinStatus !== "ready" || !wagerCoins || !!wagerErr
          }
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
    borderRadius: commonTheme.rounded.md,
    paddingHorizontal: commonTheme.space.md,
    paddingVertical: commonTheme.space.md,
  },

  tileRow: {
    flexDirection: "row",
    gap: commonTheme.space.sm,
  },

  tile: {
    flex: 1,
    padding: commonTheme.space.md,
    borderRadius: commonTheme.rounded.lg,
    gap: commonTheme.space.xs,
  },

  tileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.xs,
  },

  panel: {
    padding: commonTheme.space.md,
    borderRadius: commonTheme.rounded.lg,
    gap: commonTheme.space.md,
  },

  panelInner: {
    gap: commonTheme.space.sm,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: commonTheme.space.sm,
  },

  chip: {
    paddingHorizontal: commonTheme.space.lg,
    paddingVertical: commonTheme.space.sm,
    borderRadius: commonTheme.rounded.full,
  },

  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.sm,
  },

  durationInput: {
    flex: 1,
    textAlign: "center",
  },

  outcome: {
    padding: commonTheme.space.md,
    borderRadius: commonTheme.rounded.lg,
    gap: commonTheme.space.sm,
  },

  outcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
