import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

function parseDescription(desc: string | null) {
  if (!desc) return null;
  if (desc.trim().startsWith("{") || desc.trim().startsWith("[")) {
    try {
      return JSON.parse(desc);
    } catch {
      return desc; // Fallback to raw text if parsing fails
    }
  }
  return desc;
}

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

  const serializedQuests = (quests || []).map((q) => ({
    ...q,
    description: parseDescription(q.description),
  }));

  return Response.json({ quests: serializedQuests });
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

  // =================================================================
  // 🚨 CHECKPOINT 1: THE RAW ARRIVAL
  // =================================================================
  console.log("\n--------------------------------------------------");
  console.log("📍 [CHECKPOINT 1] RAW BODY RECEIVED FROM EXPO:");
  console.log(JSON.stringify(body, null, 2));
  console.log("-> Value of body.description:", body.description);
  console.log(
    "-> JavaScript typeof body.description:",
    typeof body.description,
  );
  console.log("--------------------------------------------------\n");

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

  // =================================================================
  // 🚨 CHECKPOINT 2: THE PARSER
  // =================================================================
  let finalDescription = null;

  console.log("📍 [CHECKPOINT 2] EVALUATING DESCRIPTION PARSER:");
  console.log(`-> Evaluates as truthy? : ${Boolean(description)}`);

  if (description) {
    if (typeof description === "object") {
      console.log("-> Branch caught: 'object'. Running JSON.stringify()");
      finalDescription = JSON.stringify(description);
    } else {
      console.log("-> Branch caught: 'string'. Running .trim() || null");
      finalDescription = description.trim() || null;
    }
  }

  console.log(`-> Resulting finalDescription variable:`, finalDescription);
  console.log(`-> Resulting typeof:`, typeof finalDescription);
  console.log("--------------------------------------------------\n");

  // Pack the payload into an explicit object so we can log it before sending
  const dbInsertPayload = {
    family_id: familyId,
    title: title.trim(),
    description: finalDescription,
    reward: parsedReward,
    type,
    status: "active",
    expires_at: expires_at ?? null,
  };

  // =================================================================
  // 🚨 CHECKPOINT 3: THE SUPABASE HANDOFF
  // =================================================================
  console.log("📍 [CHECKPOINT 3] EXACT PAYLOAD HANDED TO SUPABASE:");
  console.log(JSON.stringify(dbInsertPayload, null, 2));
  console.log("--------------------------------------------------\n");

  const { data: quest, error } = await supabase
    .from("quests")
    .insert(dbInsertPayload)
    .select()
    .single();

  if (error) {
    console.error("SUPABASE INSERT ERROR:", error);
    return Response.json({ error: "Failed to create quest" }, { status: 500 });
  }

  if (quest) {
    quest.description = parseDescription(quest.description);
  }

  return Response.json({
    success: true,
    quest,
  });
}
