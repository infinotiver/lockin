import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

/*
 * GET /api/quests?familyId=<uuid>
 *
 * Returns all quests belonging to a family.
 *
 * Allowed:
 * - individual
 * - teen
 *
 * Requirements:
 * - User must belong to that family.
 */
export async function GET(request: Request) {
  // Verify JWT and get Clerk user id
  const clerkId = await verifyAuth(request);

  if (!clerkId) {
    return unauthorized();
  }

  // Read familyId from query string
  const url = new URL(request.url);
  const familyId = url.searchParams.get("familyId");

  if (!familyId) {
    return Response.json({ error: "familyId is required" }, { status: 400 });
  }

  // Verify user belongs to this family
  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("clerk_id", clerkId)
    .eq("family_id", familyId)
    .single();

  if (!membership) {
    return forbidden();
  }

  // Fetch all quests
  const { data: quests, error } = await supabase
    .from("quests")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);

    return Response.json({ error: "Failed to fetch quests" }, { status: 500 });
  }

  return Response.json({ quests });
}

/*
 * POST /api/quests
 *
 * Creates a new quest.
 *
 * Allowed:
 * - individual only
 */
export async function POST(request: Request) {
  // Verify JWT
  const clerkId = await verifyAuth(request);

  if (!clerkId) {
    return unauthorized();
  }

  // Load Clerk user
  let user;
  try {
    user = await clerk.users.getUser(clerkId);
  } catch {
    return Response.json(
      { error: "Authentication service unavailable" },
      { status: 502 },
    );
  }

  // Teens cannot create quests
  if (user.publicMetadata?.role !== "individual") {
    return forbidden();
  }

  let body: any;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { familyId, title, description, reward, type, expires_at } = body;

  // Basic validation

  if (!familyId) {
    return Response.json({ error: "familyId is required" }, { status: 400 });
  }

  if (!title?.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  const parsedReward = Number(reward);
  if (!Number.isFinite(parsedReward) || parsedReward <= 0) {
    return Response.json(
      { error: "Reward must be greater than 0" },
      { status: 400 },
    );
  }

  const validTypes = ["chore", "study", "screen-time", "work", "shop"];

  if (!validTypes.includes(type)) {
    return Response.json({ error: "Invalid quest type" }, { status: 400 });
  }

  // Verify user belongs to family
  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("clerk_id", clerkId)
    .eq("family_id", familyId)
    .single();

  if (!membership) {
    return forbidden();
  }

  // Create quest
  const { data: quest, error } = await supabase
    .from("quests")
    .insert({
      family_id: familyId,
      title: title.trim(),
      description: description?.trim() ?? null,
      reward: Number(reward),
      type,
      status: "available",
      expires_at: expires_at ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error(error);

    return Response.json({ error: "Failed to create quest" }, { status: 500 });
  }

  return Response.json({
    success: true,
    quest,
  });
}
