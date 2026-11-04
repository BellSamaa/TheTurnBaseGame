'use client';
import { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import {LMS_BUFFS,LMS_BUFF_HELP} from '@/lib/lmsBuffs';
import type { LmsState } from '@/lib/lms';
import { skillPresentation } from '@/lib/skillPresentation';

export default function LmsBattle(){
  const {battleState,onlineRoomCode,currentUser,setBattleState,setPage}=useGameStore();
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[target,setTarget]=useState(''),[form,setForm]=useState(3),[meteor,setMeteor]=useState(20),[voidForm,setVoidForm]=useState(1),[lock,setLock]=useState<1|2>(1),[clock,setClock]=useState(Date.now()),[buffChoice,setBuffChoice]=useState('attack'),[trade,setTrade]=useState('1');
  const s=battleState?.lms;
  useEffect(()=>{let active=true;const t=setInterval(async()=>{setClock(Date.now());try{const r=await fetch('/api/rooms/'+onlineRoomCode,{cache:'no-store'});const b=await r.json();if(active&&b.room?.battleState)setBattleState(old=>!old?.lms||(b.room.battleState.lms?.revision??-1)>=old.lms.revision?b.room.battleState:old);}catch{}},700);return()=>{active=false;clearInterval(t);};},[onlineRoomCode,setBattleState]);
  useEffect(()=>{if(!s?.winner)return;fetch('/api/auth/profile',{cache:'no-store'}).then(r=>r.json()).then(b=>{if(b.user)useGameStore.setState(st=>({currentUser:b.user,profile:{...st.profile,rank:b.user.rankPoints,tier:b.user.tier,wins:b.user.wins,losses:b.user.losses}}));}).catch(()=>{});},[s?.winner]);
  if(!s)return null;
  const me=s.players.find(p=>p.id===currentUser?.id),attacker=s.players.find(p=>p.id===s.order[s.active])!,mine=me?.id===attacker.id;
  const victim=s.players.find(p=>p.id===s.target);
  async function act(move:string,args:Record<string,unknown>={}){if(busy)return;setBusy(true);setError('');try{const r=await fetch('/api/rooms/'+onlineRoomCode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'lms_action',move,args,expectedRevision:s!.revision})});const b=await r.json();if(b.room?.battleState)setBattleState(old=>!old?.lms||(b.room.battleState.lms?.revision??-1)>=old.lms.revision?b.room.battleState:old);if(!r.ok)throw Error(b.error);}catch(e){setError(e instanceof Error?e.message:'Mất kết nối');}finally{setBusy(false);}}
  const button=(text:string,move:string,enabled:boolean,args:Record<string,unknown>={})=><button disabled={busy||!enabled} className={'lms-action '+(enabled?'action-beacon':'')} onClick={()=>act(move,args)}>{text}</button>;
  const choices=s.players.filter(p=>p.id!==me?.id&&p.hp>0);
  const chosen=choices.some(p=>p.id===target)?target:choices[0]?.id;
  return <div className="lms-screen">
    <header><strong>LAST MAN STANDING · VÒNG {s.round}</strong><span>PHÒNG {onlineRoomCode} · {s.players.filter(p=>p.hp>0).length} người sống</span></header>
    <main className="lms-arena">
      <div className="lms-center"><img src="/assets/sprites/ui/frames/battle_vs.png" alt="VS" width="90"/><strong>{attacker.name}</strong><span>{s.phase==='clash'?'CAN THIỆP · '+Math.max(0,Math.ceil(((s.deadline??0)-clock)/1000))+'s':s.phase.toUpperCase()}</span><span>CÔNG {s.attack??'—'} / THỦ {s.defense??'—'}</span><small>{victim?'→ '+victim.name:'Chọn đối thủ'}</small></div>
      {s.players.map((p,i)=><section key={p.id} className={'lms-seat lms-seat-'+i+(p.hp<=0?' lms-eliminated':'')+(p.id===attacker.id?' lms-active':'')}>
        <div className="lms-player-name">{p.name}{p.id===me?.id?' · BẠN':''}</div>
        <div className="lms-hp"><i style={{width:Math.max(0,p.hp/p.maxHp*100)+'%'}}/><span>{p.hp}/{p.maxHp} HP</span></div>
        <div className="lms-resources">{p.d12Charge??0} PTS · {p.classType}</div>
        <CharacterRenderer character={p.character} weapon={p.weapon} size="sm" facing={i%2===0?'right':'left'} />
        <span>{p.weapon.name}</span><div className="lms-dice">{p.id===attacker.id?'⚔ '+(s.attack??'—'):p.id===s.target?'🛡 '+(s.defense??'—'):'D20 —'} · D6 {p.id===attacker.id?s.rolls.join(' + ')||'—':'—'}</div>
        {p.hp<=0&&<strong>ĐÃ BỊ LOẠI</strong>}
      </section>)}
    </main>
    <footer className="lms-controls"><div role="status">{error|| (s.winner?s.winner==='draw'?'HÒA: không còn người sống':'CHIẾN THẮNG: '+s.players.find(p=>p.id===s.winner)?.name:mine?'Lượt của bạn':s.phase==='defense'&&victim?.id===me?.id?'Bạn cần tung phòng thủ':'Đang chờ '+attacker.name)}</div>
      {me&&s.extras&&<details className="lms-buff" open><summary>BUFF CỦA BẠN · {LMS_BUFFS[s.extras.buffs[me.id]?.id]??'Ẩn'} · {s.extras.buffs[me.id]?.used?'ĐÃ DÙNG':'CHƯA LẬT'}</summary>
        <p>{LMS_BUFF_HELP[s.extras.buffs[me.id]?.id]}</p><p>Chọn mục tiêu bên dưới nếu buff yêu cầu. Mỗi buff dùng một lần; server kiểm tra điều kiện lúc bấm.</p>
        <select aria-label="Mục tiêu buff" value={chosen} onChange={e=>setTarget(e.target.value)}>{choices.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select aria-label="Tùy chọn buff" value={buffChoice} onChange={e=>setBuffChoice(e.target.value)}><option value="attack">D20 Công / đổi PTS thành HP</option><option value="defense">D20 Thủ</option><option value="hp">Đổi HP thành PTS</option></select>
        {buffChoice==='hp'&&<input type="number" min="1" value={trade} onChange={e=>setTrade(e.target.value)} aria-label="PTS muốn mua" className="bg-slate-900 p-2"/>}
        {button('LẬT BUFF','buff',!s.extras.buffs[me.id]?.used&&me.hp>0,{target:buffChoice==='hp'?trade:chosen,choice:buffChoice})}
        <span>Vòng bo từ vòng {s.extras.suddenRound}. Buff người khác: {s.players.filter(p=>p.id!==me.id).map(p=>p.name+': '+(s.extras!.buffs[p.id]?.revealed?LMS_BUFFS[s.extras!.buffs[p.id].id]:'ÚP')).join(' · ')}</span>
      </details>}
      {s.phase==='charge'&&button('TUNG D6 '+(s.rolls.length+1)+'/'+(me?.classType==='mage'?2:1),'charge',mine)}
      {mine&&['target','attack'].includes(s.phase)&&<><select aria-label="Mục tiêu" value={chosen} onChange={e=>setTarget(e.target.value)}>{choices.map(p=><option key={p.id} value={p.id}>{p.name} · {p.hp} HP</option>)}</select>
        {button('CHỌN MỤC TIÊU','target',s.phase==='target',{target:chosen})}
        {me&&([1,2]as const).map(slot=><button key={slot} className="lms-action" disabled={busy} onClick={()=>act('skill',{slot,target:chosen,form:slot===1?(Array.isArray(me.weapon.skill1.triggerNumber)?(me.weapon.skill1.triggerNumber.includes(form)?form:me.weapon.skill1.triggerNumber[0]):undefined):me.weapon.id==='fire_headband'?meteor:me.weapon.id==='infinity_ring'?voidForm:undefined,lockSlot:lock})} title={slot===1?me.weapon.skill1.descriptionVi:me.weapon.skill2.descriptionVi}>SKILL {slot} · {slot===1?me.weapon.skill1.chargeRequired:me.weapon.skill2.chargeRequired} PTS</button>)}
        {me&&Array.isArray(me.weapon.skill1.triggerNumber)&&<select aria-label="Dạng Skill 1" value={me.weapon.skill1.triggerNumber.includes(form)?form:me.weapon.skill1.triggerNumber[0]} onChange={e=>setForm(+e.target.value)}>{me.weapon.skill1.triggerNumber.map(f=><option key={f} value={f}>{skillPresentation(me,1,f).nameVi}</option>)}</select>}
        {me?.weapon.id==='fire_headband'&&<select value={meteor} onChange={e=>setMeteor(+e.target.value)}><option value={20}>20 PTS · 10 dame</option><option value={30}>30 PTS · 30 dame + hoảng loạn</option></select>}
        {me?.weapon.id==='infinity_ring'&&<><select value={voidForm} onChange={e=>setVoidForm(+e.target.value)}><option value={1}>Cầu tím 50</option><option value={2}>Thiên không 30 + khóa</option></select><select value={lock} onChange={e=>setLock(+e.target.value as 1|2)}><option value={1}>Khóa Skill 1</option><option value={2}>Khóa Skill 2</option></select></>}
        {button('TUNG D20 CÔNG','attack',s.phase==='attack')}</>}
      {s.phase==='defense'&&button('TUNG D20 THỦ','defend',victim?.id===me?.id)}
      {s.phase==='clash'&&<>{button('+1 CÔNG · 3 PTS','clash',(me?.hp??0)>0,{delta:1})}{button('−1 CÔNG · 3 PTS','clash',(me?.hp??0)>0,{delta:-1})}{button('TÍNH SÁT THƯƠNG','resolve',clock>=(s.deadline??Infinity))}</>}
      {s.phase==='end'&&button('KẾT THÚC LƯỢT','end',mine)}
      {s.winner&&<button className="lms-action" onClick={async()=>{const r=await fetch('/api/rooms/'+onlineRoomCode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'return_lobby',userId:me?.id})});if(r.ok)setPage('play');}}>VỀ PHÒNG</button>}
      <details><summary>Nhật ký trận</summary>{s.log.slice(0,30).map((l,i)=><p key={i}>{l}</p>)}</details>
    </footer>
  </div>;
}
