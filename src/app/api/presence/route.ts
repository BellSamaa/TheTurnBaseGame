import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sameOrigin, sessionUser } from '@/lib/serverAuth';
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const actor = await sessionUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { tabId, activity } = await req.json();
    if (typeof tabId !== 'string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(tabId) || !['online','lobby','battle','offline'].includes(activity)) return NextResponse.json({ error: 'Invalid presence' }, { status: 400 });
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ error: 'Presence not configured' }, { status: 503 });
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await db.rpc('game_presence', { p_actor: actor, p_tab: tabId, p_activity: activity });
    if (error) return NextResponse.json({ error: 'Cần chạy SQL supabase-presence.sql' }, { status: 503 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Presence unavailable' }, { status: 503 }); }
}
