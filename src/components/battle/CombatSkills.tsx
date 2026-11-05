'use client';
import {effectFrame} from '@/lib/weaponUpdateAssets';
import {useState} from 'react';
import type {PlayerState} from '@/types/game';
import {useGameStore} from '@/stores/gameStore';
import {skillCost} from '@/lib/chargedSkills';
import {skillIsLocked} from '@/lib/combatDamage';
import {WEAPON_DEFINITIONS} from '@/lib/constants';
import {activeWeather} from '@/lib/weaponUpdateState';
import {skillPresentation} from '@/lib/skillPresentation';

export default function CombatSkills({player,round,enabled,busy,onCast,players}:{player:PlayerState;round:number;enabled:boolean;busy:boolean;players?:PlayerState[];onCast:(args:Record<string,unknown>)=>void}){
  const p={...player,weapon:WEAPON_DEFINITIONS[player.weapon.id]||player.weapon};
  const en=useGameStore(s=>s.settings.language)==='en',[form,setForm]=useState<number>(),[second,setSecond]=useState(1),[lock,setLock]=useState(1);
  const battle=useGameStore(s=>s.battleState);const opponents=(players||battle?.lms?.players||[battle?.player1,battle?.player2]).filter((x):x is PlayerState=>!!x&&x.id!==p.id&&x.hp>0);
  const marked=opponents.some(x=>x.weaponUpdate?.markedBy===p.id&&(x.weaponUpdate.markUntil??0)>=round);
  const named=opponents.some(x=>x.weaponUpdate?.namedBy===p.id);
  const rawForms=p.weapon.skill1.triggerNumber;
  const forms=p.weapon.id==='thunder_spear'&&activeWeather(p,round)?.kind!=='rain'?[1]:rawForms,first=Array.isArray(forms)?forms.includes(form??-1)?form:forms[0]:undefined;
  const f2=Array.isArray(p.weapon.skill2.triggerNumber)?p.weapon.id==='king_slasher'&&!marked?1:second:p.weapon.id==='fire_headband'?(second===30?30:20):p.weapon.id==='infinity_ring'?second:undefined;
  return <div className="combat-skills">{([1,2]as const).map(slot=>{
    const skill=slot===1?p.weapon.skill1:p.weapon.skill2,chosen=slot===1?first:f2,art=skillPresentation(p,slot,chosen),cost=skillCost(p,slot,chosen,round);
    const used=(slot===1?p.skill1UsedTurn:p.skill2UsedTurn)===round,locked=skillIsLocked(p,slot,round),leaf=slot===1&&p.weapon.id==='fire_headband'&&p.leafSkillReadyTurn!==round,rock=slot===2&&p.weapon.id==='spirit_stone'&&((p.petRockHp??0)<=0||p.petRockEnraged),empty=slot===2&&p.weapon.id==='revolver'&&(p.bullets??6)<=0;
    const statusLocked=p.weaponUpdate?.slowChargeRound===round&&p.weaponUpdate.slowChargeBlocked;
    const targetGate=slot===2&&p.weapon.id==='death_note'&&!named;
    const autoShield=slot===1&&p.weapon.id==='shield';
    const rockAlive=slot===1&&p.weapon.id==='spirit_stone'&&(p.petRockHp??0)>0;
    const ready=enabled&&!statusLocked&&!targetGate&&!autoShield&&!rockAlive&&!used&&!locked&&!leaf&&!rock&&!empty&&(p.d12Charge??0)>=cost;
    return <div key={slot} className="combat-skill"><button className={'combat-skill-cast '+(ready?'action-beacon':'')+(rockAlive?' rock-summon-locked':'')} disabled={busy||!ready} title={en?skill.description:skill.descriptionVi} onClick={e=>{e.currentTarget.closest('.combat-skill')?.querySelector('details')?.removeAttribute('open');onCast({slot,form:chosen,lockSlot:lock});}}><img src={'/assets/sprites/ui/frames/btn_skill_'+slot+'.png'} alt={'Skill '+slot}/><img className="weapon-skill-art" src={effectFrame(art.effect,1)} alt={en?art.nameEn:art.nameVi}/></button><span className="combat-skill-cost">{cost} PTS · {statusLocked?(en?'D6 locked':'D6 bị khóa'):targetGate?(en?'Write a name first':'Cần ghi tên trước'):autoShield?'D6 = 4':rockAlive?(en?'Rock alive':'Rock còn sống'):used?'✓':locked?'🔒':leaf?'D6 = 2':rock?(en?'Summon first':'Triệu hồi trước'):ready?'⚡':(p.d12Charge??0)+'/'+cost}</span>
      <details className="combat-skill-info"><summary>ⓘ {en?'Details / Form':'Chi tiết / Dạng'}</summary><div><img src={effectFrame(art.effect,1)} alt=""/><b>{en?art.nameEn:art.nameVi}</b><p>{en?skill.description:skill.descriptionVi}</p><small>{en?'Shared PTS · Once per round':'Chung PTS · Một lần mỗi vòng'}</small>
      {slot===1&&Array.isArray(forms)&&<select aria-label={en?'Skill 1 form':'Dạng Skill 1'} value={first} onChange={e=>{setForm(+e.target.value);e.currentTarget.closest('details')?.removeAttribute('open');}}>{forms.map(f=><option key={f} value={f}>{skillPresentation(p,1,f)[en?'nameEn':'nameVi']}</option>)}</select>}
      {slot===2&&f2!==undefined&&<select aria-label={en?'Skill 2 form':'Dạng Skill 2'} value={f2} onChange={e=>{setSecond(+e.target.value);e.currentTarget.closest('details')?.removeAttribute('open');}}>{(Array.isArray(p.weapon.skill2.triggerNumber)?p.weapon.skill2.triggerNumber:p.weapon.id==='fire_headband'?[20,30]:[1,2]).filter(f=>p.weapon.id!=='king_slasher'||f!==2||marked).map(f=><option key={f} value={f}>{skillPresentation(p,2,f)[en?'nameEn':'nameVi']} · {skillCost(p,2,f)} PTS</option>)}</select>}
      {slot===2&&p.weapon.id==='infinity_ring'&&f2===2&&<select value={lock} onChange={e=>{setLock(+e.target.value);e.currentTarget.closest('details')?.removeAttribute('open');}} aria-label="Lock enemy skill"><option value={1}>{en?'Lock enemy Skill 1':'Khóa Skill 1 đối thủ'}</option><option value={2}>{en?'Lock enemy Skill 2':'Khóa Skill 2 đối thủ'}</option></select>}
      </div></details></div>;
  })}</div>;
}
