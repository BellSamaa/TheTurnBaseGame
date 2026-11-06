'use client';
import {musashiHidden} from '@/lib/weaponUpdate2Logic';
import {deathNoteMode} from '@/lib/deathNote';
import {effectFrame} from '@/lib/weaponUpdateAssets';
import {useState,useEffect} from 'react';
import type {PlayerState} from '@/types/game';
import {useGameStore} from '@/stores/gameStore';
import {skillCost} from '@/lib/chargedSkills';
import {skillIsLocked} from '@/lib/combatDamage';
import {WEAPON_DEFINITIONS} from '@/lib/constants';
import {activeWeather} from '@/lib/weaponUpdateState';
import {skillPresentation} from '@/lib/skillPresentation';

export default function CombatSkills({player,round,enabled,busy,onCast,players,freeSlots=[]}:{player:PlayerState;round:number;enabled:boolean;busy:boolean;players?:PlayerState[];freeSlots?:number[];onCast:(args:Record<string,unknown>)=>void}){
  const [openSlot,setOpenSlot]=useState<1|2|null>(null);
  const p={...player,weapon:WEAPON_DEFINITIONS[player.weapon.id]||player.weapon};
  const en=useGameStore(s=>s.settings.language)==='en',[form,setForm]=useState<number>(),[second,setSecond]=useState(1),[lock,setLock]=useState(1);
  const battle=useGameStore(s=>s.battleState);const opponents=(players||battle?.lms?.players||[battle?.player1,battle?.player2]).filter((x):x is PlayerState=>!!x&&x.id!==p.id&&x.hp>0);
  const marked=opponents.some(x=>x.weaponUpdate?.markedBy===p.id&&(x.weaponUpdate.markUntil??0)>=round);
  const named=opponents.some(x=>x.weaponUpdate?.namedBy===p.id);
  const rawForms=p.weapon.skill1.triggerNumber;
  const forms=p.weapon.id==='thunder_spear'&&activeWeather(p,round)?.kind!=='rain'?[1]:rawForms,first=Array.isArray(forms)?forms.includes(form??-1)?form:forms[0]:undefined;
  const f2=p.weapon.id==='musashi'?(opponents.some(t=>musashiHidden(p,t,round))?2:1):p.weapon.id==='death_note'?deathNoteMode(p,round):Array.isArray(p.weapon.skill2.triggerNumber)?p.weapon.id==='king_slasher'&&!marked?1:second:p.weapon.id==='fire_headband'?(second===30?30:20):p.weapon.id==='infinity_ring'?second:undefined;
  const [hiddenFrame,setHiddenFrame]=useState(0);useEffect(()=>{if(p.weapon.id!=='musashi'||f2!==2)return;const t=setInterval(()=>setHiddenFrame(f=>(f+1)%24),84);return()=>clearInterval(t)},[p.weapon.id,f2]);
  return <div className="combat-skills">{([1,2]as const).map(slot=>{
    const skill=slot===1?p.weapon.skill1:p.weapon.skill2,chosen=slot===1?first:f2,art=skillPresentation(p,slot,chosen),cost=freeSlots.includes(slot)?0:skillCost(p,slot,chosen,round);
    const used=(slot===1?p.skill1UsedTurn:p.skill2UsedTurn)===round,locked=skillIsLocked(p,slot,round),leaf=slot===1&&p.weapon.id==='fire_headband'&&p.leafSkillReadyTurn!==round,rock=slot===2&&p.weapon.id==='spirit_stone'&&((p.petRockHp??0)<=0||p.petRockEnraged),empty=slot===2&&p.weapon.id==='revolver'&&(p.bullets??6)<=0;
    const statusLocked=p.weaponUpdate?.slowChargeRound===round&&p.weaponUpdate.slowChargeBlocked;
    const targetGate=slot===2&&p.weapon.id==='death_note'&&(f2===1?!named:opponents.some(x=>x.weaponUpdate?.judgement?.owner===p.id));
    const autoShield=slot===1&&p.weapon.id==='shield';
    const rockAlive=slot===1&&p.weapon.id==='spirit_stone'&&(p.petRockHp??0)>0;
    const ready=enabled&&!statusLocked&&!targetGate&&!autoShield&&!rockAlive&&!used&&!locked&&!leaf&&!rock&&!empty&&(p.d12Charge??0)>=cost;
    return <div key={slot} className="combat-skill" onPointerEnter={e=>{if(e.pointerType!=='touch')setOpenSlot(slot);}} onPointerLeave={e=>{if(e.pointerType!=='touch')setOpenSlot(null);}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpenSlot(null);}} onKeyDown={e=>{if(e.key==='Escape')setOpenSlot(null);}}><button className={'combat-skill-cast '+(slot===2&&p.weapon.id==='musashi'&&f2===2?' musashi-hidden-ready ':'')+(ready?'action-beacon':'')+(rockAlive?' rock-summon-locked':'')+(slot===2&&p.weapon.id==='death_note'&&f2!==1?' death-hidden-ready':'')} disabled={busy||!ready} onClick={()=>{setOpenSlot(null);onCast({slot,form:chosen,lockSlot:lock});}}><img src={slot===2&&p.weapon.id==='musashi'&&f2===2?'/assets/weapon-update-2/musashi/S2_Hidden_Ready/'+hiddenFrame+'.webp':'/assets/sprites/ui/frames/btn_skill_'+slot+'.png'} alt={'Skill '+slot}/><img className="weapon-skill-art" src={slot===2&&p.weapon.id==='death_note'&&f2!==1?'/assets/death-note/hidden.png':effectFrame(art.effect,1)} alt=""/></button><span className="combat-skill-cost">{cost} PTS · {statusLocked?(en?'D6 locked':'D6 bị khóa'):targetGate?(en?'Write a name first':'Cần ghi tên trước'):autoShield?'D6 = 4':rockAlive?(en?'Rock alive':'Rock còn sống'):used?'✓':locked?'🔒':leaf?'D6 = 2':rock?(p.petRockEnraged?(en?'Rage active':'Đang cuồng bạo'):(en?'Summon first':'Triệu hồi trước')):ready?'⚡':(p.d12Charge??0)+'/'+cost}</span>
      <button type="button" className="skill-touch-info" aria-label={(en?'Skill details ':'Chi tiết kỹ năng ')+slot} aria-expanded={openSlot===slot} onClick={()=>setOpenSlot(openSlot===slot?null:slot)}>ⓘ</button>
      {openSlot===slot&&<div className="skill-hover-panel" role="group" aria-label={en?'Skill details':'Chi tiết kỹ năng'}><div><img src={effectFrame(art.effect,1)} alt=""/><b>{en?art.nameEn:art.nameVi}</b><p>{en?skill.description:skill.descriptionVi}</p>{slot===2&&p.weapon.id==='death_note'&&<b>{f2===2?'EYE OF DEATH + PURGING JUDGEMENT · 20 PTS':'JUDGEMENT · 32 PTS'}</b>}<small>{en?'Shared PTS · Once per round':'Chung PTS · Một lần mỗi vòng'}</small>
      {slot===1&&Array.isArray(forms)&&<select aria-label={en?'Skill 1 form':'Dạng Skill 1'} value={first} onChange={e=>{setForm(+e.target.value);}}>{forms.map(f=><option key={f} value={f}>{skillPresentation(p,1,f)[en?'nameEn':'nameVi']}</option>)}</select>}
      {slot===2&&!['death_note','musashi'].includes(p.weapon.id)&&f2!==undefined&&<select aria-label={en?'Skill 2 form':'Dạng Skill 2'} value={f2} onChange={e=>{setSecond(+e.target.value);}}>{(Array.isArray(p.weapon.skill2.triggerNumber)?p.weapon.skill2.triggerNumber:p.weapon.id==='fire_headband'?[20,30]:[1,2]).filter(f=>p.weapon.id!=='king_slasher'||f!==2||marked).map(f=><option key={f} value={f}>{skillPresentation(p,2,f)[en?'nameEn':'nameVi']} · {skillCost(p,2,f)} PTS</option>)}</select>}
      {slot===2&&p.weapon.id==='infinity_ring'&&f2===2&&<select value={lock} onChange={e=>{setLock(+e.target.value);}} aria-label="Lock enemy skill"><option value={1}>{en?'Lock enemy Skill 1':'Khóa Skill 1 đối thủ'}</option><option value={2}>{en?'Lock enemy Skill 2':'Khóa Skill 2 đối thủ'}</option></select>}
      </div></div>}</div>;
  })}</div>;
}
