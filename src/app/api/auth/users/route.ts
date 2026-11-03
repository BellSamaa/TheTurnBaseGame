import { NextRequest, NextResponse } from 'next/server';
import { listAllUsersAsync } from '@/lib/serverDb';

export async function GET(req: NextRequest) {
  // Reading nextUrl marks this route handler as dynamic per request
  const _search = req.nextUrl.searchParams;
  try {
    const users = await listAllUsersAsync();
    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve users';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
