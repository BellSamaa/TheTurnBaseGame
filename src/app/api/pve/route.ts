import {NextResponse} from 'next/server';
import {sessionUser,sameOrigin} from '@/lib/serverAuth';
import {onlineDb} from '@/lib/onlineRuntime';
import {getUserByIdAsync} from '@/lib/serverDb';
import {createPve,advancePve,pveNeedsLoadoutRefresh} from '@/lib/pve';
export async function GET(){const actor=await sessionUser();if(!actor)return NextResponse.json({error:'Đăng nhập để lưu PvE và phần thưởng'},{status:401});const {data,error}=await onlineDb().from('game_pve_runs').select('*').eq('user_id',actor).eq('active',true).order('created_at',{ascending:false}).limit(1).maybeSingle();return NextResponse.json(error?{error:error.message}:{run:data},{status:error?503:200});}
export async function POST(req:Request){
 const actor=await sessionUser();if(!actor||!sameOrigin(req))return NextResponse.json({error:'Vui lòng đăng nhập'},{status:401});
 try{const body=await req.json(),db=onlineDb(),user=await getUserByIdAsync(actor);if(!user)throw Error('Account missing');const hero={id:actor,name:user.username,character:user.avatarConfig,classType:user.selectedClass,weaponId:user.selectedWeapon,isReady:true};
  if(body.move==='start'||body.move==='resume'){
   const {data:existing,error:loadError}=await db.from('game_pve_runs').select('*').eq('user_id',actor).eq('active',true).maybeSingle();if(loadError)throw Error(loadError.message);if(existing){
    if(pveNeedsLoadoutRefresh(existing.state,hero)){
      const {data,error}=await db.rpc('game_save_pve',{p_actor:actor,p_run:existing.id,p_revision:existing.revision,p_state:createPve(hero,existing.state.stage)});
      if(error)throw Error(error.message);
      return NextResponse.json({run:data,loadoutSynced:true});
    }
    return NextResponse.json({run:existing});
   }
   if(body.move==='resume')return NextResponse.json({run:null});
   const {data,error}=await db.from('game_pve_runs').insert({user_id:actor,state:createPve(hero)}).select('*').single();if(error)throw Error(error.message);return NextResponse.json({run:data});
  }
  const {data:run,error}=await db.from('game_pve_runs').select('*').eq('id',body.id).eq('user_id',actor).single();if(error)throw Error(error.message);if(!run.active){if(body.move==='rest'&&run.state.combat.winner===actor)return NextResponse.json({run:null,rested:true});return NextResponse.json({error:'This run has ended. Start a new run.'},{status:409});}if(run.revision!==body.revision)return NextResponse.json({run,error:'State updated; please try again.'},{status:409});
  if(body.move==='surrender'||body.move==='rest'){
   if(body.move==='rest'&&run.state.combat.winner!==actor)throw Error('Clear the floor before claiming and resting.');
   const {data:cleared,error:clear}=await db.from('game_pve_runs').update({active:false,revision:run.revision+1}).eq('id',run.id).eq('user_id',actor).eq('revision',run.revision).select('id');
   if(!cleared?.length&&!clear)return NextResponse.json({error:'State updated; please try again.'},{status:409});
   if(clear)throw Error(clear.message);return NextResponse.json(body.move==='rest'?{run:null,rested:true}:{run:null,abandoned:true});
  }
  if(Date.now()<(run.state.combat.animationUntil??0))return NextResponse.json({run,error:'Animation is playing; wait for it to finish.'},{status:409});
  const frames:import('@/lib/pve').PveState[]=[];
  let next;if(body.move==='next'){if(run.state.combat.winner!==actor)throw Error('Cần thắng tầng này');next=createPve(hero,run.state.stage+1);}else next=advancePve(run.state,actor,body.move,body.args,frame=>{if(frames.at(-1)?.combat.revision!==frame.combat.revision)frames.push(frame);});
  const {data,error:save}=await db.rpc('game_save_pve',{p_actor:actor,p_run:run.id,p_revision:run.revision,p_state:next});if(save)throw Error(save.message);return NextResponse.json({run:data,frames});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Server error'},{status:400});}
}
