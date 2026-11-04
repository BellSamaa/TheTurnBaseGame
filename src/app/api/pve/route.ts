import {NextResponse} from 'next/server';
import {sessionUser,sameOrigin} from '@/lib/serverAuth';
import {onlineDb} from '@/lib/onlineRuntime';
import {getUserByIdAsync} from '@/lib/serverDb';
import {createPve,advancePve} from '@/lib/pve';
export async function GET(){const actor=await sessionUser();if(!actor)return NextResponse.json({error:'Đăng nhập để lưu PvE và phần thưởng'},{status:401});const {data,error}=await onlineDb().from('game_pve_runs').select('*').eq('user_id',actor).order('created_at',{ascending:false}).limit(1).maybeSingle();return NextResponse.json(error?{error:error.message}:{run:data},{status:error?503:200});}
export async function POST(req:Request){
 const actor=await sessionUser();if(!actor||!sameOrigin(req))return NextResponse.json({error:'Vui lòng đăng nhập'},{status:401});
 try{const body=await req.json(),db=onlineDb(),user=await getUserByIdAsync(actor);if(!user)throw Error('Account missing');const hero={id:actor,name:user.username,character:user.avatarConfig,classType:user.selectedClass,weaponId:user.selectedWeapon,isReady:true};
  if(body.move==='start'){
   const {data:existing}=await db.from('game_pve_runs').select('*').eq('user_id',actor).eq('active',true).maybeSingle();if(existing)return NextResponse.json({run:existing});
   const {data,error}=await db.from('game_pve_runs').insert({user_id:actor,state:createPve(hero)}).select('*').single();if(error)throw Error(error.message);return NextResponse.json({run:data});
  }
  const {data:run,error}=await db.from('game_pve_runs').select('*').eq('id',body.id).eq('user_id',actor).single();if(error)throw Error(error.message);if(run.revision!==body.revision)throw Error('Trận đã cập nhật, tải lại để tiếp tục');
  let next;if(body.move==='next'){if(run.state.combat.winner!==actor)throw Error('Cần thắng tầng này');next=createPve(hero,run.state.stage+1);}else next=advancePve(run.state,actor,body.move,body.args);
  const {data,error:save}=await db.rpc('game_save_pve',{p_actor:actor,p_run:run.id,p_revision:run.revision,p_state:next});if(save)throw Error(save.message);return NextResponse.json({run:data});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Server error'},{status:400});}
}
