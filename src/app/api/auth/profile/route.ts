import { NextResponse } from 'next/server';
import { getUserByUsername, saveUser } from '@/lib/serverDb';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, avatarConfig, selectedClass, selectedWeapon, bio, rankPoints, wins, losses } = body;

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username required' }, { status: 400 });
    }

    const user = getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (avatarConfig) user.avatarConfig = avatarConfig;
    if (selectedClass) user.selectedClass = selectedClass;
    if (selectedWeapon) user.selectedWeapon = selectedWeapon;
    if (bio !== undefined) user.bio = bio;
    if (rankPoints !== undefined) user.rankPoints = rankPoints;
    if (wins !== undefined) user.wins = wins;
    if (losses !== undefined) user.losses = losses;

    const saved = saveUser(user);
    const { passwordHash: _, ...safeUser } = saved;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
