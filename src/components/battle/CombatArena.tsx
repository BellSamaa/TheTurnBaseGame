'use client';
import {useEffect,useRef,useState} from 'react';
import {useGameStore} from '@/stores/gameStore';
import type {LmsState} from '@/lib/lms';
import {opponentRolls,type OpponentRoll} from '@/lib/opponentRolls';
import {CLASS_DEFINITIONS,MAP_DEFINITIONS} from '@/lib/constants';
import {tx,phaseLabel} from '@/lib/uiLocale';
import {WalletBar} from '@/components/progression/AccountPanel';
import HealthBar from '@/components/ui/HealthBar';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import {RockHealthBar,RockCompanion} from './RockCompanion';
import WeaponStand from './WeaponStand';
import DiceRoller3D from './DiceRoller3D';
import {BuffCard} from './BuffCard';
import VfxAnimationPlayer from './VfxAnimationPlayer';
import {playDiceRollSound,playBattleCue,playBattleEffect} from '@/lib/soundEffects';

/** Presentation only: all values and dice results come from the battle server. */
export default function CombatArena({state:s,viewer,busy=false,title,onSurrender,onBack,buffs=false,stageSequence,children}:{state:LmsState;viewer?:string;busy?:boolean;title:string;onSurrender:()=>void;onBack?:()=>void;buffs?:boolean;stageSequence?:LmsState['phase'][];children:React.ReactNode}){
  const mapId=useGameStore(st=>st.battleState?.mapId)||'castle';
  const map=MAP_DEFINITIONS.find(m=>m.id===mapId)||MAP_DEFINITIONS[0];
  const arenaRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{const parent=arenaRef.current?.parentElement;if(!parent)return;parent.style.setProperty("--battle-map",`url("${map.image.replace(/\.png$/,'.webp')}")`);return()=>{parent.style.removeProperty("--battle-map");};},[map.image]);
  const stages=stageSequence||['attack','defense','charge','charge_defense','skills'];
  const lang=useGameStore(st=>st.settings.language),en=lang==='en';
  const [banner,setBanner]=useState<LmsState['lastEvent']>();
  const [event,setEvent]=useState<LmsState['lastEvent']>(),[rolling,setRolling]=useState(false);
  const seen=useRef(s.lastEvent?.id),lastRoll=useRef('');
  const shownPhase=s.phase==='target'?'attack':s.phase==='clash'?'defense':s.phase==='end'?'skills':s.phase;
  const personalRolls=viewer===s.order[s.active]?s.rolls:viewer===s.target?s.defenderRolls||[]:[];
  const personalD20=viewer===s.order[s.active]?s.attack:viewer===s.target?s.defense:undefined;
  const rollKey=JSON.stringify([s.round,s.active,personalD20,personalRolls]);
  const [rollingDie,setRollingDie]=useState<'d20'|'d6'>('d20');
  const oldRoll=useRef({d20:personalD20,count:personalRolls.length});
  const oldPhase=useRef(shownPhase);
  useEffect(()=>{if(oldPhase.current!==shownPhase){oldPhase.current=shownPhase;playBattleCue(shownPhase==='skills'?'ready':'phase');}},[shownPhase]);
  const otherRolls=opponentRolls(s,viewer),otherRollKey=otherRolls.map(r=>r.key).join('|');
  const seenOtherRolls=useRef(new Set(otherRolls.map(r=>r.key)));
  const [rollAlerts,setRollAlerts]=useState<OpponentRoll[]>([]);
  useEffect(()=>{
    const fresh=otherRolls.filter(r=>!seenOtherRolls.current.has(r.key));
    otherRolls.forEach(r=>seenOtherRolls.current.add(r.key));
    if(!fresh.length)return;
    if(seenOtherRolls.current.size>200)seenOtherRolls.current=new Set(otherRolls.map(r=>r.key));
    setRollAlerts(fresh);playBattleCue('result');
  },[otherRollKey]);
  useEffect(()=>{if(!rollAlerts.length)return;const timer=setTimeout(()=>setRollAlerts([]),4200);return()=>clearTimeout(timer);},[rollAlerts]);
  const viewerIndex=Math.max(0,s.players.findIndex(p=>p.id===viewer));
  const displayPlayers=[...s.players.slice(viewerIndex),...s.players.slice(0,viewerIndex)];
  const active=s.players.find(p=>p.id===s.order[s.active])!,victim=s.players.find(p=>p.id===s.target);
  useEffect(()=>{if(!s.lastEvent||seen.current===s.lastEvent.id)return;seen.current=s.lastEvent.id;setEvent(s.lastEvent);!s.lastEvent.slot&&playBattleEffect(s.lastEvent.effect,false);const t=setTimeout(()=>setEvent(undefined),1800);return()=>clearTimeout(t);},[s.lastEvent?.id]);
  const announcementKey=s.lastEvent?.announcementId||s.lastEvent?.id;
  const seenAnnouncement=useRef(announcementKey);
  useEffect(()=>{
    if(!s.lastEvent?.nameEn||seenAnnouncement.current===announcementKey)return;
    seenAnnouncement.current=announcementKey;setBanner(s.lastEvent);playBattleEffect(s.lastEvent.effect,true);
    const timer=setTimeout(()=>setBanner(undefined),2400);return()=>clearTimeout(timer);
  },[announcementKey]);
  useEffect(()=>{
    const changed=lastRoll.current&&lastRoll.current!==rollKey;
    const added=personalRolls.length>oldRoll.current.count, rolledD20=personalD20!==undefined&&personalD20!==oldRoll.current.d20;
    lastRoll.current=rollKey;oldRoll.current={d20:personalD20,count:personalRolls.length};
    if(!changed||(!added&&!rolledD20)){setRolling(false);return;}
    setRollingDie(added?'d6':'d20');setRolling(true);playDiceRollSound();
    const t=setTimeout(()=>{setRolling(false);playBattleCue('result');},700);return()=>clearTimeout(t);
  },[rollKey]);
  return <div ref={arenaRef} className={'combat-arena battle-balanced '+(buffs?'combat-party':'combat-duel')}>
    <header className="combat-topbar">
      <div className="combat-heading">{onBack&&<button className="combat-back" onClick={onBack}>{en?'← Back':'← Trở lại'}</button>}<div><small>{title}</small><h2>{en?'ROUND':'VÒNG'} {s.round}</h2></div></div>
      <div className="combat-toolbar"><WalletBar/><details className="combat-log"><summary>{en?'Battle log':'Nhật ký'}</summary><div className="combat-log-entries">{(en?s.log:s.logVi||s.log).slice(0,30).map((l,i)=><p key={i}>{tx(l)}</p>)}</div></details><button className="combat-surrender" disabled={busy||!!s.winner} onClick={onSurrender}>{en?'Surrender':'Đầu hàng'}</button></div>
    </header>
    <nav className="combat-phase-bar" aria-label={en?'Battle phases':'Giai đoạn chiến đấu'}>{stages.map((phase,i)=>{
      const labels:Record<string,string>=en?{charge:'D6 · ATK',charge_defense:'D6 · DEF',skills:'SKILL USING',target:'TARGET',attack:'D20 · ATK',defense:'D20 · DEF',clash:'REACTION',end:stageSequence?'SKILLS / END':'END TURN'}:{charge:'D6 · CÔNG',charge_defense:'D6 · THỦ',skills:'DÙNG KỸ NĂNG',target:'MỤC TIÊU',attack:'D20 · CÔNG',defense:'D20 · THỦ',clash:'CAN THIỆP',end:stageSequence?'CHIÊU / KẾT THÚC':'KẾT THÚC'};
      const descriptions:Record<string,string>=en?{charge:'Attacker rolls D6 to charge shared PTS.',charge_defense:'Defender rolls D6 to charge shared PTS.',skills:'Both players may spend shared PTS on skills, then confirm End Turn.',target:'Choose the opponent to attack.',attack:'Attacker rolls D20.',defense:'Defender rolls D20.',clash:'Resolve the hit and available reactions.',end:'Finish available actions, then end the turn.'}:{charge:'Bên công tung D6 để sạc PTS.',charge_defense:'Bên thủ tung D6 để sạc PTS.',skills:'Hai bên dùng chung PTS cho kỹ năng rồi bấm Kết thúc lượt.',target:'Chọn đối thủ để tấn công.',attack:'Người tấn công tung D20.',defense:'Người phòng thủ tung D20.',clash:'Xử lý đòn đánh và phản ứng có thể dùng.',end:'Hoàn tất hành động rồi kết thúc lượt.'};
      return <span key={phase} title={descriptions[phase]} aria-current={shownPhase===phase?'step':undefined} className={shownPhase===phase?'phase-current':stages.indexOf(shownPhase)>i?'phase-complete':''}><i>{i+1}</i><b>{labels[phase]||phaseLabel(phase)}</b></span>;
    })}</nav>
    <div className="combat-result-strip" role="status" aria-live="polite">{rollAlerts.length?<div className="opponent-roll-alerts">{rollAlerts.map(r=><div className="opponent-roll-alert" key={r.key}><span>{tx(r.name)}</span><small>{r.die} · {r.role==='ATK'?(en?'ATK':'CÔNG'):(en?'DEF':'THỦ')}</small><strong>{r.values.join(' + ')}</strong></div>)}</div>:<div key={s.log[0]} className="combat-roll-notice" title={s.log[0]}>{en?s.log[0]:(s.logVi||s.log)[0]}</div>}</div>
    <div className="combat-stage"><img className="battle-background-2d" src={map.image.replace(/\.png$/,'.webp')} alt=""/>
      <div className="combat-vs"><img src="/assets/sprites/ui/frames/battle_vs.png" alt="VS"/><small>{victim?active.name+' → '+victim.name:en?'Choose a target':'Chọn mục tiêu'}</small></div>
      {displayPlayers.map((p,i)=>{const side=i%2===0?'left':'right';return <section key={p.id} className={'combat-seat combat-seat-'+i+(p.id===active.id?' combat-active':'')+(p.hp<=0?' combat-out':'')}>
        {p.id!==viewer&&<div className="opponent-roll-badge">{otherRolls.filter(r=>r.playerId===p.id).map(r=><span key={r.key} title={r.name+' · '+r.die+' '+r.role}><small>{r.die}</small><b>{r.values.join('+')}</b></span>)}</div>}
        <div className="combat-name"><b>{p.id==='pve_bot'?tx(p.name):p.name}</b><small>{p.id===viewer?(en?'YOU':'BẠN'):p.hp<=0?(en?'ELIMINATED':'ĐÃ BỊ LOẠI'):p.id===active.id?'ATK':p.id===victim?.id?'DEF':''}</small></div>
        <HealthBar current={p.hp} max={p.maxHp}/><RockHealthBar player={p}/>
        <div className="combat-fighter"><WeaponStand weaponId={p.weapon.id} side={side}/><div className="combat-avatar"><CharacterRenderer character={p.character} weapon={p.weapon} size={buffs?'md':'lg'} facing={side==='left'?'right':'left'} animation="idle"/></div><RockCompanion player={p} side={side}/>
          {p.immuneDamageNext&&<div className="combat-immunity" title="Immune"/>}
          {event?.target===p.id&&<div className="combat-hit-overlay"><VfxAnimationPlayer activeVfx={{id:event.id,effect:event.effect,target:'center',size:buffs?120:180}}/></div>}
        </div>
        <div className="combat-equipment"><img src={p.weapon.image} alt=""/><span>{en?p.weapon.name:p.weapon.nameVi}<small>{en?CLASS_DEFINITIONS[p.classType].name:CLASS_DEFINITIONS[p.classType].nameVi} · {p.weapon.tier}</small></span></div>
        <div className="combat-stats"><b>{p.d12Charge??0} PTS</b>{p.weapon.id==='revolver'&&<span>◈ {p.bullets??6}/6</span>}{p.burnTicks? <span title={en?'Burn turns remaining':'Số lượt thiêu đốt còn lại'}>🔥 {p.burnTicks}</span>:null}{p.panicTurns?<span title="Panic −5 ATK">⚠ {p.panicTurns}</span>:null}{p.lockedSkill&&p.skillLockTurn===s.round?<span>🔒 S{p.lockedSkill}</span>:null}</div>
        <div className="combat-seat-dice" hidden><span>D6 · {p.id===active.id?s.rolls.join(' + ')||'—':'—'}</span><span>D20 · {p.id===active.id?s.attack??'—':p.id===victim?.id?s.defense??'—':'—'}</span></div>
        {buffs&&<div className="combat-buffs"><BuffCard id={s.extras?.buffs[p.id]?.id??-1} used={s.extras?.buffs[p.id]?.used}/>{s.extras?.bonusBuffs?.[p.id]&&<BuffCard id={s.extras.bonusBuffs[p.id].id} used={s.extras.bonusBuffs[p.id].used}/>}</div>}
      </section>;})}
    </div>
    {banner?.nameEn&&<div key={banner.id} className="combat-skill-flash"><img src={'/assets/vfx/frames/'+banner.effect+'/1.png'} alt=""/><div><small>{s.players.find(p=>p.id===banner.caster)?.name} · SKILL {banner.slot}</small><strong>{en?banner.nameEn:banner.nameVi}</strong></div><span className="skill-sweep-spark" aria-hidden="true">✦</span></div>}
    <div className="combat-console"><div className="combat-dice-dock">
      <div className="personal-d20"><DiceRoller3D diceType="d20" isRolling={rolling&&rollingDie==='d20'} targetValue={personalD20??null} label="D20"/></div>
      <div className="personal-d6"><DiceRoller3D diceType="d6" isRolling={rolling&&rollingDie==='d6'} targetValue={personalRolls.at(-1)??null} label="D6" resultText={personalRolls.length?personalRolls.join(' + '):undefined}/></div>
      <div className="combat-formula"><b>{s.attack??'—'} <span>⚔</span> {s.defense??'—'}</b><small>{en?'Hit: 15 base + ATK − DEF, then effects':'Trúng: 15 cơ sở + Công − Thủ, rồi áp dụng hiệu ứng'}</small></div>
    </div><div className="combat-command-panel">{children}</div></div>
  </div>;
}
