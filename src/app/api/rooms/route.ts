import { NextResponse } from 'next/server';
import { listOpenRooms, createRoom, type RoomParticipant } from '@/lib/serverDb';

export async function GET() {
  try {
    const rooms = await listOpenRooms();
    return NextResponse.json({ success: true, rooms });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { host, mode, mapId, gameMode } = body;

    if (!host || !host.id || !host.name) {
      return NextResponse.json(
        { success: false, error: 'Host user information required' },
        { status: 400 }
      );
    }

    const hostParticipant: RoomParticipant = {
      id: host.id,
      name: host.name,
      character: host.character,
      classType: host.classType || 'warrior',
      weaponId: host.weaponId || 'greatsword',
      isReady: true,
    };

    if (gameMode !== undefined && !['classic', 'last_man_standing'].includes(gameMode)) return NextResponse.json({ success: false, error: 'Invalid game mode' }, { status: 400 });
    const room = await createRoom(hostParticipant, mode || 'casual', mapId || 'castle', gameMode || 'classic');
    return NextResponse.json({ success: true, room });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
