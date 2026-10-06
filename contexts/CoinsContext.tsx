import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { Button } from "@/components/ui/Button";

export type CoinLedgerEntry = {
  id: string;
  delta: number;
  type: string;
  stake_id: string | null;
  ref: string | null;
  idempotency_key: string;
  created_at: string;
};

type CoinsStatus = "loading" | "ready" | "stale";
type CoinsValue = {
  balance: number | null;
  locked: number;
  earnedThisWeek: number;
  recent: CoinLedgerEntry[];
  status: CoinsStatus;
  refresh: () => Promise<void>;
};

const CoinsContext = createContext<CoinsValue | null>(null);

const seenWelcome = new Set<string>();

export function CoinsProvider({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const getTokenRef = useRef(getToken);
  const authRef = useRef({ isLoaded, isSignedIn, userId });
  const fetchingRef = useRef<Promise<void> | null>(null);
  const fetchingUserRef = useRef<string | null>(null);
  const previousUserRef = useRef<string | null>(userId);
  const welcomeSheetRef = useRef<BottomSheetModal>(null);
  const welcomeKeyRef = useRef<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [locked, setLocked] = useState(0);
  const [earnedThisWeek, setEarnedThisWeek] = useState(0);
  const [recent, setRecent] = useState<CoinLedgerEntry[]>([]);
  const [status, setStatus] = useState<CoinsStatus>("loading");
  const [welcomeVisible, setWelcomeVisible] = useState(false);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    authRef.current = { isLoaded, isSignedIn, userId };
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (previousUserRef.current === userId) return;
    previousUserRef.current = userId;
    setBalance(null);
    setLocked(0);
    setEarnedThisWeek(0);
    setRecent([]);
    setStatus("loading");
  }, [userId]);

  const getReadyToken = useCallback(async () => {
    let token = await getTokenRef.current();
    if (!token) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      token = await getTokenRef.current();
    }
    return token;
  }, []);

  const refresh = useCallback(async () => {
    const requestUserId = authRef.current.userId;
    if (!authRef.current.isLoaded || !authRef.current.isSignedIn || !requestUserId) {
      setBalance(null);
      setLocked(0);
      setEarnedThisWeek(0);
      setRecent([]);
      setStatus("loading");
      return;
    }
    if (fetchingRef.current && fetchingUserRef.current === requestUserId) {
      return fetchingRef.current;
    }

    const request = Promise.resolve().then(async () => {
      try {
        const token = await getReadyToken();
        if (!token) throw new Error("missing_token");
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/coins/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("balance_fetch_failed");
        const data = await response.json();
        if (authRef.current.userId !== requestUserId) return;
        if (typeof data.balance !== "number" || typeof data.locked !== "number") {
          throw new Error("invalid_balance_response");
        }
        setBalance(data.balance);
        setLocked(data.locked);
        setEarnedThisWeek(typeof data.earnedThisWeek === "number" ? data.earnedThisWeek : 0);
        setRecent(Array.isArray(data.recent) ? data.recent : []);
        setStatus("ready");
        void AsyncStorage.setItem(
          `coinsBalanceCache:${requestUserId}`,
          JSON.stringify({
            balance: data.balance,
            locked: data.locked,
            earnedThisWeek: typeof data.earnedThisWeek === "number" ? data.earnedThisWeek : 0,
            recent: Array.isArray(data.recent) ? data.recent : [],
          }),
        ).catch(() => {});
      } catch {
        if (authRef.current.userId === requestUserId) setStatus("stale");
      } finally {
        if (fetchingRef.current === request) {
          fetchingRef.current = null;
          fetchingUserRef.current = null;
        }
      }
    });
    fetchingRef.current = request;
    fetchingUserRef.current = requestUserId;
    return request;
  }, [getReadyToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setBalance(null);
      setLocked(0);
      setEarnedThisWeek(0);
      setRecent([]);
      setStatus("loading");
      return;
    }
    void (async () => {
      try {
        const cached = await AsyncStorage.getItem(`coinsBalanceCache:${userId}`);
        const data = cached ? JSON.parse(cached) : null;
        if (authRef.current.userId === userId && typeof data?.balance === "number") {
          setBalance(data.balance);
          setLocked(typeof data.locked === "number" ? data.locked : 0);
          setEarnedThisWeek(typeof data.earnedThisWeek === "number" ? data.earnedThisWeek : 0);
          setRecent(Array.isArray(data.recent) ? data.recent : []);
          setStatus("stale");
        }
      } catch {}
      await refresh();
    })();
  }, [isLoaded, isSignedIn, userId, refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const role = user?.publicMetadata?.role;
  const onboarded = user?.publicMetadata?.onboarded;
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !role || !onboarded) return;
    const key = `coinsWelcomeSeen:${userId}`;
    if (seenWelcome.has(key)) return;
    seenWelcome.add(key);
    welcomeKeyRef.current = key;

    void (async () => {
      try {
        const alreadySeen = await AsyncStorage.getItem(key);
        if (alreadySeen) return;
        const token = await getReadyToken();
        if (!token) throw new Error("missing_token");
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/coins/grant-starter`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("starter_grant_failed");
        await refresh();
        setWelcomeVisible(true);
      } catch {
        seenWelcome.delete(key);
      }
    })();
  }, [getReadyToken, isLoaded, isSignedIn, onboarded, refresh, role, userId]);

  useEffect(() => {
    if (welcomeVisible) welcomeSheetRef.current?.present();
  }, [welcomeVisible]);

  const markWelcomeSeen = async () => {
    const key = welcomeKeyRef.current;
    if (key) await AsyncStorage.setItem(key, "1");
    setWelcomeVisible(false);
    welcomeSheetRef.current?.dismiss();
  };

  return (
    <CoinsContext.Provider value={{ balance, locked, earnedThisWeek, recent, status, refresh }}>
      {children}
      <BottomSheetModal
        ref={welcomeSheetRef}
        snapPoints={[]}
        enableDynamicSizing
        enablePanDownToClose
        onDismiss={() => {
          setWelcomeVisible(false);
          const key = welcomeKeyRef.current;
          if (key) void AsyncStorage.setItem(key, "1");
        }}
        backgroundStyle={{ backgroundColor: colors.surfaceContainerLow }}
        backdropComponent={(props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      >
        <BottomSheetView style={{ padding: commonTheme.space.xl, gap: commonTheme.space.lg }}>
          <Text style={[commonTheme.text.sectionTitle, { color: colors.text }]}>
            You start with <Text style={{ fontFamily: commonTheme.font.monoBold }}>200</Text> coins
          </Text>
          <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>
            Wager them on a goal. Hit it and you keep them plus a bonus. Miss it and they&apos;re gone.
          </Text>
          <Button variant="primary" size="lg" onPress={() => void markWelcomeSeen()} fullWidth>
            Got it
          </Button>
        </BottomSheetView>
      </BottomSheetModal>
    </CoinsContext.Provider>
  );
}

export function useCoins(): CoinsValue {
  const value = useContext(CoinsContext);
  if (!value) throw new Error("useCoins must be used within CoinsProvider");
  return value;
}
