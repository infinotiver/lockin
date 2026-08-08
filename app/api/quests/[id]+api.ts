import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { validStatuses } from "@/types/stakes";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

/**
 * Confirms that a Clerk user belongs to the family that owns a quest.
 *
 * @param clerkId - Authenticated Clerk user identifier.
 * @param questId - Quest identifier supplied by the dynamic route.
 * @returns The quest and matching membership, or `null` when either is absent.
 * @throws The underlying Supabase error when either lookup fails, allowing the
 * route runtime to report an infrastructure failure instead of a false 403.
 */
export async function verifyQuestAccess(clerkId: string, questId: string) {
  const { data: quest, error: questError } = await supabase
    .from("quests")
    .select("*")
    .eq("id", questId)
    .maybeSingle();

  if (questError) throw questError;
  if (!quest) return null;

  const { data: membership, error: memberError } = await supabase
    .from("family_members")
    .select("family_id, role")
    .eq("clerk_id", clerkId)
    .eq("family_id", quest.family_id)
    .maybeSingle();

  if (memberError) throw memberError;
  if (!membership) return null;

  return { quest, membership };
}

/**
 * Returns a quest only to a member of its owning family.
 *
 * @param request - Request carrying the Clerk bearer token.
 * @param context - Expo Router dynamic-route params; `id` identifies the quest.
 * @returns A JSON response containing the quest, or 401/403 for denied access.
 * @throws Propagates Supabase access-check failures.
 */
export async function GET(request: Request, { id }: Record<string, string>) {
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();

  const access = await verifyQuestAccess(clerkId, id);
  if (!access) return forbidden();

  return Response.json({ quest: access.quest });
}

/**
 * Validates and persists a requested status for a family-owned quest.
 *
 * @param request - Request carrying authentication and a JSON `{ status }` body.
 * @param context - Expo Router dynamic-route params; `id` identifies the quest.
 * @returns The updated quest, or a documented 400, 401, 403, or 500 error.
 * @throws Propagates unexpected authentication or database failures not handled
 * locally by the route.
 */
export async function PATCH(request: Request, { id }: Record<string, string>) {
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();

  let status: string;
  try {
    const body = await request.json();
    status = body?.status;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!validStatuses.includes(status as any)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const access = await verifyQuestAccess(clerkId, id);
  if (!access) return forbidden();
  const { data, error } = await supabase
    .from("quests")
    .update({ status })
    .eq("id", id)
    .eq("family_id", access.quest.family_id)
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return Response.json({ error: "Failed to update quest." }, { status: 500 });
  }

  // Settlement creation is handled atomically by the quest_failed_settlement in supabase

  return Response.json({ quest: data });
}

/**
 * Deletes a quest only when the caller has the individual role and family access.
 *
 * @param request - Request carrying the Clerk bearer token.
 * @param context - Expo Router dynamic-route params; `id` identifies the quest.
 * @returns `{ success: true }`, or 401/403/500 when deletion is not permitted.
 * @throws Propagates Supabase errors from the ownership check.
 */
export async function DELETE(request: Request, { id }: Record<string, string>) {
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

  if (user.publicMetadata?.role !== "individual") return forbidden();

  const access = await verifyQuestAccess(clerkId, id);
  if (!access) return forbidden();

  const { error } = await supabase.from("quests").delete().eq("id", id);

  if (error) {
    return Response.json({ error: "Failed to delete quest" }, { status: 500 });
  }

  return Response.json({ success: true });
}
