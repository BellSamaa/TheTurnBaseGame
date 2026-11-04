import { NextResponse } from 'next/server';
import { sessionUser } from '@/lib/serverAuth';
import { getUserByIdAsync, getUserByUsernameAsync, saveUserAsync } from '@/lib/serverDb';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, avatarConfig, selectedClass, selectedWeapon, bio, rankPoints, wins, losses } = body;

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username required' });
    }

    const actor = await sessionUser();
    const user = actor ? await getUserByIdAsync(actor) : null;
    if (!user || user.username !== username) return NextResponse.json({success:false,error:'Sign in required'},{status:401});
    if (!user) {
      // Soft response to prevent browser console 404 red error for guest / unsynced local accounts
      return NextResponse.json({ success: false, message: 'Local profile updated, user not in server DB' });
    }

    if (avatarConfig) user.avatarConfig = avatarConfig;
    if (selectedClass) user.selectedClass = selectedClass;
    if (selectedWeapon) user.selectedWeapon = selectedWeapon;
    if (bio !== undefined) user.bio = bio;




    const saved = await saveUserAsync(user);
    const { passwordHash: _, ...safeUser } = saved;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
 const id=await sessionUser(); const user=id?await getUserByIdAsync(id):null;
 if(!user)return NextResponse.json({error:'Sign in required'},{status:401});
 const {passwordHash:_,...safe}=user;
 return NextResponse.json({user:safe},{headers:{'Cache-Control':'no-store'}});
}
