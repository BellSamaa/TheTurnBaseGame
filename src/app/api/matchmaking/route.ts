import { NextResponse } from 'next/server';
import {
  joinMatchmakingQueueAsync,
  pollMatchmakingQueueAsync,
  leaveMatchmakingQueueAsync,
  type MatchmakingPlayer,
} from '@/lib/serverDb';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const result = await pollMatchmakingQueueAsync(userId);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, user, userId } = body;

    if (action === 'join') {
      if (!user || !user.id || !user.username) {
        return NextResponse.json({ success: false, error: 'User payload required' }, { status: 400 });
      }

      const player: MatchmakingPlayer = {
        userId: user.id,
        username: user.username,
        rankPoints: user.rankPoints ?? 1000,
        classType: user.classType || user.selectedClass || 'warrior',
        weaponId: user.weaponId || user.selectedWeapon || 'greatsword',
        avatarConfig: user.avatarConfig || user.character,
      };

      const result = await joinMatchmakingQueueAsync(player);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'leave' || action === 'cancel') {
      const targetId = userId || user?.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
      }
      await leaveMatchmakingQueueAsync(targetId);
      return NextResponse.json({ success: true, message: 'Left matchmaking queue' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }
    await leaveMatchmakingQueueAsync(userId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
