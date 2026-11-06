import {NextResponse} from 'next/server';
import {randomInt} from 'node:crypto';
import {sessionUser,sameOrigin} from '@/lib/serverAuth';
import {onlineDb} from '@/lib/onlineRuntime';
import {getUserByIdAsync} from '@/lib/serverDb';
import {createDungeon,dungeonAction,makePlayer,tickDungeon,type DungeonState} from '@/lib/dungeon';

async function run(req:Request){
  const actor=await sessionUser();
  if(!actor)return NextResponse.json({error:'Sign in required'},{status:401});
  if(req.method==='POST'&&!sameOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});
  try{
    const body=req.method==='POST'?await req.json():Object.fromEntries(new URL(req.url).searchParams);
    const db=onlineDb();
    if(req.method==='GET'&&body.action==='browse'){
      const {data,error}=await db.from('game_dungeons').select('code,state,updated_at').eq('state->>phase','room').gte('updated_at',new Date(Date.now()-6*3600000).toISOString()).order('updated_at',{ascending:false}).limit(50);
      if(error)throw Error(error.message);
      return NextResponse.json({rooms:(data||[]).filter(r=>r.state.players.length<4).map(r=>({code:r.code,host:r.state.players.find((p:{id:string})=>p.id===r.state.host)?.name||'Host',count:r.state.players.length}))});
    }
    if(body.action==='create'||body.action==='join'){
      const user=await getUserByIdAsync(actor);
      if(!user)throw Error('Account not found.');
      const participant={id:actor,name:user.username,character:user.avatarConfig,classType:user.selectedClass,weaponId:user.selectedWeapon,isReady:true};
      if(body.action==='create'){
        for(let attempt=0;attempt<5;attempt++){
          const state=createDungeon(participant),code='D'+randomInt(100000,1000000);
          const {data,error}=await db.from('game_dungeons').insert({code,state:{...state,runId:crypto.randomUUID()}}).select().single();
          if(!error)return NextResponse.json({room:data});
          if(error.code!=='23505')throw Error(error.message);
        }
        throw Error('Could not reserve a room code.');
      }
    }
    const code=String(body.code||'').trim().toUpperCase();
    const {data:room,error}=await db.from('game_dungeons').select().eq('code',code).single();
    if(error)return NextResponse.json({error:error.code==='PGRST116'?'Dungeon closed.':'Dungeon unavailable. Run sql/20261106-dungeon.sql if needed.'},{status:error.code==='PGRST116'?404:503});
    let state=room.state as DungeonState;
    const requestKey=typeof body.requestId==='string'?actor+':'+body.requestId.slice(0,64):undefined;
    if(requestKey&&state.requests?.includes(requestKey))return NextResponse.json({room});
    if(body.action==='join'){
      if(state.players.some(p=>p.id===actor))return NextResponse.json({room});
      if(state.phase!=='room'||state.players.length>=4)throw Error('Room full or already started.');
      const user=await getUserByIdAsync(actor);
      if(!user)throw Error('Account missing.');
      state=structuredClone(state);
      state.players.push(makePlayer({id:actor,name:user.username,character:user.avatarConfig,classType:user.selectedClass,weaponId:user.selectedWeapon,isReady:true}));
    }else{
      if(!state.players.some(p=>p.id===actor))return NextResponse.json({error:'Not a participant'},{status:403});
      if(body.action==='leave'){
        const next=structuredClone(state);
        next.players=next.players.filter(p=>p.id!==actor);
        if(!next.players.length||['victory','defeat'].includes(next.phase)){
          const {error:removed}=await db.from('game_dungeons').delete().eq('code',code).eq('revision',room.revision);
          if(removed)throw Error(removed.message);
          return NextResponse.json({left:true});
        }
        if(next.host===actor)next.host=next.players[0].id;
        delete next.positions[actor];next.votes=next.votes.filter(id=>id!==actor);
        state=next;
      }else if(req.method==='POST'){
        if(body.revision!==room.revision)return NextResponse.json({room,error:'State updated; retry.'},{status:409});
        if(Date.now()<(state.animationUntil??0)&&!['move','shop','equip','ready'].includes(body.action))return NextResponse.json({room,error:'Animation is playing; wait for it to finish.'},{status:409});
        state=dungeonAction(state,actor,String(body.action),body.args||{});
      }
      if(Date.now()>=(state.animationUntil??0))state=tickDungeon(state);
    }
    if(state!==room.state&&Date.now()<(state.animationUntil??0)&&['attack','defense','charge','skills','end'].includes(state.phase))state.deadline=Math.max(state.deadline||0,state.animationUntil!+20000);
    if(state===room.state)return NextResponse.json({room});
    if(requestKey){state.requests=[...(state.requests||[]),requestKey].slice(-128);}
    const {data,error:save}=await db.rpc('game_save_dungeon',{p_code:code,p_revision:room.revision,p_state:state});
    if(save){
      const {data:fresh}=await db.from('game_dungeons').select().eq('code',code).single();
      return NextResponse.json({room:fresh,error:save.message},{status:409});
    }
    return NextResponse.json({room:data});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Dungeon unavailable'},{status:400});}
}
export const GET=run;
export const POST=run;
