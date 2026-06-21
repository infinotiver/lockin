import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

async function verifyQuestAccess(clerkId: string, questId: string) {
  const { data: quest } = await supabase
    .from("quests")
    .select("*")
    .eq("id", questId)
    .single();

  if (!quest) return null;

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id, role")
    .eq("clerk_id", clerkId)
    .eq("family_id", quest.family_id)
    .single();

  if (!membership) return null;

  return { quest, membership };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();

  const access = await verifyQuestAccess(clerkId, params.id);
  if (!access) return forbidden();

  return Response.json({ quest: access.quest });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();

  const user = await clerk.users.getUser(clerkId);
  // if (user.publicMetadata?.role !== "individual") return forbidden(); allow teens to PATCH too

  const access = await verifyQuestAccess(clerkId, params.id);
  if (!access) return forbidden();
  const userRole = access.membership.role;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (userRole === "teen") {
    const attemptedKeys = Object.keys(body);
    const tryingToCheat =
      attemptedKeys.length > 1 || attemptedKeys[0] !== "status";

    if (tryingToCheat || body.status !== "completed") {
      return Response.json(
        { error: "Teens can only mark quests as completed" },
        { status: 403 },
      );
    }
  }
  const allowedFields = [
    "title",
    "description",
    "reward",
    "type",
    "icon_url",
    "status",
    "expires_at",
  ];
  const updates: any = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  const { data: updated, error } = await supabase
    .from("quests")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: "Failed to update quest" }, { status: 500 });
  }

  return Response.json({ success: true, quest: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();

  const user = await clerk.users.getUser(clerkId);
  if (user.publicMetadata?.role !== "individual") return forbidden();

  const access = await verifyQuestAccess(clerkId, id);
  if (!access) return forbidden();

  const { error } = await supabase.from("quests").delete().eq("id", params.id);

  if (error) {
    return Response.json({ error: "Failed to delete quest" }, { status: 500 });
  }

  return Response.json({ success: true });
}
