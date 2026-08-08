import { supabase } from "@/lib/supabase";
import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

// PATCH /api/settlements/[id] — update settlement status
export async function PATCH(request: Request, { id }: Record<string, string>) {
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();

  let requester;
  try {
    requester = await clerk.users.getUser(clerkId);
  } catch {
    return Response.json(
      { error: "Authentication service unavailable" },
      { status: 502 },
    );
  }

  // Fetch the settlement first so we know who owns it before allowing any write
  const { data: settlement, error: fetchError } = await supabase
    .from("settlements")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !settlement) {
    return Response.json({ error: "Settlement not found" }, { status: 404 });
  }

  const isOwner = settlement.user_id === requester.id;

  // TODO: allow an authorized family member to also update settlement
  if (!isOwner) return forbidden();

  const body = await request.json();
  const { status, note } = body;

  const allowedStatuses = ["pending", "settled"];
  if (!allowedStatuses.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const update: Record<string, unknown> = { status };
  if (note !== undefined) update.note = note;
  if (status === "settled") update.settled_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("settlements")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ settlement: data });
}
