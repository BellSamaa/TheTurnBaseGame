'use client';
import {useEffect,useState} from 'react';
import {useGameStore} from '@/stores/gameStore';
import type {PveState} from '@/lib/pve';
import {skillPresentation} from '@/lib/skillPresentation';
import {loadProgress,WalletBar} from '@/components/progression/AccountPanel';
import CharacterRenderer from '@/components/character/CharacterRenderer';
type Run={id:string;revision:number;state:PveState};
export default function PveTower(){const {currentUser,setPage,setAuthModal}=useGameStore(),[run,setRun]=useState<Run|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[form,setForm]=useState(3),[second,setSecond]=useState(1),[lock,setLock]=useState(1);
 useEffect(()=>{fetch('/api/pve').then(r=>r.json()).then(b=>{setRun(b.run);if(b.error)setError(b.error);}).catch(()=>setError('Mất kết nối'));},[]);
 async function act(move:string,args:Record<string,unknown>={}){if(busy)return;setBusy(true);setError('');try{const r=await fetch('/api/pve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({move,args,id:run?.id,revision:run?.revision})});const b=await r.json();if(!r.ok)throw Error(b.error);setRun(b.run);if(b.run.state.combat.winner===currentUser?.id)loadProgress().catch(()=>{});}catch(e){setError(e instanceof Error?e.message:'Lỗi kết nối');}finally{setBusy(false);}}
 const s=run?.state.combat,me=s?.players.find(p=>p.id===currentUser?.id),bot=s?.players.find(p=>p.id==='pve_bot'),mine=s?.order[s.active]===me?.id;
 return <div className="pve-tower"><header><button onClick={()=>setPage('play')}>← Quay lại</button><h2>THÁP XÚC XẮC · TẦNG {run?.state.stage||1}</h2><WalletBar/></header>{error&&<p role="alert">{error}</p>}
 {!currentUser?<button onClick={()=>setAuthModal('login')}>Đăng nhập để lưu phần thưởng</button>:!run||s?.winner&&s.winner!==me?.id?<button className="primary-action" disabled={busy} onClick={()=>act('start')}>BẮT ĐẦU CHUỖI MỚI</button>:<>
 <div className="pve-duel">{[me,bot].map((p,i)=>p&&<section key={p.id}><h3>{p.name}</h3><progress max={p.maxHp} value={p.hp}/><p>{p.hp}/{p.maxHp} HP · {p.d12Charge||0} PTS</p><CharacterRenderer character={p.character} weapon={p.weapon} size="lg" facing={i===0?'right':'left'}/><p>{p.weapon.name} · {p.weapon.tier}</p></section>)}</div>
 <div className="pve-status"><strong>{s?.winner===me?.id?'TẦNG ĐÃ VƯỢT QUA':s?.phase==='defense'?'ĐỐI THỦ ĐANG TẤN CÔNG':mine?'LƯỢT CỦA BẠN':'ĐỐI THỦ'}</strong><p>D6: {s?.rolls.join(' + ')||'—'} · Công {s?.attack??'—'} / Thủ {s?.defense??'—'}</p><p>Thưởng tầng: ◆ {run.state.reward.gems} Gem · ♦ {run.state.reward.rubies} Ruby · +{run.state.reward.exp} EXP</p></div>
 <div className="pve-actions">{s?.winner===me?.id?<button className="primary-action" disabled={busy} onClick={()=>act('next')}>ĐI TIẾP TẦNG {run.state.stage+1}</button>:<>
 {mine&&s?.phase==='charge'&&<button className="primary-action" disabled={busy} onClick={()=>act('charge')}>TUNG D6 · {s.rolls.length+1}/{me?.classType==='mage'?2:1}</button>}
 {mine&&me&&['target','attack'].includes(s!.phase)&&<>
 {[1,2].map(slot=><button key={slot} disabled={busy} title={slot===1?me.weapon.skill1.descriptionVi:me.weapon.skill2.descriptionVi} onClick={()=>act('skill',{target:'pve_bot',slot,form:slot===1?(Array.isArray(me.weapon.skill1.triggerNumber)?(me.weapon.skill1.triggerNumber.includes(form)?form:me.weapon.skill1.triggerNumber[0]):undefined):me.weapon.id==='fire_headband'?(second===30?30:20):me.weapon.id==='infinity_ring'?second:undefined,lockSlot:lock})}>Skill {slot} · {slot===1?me.weapon.skill1.chargeRequired:me.weapon.skill2.chargeRequired} PTS</button>)}
 {Array.isArray(me.weapon.skill1.triggerNumber)&&<select aria-label="Dạng Skill 1" value={me.weapon.skill1.triggerNumber.includes(form)?form:me.weapon.skill1.triggerNumber[0]} onChange={e=>setForm(+e.target.value)}>{me.weapon.skill1.triggerNumber.map(f=><option key={f} value={f}>{skillPresentation(me,1,f).nameVi}</option>)}</select>}
 {['fire_headband','infinity_ring'].includes(me.weapon.id)&&<select aria-label="Dạng Skill 2" value={second} onChange={e=>setSecond(+e.target.value)}>{(me.weapon.id==='fire_headband'?[20,30]:[1,2]).map(f=><option key={f} value={f}>{skillPresentation(me,2,f).nameVi} · {f}</option>)}</select>}
 {me.weapon.id==='infinity_ring'&&<select aria-label="Khóa skill" value={lock} onChange={e=>setLock(+e.target.value)}><option value={1}>Khóa Skill 1</option><option value={2}>Khóa Skill 2</option></select>}
 <button className="primary-action" disabled={busy} onClick={()=>s?.phase==='target'?act('target',{target:'pve_bot'}):act('attack')}>{s?.phase==='target'?'CHỌN ĐỐI THỦ':'TUNG D20 CÔNG'}</button></>}
 {s?.phase==='defense'&&s.target===me?.id&&<button className="primary-action" disabled={busy} onClick={()=>act('defend')}>TUNG D20 THỦ</button>}
 {mine&&s?.phase==='end'&&<button className="primary-action" disabled={busy} onClick={()=>act('end')}>KẾT THÚC LƯỢT</button>}</>}</div>
 <details><summary>Nhật ký</summary>{s?.log.slice(0,20).map((l,i)=><p key={i}>{l}</p>)}</details></>}
 </div>;
}
