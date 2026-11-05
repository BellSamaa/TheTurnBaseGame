import {NextResponse} from 'next/server';
import {sessionUser} from '@/lib/serverAuth';
export async function GET(){
 if(!await sessionUser())return NextResponse.json({error:'Sign in required'},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.SUPABASE_ANON_KEY;
 if(!url||!key)return NextResponse.json({error:'Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for lobby Broadcast.'},{status:503});
 return NextResponse.json({url,key},{headers:{'Cache-Control':'no-store'}});
}
