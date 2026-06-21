// app/api/families+api.ts
import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

// generates a random 6 character uppercase code e.g. "A3K9PQ"
function generateCode() {
  const buffer = new Uint8Array(6);
  crypto.getRandomValues(buffer);

  // Convert random bytes to base36, grab characters, and force uppercase
  return Array.from(buffer)
    .map((byte) => byte.toString(36))
    .join("")
    .substring(0, 6)
    .toUpperCase();
}

export async function POST(request: Request) {
  // Step 1: verify the user is logged in
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();

  // Step 2: verify they have the individual role
  const user = await clerk.users.getUser(clerkId);
  const role = user.publicMetadata?.role;
  if (role !== "individual") return forbidden();

  // Step 3: get family name from request body
  let familyName: string;
  try {
    const body = await request.json();
    familyName = body?.name?.trim();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!familyName) {
    return Response.json({ error: "Family name is required" }, { status: 400 });
  }

  // Step 4: generate a unique invite code
  // keep trying until we get one that doesn't exist yet
  // might need improvent later ?
  let code = generateCode();
  let codeExists = true;
  while (codeExists) {
    const { data } = await supabase
      .from("families")
      .select("id")
      .eq("code", code)
      .single();
    if (!data) codeExists = false;
    else code = generateCode();
  }

  // Step 5: create the family in Supabase
  const { data: family, error: familyError } = await supabase
    .from("families")
    .insert({ code, parent_clerk_id: clerkId, name: familyName })
    .select()
    .single();

  if (familyError) {
    console.error("Failed to create family:", familyError);
    return Response.json({ error: "Failed to create family" }, { status: 500 });
  }

  // Step 6: add the parent as a member
  const { error: memberError } = await supabase
    .from("family_members")
    .insert({ family_id: family.id, clerk_id: clerkId, role: "individual" });

  if (memberError) {
    console.error("Failed to add member:", memberError);
    return Response.json({ error: "Failed to add member" }, { status: 500 });
  }

  return Response.json({ success: true, family });
}

export async function GET(request: Request) {
  // Step 1: verify the user is logged in
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();

  // Step 2: find which family this user belongs to
  const { data: membership, error: memberError } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("clerk_id", clerkId)
    .single();

  if (memberError || !membership) {
    return Response.json({ error: "Not in a family" }, { status: 404 });
  }

  // Step 3: get the family details
  const { data: family, error: familyError } = await supabase
    .from("families")
    .select("*")
    .eq("id", membership.family_id)
    .single();

  if (familyError || !family) {
    return Response.json({ error: "Family not found" }, { status: 404 });
  }

  // Step 4: get all members
  const { data: members, error: membersError } = await supabase
    .from("family_members")
    .select("*")
    .eq("family_id", family.id);

  if (membersError) {
    return Response.json({ error: "Failed to fetch members" }, { status: 500 });
  }

  return Response.json({ family, members });
}
