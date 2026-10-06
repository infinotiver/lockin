import { FREEZE_PRICE, MAX_FREEZES_HELD } from "@/constants/coinEconomy";
import { verifyAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const freezeItem = {
  id: "streak_freeze",
  name: "Streak Freeze",
  description: "Covers one missed day so your stake survives",
  price: FREEZE_PRICE,
  maxHeld: MAX_FREEZES_HELD,
};

export async function GET(request: Request) {
  const userId = await verifyAuth(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const [{ data: inventory, error: inventoryError }, { data: balance, error: balanceError }] =
    await Promise.all([
      supabaseAdmin
        .from("item_events")
        .select("delta")
        .eq("user_id", userId)
        .eq("item_id", freezeItem.id),
      supabaseAdmin
        .from("coin_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  if (inventoryError || balanceError) {
    return Response.json({ error: "unknown" }, { status: 500 });
  }
  const owned = (inventory ?? []).reduce((sum, event) => sum + event.delta, 0);
  return Response.json({
    balance: balance?.balance ?? 0,
    items: [{ ...freezeItem, owned }],
  });
}

export async function POST(request: Request) {
  const userId = await verifyAuth(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "unknown" }, { status: 400 });
  }
  const clientRequestId =
    typeof body === "object" && body !== null && "clientRequestId" in body
      ? (body as { clientRequestId?: unknown }).clientRequestId
      : null;
  if (
    typeof clientRequestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientRequestId)
  ) {
    return Response.json({ error: "unknown" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc("shop_buy", {
    p_user: userId,
    p_item: freezeItem.id,
    p_price: freezeItem.price,
    p_max_held: freezeItem.maxHeld,
    p_key: `buy:${clientRequestId}`,
  });
  if (error) {
    const code = error.message.includes("insufficient_coins")
      ? "insufficient_coins"
      : error.message.includes("max_held")
        ? "max_held"
        : "unknown";
    return Response.json({ error: code }, { status: code === "unknown" ? 500 : 409 });
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result || typeof result.balance !== "number" || typeof result.owned !== "number") {
    return Response.json({ error: "unknown" }, { status: 500 });
  }
  return Response.json({
    balance: result.balance,
    owned: result.owned,
    alreadyApplied: !result.applied,
  });
}
