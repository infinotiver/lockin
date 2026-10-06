import { verifyAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LedgerEntry = {
  id: string;
  delta: number;
  type: string;
  stake_id: string | null;
  ref: string | null;
  idempotency_key: string;
  created_at: string;
};

export async function GET(request: Request) {
  const userId = await verifyAuth(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const weekStart = new Date();
  weekStart.setUTCHours(0, 0, 0, 0);
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));

  const [balanceResult, lockedResult, recentResult, earnedResult] = await Promise.all([
    supabaseAdmin
      .from("coin_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("coin_locked_balances")
      .select("locked")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("coin_ledger")
      .select("id,delta,type,stake_id,ref,idempotency_key,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("coin_ledger")
      .select("delta")
      .eq("user_id", userId)
      .in("type", ["day_pass", "stake_win_bonus"])
      .gte("created_at", weekStart.toISOString()),
  ]);

  if (balanceResult.error || lockedResult.error || recentResult.error || earnedResult.error) {
    return Response.json({ error: "unknown" }, { status: 500 });
  }

  return Response.json({
    balance: balanceResult.data?.balance ?? 0,
    locked: lockedResult.data?.locked ?? 0,
    recent: (recentResult.data ?? []) as LedgerEntry[],
    earnedThisWeek: (earnedResult.data ?? []).reduce((sum, row) => sum + row.delta, 0),
  });
}
