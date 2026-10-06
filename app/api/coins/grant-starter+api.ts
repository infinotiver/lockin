import { verifyAuth } from "@/lib/auth";
import { STARTER_GRANT } from "@/constants/coinEconomy";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const userId = await verifyAuth(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin.rpc("coin_apply", {
    p_user: userId,
    p_delta: STARTER_GRANT,
    p_type: "starter_grant",
    p_stake: null,
    p_ref: null,
    p_key: `starter:${userId}`,
  });

  if (error) {
    console.error("Starter grant failed:", error);
    return Response.json({ error: "unknown" }, { status: 500 });
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (
    !result ||
    typeof result.balance !== "number" ||
    typeof result.applied !== "boolean"
  ) {
    return Response.json({ error: "unknown" }, { status: 500 });
  }

  return Response.json({
    balance: result.balance,
    applied: result.applied,
    alreadyApplied: !result.applied,
  });
}
