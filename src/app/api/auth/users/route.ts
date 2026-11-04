import { NextRequest, NextResponse } from 'next/server';
import {onlineDb} from '@/lib/onlineRuntime';
import { readPresence } from '@/lib/presence';
import { listAllUsersAsync } from '@/lib/serverDb';

export async function GET(req: NextRequest) {
  // Reading nextUrl marks this route handler as dynamic per request
  const _search = req.nextUrl.searchParams;
  try {
    const users = await listAllUsersAsync();
    const {data:accountRows}=await onlineDb().from('game_accounts').select('user_id,exp,equipped_frame').in('user_id',users.map(u=>u.id));
    const accounts=Object.fromEntries((accountRows||[]).map(a=>[a.user_id,a]));
    const presence = await readPresence(users.map(u => u.id));
    return NextResponse.json({
      success: true,
      users: users.map(({ email: _email, ...u }) => ({ ...u, ...accounts[u.id], presence: presence ? presence[u.id] || "offline" : "unknown" })),
      total: users.length,
      presenceAvailable: presence !== null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve users';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
