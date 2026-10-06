import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Coins, Lock, LockOpen, ShoppingBag } from "lucide-react-native";
import { AppBar } from "@/components/ui/AppBar";
import { Button } from "@/components/ui/Button";
import type { CoinLedgerEntry } from "@/contexts/CoinsContext";
import { useCoins } from "@/contexts/CoinsContext";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { DAILY_EARN_CAP, DAY_PASS_REWARD } from "@/constants/coinEconomy";

function dateHeading(dayKey: string): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const key = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (dayKey === key(today)) return "Today";
  if (dayKey === key(yesterday)) return "Yesterday";
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function entryTitle(entry: CoinLedgerEntry): string {
  switch (entry.type) {
    case "starter_grant": return "Starter coins";
    case "day_pass": return "Day passed";
    case "stake_lock": return "Wager locked";
    case "stake_release": return "Wager returned";
    case "stake_win_bonus": return "Win bonus";
    case "stake_forfeit": return "Stake failed";
    case "lock_reversal": return "Wager returned";
    case "shop_purchase": return "Shop purchase";
    case "admin_adjust": return "Balance adjustment";
    default: return "Coin activity";
  }
}

function LedgerRow({ entry }: { entry: CoinLedgerEntry }) {
  const colors = useColors();
  const isForfeit = entry.type === "stake_forfeit";
  const isLoss = entry.delta < 0;
  const isSpecial = entry.type === "shop_purchase";
  const Icon = isSpecial
    ? ShoppingBag
    : entry.type === "stake_lock" || isForfeit
      ? Lock
      : entry.type === "stake_release" || entry.type === "lock_reversal"
        ? LockOpen
        : Coins;
  const amountColor = isLoss ? colors.error : entry.delta > 0 ? colors.success : colors.textMuted;
  const detail = entry.type === "shop_purchase"
    ? entry.ref === "streak_freeze" ? "Streak Freeze" : entry.ref ?? "Shop item"
    : entry.stake_id ? "Stake" : "";

  return (
    <View style={[styles.ledgerRow, { backgroundColor: colors.surfaceContainer }]}>
      <Icon size={commonTheme.fontSize["3xl"]} color={isSpecial ? colors.tertiary : isLoss ? colors.error : colors.primary} />
      <View style={styles.ledgerCopy}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={[commonTheme.text.bodyStrong, { color: colors.text }]}>
          {entryTitle(entry)}
        </Text>
        {!!detail && (
          <Text numberOfLines={1} ellipsizeMode="tail" style={[commonTheme.text.caption, { color: colors.textMuted }]}>
            {detail}
          </Text>
        )}
      </View>
      <Text style={[commonTheme.text.bodyStrong, styles.ledgerAmount, { color: amountColor, fontFamily: commonTheme.font.monoSemibold }]}>
        {isForfeit ? "Burned" : entry.delta > 0 ? `+${entry.delta}` : entry.delta < 0 ? `−${Math.abs(entry.delta)}` : "0"}
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { balance, locked, earnedThisWeek, status, refresh } = useCoins();
  const [entries, setEntries] = useState<CoinLedgerEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [ledgerError, setLedgerError] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingPageRef = useRef(false);
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const loadPage = useCallback(async (next: string | null, append: boolean) => {
    if (loadingPageRef.current) return;
    loadingPageRef.current = true;
    append ? setLoadingMore(true) : setLoadingLedger(true);
    try {
      const token = await getTokenRef.current?.();
      if (!token) throw new Error("Missing token");
      const params = new URLSearchParams({ limit: "20" });
      if (next) params.set("cursor", next);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/coins/ledger?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error("Ledger fetch failed");
      const data = await response.json();
      const page: CoinLedgerEntry[] = Array.isArray(data.entries) ? data.entries : [];
      setEntries((current) => {
        if (!append) return page;
        const ids = new Set(current.map((entry) => entry.id));
        return [...current, ...page.filter((entry) => !ids.has(entry.id))];
      });
      setCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
      setLedgerError(false);
    } catch {
      setLedgerError(true);
    } finally {
      loadingPageRef.current = false;
      setLoadingLedger(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      void loadPage(null, false);
    }, [loadPage, refresh]),
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(), loadPage(null, false)]);
  }, [loadPage, refresh]);

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, CoinLedgerEntry[]>();
    for (const entry of entries) {
      const dayKey = entry.created_at.slice(0, 10);
      const group = groups.get(dayKey) ?? [];
      group.push(entry);
      groups.set(dayKey, group);
    }
    return [...groups.entries()];
  }, [entries]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    if (
      hasMore && !loadingPageRef.current &&
      contentOffset.y + layoutMeasurement.height >= contentSize.height - commonTheme.space["2xl"]
    ) {
      void loadPage(cursor, true);
    }
  };

  return (
    <SafeAreaView style={[commonTheme.layout.flex, { backgroundColor: colors.background }]} edges={["top"]}>
      <AppBar title="Wallet" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 64 + Math.max(insets.bottom, 16) + commonTheme.space.sm }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={160}
        refreshControl={<RefreshControl refreshing={status === "loading" || loadingLedger} onRefresh={handleRefresh} tintColor={colors.textMuted} colors={[colors.primary]} />}
      >
        <View style={[styles.hero, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Text style={[commonTheme.text.amountLarge, { color: colors.text }]} maxFontSizeMultiplier={1.3}>
            {balance === null ? "····" : balance.toLocaleString()}
          </Text>
          <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>coins</Text>
        </View>

        <View style={[styles.statsRow, width < 360 && styles.statsStack]}>
          <View style={[styles.statTile, { backgroundColor: colors.surfaceContainerLow }]}>
            <Lock size={commonTheme.fontSize["2xl"]} color={colors.primary} />
            <Text style={[commonTheme.text.caption, { color: colors.textMuted }]}>Locked in stakes</Text>
            <Text style={[commonTheme.text.amount, styles.monoNumber, { color: colors.text }]}>{locked}</Text>
          </View>
          <View style={[styles.statTile, { backgroundColor: colors.surfaceContainerLow }]}>
            <Coins size={commonTheme.fontSize["2xl"]} color={colors.secondary} />
            <Text style={[commonTheme.text.caption, { color: colors.textMuted }]}>Earned this week</Text>
            <Text style={[commonTheme.text.amount, styles.monoNumber, { color: colors.text }]}>{earnedThisWeek}</Text>
          </View>
        </View>

        <Button variant="primary" size="lg" onPress={() => router.push("/shop" as unknown as Href)} fullWidth>
          Visit the shop
        </Button>

        <View style={styles.historyHeader}>
          <Text style={[commonTheme.text.sectionTitle, { color: colors.text }]}>History</Text>
          {status === "stale" && <Text style={[commonTheme.text.caption, { color: colors.textMuted }]}>Offline · showing last known balance</Text>}
        </View>

        {!!ledgerError && (
          <View style={[styles.errorBanner, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Text style={[commonTheme.text.body, { color: colors.text }]}>Couldn&apos;t load. Tap to retry</Text>
            <Button variant="ghost" size="lg" label="Retry" onPress={() => void loadPage(null, false)} />
          </View>
        )}

        {entries.length === 0 && !loadingLedger && !ledgerError ? (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>Nothing yet. Your first stake starts the story.</Text>
          </View>
        ) : groupedEntries.map(([day, rows]) => (
          <View key={day} style={styles.dayGroup}>
            <Text style={[commonTheme.text.label, { color: colors.textMuted }]}>{dateHeading(day)}</Text>
            {rows.map((entry) => <LedgerRow key={entry.id} entry={entry} />)}
          </View>
        ))}

        {(loadingLedger || loadingMore) && (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[commonTheme.text.caption, { color: colors.textMuted }]}>Loading history…</Text>
          </View>
        )}
        {!hasMore && entries.length > 0 && !loadingLedger && !loadingMore && (
          <Text style={[commonTheme.text.caption, styles.endLabel, { color: colors.textMuted }]}>That&apos;s everything</Text>
        )}

        <Button
          variant="ghost"
          size="md"
          fullWidth
          label="View legacy settlements"
          onPress={() => router.push("/legacy-wallet" as unknown as Href)}
        />
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLow }]}>
          <Text style={[commonTheme.text.cardTitle, { color: colors.text }]}>How to earn</Text>
          <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>Pass a day: <Text style={{ fontFamily: commonTheme.font.mono }}>+{DAY_PASS_REWARD}</Text> coins</Text>
          <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>Finish a stake: wager back plus bonus</Text>
          <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>Daily earn cap: <Text style={{ fontFamily: commonTheme.font.mono }}>{DAILY_EARN_CAP}</Text> coins</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: commonTheme.space.lg,
    gap: commonTheme.space.lg,
  },
  hero: {
    alignItems: "center",
    padding: commonTheme.space.xl,
    borderRadius: commonTheme.rounded.xl,
    gap: commonTheme.space.xs,
  },
  statsRow: {
    flexDirection: "row",
    gap: commonTheme.space.md,
  },
  statsStack: {
    flexDirection: "column",
  },
  statTile: {
    flex: 1,
    padding: commonTheme.space.lg,
    borderRadius: commonTheme.rounded.lg,
    gap: commonTheme.space.sm,
  },
  monoNumber: {
    fontFamily: commonTheme.font.monoBold,
  },
  card: {
    padding: commonTheme.space.lg,
    borderRadius: commonTheme.rounded.lg,
    gap: commonTheme.space.sm,
  },
  historyHeader: {
    gap: commonTheme.space.xs,
  },
  dayGroup: {
    gap: commonTheme.space.sm,
  },
  ledgerRow: {
    minHeight: commonTheme.space["2xl"] + commonTheme.space.xl,
    flexDirection: "row",
    alignItems: "center",
    padding: commonTheme.space.md,
    borderRadius: commonTheme.rounded.lg,
    gap: commonTheme.space.md,
  },
  ledgerCopy: {
    flex: 1,
    gap: commonTheme.space.xs,
  },
  ledgerAmount: {
    textAlign: "right",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: commonTheme.space.md,
    borderRadius: commonTheme.rounded.lg,
    gap: commonTheme.space.sm,
  },
  endLabel: {
    textAlign: "center",
    padding: commonTheme.space.md,
  },
});
