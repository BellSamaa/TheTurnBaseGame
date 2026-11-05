import {NextResponse} from 'next/server';
import {lobbyChatRequest} from '@/lib/lobbyChat';
import {sessionUser,sameOrigin} from '@/lib/serverAuth';
export async function GET(){
 const actor=await sessionUser();if(!actor)return NextResponse.json({error:'Sign in required'},{status:401});
 const result=await lobbyChatRequest(actor,null,'read');
 return NextResponse.json(result.error||result.data,{status:result.status,headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:Request){
 const actor=await sessionUser();if(!actor||!sameOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});
 const b=await req.json();const message=typeof b.message==='string'?b.message.trim():'';
 if(!message||message.length>240)return NextResponse.json({error:'1–240 characters required'},{status:400});
 const result=await lobbyChatRequest(actor,null,'send',message);
 return NextResponse.json(result.error||{success:true,...result.data},{status:result.status});
}
