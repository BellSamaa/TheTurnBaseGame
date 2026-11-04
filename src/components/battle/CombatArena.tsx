'use client';
import {useEffect,useRef,useState} from 'react';
import {useGameStore} from '@/stores/gameStore';
import type {LmsState} from '@/lib/lms';
import {CLASS_DEFINITIONS,MAP_DEFINITIONS} from '@/lib/constants';
import {tx,phaseLabel} from '@/lib/uiLocale';
import HealthBar from '@/components/ui/HealthBar';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import {RockHealthBar,RockCompanion} from './RockCompanion';
import WeaponStand from './WeaponStand';
import DiceRoller3D from './DiceRoller3D';
import {BuffCard} from './BuffCard';
import VfxAnimationPlayer from './VfxAnimationPlayer';
import {playDiceRollSound,playHitSound,playSkillSound} from '@/lib/soundEffects';

/** Presentation only: all values and dice results come from the battle server. */
export default function CombatArena({state:s,viewer,busy=false,title,onSurrender,buffs=false,stageSequence,children}:{state:LmsState;viewer?:string;busy?:boolean;title:string;onSurrender:()=>void;buffs?:boolean;stageSequence?:LmsState['phase'][];children:React.ReactNode}){
  const mapId=useGameStore(st=>st.battleState?.mapId)||'castle';
  const map=MAP_DEFINITIONS.find(m=>m.id===mapId)||MAP_DEFINITIONS[0];
  const stages=stageSequence||['charge','target','attack','defense','clash','end'];
  const lang=useGameStore(st=>st.settings.language),en=lang==='en';
  const [event,setEvent]=useState<LmsState['lastEvent']>(),[rolling,setRolling]=useState(false);
  const seen=useRef(s.lastEvent?.id),lastRoll=useRef('');
  const viewerIndex=Math.max(0,s.players.findIndex(p=>p.id===viewer));
  const displayPlayers=[...s.players.slice(viewerIndex),...s.players.slice(0,viewerIndex)];
  const active=s.players.find(p=>p.id===s.order[s.active])!,victim=s.players.find(p=>p.id===s.target);
  useEffect(()=>{if(!s.lastEvent||seen.current===s.lastEvent.id)return;seen.current=s.lastEvent.id;setEvent(s.lastEvent);s.lastEvent.slot?playSkillSound():playHitSound();const t=setTimeout(()=>setEvent(undefined),1800);return()=>clearTimeout(t);},[s.lastEvent?.id]);
  useEffect(()=>{const key=[s.round,s.active,s.rolls.join(','),s.attack,s.defense].join(':');if(lastRoll.current&&lastRoll.current!==key){setRolling(true);playDiceRollSound();const t=setTimeout(()=>setRolling(false),700);lastRoll.current=key;return()=>clearTimeout(t);}lastRoll.current=key;},[s.round,s.active,s.rolls.length,s.attack,s.defense]);
  return <div className={'combat-arena battle-balanced '+(buffs?'combat-party':'combat-duel')}>
    <header className="combat-topbar"><div><small>{title}</small><h2>{en?'ROUND':'VÒNG'} {s.round}</h2></div><div className="combat-turn"><b>{active.name}</b><span>{phaseLabel(s.phase)}</span></div><button className="combat-surrender" disabled={busy||!!s.winner} onClick={onSurrender}>{en?'Surrender':'Đầu hàng'}</button></header>
    <nav className="combat-phase-bar" aria-label={en?'Battle phases':'Giai đoạn chiến đấu'}>{stages.map((phase,i)=><span key={phase} aria-current={s.phase===phase?'step':undefined} className={s.phase===phase?'phase-current':''}><i>{i+1}</i>{phaseLabel(phase as LmsState['phase'])}</span>)}</nav>
    <div className="combat-roll-notice" role="status" title={s.log[0]}>{en?s.log[0]:(s.logVi||s.log)[0]}</div>
    <div className="combat-stage"><img className="battle-background-2d" src={map.image.replace(/\.png$/,'.webp')} alt=""/>
      <div className="combat-vs"><img src="/assets/sprites/ui/frames/battle_vs.png" alt="VS"/><small>{victim?active.name+' → '+victim.name:en?'Choose a target':'Chọn mục tiêu'}</small></div>
      {displayPlayers.map((p,i)=>{const side=i%2===0?'left':'right';return <section key={p.id} className={'combat-seat combat-seat-'+i+(p.id===active.id?' combat-active':'')+(p.hp<=0?' combat-out':'')}>
        <div className="combat-name"><b>{p.id==='pve_bot'?tx(p.name):p.name}</b><small>{p.id===viewer?(en?'YOU':'BẠN'):p.hp<=0?(en?'ELIMINATED':'ĐÃ BỊ LOẠI'):p.id===active.id?'ATK':p.id===victim?.id?'DEF':''}</small></div>
        <HealthBar current={p.hp} max={p.maxHp}/><RockHealthBar player={p}/>
        <div className="combat-fighter"><WeaponStand weaponId={p.weapon.id} side={side}/><div className="combat-avatar"><CharacterRenderer character={p.character} weapon={p.weapon} size={buffs?'md':'lg'} facing={side==='left'?'right':'left'} animation={busy&&p.id===viewer?'walk':'idle'}/></div><RockCompanion player={p} side={side}/>
          {p.immuneDamageNext&&<div className="combat-immunity" title="Immune"/>}
          {event?.target===p.id&&<VfxAnimationPlayer activeVfx={{id:event.id,effect:event.effect,target:'center',size:buffs?120:180}}/>}
        </div>
        <div className="combat-equipment"><img src={p.weapon.image} alt=""/><span>{en?p.weapon.name:p.weapon.nameVi}<small>{en?CLASS_DEFINITIONS[p.classType].name:CLASS_DEFINITIONS[p.classType].nameVi} · {p.weapon.tier}</small></span></div>
        <div className="combat-stats"><b>{p.d12Charge??0} PTS</b>{p.weapon.id==='revolver'&&<span>◈ {p.bullets??6}/6</span>}{p.burnTicks? <span title={en?'Burn turns remaining':'Số lượt thiêu đốt còn lại'}>🔥 {p.burnTicks}</span>:null}{p.panicTurns?<span title="Panic −5 ATK">⚠ {p.panicTurns}</span>:null}{p.lockedSkill&&p.skillLockTurn===s.round?<span>🔒 S{p.lockedSkill}</span>:null}</div>
        <div className="combat-seat-dice" hidden><span>D6 · {p.id===active.id?s.rolls.join(' + ')||'—':'—'}</span><span>D20 · {p.id===active.id?s.attack??'—':p.id===victim?.id?s.defense??'—':'—'}</span></div>
        {buffs&&<div className="combat-buffs"><BuffCard id={s.extras?.buffs[p.id]?.id??-1} used={s.extras?.buffs[p.id]?.used}/>{s.extras?.bonusBuffs?.[p.id]&&<BuffCard id={s.extras.bonusBuffs[p.id].id} used={s.extras.bonusBuffs[p.id].used}/>}</div>}
      </section>;})}
    </div>
    {event?.nameEn&&<div key={event.id} className="combat-skill-flash"><img src={'/assets/vfx/frames/'+event.effect+'/1.png'} alt=""/>{en?event.nameEn:event.nameVi}</div>}
    <div className="combat-console"><div className="combat-dice-dock">
      <div className="personal-d20"><DiceRoller3D diceType="d20" isRolling={rolling&&s.phase!=='charge'&&(active.id===viewer||s.target===viewer)} targetValue={active.id===viewer?s.attack??null:s.target===viewer?s.defense??null:null} label="D20"/></div>
      <div className="personal-d6"><DiceRoller3D diceType="d6" isRolling={rolling&&s.phase==='charge'&&active.id===viewer} targetValue={active.id===viewer?s.rolls.at(-1)??null:null} label={'D6'+(active.id===viewer&&s.rolls.length?' · '+s.rolls.join('+'):'')}/></div>
      <div className="combat-formula"><b>{s.attack??'—'} <span>⚔</span> {s.defense??'—'}</b><small>{en?'Hit: 15 base + ATK − DEF, then effects':'Trúng: 15 cơ sở + Công − Thủ, rồi áp dụng hiệu ứng'}</small></div>
    </div><div className="combat-command-panel">{children}</div></div>
  </div>;
}
