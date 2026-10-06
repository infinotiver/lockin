import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Coins, Snowflake } from "lucide-react-native";
import { AppBar } from "@/components/ui/AppBar";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCoins } from "@/contexts/CoinsContext";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { FREEZE_PRICE, MAX_FREEZES_HELD } from "@/constants/coinEconomy";

type ShopItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  maxHeld: number;
  owned: number;
};

function clientRequestId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (letter) => {
    const random = Math.floor(Math.random() * 16);
    return (letter === "x" ? random : (random & 3) | 8).toString(16);
  });
}

export default function ShopScreen() {
  const colors = useColors();
  const router = useRouter();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const { balance, status, refresh } = useCoins();
  const [item, setItem] = useState<ShopItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string>();
  const requestIdRef = useRef(clientRequestId());

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const loadShop = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const token = await getTokenRef.current();
      if (!token) throw new Error("missing_token");
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/shop`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("shop_fetch_failed");
      const data = await response.json();
      setItem(Array.isArray(data.items) ? (data.items[0] ?? null) : null);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadShop();
    }, [loadShop]),
  );

  const buy = async () => {
    if (purchasing) return;
    setPurchasing(true);
    setPurchaseError(undefined);
    try {
      const token = await getTokenRef.current();
      if (!token) throw new Error("network");
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/shop`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ clientRequestId: requestIdRef.current }),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "unknown");
      setDialogVisible(false);
      requestIdRef.current = clientRequestId();
      await Promise.all([refresh(), loadShop()]);
    } catch (error) {
      const code = error instanceof Error ? error.message : "unknown";
      setPurchaseError(
        error instanceof TypeError || code === "network"
          ? "Could not reach the server. Try again."
          : code === "insufficient_coins"
            ? "Not enough coins."
            : code === "max_held"
              ? `You already hold ${MAX_FREEZES_HELD}.`
              : "Something went wrong. Try again.",
      );
    } finally {
      setPurchasing(false);
    }
  };

  const price = item?.price ?? FREEZE_PRICE;
  const maxHeld = item ? item.owned >= item.maxHeld : false;
  const insufficient = balance !== null && balance < price;
  const offline = status === "stale";
  const buyDisabled =
    loading ||
    !item ||
    balance === null ||
    offline ||
    maxHeld ||
    insufficient ||
    purchasing;

  const hint = offline
    ? "Reconnect to make a purchase."
    : maxHeld
      ? "Inventory full. Use a freeze before buying another."
      : insufficient
        ? `You need ${price - (balance ?? 0)} more.`
        : undefined;

  return (
    <SafeAreaView
      style={[commonTheme.layout.flex, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <AppBar
        title="Shop"
        rightActions={[
          { key: "close", label: "Close", onPress: () => router.back() },
        ]}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balance}>
          <Text style={[commonTheme.text.label, { color: colors.textMuted }]}>
            BALANCE
          </Text>
          <View style={styles.balanceRow}>
            <Coins size={commonTheme.fontSize["2xl"]} color={colors.primary} />
            <Text style={[styles.balanceValue, { color: colors.text }]}>
              {balance ?? "–"}
            </Text>
          </View>
        </View>

        {loadError ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <Text style={[commonTheme.text.bodyStrong, { color: colors.text }]}>
              The shop did not load.
            </Text>
            <Button
              variant="ghost"
              size="md"
              label="Try again"
              onPress={() => void loadShop()}
            />
          </View>
        ) : loading ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>
              Loading shop...
            </Text>
          </View>
        ) : !item ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>
              No items are available right now.
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <View style={styles.itemHeader}>
              <View
                style={[
                  styles.iconTile,
                  { backgroundColor: colors.tertiaryContainer },
                ]}
              >
                <Snowflake
                  size={commonTheme.fontSize["2xl"]}
                  color={colors.onTertiaryContainer}
                />
              </View>
              <View style={styles.itemHeading}>
                <Text
                  style={[commonTheme.text.cardTitle, { color: colors.text }]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    commonTheme.text.caption,
                    styles.mono,
                    { color: colors.textMuted },
                  ]}
                >
                  {item.owned} / {item.maxHeld} owned
                </Text>
              </View>
              <View style={styles.price}>
                <Text
                  style={[
                    commonTheme.text.bodyStrong,
                    styles.mono,
                    { color: colors.text },
                  ]}
                >
                  {price}
                </Text>
                <Coins size={commonTheme.fontSize.xl} color={colors.primary} />
              </View>
            </View>

            <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>
              {item.description}
            </Text>

            <View style={styles.action}>
              <Button
                variant="primary"
                style={{ borderRadius: commonTheme.rounded.full }}
                size="lg"
                fullWidth
                loading={purchasing}
                disabled={buyDisabled}
                label={
                  maxHeld
                    ? "Inventory full"
                    : insufficient
                      ? "Not enough coins"
                      : `Buy for ${price}`
                }
                onPress={() => {
                  setPurchaseError(undefined);
                  setDialogVisible(true);
                }}
              />
              {!!hint && (
                <Text
                  style={[
                    commonTheme.text.caption,
                    styles.center,
                    { color: colors.textMuted },
                  ]}
                >
                  {hint}
                </Text>
              )}
              {!!purchaseError && (
                <Text
                  style={[
                    commonTheme.text.caption,
                    styles.center,
                    { color: colors.error },
                  ]}
                >
                  {purchaseError}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
      <ConfirmDialog
        visible={dialogVisible}
        title="Buy Streak Freeze?"
        message={
          <>
            Buy Streak Freeze for{" "}
            <Text style={{ fontFamily: commonTheme.font.mono }}>{price}</Text>{" "}
            coins?
          </>
        }
        error={purchaseError}
        primary={{
          label: "Buy",
          onPress: () => void buy(),
          loading: purchasing,
          disabled: purchasing,
        }}
        secondary={{
          label: "Cancel",
          onPress: () => {
            if (!purchasing) setDialogVisible(false);
          },
          disabled: purchasing,
        }}
        onDismiss={() => {
          if (!purchasing) setDialogVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: commonTheme.space.lg,
    paddingBottom: commonTheme.space["2xl"],
    gap: commonTheme.space.xl,
  },
  balance: {
    alignItems: "center",
    gap: commonTheme.space.xs,
    paddingVertical: commonTheme.space.xl,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.sm,
  },
  balanceValue: {
    fontSize: commonTheme.fontSize["5xl"],
    fontFamily: commonTheme.font.monoSemibold,
  },
  card: {
    padding: commonTheme.space.lg,
    borderRadius: commonTheme.rounded.xl,
    gap: commonTheme.space.lg,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.md,
  },
  iconTile: {
    width: commonTheme.space["2xl"] + commonTheme.space.md,
    height: commonTheme.space["2xl"] + commonTheme.space.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: commonTheme.rounded.lg,
  },
  itemHeading: {
    flex: 1,
    gap: commonTheme.space.xs,
  },
  price: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.xs,
  },
  action: {
    gap: commonTheme.space.sm,
  },
  center: {
    textAlign: "center",
  },
  mono: {
    fontFamily: commonTheme.font.monoSemibold,
  },
});
