// contexts/StakeManagerContext.tsx
import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
} from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useStakeManager } from "@/hooks/useStakeManager";
import { mapStake } from "@/lib/mapStake";
import type { Stake } from "@/types/stakes";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRouter } from "expo-router";

/** A dismissible warning whose text is safe to show directly to the user. */
type DialogState = { visible: boolean; message: string };

/** A dismissible informational dialog with a separate title and body. */
type InfoDialogState = { visible: boolean; title: string; message: string };

/**
 * Shared state and commands used by stake-list and stake-detail routes.
 *
 * Keeping this state above the routes prevents each screen from starting an
 * independent evaluator, which could otherwise submit duplicate status updates.
 */
type Ctx = {
  stakes: Stake[];
  loading: boolean;
  fetchError: string;
  fetchStakes: () => Promise<void>;
  runCheck: () => Promise<void>;
  checking: boolean;
  warnDialog: DialogState;
  setWarnDialog: (d: DialogState) => void;
  infoDialog: InfoDialogState;
  setInfoDialog: (d: InfoDialogState) => void;
};

const StakeManagerContext = createContext<Ctx | null>(null);

/**
 * Provides a single stake-fetching and verification lifecycle to descendant routes.
 *
 * @param props.children - The authenticated application tree that consumes stake state.
 * @returns A context provider wrapping `children`.
 * @throws Does not intentionally throw; network failures are surfaced in `fetchError`
 * or a warning dialog so routes remain renderable.
 */
export function StakeManagerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getToken } = useAuth();
  // Callbacks below are intentionally stable. The ref lets them use a refreshed
  // Clerk token without making each token refresh recreate the request pipeline.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [stakes, setStakes] = useState<Stake[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const fetchingRef = useRef(false);
  const finalizingRef = useRef(new Set<string>());

  const [warnDialog, setWarnDialog] = useState<DialogState>({
    visible: false,
    message: "",
  });
  const [infoDialog, setInfoDialog] = useState<InfoDialogState>({
    visible: false,
    title: "",
    message: "",
  });

  /**
   * Fetches and maps the current user's stakes.
   *
   * @returns A promise that always resolves after state has settled. Request and
   * authentication errors are stored in `fetchError` instead of being rethrown.
   */
  const fetchStakes = useCallback(async (): Promise<void> => {
    // Focus events and pull-to-refresh can overlap; only one response should be
    // allowed to control the shared loading and error state at a time.
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setFetchError("");
    try {
      const token = await getTokenRef.current();
      if (!token) throw new Error("Missing auth token.");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/quests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to fetch stakes.");
      }
      const body = await res.json();
      setStakes((body.quests || []).map((q: any) => mapStake(q)));
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to fetch stakes.");
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  /**
   * Persists a terminal stake status, refreshes shared data, and presents the
   * result dialog only after the server accepts the transition.
   *
   * @param stakeId - Identifier of the stake being finalized.
   * @param status - Terminal status to send to the quests endpoint.
   * @param failMessage - Optional evaluator explanation for a failed stake.
   * @returns A promise that resolves after the refresh and dialog update complete.
   * @throws Re-throws missing-token and request errors so the evaluator does not
   * mark the result handled and can retry on a later cycle.
   */
  const finalizeStake = useCallback(
    async (
      stakeId: string,
      status: "completed" | "failed",
      failMessage?: string,
    ) => {
      // Status is part of the key: a stale callback for one terminal outcome must
      // not suppress a distinct outcome while the server transition is in flight.
      const key = `${stakeId}:${status}`;
      if (finalizingRef.current.has(key)) return;
      finalizingRef.current.add(key);

      try {
        const token = await getTokenRef.current();
        if (!token) throw new Error("Missing auth token.");

        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/quests/${stakeId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
          },
        );

        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.error ?? "Failed to update stake.");
        }

        const persistedStatus = body?.quest?.status;
        if (persistedStatus !== status) {
          throw new Error(
            `Stake update was acknowledged but returned status "${persistedStatus ?? "missing"}" instead of "${status}".`,
          );
        }

        await fetchStakes();

        if (status === "completed") {
          setInfoDialog({
            visible: true,
            title: "Stake complete",
            message:
              "You hit your goal. The reward has been marked as yours (WIP).",
          });
        } else {
          setWarnDialog({
            visible: true,
            message:
              failMessage ??
              "You missed your goal. The stake has been marked as failed.",
          });
        }
      } catch (e) {
        setWarnDialog({
          visible: true,
          message:
            e instanceof Error ? e.message : "Failed to update stake status.",
        });
        throw e; // propagate so useStakeManager knows finalize failed and retries next cycle
      } finally {
        finalizingRef.current.delete(key);
      }
    },
    [fetchStakes],
  );

  // The hook owns scheduling; this provider owns the side effects that must be
  // consistent across every route (network mutations and user-facing dialogs).
  const { checking, runCheck } = useStakeManager({
    stakes,
    onComplete: async (id) => {
      await finalizeStake(id, "completed");
    },
    onFail: async (id, message) => {
      const isPermission = message?.toLowerCase().includes("permission");
      if (isPermission) {
        setInfoDialog({
          visible: true,
          title: "Permission required",
          message:
            "Usage access was revoked. Re-enable it in Settings → Permissions to keep your stake active.",
        });
        return;
      }
      await finalizeStake(id, "failed", message);
    },
    onUnsupported: () => {
      // handled by the one-time platform warning currently in StakesScreen;
    },
  });

  return (
    <StakeManagerContext.Provider
      value={{
        stakes,
        loading,
        fetchError,
        fetchStakes,
        runCheck,
        checking,
        warnDialog,
        setWarnDialog,
        infoDialog,
        setInfoDialog,
      }}
    >
      {children}
    </StakeManagerContext.Provider>
  );
}

/**
 * Reads the shared stake manager.
 *
 * @returns The provider's stake state and operations.
 * @throws {Error} When called outside `StakeManagerProvider`, because continuing
 * without the shared lifecycle would hide an application composition error.
 */
export function useStakeManagerContext(): Ctx {
  const ctx = useContext(StakeManagerContext);
  if (!ctx)
    throw new Error(
      "useStakeManagerContext must be used within StakeManagerProvider",
    );
  return ctx;
}


export function StakeManagerDialogs() {
  const router = useRouter();
  const { warnDialog, setWarnDialog, infoDialog, setInfoDialog } =
    useStakeManagerContext();

  return (
    <>
      <ConfirmDialog
        visible={warnDialog.visible}
        title="Heads up"
        message={warnDialog.message}
        primary={{
          label: "Dismiss",
          onPress: () => setWarnDialog({ visible: false, message: "" }),
        }}
        secondary={{
          label: "View records",
          variant: "ghost",
          onPress: () => {
            setWarnDialog({ visible: false, message: "" });
            router.push("/(tabs)/stakes");
          },
        }}
        onDismiss={() => setWarnDialog({ visible: false, message: "" })}
      />

      <ConfirmDialog
        visible={infoDialog.visible}
        title={infoDialog.title}
        message={infoDialog.message}
        primary={{
          label: "Got it",
          onPress: () =>
            setInfoDialog({ visible: false, title: "", message: "" }),
        }}
        secondary={{
          label: "Settings",
          variant: "ghost",
          onPress: () => {
            setInfoDialog({ visible: false, title: "", message: "" });
            router.push("/(tabs)/settings");
          },
        }}
        onDismiss={() =>
          setInfoDialog({ visible: false, title: "", message: "" })
        }
      />
    </>
  );
}
