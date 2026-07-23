import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { validStatuses } from "@/types/stakes";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

async function verifyQuestAccess(clerkId: string, questId: string) {
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
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

  let familyId: string | undefined;
  try {
    const user = await clerk.users.getUser(clerkId);
    familyId = user.publicMetadata?.familyId as string | undefined;
  } catch {
    return Response.json(
      { error: "Authentication service unavailable" },
      { status: 502 },
    );
  }

  if (!familyId) {
    return Response.json(
      { error: "User is not assigned to a family" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("quests")
    .update({ status })
    .eq("id", id)
    .eq("family_id", familyId)
    .select()
    .single();

  if (error || !data) {
    return Response.json({ error: "Quest not found" }, { status: 404 });
  }

  return Response.json({ quest: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
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
