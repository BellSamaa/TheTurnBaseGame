import {roundLmsAction,roundLmsTick} from './lmsRound';
import {skillPresentation,skillEffectPlan,normalAttackEffect} from './skillPresentation';
import {translateText} from './localeText';
import {activateBuff,type LmsExtras} from './lmsBuffs';
import type { PlayerState } from '@/types/game';
import type { RoomParticipant } from './serverDb';
import { CLASS_DEFINITIONS, WEAPON_DEFINITIONS } from './constants';
import { calculateD20Combat, rollD20, rollD6 } from './battleLogic';
import { castChargedSkill, chargeSkillPoints } from './chargedSkills';
import { applyOpponentDamage, recordOpponentDamage } from './combatDamage';

export interface LmsState {
  lastEvent?: {id:string;announcementId?:string;cues?:{effect:string;target:string}[];effect:string;caster:string;target:string;nameEn?:string;nameVi?:string;slot?:1|2};
  rollDeadline?:number;
  initiative?: {id:string;roll:number}[];
  extras?: LmsExtras; remainingTargets?: string[];
  turnFlow?:2|3;roundCharges?:Record<string,number[]>;endVotes?:string[];endDeadline?:number; defenderRolls?:number[]; skillDone?:string[];
  players: PlayerState[]; order: string[]; active: number; round: number;
  phase: 'initiative' | 'charge' | 'charge_defense' | 'skills' | 'buffs' | 'target' | 'attack' | 'defense' | 'clash' | 'end' | 'finished';
  target?: string; attack?: number; defense?: number; deadline?: number;
  rolls: number[]; log: string[]; logVi?:string[]; winner?: string; revision: number;
}
export function createLms(participants: RoomParticipant[], duel = false): LmsState {
  if ((participants.length < (duel?2:3)) || participants.length > 4) throw Error('LMS cần 3–4 người');
  const players = participants.map(p => ({ id:p.id,name:p.name,character:p.character,classType:p.classType,
    weapon:WEAPON_DEFINITIONS[p.weaponId],hp:Math.round((duel?150:200)*CLASS_DEFINITIONS[p.classType].hpModifier),maxHp:Math.round((duel?150:200)*CLASS_DEFINITIONS[p.classType].hpModifier),
    skillCharge:0,d12Charge:0,isAttacker:false,petRockHp:0,bullets:6 }));
  const initiative = duel?players.map(p=>({id:p.id,roll:rollD20()})).sort((a,b)=>b.roll-a.roll):[];
  return {players,rollDeadline:duel?undefined:Date.now()+10000,initiative,order:duel?initiative.map(p=>p.id):players.map(p=>p.id),active:0,round:1,turnFlow:2,phase:duel?'attack':'initiative',target:duel?players.find(p=>p.id!==initiative[0].id)!.id:undefined,rolls:[],defenderRolls:[],skillDone:[],revision:0,
    extras:{buffs:Object.fromEntries(players.map(p=>[p.id,{id:Math.floor(Math.random()*20),used:false,revealed:false}])),flags:{},bombs:[],direction:1,suddenRound:8,eliminated:[]},
    log:initiative.map(p=>players.find(x=>x.id===p.id)!.name+' · Initiative D20: '+p.roll),
    logVi:initiative.map(p=>players.find(x=>x.id===p.id)!.name+' · D20 khởi đầu: '+p.roll)};
}
export function lmsAction(input:LmsState, actor:string, action:string, args:{target?:string;slot?:1|2;form?:number;lockSlot?:1|2;delta?:number;choice?:string;buffSlot?:'initial'|'bonus'}={}, now=Date.now()):LmsState {
  if(input.turnFlow===3)return roundLmsAction(input,actor,action,args,now);
  const s=structuredClone(input), user=s.players.find(p=>p.id===actor);
  if(!user || (user.hp<=0 && !(action==='end'&&actor===s.order[s.active])) || s.phase==='finished') throw Error('Không thể hành động');
  const attacker=s.players.find(p=>p.id===s.order[s.active])!;
  const target=s.players.find(p=>p.id===s.target);
  s.players.forEach(p=>{p.isAttacker=s.phase!=='initiative'&&p.id===attacker.id;});
  const add=(text:string,en?:string)=>{s.logVi??=[...s.log];s.log.unshift(en||translateText(text,'en'));s.logVi.unshift(text);};
  const completeInitiative=()=>{
    if(s.players.filter(p=>p.hp>0).every(p=>s.initiative?.some(r=>r.id===p.id))){
      s.order=[...s.players].sort((a,b)=>(s.initiative?.find(r=>r.id===b.id)?.roll??-1)-(s.initiative?.find(r=>r.id===a.id)?.roll??-1)).map(p=>p.id);
      s.active=0;s.phase='target';s.players.forEach(p=>{p.isAttacker=p.id===s.order[0];});
      const first=s.players.find(p=>p.id===s.order[0])!;
      add(first.name+' có D20 khởi đầu cao nhất, được chọn mục tiêu.',first.name+' has the highest opening D20 and chooses a target.');
    }
  };
  if(s.phase==='initiative'&&action!=='surrender'){
    if(action!=='initiative')throw Error('Wait for every player to roll opening D20');
    if(s.initiative?.some(r=>r.id===actor))throw Error('Opening D20 already rolled');
    const roll=rollD20();(s.initiative??=[]).push({id:actor,roll});
    add(user.name+' · D20 khởi đầu: '+roll,user.name+' · Opening D20: '+roll);
    completeInitiative();armLmsRollTimer(s,now,input);s.revision++;return s;
  }
  const finish=()=>{
    const killer=action==='skill'?user:attacker;
    for(const p of s.players.filter(p=>p.hp<=0)) if(!s.extras!.eliminated.includes(p.id)) {
      s.extras!.eliminated.push(p.id);
      if(killer.hp>0 && p.id!==killer.id && (['resolve','skill'].includes(action)||(action==='buff'&&(args.buffSlot==='bonus'?s.extras!.bonusBuffs?.[actor]?.id:s.extras!.buffs[actor]?.id)===8))) {
        const rewardHp=Math.min(30,killer.maxHp-killer.hp);killer.hp+=rewardHp;killer.d12Charge=(killer.d12Charge??0)+5;
        s.extras!.lastKill={killer:killer.id,round:s.round,hp:rewardHp,pts:5};add(killer.name+' hạ gục '+p.name+': +30 HP, +5 PTS');
      }
    }
    const alive=s.players.filter(p=>p.hp>0);if(alive.length<=1){s.winner=alive[0]?.id??'draw';s.phase='finished';}};
  if(action==='surrender'){user.hp=0;add(user.name+' đã đầu hàng.',user.name+' surrendered.');finish();if(!s.winner&&input.phase==='initiative')completeInitiative();else if(!s.winner&&(actor===attacker.id||actor===target?.id))s.phase='end';}
  else if(action==='buff'){activateBuff(s,actor,args);finish();}
  else if(action==='resolve') {
    if(s.phase!=='clash'||now<(s.deadline??Infinity)||!target) throw Error('Chờ hết 5 giây can thiệp');
    const result=calculateD20Combat(s.attack!,s.defense!,CLASS_DEFINITIONS[attacker.classType],CLASS_DEFINITIONS[target.classType],attacker,target);
    const flags=s.extras!.flags;let damage=result.damage;
    if(flags['double:'+attacker.id])damage*=2;
    if(flags['shield:'+target.id]){attacker.hp=Math.max(0,attacker.hp-Math.floor(damage/2));damage=0;delete flags['shield:'+target.id];}
    if(flags['insurance:'+target.id]){damage=Math.min(15,damage);target.d12Charge=(target.d12Charge??0)+3;delete flags['insurance:'+target.id];}
    if(flags['phoenix:'+target.id]&&damage>=target.hp){damage=Math.max(0,target.hp-1);target.d12Charge=(target.d12Charge??0)+20;delete flags['phoenix:'+target.id];}
    const lost=Math.min(target.hp,damage);target.hp=Math.max(0,target.hp-damage);recordOpponentDamage(target,lost,s.round);
    for(const p of s.players)if(flags['watch:'+p.id]){p.d12Charge=(p.d12Charge??0)+Math.floor(lost/5);delete flags['watch:'+p.id];}
    if((attacker.petRockHp??0)>0&&target.hp>0)applyOpponentDamage(target,2,s.round);
    if((attacker.panicTurns??0)>0)attacker.panicTurns!--;
    s.lastEvent={id:crypto.randomUUID(),effect:result.isImmune?'infinity':result.isDodged?'dodge_attack':result.absorbedByRock?'rock_block':result.isHit?normalAttackEffect(attacker.weapon.id):'guard',caster:attacker.id,target:target.id};
    add(result.logTextVi,result.logTextEn);
    add('Sát thương cuối: '+lost+' HP');
    s.phase=s.turnFlow===2&&target.hp>0&&attacker.hp>0?'charge':'end';finish();
    if(!s.winner && s.remainingTargets?.length){s.target=s.remainingTargets.shift();s.defense=undefined;s.phase='defense';}
  } else if(action==='clash') {
    if(s.extras?.silencedRound===s.round||s.phase!=='clash'||now>=(s.deadline??0)||(user.d12Charge??0)<3||![1,-1].includes(args.delta??0))throw Error('Can thiệp cần 3 PTS trong 5 giây');
    user.d12Charge!-=3;s.attack=Math.max(1,Math.min(20,s.attack!+args.delta!));add(user.name+' can thiệp Công '+(args.delta!>0?'+1':'−1'));
  } else if(action==='defend') {
    if(s.phase!=='defense'||target?.id!==actor)throw Error('Chưa đến lượt phòng thủ');
    s.defense=rollD20();if(user.classType==='boxer')s.defense=Math.max(s.defense,rollD20());s.phase='clash';s.deadline=now+5000;add(user.name+' Thủ '+s.defense);
  } else if(action==='charge'&&s.phase==='charge_defense') {
    if(target?.id!==actor)throw Error('Chưa đến lượt D6 phòng thủ');
    const roll=rollD6();(s.defenderRolls??=[]).push(roll);Object.assign(user,chargeSkillPoints(user,[roll],s.round));add(user.name+' D6 '+roll+' → '+user.d12Charge+' PTS');
    if(s.defenderRolls.length>=1+CLASS_DEFINITIONS[user.classType].extraD6Rolls)s.phase='skills';
  } else {
    const skillActor=s.turnFlow===2&&s.phase==='skills'&&(actor===attacker.id||actor===target?.id);
    if(actor!==attacker.id&&!skillActor)throw Error('Chưa đến lượt bạn');
    if(skillActor&&s.skillDone?.includes(actor))throw Error('Bạn đã kết thúc lượt kỹ năng');
    if(action==='charge') {
      if(s.phase!=='charge')throw Error('Đã sạc đủ');
      const roll=rollD6();s.rolls.push(roll);Object.assign(user,chargeSkillPoints(user,[roll],s.round));add(user.name+' D6 '+roll+' → '+user.d12Charge+' PTS');
      if(s.rolls.length>=1+CLASS_DEFINITIONS[user.classType].extraD6Rolls)s.phase=s.turnFlow===2?'charge_defense':'target';
    } else if(action==='target') {
      if(s.phase!=='target'||!s.players.some(p=>p.id===args.target&&p.id!==actor&&p.hp>0))throw Error('Chọn người còn sống');
      s.target=args.target;s.phase='attack';
    } else if(action==='skill') {
      if(!(s.turnFlow===2?s.phase==='skills':['target','attack'].includes(s.phase))||(args.slot!==1&&args.slot!==2))throw Error('Dùng skill sau khi cả hai đã tung D6');
      const victim=s.players.find(p=>p.id===args.target&&p.hp>0&&p.id!==actor);if(!victim)throw Error('Chọn mục tiêu skill');
      if(s.extras?.silencedRound===s.round)throw Error('Vòng này cấm kỹ năng');
      const cast=castChargedSkill(user,victim,args.slot,s.round,args.form,args.lockSlot);if(!cast)throw Error('Chưa đủ điều kiện dùng skill');
      if((user.weapon.id==='greatsword'&&args.slot===2)||(user.weapon.id==='staff'&&args.slot===1)){for(const other of s.players.filter(p=>p.id!==user.id&&p.id!==victim.id&&p.hp>0)){const extra=castChargedSkill(user,other,args.slot,s.round,args.form,args.lockSlot);if(extra)Object.assign(other,extra.opponent);}}
      const art=skillPresentation(user,args.slot,args.form);s.lastEvent={id:crypto.randomUUID(),effect:art.effect,caster:user.id,target:art.target==='caster'?user.id:art.target==='center'?'center':victim.id,cues:skillEffectPlan(user,args.slot,args.form).map(c=>({effect:c.effect,target:c.target==='caster'?user.id:c.target==='center'?'center':victim.id})),nameEn:art.nameEn,nameVi:art.nameVi,slot:args.slot};
      Object.assign(user,cast.caster);Object.assign(victim,cast.opponent);add(cast.logTextVi,cast.logTextEn);if(victim.hp<=0&&s.target===victim.id){if(s.turnFlow===2)s.phase='end';else{s.target=undefined;s.phase='target';}}finish();
    } else if(action==='attack') {
      if(s.phase!=='attack')throw Error('Chọn mục tiêu trước');
      s.attack=rollD20();if(user.classType==='boxer')s.attack=Math.max(s.attack,rollD20());
      if(user.weapon.id==='revolver'){if((user.bullets??0)<=0)s.attack=0;else user.bullets!--;}
      if(s.extras!.flags['blood:'+actor]){s.attack=20;delete s.extras!.flags['blood:'+actor];}
      if(s.extras!.flags['aoe:'+actor]){const victims=s.players.filter(p=>p.id!==actor&&p.hp>0).map(p=>p.id);s.target=victims.shift();s.remainingTargets=victims;delete s.extras!.flags['aoe:'+actor];}
      s.phase='defense';add(user.name+' Công '+s.attack);
    } else if(action==='end') {
      if(s.turnFlow===2&&s.phase==='skills'){
        (s.skillDone??=[]).push(actor);
        const required=[attacker,target].filter(p=>p&&p.hp>0);
        if(required.some(p=>!s.skillDone!.includes(p!.id))){s.revision++;return s;}
        // LMS keeps an explicit end window for Hourglass and end-of-round cards.
        if(s.players.length>2){s.phase='end';s.revision++;return s;}
      }else if(s.phase!=='end')throw Error('Chưa kết thúc đòn đánh');
      s.extras!.lastKill=undefined;
      // Attack/reaction buffs expire with this turn, including a cancelled attack.
      s.extras!.flags={};
      const previousRound=s.round;
      do{s.active=(s.active+s.extras!.direction+s.order.length)%s.order.length;if(s.active===(s.extras!.direction===1?0:s.order.length-1))s.round++;}while(s.players.find(p=>p.id===s.order[s.active])!.hp<=0);
      if(s.round!==previousRound){
        if(previousRound<30&&s.round>=30&&!s.extras!.bonusRound){
          s.extras!.bonusRound=30;
          s.extras!.bonusBuffs=Object.fromEntries(s.players.filter(p=>p.hp>0).map(p=>[p.id,{id:Math.floor(Math.random()*20),used:false,revealed:false}]));
          add('Vòng 30: mỗi người còn sống nhận thêm một buff bí mật.');
        }
        for(const bomb of s.extras!.bombs.filter(b=>b.round<=s.round)){const p=s.players.find(p=>p.id===bomb.target)!;if(p.hp>0)p.hp=Math.max(0,p.hp-40);add('Bom nổ: '+p.name+' −40 HP');}
        s.extras!.bombs=s.extras!.bombs.filter(b=>b.round>s.round);
        if(s.round>=s.extras!.suddenRound){const storm=10+5*(s.round-s.extras!.suddenRound);s.players.filter(p=>p.hp>0).forEach(p=>p.hp=Math.max(0,p.hp-storm));add('Vòng bo: tất cả −'+storm+' HP');}
        s.extras!.flags={};
      }
      finish();if(s.winner){s.revision++;return s;}
      const next=s.players.find(p=>p.id===s.order[s.active])!;
      if((next.burnTicks??0)>0){applyOpponentDamage(next,next.burnDmgPerTurn??1,s.round,false);next.burnTicks!--;}
      if(next.hp<=0){s.phase='end';finish();if(!s.winner){do{s.active=(s.active+s.extras!.direction+s.order.length)%s.order.length;}while(s.players.find(p=>p.id===s.order[s.active])!.hp<=0);}}
      s.turnFlow=2;s.phase=s.players.length===2?'attack':'target';s.rolls=[];s.defenderRolls=[];s.skillDone=[];s.target=s.players.length===2?s.players.find(p=>p.id!==s.order[s.active]&&p.hp>0)?.id:undefined;s.attack=undefined;s.defense=undefined;s.deadline=undefined;finish();
    } else throw Error('Hành động không hợp lệ');
  }
  armLmsRollTimer(s,now,input);s.revision++;return s;
}

