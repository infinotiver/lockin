import { supabase } from "@/lib/supabase";
import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";

// GET /api/settlements?userId=X — list settlements, optionally filtered by status
// Basic settlements implementation

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export async function GET(request: Request) {
  const url = new URL(request.url);
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
  const stakeId = url.searchParams.get("stakeId");
  const status = url.searchParams.get("status");

  let query = supabase.from("settlements").select("*").eq("user_id", user.id);
  if (stakeId) query = query.eq("stake_id", stakeId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ settlements: data });
}
