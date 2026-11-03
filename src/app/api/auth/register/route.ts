import { issueSession, hashPassword, sameOrigin } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import { getUserByUsernameAsync, saveUserAsync, type DbUserAccount } from '@/lib/serverDb';
import type { CharacterCustomization, ClassType } from '@/types/game';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const { username, email, password, avatarConfig, selectedClass, selectedWeapon } = body;

    const trimmedUser = (username || '').trim();
    const trimmedPass = (password || '').trim();

    if (!trimmedUser || trimmedUser.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Tên tài khoản phải có ít nhất 3 ký tự (Username must be >= 3 chars)' },
        { status: 400 }
      );
    }

    if (!trimmedPass || trimmedPass.length < 4) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu phải có ít nhất 4 ký tự (Password must be >= 4 chars)' },
        { status: 400 }
      );
    }

    const existing = await getUserByUsernameAsync(trimmedUser);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Tên tài khoản này đã tồn tại, vui lòng chọn tên khác hoặc Đăng Nhập!' },
        { status: 409 }
      );
    }

    const defaultAvatar: CharacterCustomization = {
      baseIndex: 0,
      hairIndex: 0,
      hairColor: '#ffe066',
      skinColor: '#f8d5b8',
      shirtIndex: 0,
      shirtColor: '#4d94ff',
      pantsIndex: 0,
      pantsColor: '#1a202c',
      accessoryIndex: -1,
      faceIndex: 0,
    };

    const newUser: DbUserAccount = {
      id: 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      username: trimmedUser,
      email: (email || `${trimmedUser.toLowerCase()}@dicemaniac.rpg`).trim(),
      passwordHash: hashPassword(trimmedPass),
      avatarConfig: avatarConfig || defaultAvatar,
      selectedClass: (selectedClass as ClassType) || 'warrior',
      selectedWeapon: selectedWeapon || 'greatsword',
      tier: 1,
      rankPoints: 1000,
      wins: 0,
      losses: 0,
      bio: 'Challenger ready to roll the D20 in Dice Maniac.',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveUserAsync(newUser);

    await issueSession(saved.id);
    // Return safe user object (omit password)
    const { passwordHash: _, ...safeUser } = saved;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
