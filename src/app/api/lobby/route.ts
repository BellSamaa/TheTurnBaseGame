import {lobbyPositionAllowed,LOBBY_SEATS} from '@/lib/lobbyMovement';
import {NextResponse} from 'next/server';
import {onlineDb} from '@/lib/onlineRuntime';
import {sessionUser,sameOrigin} from '@/lib/serverAuth';

export async function GET(){
 const actor=await sessionUser();if(!actor)return NextResponse.json({error:'Sign in required'},{status:401});
 try{const {data,error}=await onlineDb().from('game_lobby_players').select('user_id,x,z,facing,moving,seat_id,users(username,avatar_config,selected_weapon)').gt('updated_at',new Date(Date.now()-15000).toISOString()).limit(80);
 if(error&&error.message.includes('seat_id')){const legacy=await onlineDb().from('game_lobby_players').select('user_id,x,z,facing,moving,users(username,avatar_config,selected_weapon)').gt('updated_at',new Date(Date.now()-15000).toISOString()).limit(80);if(!legacy.error)return NextResponse.json({players:legacy.data},{headers:{'Cache-Control':'no-store'}});}
 if(error)throw error;return NextResponse.json({players:data},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Lobby unavailable. Apply sql/20261105-world-lobby.sql.'},{status:503});}
}
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});
 const actor=await sessionUser();if(!actor)return NextResponse.json({error:'Sign in required'},{status:401});
 try{const b=await req.json();
 const db=onlineDb();
 const {data:old}=await db.from('game_lobby_players').select('*').eq('user_id',actor).maybeSingle();
 if(b.action==='sit'||b.action==='stand'){
  if(!old)return NextResponse.json({error:'Enter lobby first'},{status:400});
  const seat=LOBBY_SEATS.find(s=>s.id===(b.action==='stand'?old.seat_id:b.seat));
  if(!seat||b.action==='sit'&&(old.seat_id||Math.hypot(old.x-seat.exitX,old.z-seat.exitZ)>1.5))return NextResponse.json({error:'Move closer to the seat'},{status:400});
  await db.from('game_lobby_players').delete().lt('updated_at',new Date(Date.now()-15000).toISOString());
  const position={x:b.action==='sit'?seat.x:seat.exitX,z:b.action==='sit'?seat.z:seat.exitZ,seat_id:b.action==='sit'?seat.id:null,moving:false};
  const {error}=await db.from('game_lobby_players').update({...position,updated_at:new Date().toISOString()}).eq('user_id',actor);
  return NextResponse.json(error?{error:'Seat occupied'}:{position},{status:error?409:200});
 }
 if(old?.seat_id){await db.from('game_lobby_players').update({updated_at:new Date().toISOString()}).eq('user_id',actor);return NextResponse.json({success:true});}
 if(!lobbyPositionAllowed(b.x,b.z))return NextResponse.json({error:'Invalid position'},{status:400});
 const {error}=await onlineDb().from('game_lobby_players').upsert({user_id:actor,x:b.x,z:b.z,facing:b.facing==='left'?'left':'right',moving:!!b.moving,updated_at:new Date().toISOString()});
 if(error)throw error;return NextResponse.json({success:true});
 }catch{return NextResponse.json({error:'Lobby unavailable'},{status:503});}
}
export async function DELETE(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});
 const actor=await sessionUser();if(!actor)return NextResponse.json({error:'Sign in required'},{status:401});
 const {error}=await onlineDb().from('game_lobby_players').delete().eq('user_id',actor);
 return NextResponse.json({success:!error},{status:error?503:200});
}
