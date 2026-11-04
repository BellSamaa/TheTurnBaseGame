import {createClient} from '@supabase/supabase-js';
import {getUserByIdAsync,createRankedBattleState} from './serverDb';
export function onlineDb(){
 const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error('Cần cấu hình Supabase service role trên server');
 return createClient(url,key,{auth:{persistSession:false}});
}
export async function persistentMatch(actor:string,action:string){
 const user=await getUserByIdAsync(actor);if(!user)throw Error('Account missing');
 const participant={id:user.id,name:user.username,character:user.avatarConfig,classType:user.selectedClass,weaponId:user.selectedWeapon,isReady:true};
 const battle=createRankedBattleState('pending',participant,{...participant,id:'pending'},'castle');
 battle.player1.petRockHp=0;
 const {data,error}=await onlineDb().rpc('game_match',{p_actor:actor,p_action:action,p_payload:{participant,player:battle.player1,battle}});
 if(error)throw Error(error.message+' — hãy chạy sql/20261104-online-runtime.sql');return data;
}
export async function finishRank(code:string){const {error}=await onlineDb().rpc('game_finish_rank',{p_code:code});if(error)throw Error(error.message);}
