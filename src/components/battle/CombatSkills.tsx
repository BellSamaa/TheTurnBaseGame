'use client';
import {useState} from 'react';
import type {PlayerState} from '@/types/game';
import {useGameStore} from '@/stores/gameStore';
import {skillCost} from '@/lib/chargedSkills';
import {skillIsLocked} from '@/lib/combatDamage';
import {skillPresentation} from '@/lib/skillPresentation';

export default function CombatSkills({player:p,round,enabled,busy,onCast}:{player:PlayerState;round:number;enabled:boolean;busy:boolean;onCast:(args:Record<string,unknown>)=>void}){
  const en=useGameStore(s=>s.settings.language)==='en',[form,setForm]=useState<number>(),[second,setSecond]=useState(1),[lock,setLock]=useState(1);
  const forms=p.weapon.skill1.triggerNumber,first=Array.isArray(forms)?forms.includes(form??-1)?form:forms[0]:undefined;
  const f2=p.weapon.id==='fire_headband'?(second===30?30:20):p.weapon.id==='infinity_ring'?second:undefined;
  return <div className="combat-skills">{([1,2]as const).map(slot=>{
    const skill=slot===1?p.weapon.skill1:p.weapon.skill2,chosen=slot===1?first:f2,art=skillPresentation(p,slot,chosen),cost=skillCost(p,slot,chosen);
    const used=(slot===1?p.skill1UsedTurn:p.skill2UsedTurn)===round,locked=skillIsLocked(p,slot,round),leaf=slot===1&&p.weapon.id==='fire_headband'&&p.leafSkillReadyTurn!==round,rock=slot===2&&p.weapon.id==='spirit_stone'&&((p.petRockHp??0)<=0||p.petRockEnraged),empty=slot===2&&p.weapon.id==='revolver'&&(p.bullets??6)<=0;
    const rockAlive=slot===1&&p.weapon.id==='spirit_stone'&&(p.petRockHp??0)>0;
    const ready=enabled&&!rockAlive&&!used&&!locked&&!leaf&&!rock&&!empty&&(p.d12Charge??0)>=cost;
    return <div key={slot} className="combat-skill"><button className={'combat-skill-cast '+(ready?'action-beacon':'')+(rockAlive?' rock-summon-locked':'')} disabled={busy||!ready} title={en?skill.description:skill.descriptionVi} onClick={e=>{e.currentTarget.closest('.combat-skill')?.querySelector('details')?.removeAttribute('open');onCast({slot,form:chosen,lockSlot:lock});}}><img src={'/assets/sprites/ui/frames/btn_skill_'+slot+'.png'} alt={'Skill '+slot}/></button><span className="combat-skill-cost">{cost} PTS · {rockAlive?(en?'Rock alive':'Rock còn sống'):used?'✓':locked?'🔒':leaf?'D6 = 2':rock?(en?'Summon first':'Triệu hồi trước'):ready?'⚡':(p.d12Charge??0)+'/'+cost}</span>
      <details className="combat-skill-info"><summary>ⓘ {en?'Details / Form':'Chi tiết / Dạng'}</summary><div><img src={'/assets/vfx/frames/'+art.effect+'/1.png'} alt=""/><b>{en?art.nameEn:art.nameVi}</b><p>{en?skill.description:skill.descriptionVi}</p><small>{en?'Shared PTS · Once per round':'Chung PTS · Một lần mỗi vòng'}</small>
      {slot===1&&Array.isArray(forms)&&<select aria-label={en?'Skill 1 form':'Dạng Skill 1'} value={first} onChange={e=>{setForm(+e.target.value);e.currentTarget.closest('details')?.removeAttribute('open');}}>{forms.map(f=><option key={f} value={f}>{skillPresentation(p,1,f)[en?'nameEn':'nameVi']}</option>)}</select>}
      {slot===2&&f2!==undefined&&<select aria-label={en?'Skill 2 form':'Dạng Skill 2'} value={f2} onChange={e=>{setSecond(+e.target.value);e.currentTarget.closest('details')?.removeAttribute('open');}}>{(p.weapon.id==='fire_headband'?[20,30]:[1,2]).map(f=><option key={f} value={f}>{skillPresentation(p,2,f)[en?'nameEn':'nameVi']} · {skillCost(p,2,f)} PTS</option>)}</select>}
      {slot===2&&p.weapon.id==='infinity_ring'&&f2===2&&<select value={lock} onChange={e=>{setLock(+e.target.value);e.currentTarget.closest('details')?.removeAttribute('open');}} aria-label="Lock enemy skill"><option value={1}>{en?'Lock enemy Skill 1':'Khóa Skill 1 đối thủ'}</option><option value={2}>{en?'Lock enemy Skill 2':'Khóa Skill 2 đối thủ'}</option></select>}
      </div></details></div>;
  })}</div>;
}
