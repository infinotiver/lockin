import { verifyAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function decodeCursor(cursor: string | null) {
  if (!cursor) return null;
  try {
    const decoded = decodeURIComponent(cursor);
    const separator = decoded.lastIndexOf("|");
    if (separator < 1) return null;
    const createdAt = decoded.slice(0, separator);
    const id = decoded.slice(separator + 1);
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(createdAt) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const userId = await verifyAuth(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const rawLimit = url.searchParams.get("limit");
  const requestedLimit = rawLimit === null ? 20 : Number(rawLimit);
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
    return Response.json({ error: "unknown" }, { status: 400 });
  }
  const limit = Math.min(requestedLimit, 50);
  const rawCursor = url.searchParams.get("cursor");
  const cursor = decodeCursor(rawCursor);
  if (rawCursor && !cursor) {
    return Response.json({ error: "unknown" }, { status: 400 });
  }

  let query = supabaseAdmin
    .from("coin_ledger")
    .select("id,delta,type,stake_id,ref,idempotency_key,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.or(
      `created_at.lt."${cursor.createdAt}",and(created_at.eq."${cursor.createdAt}",id.lt.${cursor.id})`,
    );
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: "unknown" }, { status: 500 });

  const entries = data ?? [];
  const hasMore = entries.length > limit;
  const page = entries.slice(0, limit);
  const last = page.at(-1);
  const nextCursor = hasMore && last
    ? encodeURIComponent(`${last.created_at}|${last.id}`)
    : null;

  return Response.json({ entries: page, nextCursor, hasMore });
}
