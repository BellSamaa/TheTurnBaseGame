import {NextResponse} from 'next/server';
import {lobbyChatRequest} from '@/lib/lobbyChat';
import {sessionUser,sameOrigin} from '@/lib/serverAuth';
export async function POST(req:Request){
 const actor=await sessionUser();if(!actor||!sameOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});
 const b=await req.json();if(typeof b.session!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.session)||!['join','touch','leave'].includes(b.action))return NextResponse.json({error:'Invalid session'},{status:400});
 const result=await lobbyChatRequest(actor,b.session,b.action);
 return NextResponse.json(result.error||result.data,{status:result.status,headers:{'Cache-Control':'no-store'}});
}
