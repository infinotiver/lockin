import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { DAY_PASS_REWARD } from "@/constants/coinEconomy";
import { verifyQuestAccess } from "../quests/[id]+api";

function dateInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getLimitMs(description: unknown): number | null {
  let rule = description;
  if (typeof description === "string") {
    try {
      rule = JSON.parse(description);
    } catch {
      return null;
    }
  }
  if (
    typeof rule === "object" && rule !== null &&
    "type" in rule && rule.type === "screen_time_limit" &&
    "limitMs" in rule && typeof rule.limitMs === "number" && rule.limitMs >= 0
  ) return rule.limitMs;
  return null;
}

export async function GET(request: Request, { id }: Record<string, string>) {
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();
  const access = await verifyQuestAccess(clerkId, id);
  if (!access) return forbidden();

  const { data, error } = await supabase
    .from("stake_days")
    .select("id,date,total_ms,checked_at")
    .eq("stake_id", id)
    .order("date", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  const { data: freezes, error: freezeError } = await supabaseAdmin
    .from("item_events")
    .select("day")
    .eq("user_id", clerkId)
    .eq("item_id", "streak_freeze")
    .eq("stake_id", id)
    .lt("delta", 0);
  if (freezeError) return Response.json({ error: "unknown" }, { status: 500 });
  const frozenDates = new Set((freezes ?? []).map((event) => event.day));
  return Response.json({
    data: (data ?? []).map((record) => ({
      ...record,
      frozen: frozenDates.has(record.date),
    })),
  });
}

export async function POST(request: Request, { id }: Record<string, string>) {
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();
  const access = await verifyQuestAccess(clerkId, id);
  if (!access) return forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "unknown" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "unknown" }, { status: 400 });
  }
  const date = (body as { date?: unknown }).date;
  const totalMs = (body as { totalMs?: unknown }).totalMs;
  if (
    typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    typeof totalMs !== "number" || !Number.isSafeInteger(totalMs) || totalMs < 0
  ) return Response.json({ error: "unknown" }, { status: 400 });
  const parsedDay = new Date(`${date}T00:00:00.000Z`);
  if (
    !Number.isFinite(parsedDay.getTime()) ||
    parsedDay.toISOString().slice(0, 10) !== date
  ) {
    return Response.json({ error: "unknown" }, { status: 400 });
  }

  const { data: terms, error: termsError } = await supabaseAdmin
    .from("stake_coin_terms")
    .select("user_id,timezone,allow_freeze")
    .eq("stake_id", id)
    .maybeSingle();
  if (termsError) return Response.json({ error: "unknown" }, { status: 500 });
  if (terms && terms.user_id !== clerkId) return forbidden();

  const timezone = terms?.timezone ?? "UTC";
  let closedDay = true;
  if (terms) {
    const today = dateInTimezone(new Date(), timezone);
    const createdDay = dateInTimezone(new Date(access.quest.created_at), timezone);
    const expired = access.quest.expires_at && Date.now() >= new Date(access.quest.expires_at).getTime();
    if (date < createdDay || date > today) {
      return Response.json({ error: "unknown" }, { status: 400 });
    }
    closedDay = date < today || Boolean(expired);
  }

  const { error: writeError } = await supabaseAdmin.from("stake_days").upsert({
    stake_id: id,
    clerk_ids: [clerkId],
    date,
    total_ms: totalMs,
    checked_at: new Date().toISOString(),
  }, { onConflict: "stake_id,date" });
  if (writeError) return Response.json({ error: "unknown" }, { status: 500 });

  if (!terms || access.quest.status !== "active") {
    return Response.json({ frozen: false, awarded: false });
  }

  const limitMs = getLimitMs(access.quest.description);
  if (limitMs === null) return Response.json({ frozen: false, awarded: false });

  if (totalMs > limitMs && terms.allow_freeze) {
    const { data: frozen, error } = await supabaseAdmin.rpc("freeze_consume", {
      p_user: clerkId,
      p_stake: id,
      p_day: date,
      p_key: `freeze:${id}:${date}`,
    });
    if (error) return Response.json({ error: "unknown" }, { status: 500 });
    if (frozen) return Response.json({ frozen: true, awarded: false });
  }

  if (totalMs <= limitMs && closedDay) {
    const { data, error } = await supabaseAdmin.rpc("coin_apply", {
      p_user: clerkId,
      p_delta: DAY_PASS_REWARD,
      p_type: "day_pass",
      p_stake: id,
      p_ref: date,
      p_key: `day_pass:${id}:${date}`,
    });
    if (error) return Response.json({ error: "unknown" }, { status: 500 });
    const result = Array.isArray(data) ? data[0] : data;
    let awarded = result?.applied === true;
    if (!awarded) {
      const { data: prior, error: priorError } = await supabaseAdmin
        .from("coin_ledger")
        .select("id")
        .eq("user_id", clerkId)
        .eq("type", "day_pass")
        .eq("idempotency_key", `day_pass:${id}:${date}`)
        .maybeSingle();
      if (priorError) return Response.json({ error: "unknown" }, { status: 500 });
      awarded = Boolean(prior);
    }
    return Response.json({ frozen: false, awarded });
  }

  return Response.json({ frozen: false, awarded: false });
}
