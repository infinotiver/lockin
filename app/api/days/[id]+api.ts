import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { verifyQuestAccess } from "../quests/[id]+api";
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export async function GET(request: Request, { id }: Record<string, string>) {
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();
  const access = await verifyQuestAccess(clerkId, id);
  if (!access) return forbidden();

  const { data, error } = await supabase
    .from("stake_days")
    .select("id,date,total_ms,checked_at")
    .eq("stake_id", id)
    .order("date", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({data});
}
