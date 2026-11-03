import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sessionUser, sameOrigin } from '@/lib/serverAuth';

async function handle(req: Request, mutation: boolean) {
  if (mutation && !sameOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const actor = await sessionUser();
  if (!actor) return NextResponse.json({ error: 'Vui lòng đăng nhập lại để dùng Bạn bè / Clan.', code: 'LOGIN_REQUIRED' }, { status: 401 });
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Server chưa cấu hình SUPABASE_SERVICE_ROLE_KEY.', code: 'SETUP_REQUIRED' }, { status: 503 });
  try {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const body = mutation ? await req.json() : {};
    const { data, error } = await db.rpc('game_social', { p_actor: actor, p_action: mutation ? body.action : 'list', p_data: body });
    if (error) {
      const setup = error.code === 'PGRST202' || error.code === '42P01';
      return NextResponse.json({ error: setup ? 'Cần chạy file SQL social-runtime trên Supabase trước.' : error.message, code: setup ? 'SETUP_REQUIRED' : 'SOCIAL_ERROR' }, { status: setup ? 503 : 400 });
    }
    return NextResponse.json({ success: true, ...data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Không thể kết nối. Vui lòng thử lại.' }, { status: 500 }); }
}
export const GET = (req: Request) => handle(req, false);
export const POST = (req: Request) => handle(req, true);
