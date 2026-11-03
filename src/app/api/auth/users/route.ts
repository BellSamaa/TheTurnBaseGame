import { NextRequest, NextResponse } from 'next/server';
import { readPresence } from '@/lib/presence';
import { listAllUsersAsync } from '@/lib/serverDb';

export async function GET(req: NextRequest) {
  // Reading nextUrl marks this route handler as dynamic per request
  const _search = req.nextUrl.searchParams;
  try {
    const users = await listAllUsersAsync();
    const presence = await readPresence(users.map(u => u.id));
    return NextResponse.json({
      success: true,
      users: users.map(({ email: _email, ...u }) => ({ ...u, presence: presence ? presence[u.id] || "offline" : "unknown" })),
      total: users.length,
      presenceAvailable: presence !== null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve users';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
