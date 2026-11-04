'use client';
import {tx} from '@/lib/uiLocale';
import {useEffect,useState} from 'react';
import {useGameStore} from '@/stores/gameStore';
import type {PveState} from '@/lib/pve';
import {skillPresentation} from '@/lib/skillPresentation';
import {loadProgress,WalletBar} from '@/components/progression/AccountPanel';
import CharacterRenderer from '@/components/character/CharacterRenderer';
type Run={id:string;revision:number;state:PveState};
export default function PveTower(){const {currentUser,setPage,setAuthModal}=useGameStore(),[run,setRun]=useState<Run|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[form,setForm]=useState(3),[second,setSecond]=useState(1),[lock,setLock]=useState(1);
 useEffect(()=>{fetch('/api/pve').then(r=>r.json()).then(b=>{setRun(b.run);if(b.error)setError(b.error);}).catch(()=>setError(tx("Mất kết nối")));},[]);
 async function act(move:string,args:Record<string,unknown>={}){if(busy)return;setBusy(true);setError('');try{const r=await fetch('/api/pve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({move,args,id:run?.id,revision:run?.revision})});const b=await r.json();if(!r.ok)throw Error(tx(b.error));setRun(b.run);if(b.run.state.combat.winner===currentUser?.id)loadProgress().catch(()=>{});}catch(e){setError(e instanceof Error?e.message:tx("Lỗi kết nối"));}finally{setBusy(false);}}
 const s=run?.state.combat,me=s?.players.find(p=>p.id===currentUser?.id),bot=s?.players.find(p=>p.id==='pve_bot'),mine=s?.order[s.active]===me?.id;
 return <div className="pve-tower"><header><button onClick={()=>setPage('play')}>{tx("← Quay lại")}</button><h2>{tx("THÁP XÚC XẮC · TẦNG") + " "}{run?.state.stage||1}</h2><WalletBar/></header>{error&&<p role="alert">{error}</p>}
 {!currentUser?<button onClick={()=>setAuthModal('login')}>{tx("Đăng nhập để lưu phần thưởng")}</button>:!run||s?.winner&&s.winner!==me?.id?<button className="primary-action" disabled={busy} onClick={()=>act('start')}>{tx("BẮT ĐẦU CHUỖI MỚI")}</button>:<>
 <div className="pve-duel">{[me,bot].map((p,i)=>p&&<section key={p.id}><h3>{p.id==='pve_bot'?tx(p.name):p.name}</h3><progress max={p.maxHp} value={p.hp}/><p>{p.hp}/{p.maxHp} HP · {p.d12Charge||0} PTS</p><CharacterRenderer character={p.character} weapon={p.weapon} size="lg" facing={i===0?'right':'left'}/><p>{p.weapon.name} · {p.weapon.tier}</p></section>)}</div>
 <div className="pve-status"><strong>{s?.winner===me?.id?tx("TẦNG ĐÃ VƯỢT QUA"):s?.phase==='defense'?tx("ĐỐI THỦ ĐANG TẤN CÔNG"):mine?tx("LƯỢT CỦA BẠN"):tx("ĐỐI THỦ")}</strong><p>D6: {s?.rolls.join(' + ')||'—'}{" " + tx("· Công") + " "}{s?.attack??'—'}{" " + tx("/ Thủ") + " "}{s?.defense??'—'}</p><p>{tx("Thưởng tầng: ◆") + " "}{run.state.reward.gems} Gem · ♦ {run.state.reward.rubies} Ruby · +{run.state.reward.exp} EXP</p></div>
 <div className="pve-actions">{s?.winner===me?.id?<button className="primary-action" disabled={busy} onClick={()=>act('next')}>{tx("ĐI TIẾP TẦNG") + " "}{run.state.stage+1}</button>:<>
 {mine&&s?.phase==='charge'&&<button className="primary-action" disabled={busy} onClick={()=>act('charge')}>{tx('TUNG D6 ·')} {s.rolls.length+1}/{me?.classType==='mage'?2:1}</button>}
 {mine&&me&&['target','attack'].includes(s!.phase)&&<>
 {[1,2].map(slot=><button key={slot} disabled={busy} title={useGameStore.getState().settings.language==='en'?(slot===1?me.weapon.skill1.description:me.weapon.skill2.description):(slot===1?me.weapon.skill1.descriptionVi:me.weapon.skill2.descriptionVi)} onClick={()=>act('skill',{target:'pve_bot',slot,form:slot===1?(Array.isArray(me.weapon.skill1.triggerNumber)?(me.weapon.skill1.triggerNumber.includes(form)?form:me.weapon.skill1.triggerNumber[0]):undefined):me.weapon.id==='fire_headband'?(second===30?30:20):me.weapon.id==='infinity_ring'?second:undefined,lockSlot:lock})}>Skill {slot} · {slot===1?me.weapon.skill1.chargeRequired:me.weapon.skill2.chargeRequired} PTS</button>)}
 {Array.isArray(me.weapon.skill1.triggerNumber)&&<select aria-label={tx("Dạng Skill 1")} value={me.weapon.skill1.triggerNumber.includes(form)?form:me.weapon.skill1.triggerNumber[0]} onChange={e=>setForm(+e.target.value)}>{me.weapon.skill1.triggerNumber.map(f=><option key={f} value={f}>{skillPresentation(me,1,f)[useGameStore.getState().settings.language==='en'?'nameEn':'nameVi']}</option>)}</select>}
 {['fire_headband','infinity_ring'].includes(me.weapon.id)&&<select aria-label={tx("Dạng Skill 2")} value={second} onChange={e=>setSecond(+e.target.value)}>{(me.weapon.id==='fire_headband'?[20,30]:[1,2]).map(f=><option key={f} value={f}>{skillPresentation(me,2,f)[useGameStore.getState().settings.language==='en'?'nameEn':'nameVi']} · {f}</option>)}</select>}
 {me.weapon.id==='infinity_ring'&&<select aria-label={tx("Khóa skill")} value={lock} onChange={e=>setLock(+e.target.value)}><option value={1}>{tx("Khóa Skill 1")}</option><option value={2}>{tx("Khóa Skill 2")}</option></select>}
 <button className="primary-action" disabled={busy} onClick={()=>s?.phase==='target'?act('target',{target:'pve_bot'}):act('attack')}>{s?.phase==='target'?tx("CHỌN ĐỐI THỦ"):tx("TUNG D20 CÔNG")}</button></>}
 {s?.phase==='defense'&&s.target===me?.id&&<button className="primary-action" disabled={busy} onClick={()=>act('defend')}>{tx("TUNG D20 THỦ")}</button>}
 {mine&&s?.phase==='end'&&<button className="primary-action" disabled={busy} onClick={()=>act('end')}>{tx("KẾT THÚC LƯỢT")}</button>}</>}</div>
 <details><summary>{tx("Nhật ký")}</summary>{(useGameStore.getState().settings.language==='vi'?(s?.logVi||s?.log):s?.log)?.slice(0,20).map((l,i)=><p key={i}>{tx(l)}</p>)}</details></>}
 </div>;
}
