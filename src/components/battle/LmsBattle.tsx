'use client';
import {updateSkillReason} from '@/lib/weaponUpdateCast';
import {stageActor} from '@/lib/lmsRound';
import {d6Allowance} from '@/lib/classMechanics';
import {tx,phaseLabel} from '@/lib/uiLocale';
import {useRef} from 'react';
import CombatArena from './CombatArena';
import CombatSkills from './CombatSkills';
import RankResult from './RankResult';
import { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import {BuffCard,BuffDraw} from './BuffCard';
import {LMS_BUFFS,LMS_BUFF_HELP,activateBuff} from '@/lib/lmsBuffs';
import type { LmsState } from '@/lib/lms';
import {ROUND_BUFF_HELP} from '@/lib/lmsRoundBuffs';
import { skillPresentation } from '@/lib/skillPresentation';

export default function LmsBattle(){
  const {battleState,onlineRoomCode,currentUser,setBattleState,setPage}=useGameStore();
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[target,setTarget]=useState(''),[form,setForm]=useState(3),[meteor,setMeteor]=useState(20),[voidForm,setVoidForm]=useState(1),[lock,setLock]=useState<1|2>(1),[clock,setClock]=useState(Date.now()),[buffChoice,setBuffChoice]=useState('attack'),[trade,setTrade]=useState('1'),[buffSlot,setBuffSlot]=useState<'initial'|'bonus'>('initial');
  const [pending,setPending]=useState<{move:string;args:Record<string,unknown>}|null>(null);
  const actionLock=useRef(false);
  const s=battleState?.lms;
  const en=useGameStore(st=>st.settings.language)==='en';
  useEffect(()=>{let active=true;const t=setInterval(async()=>{setClock(Date.now());try{const r=await fetch('/api/rooms/'+onlineRoomCode,{cache:'no-store'});const b=await r.json();if(active&&r.status===404){useGameStore.setState({onlineRoomCode:null,battleState:null,currentPage:'play'});return;}if(active&&b.room?.battleState)setBattleState(old=>!old?.lms||(b.room.battleState.lms?.revision??-1)>=old.lms.revision?b.room.battleState:old);}catch{}},700);return()=>{active=false;clearInterval(t);};},[onlineRoomCode,setBattleState]);
  useEffect(()=>{if(!s?.winner)return;fetch('/api/auth/profile',{cache:'no-store'}).then(r=>r.json()).then(b=>{if(b.user)useGameStore.setState(st=>({currentUser:b.user,profile:{...st.profile,rank:b.user.rankPoints,tier:b.user.tier,wins:b.user.wins,losses:b.user.losses}}));}).catch(()=>{});},[s?.winner]);
  useEffect(()=>{setPending(null);},[s?.phase,s?.active,s?.round,s?.stagePart,s?.stageDone?.join(","),buffSlot]);
  if(!s)return null;
  const me=s.players.find(p=>p.id===currentUser?.id),attacker=s.players.find(p=>p.id===s.order[s.active])!,mine=me?.id===attacker.id;
  const myBuff=me?(buffSlot==='bonus'?s.extras?.bonusBuffs?.[me.id]:s.extras?.buffs[me.id]):undefined;
  const victim=s.players.find(p=>p.id===s.target);
  async function act(move:string,args:Record<string,unknown>={}){
    if(actionLock.current)return;actionLock.current=true;setBusy(true);setError('');
    try{
      let revision=s!.revision;const requestId=crypto.randomUUID();
      for(let attempt=0;attempt<4;attempt++){
        const r=await fetch('/api/rooms/'+onlineRoomCode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'lms_action',move,args,requestId,expectedRevision:revision})});
        const b=await r.json();
        if(b.room?.battleState)setBattleState(old=>!old?.lms||(b.room.battleState.lms?.revision??-1)>=old.lms.revision?b.room.battleState:old);
        if(r.ok)return;
        if(['initiative','ready_opening','end'].includes(move)&&attempt<3&&(r.status===409||b.error==='Room changed; retry after synchronization')){
          const fresh=await fetch('/api/rooms/'+onlineRoomCode,{cache:'no-store'}).then(r=>r.json());
          const state=fresh.room?.battleState;
          if(!state?.lms)throw Error(tx(b.error));
          setBattleState(old=>!old?.lms||state.lms.revision>=old.lms.revision?state:old);
          if(state.lms.acceptedActions?.includes(requestId))return;
          if(move==='initiative'&&state.lms.initiative?.some((r:{id:string})=>r.id===currentUser?.id))return;
          revision=state.lms.revision;continue;
        }
        throw Error(tx(b.error));
      }
    }catch(e){setError(e instanceof Error?e.message:tx('Mất kết nối'));}finally{actionLock.current=false;setBusy(false);}
  }
  const button=(text:string,move:string,enabled:boolean,args:Record<string,unknown>={})=><button aria-label={text} disabled={busy||!enabled} className={'lms-action '+(enabled?'action-beacon':'')} onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');if(move==='target'){setPending({move,args:{}});return;}if(move==='buff'&&[2,5,7,8,10,13].includes(myBuff?.id??-1)){setPending({move,args});return;}act(move,args);}}>{['initiative','charge','target','attack','defend','end'].includes(move)?<img className="command-sprite" src={'/assets/sprites/ui/frames/'+(move==='end'?'btn_end_turn':'btn_roll_dice')+'.png'} alt=""/>:text}</button>;
  const choices=s.players.filter(p=>p.id!==me?.id&&p.hp>0);
  const ordered=['skills','buffs'].includes(s.phase)&&s.turnFlow===3;
  const myStageTurn=!ordered||stageActor(s)===me?.id;
  const chosen=choices.some(p=>p.id===target)?target:choices[0]?.id;
  let buffReason='';
  if(me&&myBuff&&!myBuff.used){try{const candidates=[2,8,10,13].includes(myBuff.id)?choices.map(p=>p.id):[buffChoice==='hp'?trade:chosen];let valid=false,lastError:unknown;for(const candidate of candidates){try{activateBuff(structuredClone(s),me.id,{target:candidate,choice:buffChoice,buffSlot});valid=true;break;}catch(e){lastError=e;}}if(!valid)throw lastError||Error('Chọn đối thủ hợp lệ');}catch(e){buffReason=tx((e as Error).message);}}
  const picking=pending||(!s.winner&&mine&&s.phase==='target'?{move:'target',args:{}}:null);
  const targetIds=picking&&me&&me.hp>0?choices.filter(p=>(picking.move!=='skill'||!updateSkillReason(me,p,picking.args.slot as 1|2,picking.args.form as number|undefined,s.round))&&(picking.move!=='buff'||(myBuff?.id!==2||p.id!==attacker.id)&&(myBuff?.id!==8||p.hp<30))).map(p=>p.id):[];
  const pickTarget=(id:string)=>{if(!picking||!targetIds.includes(id))return;setTarget(id);const move=picking;setPending(null);void act(move.move,{...move.args,target:id});};
  const canUseBuff=!!me&&me.hp>0&&myStageTurn&&!!myBuff&&!myBuff.used&&!buffReason&&s.phase!=='initiative'&&!(s.turnFlow===3&&s.phase==='buffs'&&s.stageDone?.includes(me.id));
  const buffPanel=me&&s.extras&&<details className={"lms-buff personal-buff-panel"+(canUseBuff?" buff-ready":"")+(myBuff?.used?" buff-used":"")}><summary><img src={"/assets/progression/buff-"+(myBuff?.id??0)+".webp"} alt=""/><span>{tx("BUFF CỦA BẠN ·") + " "}{tx(LMS_BUFFS[myBuff?.id??-1])||tx("Ẩn")} · {myBuff?.used?tx("ĐÃ DÙNG"):tx("CHƯA LẬT")}</span><i aria-hidden="true">✦</i></summary>
        <select aria-label={tx("Chọn lá buff")} value={buffSlot} onChange={e=>setBuffSlot(e.target.value as 'initial'|'bonus')}><option value="initial">{tx("Buff đầu trận")}</option>{s.extras.bonusBuffs?.[me.id]&&<option value="bonus">{tx("Buff vòng 30")}</option>}</select><p>{tx((s.turnFlow===3?ROUND_BUFF_HELP:LMS_BUFF_HELP)[myBuff?.id??-1])}</p><p>{en?'Reveal the card, then click a glowing opponent if a target is required.':'Lật thẻ rồi bấm vào đối thủ sáng nếu lá bài cần mục tiêu.'}</p>
        {[12,15].includes(myBuff?.id??-1)&&<select aria-label={tx("Tùy chọn buff")} value={buffChoice} onChange={e=>setBuffChoice(e.target.value)}><option value="attack">{tx("D20 Công / đổi PTS thành HP")}</option><option value="defense">{tx("D20 Thủ")}</option><option value="hp">{tx("Đổi HP thành PTS")}</option></select>}
        {buffChoice==='hp'&&<input type="number" min="1" value={trade} onChange={e=>setTrade(e.target.value)} aria-label={tx("PTS muốn mua")} className="bg-slate-900 p-2"/>}
        {button(tx("LẬT BUFF"),'buff',canUseBuff,{target:buffChoice==='hp'?trade:chosen,choice:buffChoice,buffSlot})}
        {buffReason&&<p className="buff-condition">{en?'Condition: ':'Điều kiện: '}{buffReason}</p>}
        <span>{tx("Vòng bo từ vòng") + " "}{s.extras.suddenRound}{" " + tx(". Buff người khác:") + " "}{s.players.filter(p=>p.id!==me.id).map(p=>p.name+': '+(s.extras!.buffs[p.id]?.revealed?tx(LMS_BUFFS[s.extras!.buffs[p.id].id]):tx("ÚP"))).join(' · ')}</span>
      </details>;
  return <div className="lms-screen"><RankResult battleId={battleState!.id} winner={s.winner} mode={battleState!.mode}/>
    {me&&s.round===1&&<BuffDraw id={s.extras?.buffs[me.id]?.id??-1} battleId={battleState!.id} userId={me.id} onReady={()=>{if(s.phase==='initiative'&&!s.openingReady?.includes(me.id))void act('ready_opening');}}/>}
    {me&&me.hp>0&&s.extras?.bonusBuffs?.[me.id]&&<BuffDraw key={battleState!.id+':bonus'} id={s.extras.bonusBuffs[me.id].id} battleId={battleState!.id+':round30'} userId={me.id}/>}
    <CombatArena state={s} viewer={me?.id} onTiming={()=>void act('timing')} title={(en?'LAST MAN STANDING · #':'SINH TỒN · #')+onlineRoomCode} busy={busy} buffs diceExtras={buffPanel} targetIds={targetIds} onPickTarget={pickTarget} targetPrompt={picking?(en?'Choose a glowing opponent on the battlefield':'Bấm vào đối thủ đang sáng trên sân đấu'):undefined} onSurrender={()=>{if(window.confirm(useGameStore.getState().settings.language==='en'?'Surrender this match?':'Đầu hàng trận này?'))act('surrender');}}>
    <footer className="lms-controls"><div role="status">{error|| (ordered?(!myStageTurn?(s.stageDone?.includes(me?.id||'')?(en?'Done · waiting for others':'Đã xong · chờ mọi người'):(en?'Waiting for ':'Đang chờ ')+s.players.find(p=>p.id===stageActor(s))?.name):s.phase==='buffs'?(en?'Use your Buff or End Turn':'Dùng Buff hoặc Kết thúc lượt'):s.stagePart==='charge'?(en?'Roll D6 to charge your skills':'Tung D6 để sạc kỹ năng'):(en?'Use a skill or End Turn':'Dùng skill hoặc Kết thúc lượt')):s.winner?s.winner==='draw'?tx("HÒA: không còn người sống"):tx("CHIẾN THẮNG: ")+s.players.find(p=>p.id===s.winner)?.name:s.phase==='initiative'?(s.initiative?.some(r=>r.id===me?.id)?(en?'Rolled · waiting for everyone':'Đã tung · chờ mọi người'):(en?'Everyone rolls D20 this round':'Mỗi người tung D20 một lần trong round')):s.phase==='skills'&&(s.turnFlow===3||mine||victim?.id===me?.id)?(s.skillDone?.includes(me?.id||'')?tx("Đang chờ "):useGameStore.getState().settings.language==='en'?'Use skills or End Turn':'Dùng kỹ năng hoặc Kết thúc lượt'):s.phase==='charge_defense'&&victim?.id===me?.id?(useGameStore.getState().settings.language==='en'?'Roll D6 · Defender':'Tung D6 · Bên thủ'):s.phase==='end'?(s.turnFlow===3?(en?'Everyone confirms End Turn · automatic next round after 30s':'Tất cả bấm End Turn · tự sang round sau 30 giây'):(en?'End window: reveal eligible cards; attacker confirms End Turn':'Cuối lượt: lật bài đủ điều kiện; người công bấm Kết thúc lượt')):mine?tx("Lượt của bạn"):s.phase==='defense'&&victim?.id===me?.id?tx("Bạn cần tung phòng thủ"):tx("Đang chờ ")+attacker.name)}</div>
      {pending&&<button className="lms-action" onClick={()=>setPending(null)}>{en?'Cancel selection':'Hủy chọn'}</button>}
      <div className="four-commands">
      {s.turnFlow===3?(s.phase==='initiative'?button(en?'ROLL D20':'TUNG D20','initiative',!!me&&me.hp>0&&!s.initiative?.some(r=>r.id===me.id)):s.phase==='skills'?button(en?'ROLL D6':'TUNG D6','charge',myStageTurn&&s.stagePart==='charge'&&!!me&&me.hp>0&&!s.stageDone?.includes(me.id)&&(s.roundCharges?.[me.id]?.length||0)<d6Allowance(me,s.round)):button(s.phase==='defense'?tx('TUNG D20 THỦ'):tx('CHỌN MỤC TIÊU'),s.phase==='defense'?'defend':'target',s.phase==='defense'?victim?.id===me?.id:mine&&s.phase==='target',{target:chosen})):s.phase==='initiative'?button(en?'ROLL OPENING D20':'TUNG D20 KHỞI ĐẦU','initiative',!!me&&me.hp>0&&!s.initiative?.some(r=>r.id===me.id)):button(['charge','charge_defense'].includes(s.phase)?tx('TUNG D6 ')+((s.phase==='charge_defense'?(s.defenderRolls||[]):s.rolls).length+1)+'/'+(me?d6Allowance(me,s.round):1):s.phase==='defense'?tx('TUNG D20 THỦ'):s.phase==='target'?tx('CHỌN MỤC TIÊU'):tx('TUNG D20 CÔNG'),['charge','charge_defense'].includes(s.phase)?'charge':s.phase==='defense'?'defend':s.phase==='target'?'target':'attack',!s.winner&&(['defense','charge_defense'].includes(s.phase)?victim?.id===me?.id:mine&&['charge','target','attack'].includes(s.phase)),{target:chosen})}
      {s.turnFlow===3?button(tx('KẾT THÚC LƯỢT'),'end',myStageTurn&&!!me&&me.hp>0&&(['skills','buffs'].includes(s.phase)?!s.stageDone?.includes(me.id):s.phase==='end'&&!s.endVotes?.includes(me.id))):button(tx('KẾT THÚC LƯỢT'),'end',(mine&&s.phase==='end')||(s.phase==='skills'&&(mine||victim?.id===me?.id)&&!s.skillDone?.includes(me?.id||'')))}
      {me&&<CombatSkills players={s.players} player={me} round={s.round} busy={busy} enabled={s.phase==='skills'&&(s.turnFlow===3?(myStageTurn&&s.stagePart==='skill'&&me.hp>0&&!s.stageDone?.includes(me.id)&&(s.roundCharges?.[me.id]?.length||0)>=d6Allowance(me,s.round)):(mine||victim?.id===me?.id)&&!s.skillDone?.includes(me?.id||''))} onCast={args=>{const art=skillPresentation(me,args.slot as 1|2,args.form as number|undefined);if(art.target==='caster'||s.turnFlow===3&&args.slot===1){void act('skill',{...args,target:chosen});return;}setPending({move:'skill',args});}}/>}
      </div>
      {ordered&&<p className="ordered-turn-label">{s.phase==='skills'&&s.stagePart==='charge'?(en?'CHARGE D6':'SẠC D6'):s.phase==='skills'?(en?'USE SKILL':'DÙNG SKILL'):(en?'USE BUFF':'DÙNG BUFF')} · {s.players.find(p=>p.id===stageActor(s))?.name} · {(s.stageOrder||s.order).filter(id=>s.players.some(p=>p.id===id&&p.hp>0)).map(id=>s.players.find(p=>p.id===id)?.name).join(' → ')}</p>}
      {s.turnFlow===3&&<p className="round-flow-help">{en?'Charge all → Skills → Buffs · 20s/player. End Turn to skip.':'Sạc cả bàn → Skill → Buff · 20s/người. End Turn để bỏ qua.'}{['skills','buffs','end'].includes(s.phase)&&<b> · {Math.max(0,Math.ceil(((s.phase==='end'?s.endDeadline||0:s.stageDeadline||0)-clock)/1000))}s · {(s.phase==='end'?s.endVotes:s.stageDone)?.length||0}/{s.players.filter(p=>p.hp>0).length}</b>}</p>}
      {s.rollDeadline&&['initiative','attack','defense','charge','charge_defense'].includes(s.phase)&&<div className="auto-roll-countdown">{en?'Auto-roll in ':'Tự tung sau '}{Math.max(0,Math.ceil((s.rollDeadline-clock)/1000))}s</div>}

      {s.winner&&<button className="lms-action" onClick={async()=>{const r=await fetch('/api/rooms/'+onlineRoomCode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'return_lobby',userId:me?.id})});if(r.ok)setPage('play');}}>{tx("VỀ PHÒNG")}</button>}
    </footer>
    </CombatArena>
  </div>;
}
