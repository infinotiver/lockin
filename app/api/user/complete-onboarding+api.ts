import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function POST(request: Request) {
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();

  let body: { familyId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { familyId } = body;
  if (!familyId) {
    return Response.json({ error: "familyId is required" }, { status: 400 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("family_members")
    .select("id")
    .eq("family_id", familyId)
    .eq("clerk_id", clerkId)
    .single();

  if (membershipError || !membership) {
    return forbidden();
  }

  try {
    await clerk.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        onboarded: true,
        familyId: familyId,
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Authentication service unavailable" },
      { status: 502 },
    );
  }

  return Response.json({ success: true });
}
