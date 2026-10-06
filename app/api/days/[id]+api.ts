import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
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
  if (terms) {
    const today = dateInTimezone(new Date(), timezone);
    const createdDay = dateInTimezone(new Date(access.quest.created_at), timezone);
    if (date < createdDay || date > today) {
      return Response.json({ error: "unknown" }, { status: 400 });
    }
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

  // totalMs comes from the device, and no server-verifiable usage source exists.
  // Keep it for progress tracking, but never use it to mint day-pass coins.

  return Response.json({ frozen: false, awarded: false });
}
