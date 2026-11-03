import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clearSession, sameOrigin, sessionUser } from '@/lib/serverAuth';
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const actor = await sessionUser();
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (actor && url && key) {
    try { await createClient(url,key).from('player_presence').delete().eq('user_id',actor); } catch { /* TTL clears stale presence if storage is unavailable. */ }
  }
  await clearSession();
  return NextResponse.json({ success: true });
}
