import { verifyAuth, unauthorized } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = body?.code?.trim().toUpperCase();
  if (!code)
    return Response.json({ error: "Code is required" }, { status: 400 });

  // find the family
  const { data: family } = await supabase
    .from("families")
    .select("id")
    .eq("code", code)
    .single();

  if (!family)
    return Response.json({ error: "Invalid invite code" }, { status: 404 });

  // update supabase entry
  const { error } = await supabase.from("family_members").insert({
    family_id: family.id,
    clerk_id: clerkId,
    role: "teen",
  });

  if (error) {
    // If Supabase throws a unique constraint error, they were already in it
    return Response.json({ error: "Could not join family" }, { status: 500 });
  }

  return Response.json({ success: true, family_id: family.id });
}
