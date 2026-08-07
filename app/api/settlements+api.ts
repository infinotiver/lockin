import { supabase } from "@/lib/supabase";

// GET /api/settlements?userId=X — list settlements, optionally filtered by status
// Basic settlements implementation

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const stakeId = url.searchParams.get('stakeId'); // new
  const status = url.searchParams.get('status');

  if (!userId) {
    return Response.json({ error: 'userId is required' }, { status: 400 });
  }

  let query = supabase.from('settlements').select('*').eq('user_id', userId);
  if (stakeId) query = query.eq('stake_id', stakeId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ settlements: data });
}
