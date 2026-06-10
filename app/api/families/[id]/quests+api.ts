// NOTE: Dropped/deprecated, not in use for now, I MAY pick parts from this for later code
import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function GET(request: Request, { id }: Record<string, string>) {
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("clerk_id", clerkId)
    .eq("family_id", id)
    .single();

  if (!membership) return forbidden();

  const { data: quests, error } = await supabase
    .from("quests")
    .select("*")
    .eq("family_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: "Failed to fetch quests" }, { status: 500 });
  }

  return Response.json({ quests });
}

export async function POST(request: Request, { id }: Record<string, string>) {
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();

  const user = await clerk.users.getUser(clerkId);
  if (user.publicMetadata?.role !== "individual") return forbidden();

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("clerk_id", clerkId)
    .eq("family_id", id)
    .single();

  if (!membership) return forbidden();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, description, reward, type, icon_url, expires_at } = body;

  if (!title?.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }
  if (!reward || isNaN(Number(reward)) || Number(reward) <= 0) {
    return Response.json({ error: "Valid reward amount is required" }, { status: 400 });
  }
  const validTypes = ["chore", "study", "screen-time", "work", "shop"];
  if (!validTypes.includes(type)) {
    return Response.json({ error: "Invalid quest type" }, { status: 400 });
  }

  const { data: quest, error } = await supabase
    .from("quests")
    .insert({
      family_id: id,
      title: title.trim(),
      description: description?.trim() ?? null,
      reward: Number(reward),
      type,
      icon_url: icon_url ?? null,
      expires_at: expires_at ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create quest:", error);
    return Response.json({ error: "Failed to create quest" }, { status: 500 });
  }

  return Response.json({ success: true, quest });
}
