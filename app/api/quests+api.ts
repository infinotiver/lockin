import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  WAGER_MAX,
  WAGER_MIN,
  getWinBonusRate,
} from "@/constants/coinEconomy";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

function parseDescription(desc: string | null) {
  if (!desc) return null;
  if (desc.trim().startsWith("{") || desc.trim().startsWith("[")) {
    try {
      return JSON.parse(desc);
    } catch {
      return desc; // Fallback to raw text if parsing fails
    }
  }
  return desc;
}

/*
 * GET /api/quests
 *
 * Returns all quests belonging to the caller's family (resolved via Clerk metadata).
 *
 * Allowed:
 * - individual
 * - teen
 */
export async function GET(request: Request) {
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();

  // Load Clerk user to resolve family contextual assignment
  let user;
  try {
    user = await clerk.users.getUser(clerkId);
  } catch {
    return Response.json(
      { error: "Authentication service unavailable" },
      { status: 502 },
    );
  }

  const familyId = user.publicMetadata?.familyId;
  if (!familyId) {
    return Response.json(
      { error: "User is not assigned to a family unit" },
      { status: 400 },
    );
  }

  // Fetch all quests associated with the verified metadata token
  const { data: quests, error } = await supabase
    .from("quests")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch quests" }, { status: 500 });
  }

  const questIds = (quests ?? []).map((quest) => quest.id);
  const { data: terms, error: termsError } = questIds.length
    ? await supabaseAdmin
        .from("stake_coin_terms")
        .select("stake_id,wager,bonus_rate,timezone,allow_freeze")
        .in("stake_id", questIds)
    : { data: [], error: null };
  if (termsError) return Response.json({ error: "Failed to fetch stakes" }, { status: 500 });
  const termsByStake = new Map((terms ?? []).map((term) => [term.stake_id, term]));

  // parse description
  const serializedQuests = (quests || []).map((q) => ({
    ...q,
    description: parseDescription(q.description),
    coin_terms: termsByStake.get(q.id) ?? null,
  }));

  return Response.json({ quests: serializedQuests });
}

/*
 * POST /api/quests
 *
 * Creates a new quest inside the user's family.
 *
 * Allowed:
 * - individual only
 */
export async function POST(request: Request) {
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();

  let user;
  try {
    user = await clerk.users.getUser(clerkId);
  } catch {
    return Response.json(
      { error: "Authentication service unavailable" },
      { status: 502 },
    );
  }

  if (user.publicMetadata?.role !== "individual") {
    return forbidden();
  }

  const familyId = user.publicMetadata?.familyId;
  if (!familyId) {
    return Response.json(
      { error: "User is not assigned to a family unit" },
      { status: 400 },
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, description, wagerCoins, clientRequestId, timezone, type, expires_at } = body;

  if (!title?.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  if (type !== "screen-time") {
    return Response.json({ error: "Invalid quest type" }, { status: 400 });
  }

  const wager = Number(wagerCoins);
  if (!Number.isInteger(wager) || wager < WAGER_MIN || wager > WAGER_MAX) {
    return Response.json({ error: "wager_out_of_range" }, { status: 400 });
  }
  if (
    typeof clientRequestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientRequestId)
  ) {
    return Response.json({ error: "unknown" }, { status: 400 });
  }

  const stakeTimezone = typeof timezone === "string" ? timezone : "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: stakeTimezone });
  } catch {
    return Response.json({ error: "unknown" }, { status: 400 });
  }
  const expiresAt = new Date(expires_at);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    return Response.json({ error: "unknown" }, { status: 400 });
  }

  let finalDescription = null;

  if (description) {
    if (typeof description === "object") {
      finalDescription = JSON.stringify(description);
    } else {
      finalDescription = description.trim() || null;
    }
  }

  const stakeId = clientRequestId;
  const { data: lockData, error: lockError } = await supabaseAdmin.rpc("coin_apply", {
    p_user: clerkId,
    p_delta: -wager,
    p_type: "stake_lock",
    p_stake: stakeId,
    p_ref: null,
    p_key: `lock:${clientRequestId}`,
  });
  if (lockError) {
    const code = lockError.message.includes("insufficient_coins")
      ? "insufficient_coins"
      : "unknown";
    return Response.json({ error: code }, { status: code === "unknown" ? 500 : 409 });
  }
  const lockResult = Array.isArray(lockData) ? lockData[0] : lockData;
  if (!lockResult?.applied) {
    const { data: prior, error } = await supabaseAdmin
      .from("quests")
      .select("*")
      .eq("id", stakeId)
      .eq("family_id", familyId)
      .maybeSingle();
    if (!error && prior) return Response.json({ success: true, quest: prior });
    return Response.json({ error: "unknown" }, { status: 409 });
  }

  const durationDays = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000));
  const termsPayload = {
    stake_id: stakeId,
    user_id: clerkId,
    wager,
    bonus_rate: getWinBonusRate(durationDays),
    timezone: stakeTimezone,
  };
  const { error: termsError } = await supabaseAdmin.from("stake_coin_terms").insert(termsPayload);
  if (termsError) {
    const { error: reversalError } = await supabaseAdmin.rpc("coin_apply", {
      p_user: clerkId,
      p_delta: wager,
      p_type: "lock_reversal",
      p_stake: stakeId,
      p_ref: null,
      p_key: `lock_rev:${clientRequestId}`,
    });
    if (reversalError) console.error("Coin lock reversal failed:", reversalError);
    return Response.json({ error: "unknown" }, { status: 500 });
  }

  const dbInsertPayload = {
    id: stakeId,
    family_id: familyId,
    title: title.trim(),
    description: finalDescription,
    reward: 0,
    type,
    status: "active",
    expires_at: expiresAt.toISOString(),
  };

  const { data: quest, error } = await supabaseAdmin
    .rpc("create_coin_quest", { p_user: clerkId, p_quest: dbInsertPayload })
    .single<typeof dbInsertPayload>();

  if (error) {
    await supabaseAdmin.from("stake_coin_terms").delete().eq("stake_id", stakeId);
    const { error: reversalError } = await supabaseAdmin.rpc("coin_apply", {
      p_user: clerkId,
      p_delta: wager,
      p_type: "lock_reversal",
      p_stake: stakeId,
      p_ref: null,
      p_key: `lock_rev:${clientRequestId}`,
    });
    if (reversalError) console.error("Coin lock reversal failed:", reversalError);
    if (error.code === "23514" && error.message.includes("stake_cap")) {
      return Response.json({ error: "stake_cap" }, { status: 409 });
    }
    return Response.json({ error: "Failed to create quest" }, { status: 500 });
  }

  if (quest) {
    quest.description = parseDescription(quest.description);
  }

  return Response.json({
    success: true,
    quest,
  });
}
