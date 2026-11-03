import { NextResponse } from 'next/server';
import { clearSession, sameOrigin } from '@/lib/serverAuth';
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await clearSession();
  return NextResponse.json({ success: true });
}
