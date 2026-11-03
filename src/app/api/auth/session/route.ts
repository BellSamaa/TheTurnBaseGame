import { NextResponse } from 'next/server';
import { sessionUser } from '@/lib/serverAuth';
export async function GET() {
  const userId = await sessionUser();
  return NextResponse.json({ success: Boolean(userId), userId }, {
    status: userId ? 200 : 401, headers: { 'Cache-Control': 'no-store' },
  });
}
