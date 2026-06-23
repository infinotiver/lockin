import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

/*
 * GET /api/quests
 *
 * Returns all quests belonging to the caller's family (resolved via Clerk metadata).
 *
 * Allowed:
 * - individual
 * - teen
 */
export async function GET(request: Request) {
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

  const familyId = user.publicMetadata?.familyId;
  if (!familyId) {
    return Response.json(
      { error: "User is not assigned to a family unit" },
      { status: 400 },
    );
  }

  // Fetch all quests associated with the verified metadata token
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
 * Creates a new quest inside the user's family.
 *
 * Allowed:
 * - individual only
 */
export async function POST(request: Request) {
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

  // RBAC validation
  if (user.publicMetadata?.role !== "individual") {
    return forbidden();
  }

  const familyId = user.publicMetadata?.familyId;
  if (!familyId) {
    return Response.json(
      { error: "User is not assigned to a family unit" },
      { status: 400 },
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, description, reward, type, expires_at } = body;

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

  const validTypes = [
    "integration",
    "photo-verify",
    "screen-time",
    "health",
    "peer-verify",
  ];
  if (!validTypes.includes(type)) {
    return Response.json({ error: "Invalid quest type" }, { status: 400 });
  }

  const { data: quest, error } = await supabase
    .from("quests")
    .insert({
      family_id: familyId,
      title: title.trim(),
      description: description?.trim() ?? null,
      reward: parsedReward,
      type,
      status: "active",
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
