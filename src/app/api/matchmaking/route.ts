import {NextResponse} from 'next/server';
import {sessionUser,sameOrigin} from '@/lib/serverAuth';
import {persistentMatch} from '@/lib/onlineRuntime';
async function handle(req:Request){
 if(req.method!=='GET'&&!sameOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});
 const actor=await sessionUser();if(!actor)return NextResponse.json({error:'Vui lòng đăng nhập'},{status:401});
 try{const body=req.method==='POST'?await req.json():{};const action=req.method==='GET'?'poll':req.method==='DELETE'?'leave':body.action==='join'?'join':'leave';return NextResponse.json({success:true,...await persistentMatch(actor,action)});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Server error'},{status:503});}
}
export const GET=handle;export const POST=handle;export const DELETE=handle;
