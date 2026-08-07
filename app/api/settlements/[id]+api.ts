import { supabase } from "@/lib/supabase";

// PATCH /api/settlements/[id] — mark a settlement as settled, with optional note
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { note } = await request.json(); // optional right now for getting user notes

  const { data, error } = await supabase
    .from("settlements")
    .update({
      status: "settled",
      settled_at: new Date().toISOString(),
      note: note ?? null,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ settlement: data });
}
