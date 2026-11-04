'use client';
import {tx,phaseLabel} from '@/lib/uiLocale';
import {useRef} from 'react';
import CombatArena from './CombatArena';
import CombatSkills from './CombatSkills';
import RankResult from './RankResult';
import { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import {BuffCard,BuffDraw} from './BuffCard';
import {LMS_BUFFS,LMS_BUFF_HELP} from '@/lib/lmsBuffs';
import type { LmsState } from '@/lib/lms';
import { skillPresentation } from '@/lib/skillPresentation';

export default function LmsBattle(){
  const {battleState,onlineRoomCode,currentUser,setBattleState,setPage}=useGameStore();
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[target,setTarget]=useState(''),[form,setForm]=useState(3),[meteor,setMeteor]=useState(20),[voidForm,setVoidForm]=useState(1),[lock,setLock]=useState<1|2>(1),[clock,setClock]=useState(Date.now()),[buffChoice,setBuffChoice]=useState('attack'),[trade,setTrade]=useState('1'),[buffSlot,setBuffSlot]=useState<'initial'|'bonus'>('initial');
  const actionLock=useRef(false);
  const s=battleState?.lms;
  useEffect(()=>{let active=true;const t=setInterval(async()=>{setClock(Date.now());try{const r=await fetch('/api/rooms/'+onlineRoomCode,{cache:'no-store'});const b=await r.json();if(active&&b.room?.battleState)setBattleState(old=>!old?.lms||(b.room.battleState.lms?.revision??-1)>=old.lms.revision?b.room.battleState:old);}catch{}},700);return()=>{active=false;clearInterval(t);};},[onlineRoomCode,setBattleState]);
  useEffect(()=>{if(!s?.winner)return;fetch('/api/auth/profile',{cache:'no-store'}).then(r=>r.json()).then(b=>{if(b.user)useGameStore.setState(st=>({currentUser:b.user,profile:{...st.profile,rank:b.user.rankPoints,tier:b.user.tier,wins:b.user.wins,losses:b.user.losses}}));}).catch(()=>{});},[s?.winner]);
  if(!s)return null;
  const me=s.players.find(p=>p.id===currentUser?.id),attacker=s.players.find(p=>p.id===s.order[s.active])!,mine=me?.id===attacker.id;
  const myBuff=me?(buffSlot==='bonus'?s.extras?.bonusBuffs?.[me.id]:s.extras?.buffs[me.id]):undefined;
  const victim=s.players.find(p=>p.id===s.target);
  async function act(move:string,args:Record<string,unknown>={}){if(actionLock.current)return;actionLock.current=true;setBusy(true);setError('');try{const r=await fetch('/api/rooms/'+onlineRoomCode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'lms_action',move,args,expectedRevision:s!.revision})});const b=await r.json();if(b.room?.battleState)setBattleState(old=>!old?.lms||(b.room.battleState.lms?.revision??-1)>=old.lms.revision?b.room.battleState:old);if(!r.ok)throw Error(tx(b.error));}catch(e){setError(e instanceof Error?e.message:tx("Mất kết nối"));}finally{actionLock.current=false;setBusy(false);}}
  const button=(text:string,move:string,enabled:boolean,args:Record<string,unknown>={})=><button aria-label={text} disabled={busy||!enabled} className={'lms-action '+(enabled?'action-beacon':'')} onClick={()=>act(move,args)}>{['charge','target','attack','defend','end'].includes(move)?<img className="command-sprite" src={'/assets/sprites/ui/frames/'+(move==='end'?'btn_end_turn':'btn_roll_dice')+'.png'} alt=""/>:text}</button>;
  const choices=s.players.filter(p=>p.id!==me?.id&&p.hp>0);
  const chosen=choices.some(p=>p.id===target)?target:choices[0]?.id;
  return <div className="lms-screen"><RankResult battleId={battleState!.id} winner={s.winner} mode={battleState!.mode}/>
    {me&&s.round===1&&<BuffDraw id={s.extras?.buffs[me.id]?.id??-1} battleId={battleState!.id} userId={me.id}/>}
    {me&&me.hp>0&&s.extras?.bonusBuffs?.[me.id]&&<BuffDraw key={battleState!.id+':bonus'} id={s.extras.bonusBuffs[me.id].id} battleId={battleState!.id+':round30'} userId={me.id}/>}
    <CombatArena state={s} viewer={me?.id} title={'LAST MAN STANDING · #'+onlineRoomCode} busy={busy} buffs onSurrender={()=>{if(window.confirm(useGameStore.getState().settings.language==='en'?'Surrender this match?':'Đầu hàng trận này?'))act('surrender');}}>
    <footer className="lms-controls"><div role="status">{error|| (s.winner?s.winner==='draw'?tx("HÒA: không còn người sống"):tx("CHIẾN THẮNG: ")+s.players.find(p=>p.id===s.winner)?.name:mine?tx("Lượt của bạn"):s.phase==='defense'&&victim?.id===me?.id?tx("Bạn cần tung phòng thủ"):tx("Đang chờ ")+attacker.name)}</div>
      {me&&s.extras&&<details className="lms-buff"><summary>{tx("BUFF CỦA BẠN ·") + " "}{tx(LMS_BUFFS[myBuff?.id??-1])??tx("Ẩn")} · {myBuff?.used?tx("ĐÃ DÙNG"):tx("CHƯA LẬT")}</summary>
        <select aria-label={tx("Chọn lá buff")} value={buffSlot} onChange={e=>setBuffSlot(e.target.value as 'initial'|'bonus')}><option value="initial">{tx("Buff đầu trận")}</option>{s.extras.bonusBuffs?.[me.id]&&<option value="bonus">{tx("Buff vòng 30")}</option>}</select><p>{tx(LMS_BUFF_HELP[myBuff?.id??-1])}</p><p>{tx("Chọn mục tiêu bên dưới nếu buff yêu cầu. Mỗi buff dùng một lần; server kiểm tra điều kiện lúc bấm.")}</p>
        <select aria-label={tx("Mục tiêu buff")} value={chosen} onChange={e=>setTarget(e.target.value)}>{choices.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select aria-label={tx("Tùy chọn buff")} value={buffChoice} onChange={e=>setBuffChoice(e.target.value)}><option value="attack">{tx("D20 Công / đổi PTS thành HP")}</option><option value="defense">{tx("D20 Thủ")}</option><option value="hp">{tx("Đổi HP thành PTS")}</option></select>
        {buffChoice==='hp'&&<input type="number" min="1" value={trade} onChange={e=>setTrade(e.target.value)} aria-label={tx("PTS muốn mua")} className="bg-slate-900 p-2"/>}
        {button(tx("LẬT BUFF"),'buff',!!myBuff&&!myBuff.used&&me.hp>0,{target:buffChoice==='hp'?trade:chosen,choice:buffChoice,buffSlot})}
        <span>{tx("Vòng bo từ vòng") + " "}{s.extras.suddenRound}{" " + tx(". Buff người khác:") + " "}{s.players.filter(p=>p.id!==me.id).map(p=>p.name+': '+(s.extras!.buffs[p.id]?.revealed?tx(LMS_BUFFS[s.extras!.buffs[p.id].id]):tx("ÚP"))).join(' · ')}</span>
      </details>}
      {mine&&s.phase==='target'&&<select aria-label={tx('Mục tiêu')} value={chosen} onChange={e=>setTarget(e.target.value)}>{choices.map(p=><option key={p.id} value={p.id}>{p.name} · {p.hp} HP</option>)}</select>}
      <div className="four-commands">
      {button(s.phase==='charge'?tx('TUNG D6 ')+(s.rolls.length+1)+'/'+(me?.classType==='mage'?2:1):s.phase==='defense'?tx('TUNG D20 THỦ'):s.phase==='target'?tx('CHỌN MỤC TIÊU'):tx('TUNG D20 CÔNG'),s.phase==='charge'?'charge':s.phase==='defense'?'defend':s.phase==='target'?'target':'attack',!s.winner&&(s.phase==='defense'?victim?.id===me?.id:mine&&['charge','target','attack'].includes(s.phase)),{target:chosen})}
      {button(tx('KẾT THÚC LƯỢT'),'end',mine&&s.phase==='end')}
      {me&&<CombatSkills player={me} round={s.round} busy={busy} enabled={mine&&['target','attack'].includes(s.phase)} onCast={args=>act('skill',{...args,target:chosen})}/>}
      </div>
      {s.phase==='clash'&&<div className="clash-controls">{button(tx('+1 CÔNG · 3 PTS'),'clash',(me?.hp??0)>0,{delta:1})}{button(tx('−1 CÔNG · 3 PTS'),'clash',(me?.hp??0)>0,{delta:-1})}{button(tx('TÍNH SÁT THƯƠNG'),'resolve',clock>=(s.deadline??Infinity))}</div>}
      {s.winner&&<button className="lms-action" onClick={async()=>{const r=await fetch('/api/rooms/'+onlineRoomCode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'return_lobby',userId:me?.id})});if(r.ok)setPage('play');}}>{tx("VỀ PHÒNG")}</button>}
      <details className="combat-log"><summary>{tx("Nhật ký trận")}</summary>{(useGameStore.getState().settings.language==='vi'?(s.logVi||s.log):s.log).slice(0,30).map((l,i)=><p key={i}>{tx(l)}</p>)}</details>
    </footer>
    </CombatArena>
  </div>;
}
