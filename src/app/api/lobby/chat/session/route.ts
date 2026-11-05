import {NextResponse} from 'next/server';
import {onlineDb} from '@/lib/onlineRuntime';
import {sessionUser,sameOrigin} from '@/lib/serverAuth';
export async function POST(req:Request){
 const actor=await sessionUser();if(!actor||!sameOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});
 const b=await req.json();if(typeof b.session!=='string'||!/^[0-9a-f-]{36}$/i.test(b.session)||!['join','touch','leave'].includes(b.action))return NextResponse.json({error:'Invalid session'},{status:400});
 const {data,error}=await onlineDb().rpc('game_lobby_chat_session',{p_actor:actor,p_session:b.session,p_action:b.action});
 return NextResponse.json(error?{error:'Apply sql/20261105-lobby-empty-chat.sql'}:data,{status:error?503:200});
}
