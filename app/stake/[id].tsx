import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { msToHoursAndMinutes } from "@/lib/screenTime";
import { mapStake } from "@/lib/mapStake";
import { runStakeChecks } from "@/lib/stakeEvaluator";
import { formatDate, formatDateTime, parseISODate } from "@/lib/timeParser";
import type { Stake, DayRecord } from "@/types/stakes";
import { StatusChip } from "@/components/stakes/StatusChip";
import { useSettlements } from "@/hooks/useSettlements";
import type { Settlement } from "@/hooks/useSettlements";
import { SettlementCard } from "@/components/SettlementCard";
function daysLeft(expiresAt: string | null) {
  if (!expiresAt) return "—";
  const expiresDate = parseISODate(expiresAt);
  if (!expiresDate) return "—";
  const remainingMs = expiresDate.getTime() - Date.now();
  if (remainingMs < 0) return "Expired";
  const diff = Math.ceil(remainingMs / 86400000);
  if (diff === 0) return "Last day";
  return `${diff}d left`;
}

export default function StakeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [stake, setStake] = useState<Stake | null>(null);
  const [days, setDays] = useState<DayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [daysError, setDaysError] = useState("");
  const requestSeqRef = useRef(0);

  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const { fetchForStake, markSettled } = useSettlements();
  async function load(isRefresh = false) {
    if (!id) return;
    const currentSeq = ++requestSeqRef.current;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    setDaysError("");

    try {
      if (isRefresh && stake && Platform.OS === "android" && user?.id) {
        await runStakeChecks([stake], [user.id]).catch(() => {});
      }

      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const base = process.env.EXPO_PUBLIC_API_URL;
      const headers = { Authorization: `Bearer ${token}` };

      const qRes = await fetch(`${base}/api/quests/${id}`, { headers });
      if (!qRes.ok) throw new Error(`Failed to load stake (${qRes.status})`);
      const { quest } = await qRes.json();

      if (currentSeq !== requestSeqRef.current) return;
      setStake(mapStake(quest));

      if (quest.status === "failed") {
        const s = await fetchForStake(id).catch(() => null);
        if (currentSeq === requestSeqRef.current) setSettlement(s);
      }

      const dRes = await fetch(`${base}/api/days/${id}`, {
        headers,
      });
      if (!dRes.ok) {
        if (currentSeq !== requestSeqRef.current) return;
        setDaysError(`Failed to load daily records (${dRes.status})`);
      } else {
        const { data } = await dRes.json();
        if (currentSeq !== requestSeqRef.current) return;
        setDays(
          [...(data ?? [])].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
        );
      }
    } catch (e: any) {
      if (currentSeq !== requestSeqRef.current) return;
      setError(e.message ?? "Failed to load.");
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );

  if (error || !stake)
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[{ color: colors.destructive, fontSize: 14 }]}>
          {error || "Stake not found"}
        </Text>
        <Text
          onPress={() => load()}
          style={[{ color: colors.textMuted, fontSize: 13 }]}
        >
          Tap to retry
        </Text>
      </View>
    );

  const limitMs = stake.rule?.limitMs;

  const details = [
    { label: "Started", value: formatDateTime(stake.created_at) },
    {
      label: "Ends",
      value: stake.expires_at ? formatDateTime(stake.expires_at) : "—",
    },
    { label: "Limit", value: limitMs ? msToHoursAndMinutes(limitMs) : "—" },
    { label: "Reward", value: `₹${stake.reward}` },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.textMuted}
            progressBackgroundColor={colors.surface3}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.row}>
          <StatusChip status={stake.status} />
          <Text style={[styles.typeTag, { color: colors.textMuted }]}>
            {stake.type.toUpperCase()}
          </Text>
        </View>

        <Text
          style={[
            styles.title,
            { color: colors.text, fontFamily: commonTheme.font.bold },
          ]}
        >
          {stake.title}
        </Text>
        <Text
          style={[
            styles.reward,
            { color: colors.primary, fontFamily: commonTheme.font.bold },
          ]}
        >
          ₹{stake.reward}
        </Text>

        {(stake.daysTotal ?? 0) > 0 && (
          <View style={{ gap: commonTheme.space.sm }}>
            <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${stake.progressPercent ?? 0}%` as any,
                  },
                ]}
              />
            </View>
            <View style={styles.row}>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                Day {(stake.daysTotal ?? 0) - (stake.daysLeft ?? 0)} of{" "}
                {stake.daysTotal}
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {daysLeft(stake.expires_at)}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.surface2 }]}>
          {details.map(({ label, value }, i) => (
            <View key={label}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                  {label}
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: colors.text, fontFamily: commonTheme.font.medium },
                  ]}
                >
                  {value}
                </Text>
              </View>
              {i < details.length - 1 && (
                <View
                  style={[styles.sep, { backgroundColor: colors.surface2 }]}
                />
              )}
            </View>
          ))}
        </View>
        {stake.status === "failed" && settlement && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              SETTLEMENT
            </Text>
            <SettlementCard
              settlement={settlement}
              onMarkSettled={async (id, note) => {
                await markSettled(id, note);
                setSettlement((prev) =>
                  prev ? { ...prev, status: "settled" } : prev,
                );
              }}
            />
          </>
        )}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          DAILY RECORDS
        </Text>

        {daysError ? (
          <Text style={[styles.empty, { color: colors.destructive }]}>
            {daysError}
          </Text>
        ) : days.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            No records yet — appears after each daily check.
          </Text>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surface2 }]}>
            {days.map((record, i) => {
              const passed =
                limitMs !== undefined ? record.total_ms <= limitMs : null;
              const accent =
                passed === null ? colors.text : passed ? "#34d399" : "#f87171";
              return (
                <View key={record.date}>
                  <View style={styles.dayRow}>
                    <View>
                      <Text
                        style={[
                          styles.dayDate,
                          {
                            color: colors.text,
                            fontFamily: commonTheme.font.medium,
                          },
                        ]}
                      >
                        {formatDate(record.date)}
                      </Text>
                      {passed !== null && (
                        <Text style={[styles.dayBadge, { color: accent }]}>
                          {passed ? "Under limit" : "Over limit"}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.dayTime,
                        { color: accent, fontFamily: commonTheme.font.bold },
                      ]}
                    >
                      {msToHoursAndMinutes(record.total_ms)}
                    </Text>
                  </View>
                  {i < days.length - 1 && (
                    <View
                      style={[
                        styles.sep,
                        {
                          backgroundColor: colors.surface2,
                          marginLeft: commonTheme.space.lg,
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: commonTheme.space.md,
  },
  scroll: {
    paddingHorizontal: commonTheme.space.lg,
    paddingTop: commonTheme.space.md,
    paddingBottom: commonTheme.space["2xl"],
    gap: commonTheme.space.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.xs,
    paddingHorizontal: commonTheme.space.md,
    paddingVertical: commonTheme.space.xs,
    borderRadius: commonTheme.rounded.full,
  },
  pillText: { fontSize: 12, fontFamily: commonTheme.font.medium },
  typeTag: { fontSize: 12, textTransform: "capitalize" },
  title: { fontSize: 22, lineHeight: 28 },
  reward: { fontSize: 30 },
  track: { height: 5, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  meta: { fontSize: 12 },
  card: { borderRadius: commonTheme.rounded.lg, overflow: "hidden" },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: commonTheme.space.lg,
    paddingVertical: commonTheme.space.md,
  },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14 },
  sep: { height: StyleSheet.hairlineWidth },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.7,
    fontFamily: commonTheme.font.medium,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: commonTheme.space.lg,
    paddingVertical: commonTheme.space.md,
  },
  dayDate: { fontSize: 14 },
  dayBadge: { fontSize: 11, marginTop: 2 },
  dayTime: { fontSize: 16 },
  empty: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: commonTheme.space.xl,
  },
});
