import { NextResponse } from 'next/server';
import { CLASS_DEFINITIONS, WEAPON_DEFINITIONS } from '@/lib/constants';
import { onlineDb } from '@/lib/onlineRuntime';
import { sessionUser, sameOrigin } from '@/lib/serverAuth';
import { getUserByIdAsync, getUserByUsernameAsync, saveUserAsync } from '@/lib/serverDb';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, avatarConfig, selectedClass, selectedWeapon, bio, rankPoints, wins, losses } = body;

    if (!sameOrigin(req)) return NextResponse.json({error:'Forbidden'},{status:403});
    const actor = await sessionUser();
    const user = actor ? await getUserByIdAsync(actor) : null;
    if (!user) return NextResponse.json({success:false,error:'Sign in required'},{status:401});
    if (selectedWeapon && !WEAPON_DEFINITIONS[selectedWeapon]) return NextResponse.json({success:false,error:'Invalid weapon'},{status:400});
    if (selectedClass && !CLASS_DEFINITIONS[selectedClass as keyof typeof CLASS_DEFINITIONS]) return NextResponse.json({success:false,error:'Invalid class'},{status:400});
    if(username!==undefined&&(typeof username!=='string'||username.trim().length<2||username.trim().length>32))return NextResponse.json({error:'Callsign must contain 2–32 characters'},{status:400});
    if(bio!==undefined&&(typeof bio!=='string'||bio.length>1000))return NextResponse.json({error:'Bio must be at most 1000 characters'},{status:400});
    if (username && username !== user.username) {
      const taken=await getUserByUsernameAsync(username);
      if(taken && taken.id!==actor) return NextResponse.json({success:false,error:'Username already taken'},{status:409});
      user.username=username;
    }
    if (avatarConfig) user.avatarConfig = avatarConfig;
    if (selectedClass) user.selectedClass = selectedClass;
    if (selectedWeapon) user.selectedWeapon = selectedWeapon;
    if (bio !== undefined) user.bio = bio;




    // Patch profile columns only; preserve concurrent ranked results.
    if(process.env.SUPABASE_SERVICE_ROLE_KEY){
      const patch={...(username?{username}:{}),...(avatarConfig?{avatar_config:avatarConfig}:{}),...(selectedClass?{selected_class:selectedClass}:{}),...(selectedWeapon?{selected_weapon:selectedWeapon}:{}),...(bio!==undefined?{bio}:{}),updated_at:new Date().toISOString()};
      const {error}=await onlineDb().from('users').update(patch).eq('id',actor);
      if(error)throw Error(error.message);
    }
    const saved = process.env.SUPABASE_SERVICE_ROLE_KEY ? user : await saveUserAsync(user);
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
