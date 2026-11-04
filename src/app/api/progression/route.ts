import {NextResponse} from 'next/server';
import {sessionUser,sameOrigin} from '@/lib/serverAuth';
import {onlineDb} from '@/lib/onlineRuntime';
async function handle(req:Request){
 const actor=await sessionUser();if(!actor)return NextResponse.json({error:'Vui lòng đăng nhập'},{status:401});
 if(req.method==='POST'&&!sameOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});
 try{const b=req.method==='POST'?await req.json():{};const {data,error}=await onlineDb().rpc('game_progress',{p_actor:actor,p_action:b.action||'get',p_rank:b.rank??0});if(error)throw Error(error.message);
 const battleId=new URL(req.url).searchParams.get('battle');
 if(battleId){const db=onlineDb();const [{data:result},{data:reward}]=await Promise.all([db.from('game_rank_results').select('battle_id,changes').eq('battle_id',battleId).maybeSingle(),db.from('game_reward_ledger').select('gems,rubies,exp').eq('user_id',actor).eq('event_key','match:'+battleId).maybeSingle()]);if(result&&result.changes?.[actor]!==undefined)data.result={id:battleId,delta:result.changes[actor],after:data.rankPoints,before:data.rankPoints-result.changes[actor],reward};}
 return NextResponse.json(data,{headers:{'Cache-Control':'no-store'}});}catch(e){return NextResponse.json({error:(e instanceof Error?e.message:'Server error')+' · Cần chạy migration progression-pve'},{status:400});}
}
export const GET=handle;export const POST=handle;
