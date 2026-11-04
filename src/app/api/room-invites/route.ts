import {NextResponse} from 'next/server';
import {sessionUser,sameOrigin} from '@/lib/serverAuth';
import {onlineDb} from '@/lib/onlineRuntime';
import {getRoomByCodeAsync} from '@/lib/serverDb';
export async function GET(){
 const actor=await sessionUser();if(!actor)return NextResponse.json({error:'Sign in required'},{status:401});
 const {data,error}=await onlineDb().from('game_room_invites').select('*').eq('receiver_id',actor).gt('created_at',new Date(Date.now()-600000).toISOString());
 return NextResponse.json(error?{error:error.message}:{invites:data},{status:error?503:200});
}
export async function POST(req:Request){
 const actor=await sessionUser();if(!actor||!sameOrigin(req))return NextResponse.json({error:'Sign in required'},{status:401});
 const body=await req.json(),db=onlineDb();
 if(body.action==='dismiss'){await db.from('game_room_invites').delete().eq('id',body.id).eq('receiver_id',actor);return NextResponse.json({success:true});}
 const room=await getRoomByCodeAsync(body.code);
 if(!room||!['waiting','ready'].includes(room.status)||!room.participants?.some(p=>p.id===actor))return NextResponse.json({error:'Bạn cần ở phòng chờ'},{status:400});
 const {data:social,error}=await db.rpc('game_social',{p_actor:actor,p_action:'list',p_data:{}});
 if(error||!social.friends?.some((p:{id:string;userId?:string})=>(p.userId||p.id)===body.target))return NextResponse.json({error:'Chỉ mời người trong danh sách bạn bè'},{status:403});
 const {error:write}=await db.from('game_room_invites').upsert({room_code:room.code,sender_id:actor,receiver_id:body.target,created_at:new Date().toISOString()},{onConflict:'room_code,receiver_id'});
 return NextResponse.json(write?{error:write.message}:{success:true},{status:write?503:200});
}