function rollStageKey(s:LmsState){return JSON.stringify([s.phase,s.active,s.round,s.target,s.rolls.length,s.defenderRolls?.length]);}
function armLmsRollTimer(s:LmsState,now:number,previous?:LmsState){
 if(!['initiative','attack','defense','charge','charge_defense'].includes(s.phase)){s.rollDeadline=undefined;return;}
 if(!previous||rollStageKey(s)!==rollStageKey(previous)||!s.rollDeadline)s.rollDeadline=now+10000;
}
/** Server clock controls automatic rolls; any connected client can poll safely. */
export function tickLms(input:LmsState,now=Date.now()):LmsState{
 if(input.turnFlow===3)return roundLmsTick(input,now);
 if(input.winner)return input;
 if(input.phase==='clash'&&now>=(input.deadline??Infinity))return lmsAction(input,input.players.find(p=>p.hp>0)!.id,'resolve',{},now);
 if(!['initiative','attack','defense','charge','charge_defense'].includes(input.phase))return input;
 if(!input.rollDeadline){const s=structuredClone(input);armLmsRollTimer(s,now);s.revision++;return s;}
 if(now<input.rollDeadline)return input;
 let s=input;
 if(s.phase==='initiative'){
  for(const p of input.players.filter(p=>p.hp>0&&!input.initiative?.some(r=>r.id===p.id)))s=lmsAction(s,p.id,'initiative',{},now);
  return s;
 }
 const actor=['defense','charge_defense'].includes(s.phase)?s.target!:s.order[s.active];
 return lmsAction(s,actor,s.phase==='attack'?'attack':s.phase==='defense'?'defend':'charge',{},now);
}
