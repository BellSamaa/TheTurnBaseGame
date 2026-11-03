import { NextResponse } from 'next/server';
import { issueSession, verifyPassword, hashPassword, sameOrigin } from '@/lib/serverAuth';
import { getUserByUsernameAsync, saveUserAsync } from '@/lib/serverDb';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const { username, password } = body;

    const trimmedUser = (username || '').trim();
    const trimmedPass = (password || '').trim();

    if (!trimmedUser) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập tên tài khoản (Username is required)' },
        { status: 400 }
      );
    }

    const user = await getUserByUsernameAsync(trimmedUser);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tài khoản không tồn tại. Vui lòng bấm ĐĂNG KÝ để tạo tài khoản mới!',
        },
        { status: 404 }
      );
    }

    if (!verifyPassword(trimmedPass, user.passwordHash)) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!' },
        { status: 401 }
      );
    }

    await issueSession(user.id);
    if (!user.passwordHash.startsWith('scrypt:')) { user.passwordHash = hashPassword(trimmedPass); await saveUserAsync(user); }
    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
