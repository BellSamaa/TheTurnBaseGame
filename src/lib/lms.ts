import type { PlayerState } from '@/types/game';
import type { RoomParticipant } from './serverDb';
import { CLASS_DEFINITIONS, WEAPON_DEFINITIONS } from './constants';
import { calculateD20Combat, rollD20, rollD6 } from './battleLogic';
import { castChargedSkill, chargeSkillPoints } from './chargedSkills';
import { applyOpponentDamage, recordOpponentDamage } from './combatDamage';

export interface LmsState {
  players: PlayerState[]; order: string[]; active: number; round: number;
  phase: 'charge' | 'target' | 'attack' | 'defense' | 'clash' | 'end' | 'finished';
  target?: string; attack?: number; defense?: number; deadline?: number;
  rolls: number[]; log: string[]; winner?: string; revision: number;
}
export function createLms(participants: RoomParticipant[]): LmsState {
  if (participants.length < 3 || participants.length > 4) throw Error('LMS cần 3–4 người');
  const players = participants.map(p => ({ id:p.id,name:p.name,character:p.character,classType:p.classType,
    weapon:WEAPON_DEFINITIONS[p.weaponId],hp:CLASS_DEFINITIONS[p.classType].baseHp,maxHp:CLASS_DEFINITIONS[p.classType].baseHp,
    skillCharge:0,d12Charge:0,isAttacker:false,petRockHp:0,bullets:6 }));
  const initiative = players.map(p=>({id:p.id,roll:rollD20()})).sort((a,b)=>b.roll-a.roll);
  return {players,order:initiative.map(p=>p.id),active:0,round:1,phase:'charge',rolls:[],revision:0,
    log:initiative.map(p=>players.find(x=>x.id===p.id)!.name+' · D20 khởi đầu: '+p.roll)};
}
export function lmsAction(input:LmsState, actor:string, action:string, args:{target?:string;slot?:1|2;form?:number;lockSlot?:1|2;delta?:number}={}, now=Date.now()):LmsState {
  const s=structuredClone(input), user=s.players.find(p=>p.id===actor);
  if(!user || user.hp<=0 || s.phase==='finished') throw Error('Không thể hành động');
  const attacker=s.players.find(p=>p.id===s.order[s.active])!;
  const target=s.players.find(p=>p.id===s.target);
  const add=(text:string)=>s.log.unshift(text);
  const finish=()=>{const alive=s.players.filter(p=>p.hp>0);if(alive.length===1){s.winner=alive[0].id;s.phase='finished';}};
  if(action==='resolve') {
    if(s.phase!=='clash'||now<(s.deadline??Infinity)||!target) throw Error('Chờ hết 5 giây can thiệp');
    const result=calculateD20Combat(s.attack!,s.defense!,CLASS_DEFINITIONS[attacker.classType],CLASS_DEFINITIONS[target.classType],attacker,target);
    const lost=Math.min(target.hp,result.damage);target.hp=Math.max(0,target.hp-result.damage);recordOpponentDamage(target,lost,s.round);
    if((attacker.petRockHp??0)>0&&target.hp>0)applyOpponentDamage(target,2,s.round);
    add(result.logTextVi);
    if(target.hp<=0){attacker.hp=Math.min(attacker.maxHp,attacker.hp+30);attacker.d12Charge=(attacker.d12Charge??0)+5;add(attacker.name+' hạ gục: +30 HP, +5 PTS');}
    s.phase='end';finish();
  } else if(action==='clash') {
    if(s.phase!=='clash'||now>=(s.deadline??0)||(user.d12Charge??0)<3||![1,-1].includes(args.delta??0))throw Error('Can thiệp cần 3 PTS trong 5 giây');
    user.d12Charge!-=3;s.attack=Math.max(1,Math.min(20,s.attack!+args.delta!));add(user.name+' can thiệp Công '+(args.delta!>0?'+1':'−1'));
  } else if(action==='defend') {
    if(s.phase!=='defense'||target?.id!==actor)throw Error('Chưa đến lượt phòng thủ');
    s.defense=rollD20();if(user.classType==='boxer')s.defense=Math.max(s.defense,rollD20());s.phase='clash';s.deadline=now+5000;add(user.name+' Thủ '+s.defense);
  } else {
    if(actor!==attacker.id)throw Error('Chưa đến lượt bạn');
    if(action==='charge') {
      if(s.phase!=='charge')throw Error('Đã sạc đủ');
      const roll=rollD6();s.rolls.push(roll);Object.assign(user,chargeSkillPoints(user,[roll],s.round));add(user.name+' D6 '+roll+' → '+user.d12Charge+' PTS');
      if(s.rolls.length>=1+CLASS_DEFINITIONS[user.classType].extraD6Rolls)s.phase='target';
    } else if(action==='target') {
      if(s.phase!=='target'||!s.players.some(p=>p.id===args.target&&p.id!==actor&&p.hp>0))throw Error('Chọn người còn sống');
      s.target=args.target;s.phase='attack';
    } else if(action==='skill') {
      if(!['target','attack'].includes(s.phase)||!args.slot)throw Error('Dùng skill trước khi tung Công');
      const victim=s.players.find(p=>p.id===args.target&&p.hp>0&&p.id!==actor);if(!victim)throw Error('Chọn mục tiêu skill');
      const cast=castChargedSkill(user,victim,args.slot,s.round,args.form,args.lockSlot);if(!cast)throw Error('Chưa đủ điều kiện dùng skill');
      Object.assign(user,cast.caster);Object.assign(victim,cast.opponent);add(cast.logTextVi);finish();
    } else if(action==='attack') {
      if(s.phase!=='attack')throw Error('Chọn mục tiêu trước');
      s.attack=rollD20();if(user.classType==='boxer')s.attack=Math.max(s.attack,rollD20());
      if(user.weapon.id==='revolver'){if((user.bullets??0)<=0)s.attack=0;else user.bullets!--;}
      s.phase='defense';add(user.name+' Công '+s.attack);
    } else if(action==='end') {
      if(s.phase!=='end')throw Error('Chưa kết thúc đòn đánh');
      do{s.active=(s.active+1)%s.order.length;if(s.active===0)s.round++;}while(s.players.find(p=>p.id===s.order[s.active])!.hp<=0);
      const next=s.players.find(p=>p.id===s.order[s.active])!;
      if((next.burnTicks??0)>0){applyOpponentDamage(next,next.burnDmgPerTurn??1,s.round,false);next.burnTicks!--;}
      if(next.hp<=0){s.phase='end';finish();if(!s.winner){do{s.active=(s.active+1)%s.order.length;}while(s.players.find(p=>p.id===s.order[s.active])!.hp<=0);}}
      s.phase='charge';s.rolls=[];s.target=undefined;s.attack=undefined;s.defense=undefined;s.deadline=undefined;finish();
    } else throw Error('Hành động không hợp lệ');
  }
  s.revision++;return s;
}
