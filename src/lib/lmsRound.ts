import {activateBuff,LMS_BUFFS} from './lmsBuffs';
import {createLms,lmsAction,tickLms,type LmsState} from './lms';
import type {RoomParticipant} from './serverDb';
import {chargeSkillPoints,castChargedSkill} from './chargedSkills';
import {CLASS_DEFINITIONS} from './constants';
import {rollD6,rollD20} from './battleLogic';
export function createRoundLms(players:RoomParticipant[]){const s=createLms(players);s.turnFlow=3;s.roundCharges={};s.endVotes=[];return s;}
function finish(s:LmsState){const alive=s.players.filter(p=>p.hp>0);if(alive.length<=1){s.winner=alive[0]?.id||'draw';s.phase='finished';}}
function nextRound(s:LmsState,now:number){
 // Reuse round-boundary bombs, storm, burn and round-30 card logic once.
 const legacy=structuredClone(s);legacy.turnFlow=2;legacy.phase='end';if(legacy.extras!.flags['reverseTie'])legacy.players.reverse();legacy.active=legacy.extras!.direction===1?legacy.order.length-1:0;
 let next=lmsAction(legacy,legacy.order[legacy.active],'end',{},now);
 next.turnFlow=3;next.round=s.round+1;next.initiative=[];next.active=0;next.attack=undefined;next.defense=undefined;next.target=undefined;next.rolls=[];next.defenderRolls=[];next.roundCharges={};next.endVotes=[];next.skillDone=[];next.endDeadline=undefined;next.stageDone=[];next.stageDeadline=undefined;next.lastEvent=undefined;
 if(!next.winner){next.phase='initiative';next.rollDeadline=now+10000;}return next;
}
export function roundLmsAction(input:LmsState,actor:string,action:string,args:Parameters<typeof lmsAction>[3]={},now=Date.now()):LmsState{
 let s=structuredClone(input);const user=s.players.find(p=>p.id===actor);if(!user||user.hp<=0||s.winner)throw Error('Không thể hành động');
 if(action==='buff'&&s.phase==='buffs'&&s.stageDone?.includes(actor))throw Error('Bạn đã xong giai đoạn này');
 if(action==='buff'){
  const card=args.buffSlot==='bonus'?s.extras?.bonusBuffs?.[actor]:s.extras?.buffs[actor];activateBuff(s,actor,args);s.log.unshift(user.name+' · '+LMS_BUFFS[card!.id]);s.logVi?.unshift(user.name+' · '+LMS_BUFFS[card!.id]);for(const dead of s.players.filter(p=>p.hp<=0&&!s.extras!.eliminated.includes(p.id))){s.extras!.eliminated.push(dead.id);if(card!.id===8&&dead.id!==actor){const hp=Math.min(30,user.maxHp-user.hp);user.hp+=hp;user.d12Charge=(user.d12Charge||0)+5;s.extras!.lastKill={killer:actor,round:s.round,hp,pts:5};}}finish(s);
  if(s.phase==='defense')s.rollDeadline=now+10000;
  if(!s.winner&&input.phase==='buffs'){(s.stageDone??=[]).push(actor);advanceStage(s,now);}s.revision++;return s;
 }
 if(action==='defend'){if(s.phase!=='defense'||s.extras!.flags['buffDefense']!==actor)throw Error('LMS chỉ có Defense khi dùng buff Ảo Ảnh Kép');s.defense=Math.max(rollD20(),rollD20());delete s.extras!.flags['buffDefense'];s.phase='clash';s.deadline=now+5000;s.rollDeadline=undefined;s.log.unshift(user.name+' Defense buff D20: '+s.defense);s.revision++;return s;}
 if(action==='clash')throw Error('Can thiệp PTS đã được bỏ');
 if(['skills','buffs'].includes(s.phase)&&s.stageDone?.includes(actor)&&['skill','buff','charge','end','next_stage'].includes(action))throw Error('Bạn đã xong giai đoạn này');
 if((action==='end'||action==='next_stage')&&['skills','buffs'].includes(s.phase)){
  (s.stageDone??=[]).push(actor);s.revision++;advanceStage(s,now);return s;
 }
 if(action==='charge'&&s.phase==='skills'){
  const rolls=(s.roundCharges??={})[actor]??=[];if(rolls.length>=1+CLASS_DEFINITIONS[user.classType].extraD6Rolls)throw Error('Đã tung đủ D6');
  const roll=rollD6();rolls.push(roll);Object.assign(user,chargeSkillPoints(user,[roll],s.round));s.log.unshift(user.name+' D6 '+roll+' → '+user.d12Charge+' PTS');s.logVi?.unshift(user.name+' D6 '+roll+' → '+user.d12Charge+' PTS');s.revision++;return s;
 }
 if(action==='end'){
  if(s.phase!=='end'||s.endVotes?.includes(actor))throw Error('Chưa đến bước kết thúc hoặc đã xác nhận');
  (s.endVotes??=[]).push(actor);s.revision++;return s.players.filter(p=>p.hp>0).every(p=>s.endVotes!.includes(p.id))?nextRound(s,now):s;
 }
 if(action==='buff'&&!['buffs','clash','attack','defense','target'].includes(s.phase))throw Error('Dùng bài ở giai đoạn Buff hoặc đúng thời điểm phản ứng');
 if(action==='skill'&&s.phase!=='skills')throw Error('Chưa đến giai đoạn kỹ năng');
 if(action==='skill'&&(s.roundCharges?.[actor]?.length||0)<1+CLASS_DEFINITIONS[user.classType].extraD6Rolls)throw Error('Tung D6 trước khi dùng kỹ năng');
 const legacy=structuredClone(s);legacy.turnFlow=2;
 if(action==='target'&&s.phase==='target'){
  let next=lmsAction(legacy,actor,action,args,now);next.attack=s.initiative?.find(r=>r.id===actor)?.roll;next.phase='clash';next.defense=0;next.deadline=now+5000;if(next.extras!.flags['aoe:'+actor]){next.remainingTargets=next.players.filter(p=>p.hp>0&&p.id!==actor&&p.id!==args.target).map(p=>p.id);delete next.extras!.flags['aoe:'+actor];}next.rollDeadline=now+10000;next.turnFlow=3;return next;
 }
 // All living players can use skills. The temporary defender authorizes the actor in the legacy engine.
 if(action==='skill'){legacy.target=actor===s.order[s.active]?(args.target||s.target):actor;legacy.skillDone=[];}
 if(s.phase==='buffs')legacy.phase='end';
 let next=lmsAction(legacy,actor,action,args,now);next.turnFlow=3;
 if(action==='skill'){
  next.target=s.target;
  if(args.slot===2){for(const original of s.players.filter(p=>p.id!==actor&&p.id!==args.target))Object.assign(next.players.find(p=>p.id===original.id)!,original);}
  if(args.slot===1){
   const first=s.players.find(p=>p.id===args.target)!;const sample=first&&castChargedSkill(user,first,1,s.round,args.form,args.lockSlot);
   if(sample&&(sample.damage>0||(sample.opponent.burnTicks||0)>(first.burnTicks||0))){
    for(const foe of s.players.filter(p=>p.hp>0&&p.id!==actor&&p.id!==args.target)){const cast=castChargedSkill(user,foe,1,s.round,args.form,args.lockSlot);if(cast){Object.assign(next.players.find(p=>p.id===foe.id)!,cast.opponent);if(next.lastEvent)next.lastEvent.cues!.push({effect:next.lastEvent.effect,target:foe.id});}}
   }
  }
  for(const dead of next.players.filter(p=>p.hp<=0&&!next.extras!.eliminated.includes(p.id))){next.extras!.eliminated.push(dead.id);const killer=next.players.find(p=>p.id===actor)!;if(killer.hp>0&&dead.id!==actor){killer.hp=Math.min(killer.maxHp,killer.hp+30);killer.d12Charge=(killer.d12Charge||0)+5;}}
  next.winner=undefined;next.phase='skills';finish(next);
 }
 if(action==='buff'&&s.phase==='buffs'&&!next.winner)next.phase='buffs';
 if(action==='resolve'&&!next.winner&&next.phase!=='defense'){next.phase='skills';next.roundCharges={};next.rollDeadline=undefined;next.stageDone=[];next.stageDeadline=now+10000;}
 if(action==='surrender'&&!next.winner){if(s.phase==='end'&&next.players.filter(p=>p.hp>0).every(p=>next.endVotes?.includes(p.id)))return nextRound(next,now);if(actor===s.order[s.active]){next.active=next.order.findIndex(id=>next.players.some(p=>p.id===id&&p.hp>0));if(s.phase!=='initiative'){next.phase='skills';next.roundCharges??={};}}}
 if(!next.winner&&['skills','buffs'].includes(s.phase)&&((action==='skill'&&s.phase==='skills')||(action==='buff'&&s.phase==='buffs'))){(next.stageDone??=[]).push(actor);advanceStage(next,now);}
 if(action==='surrender'&&['skills','buffs'].includes(next.phase))advanceStage(next,now);
 return next;
}
function advanceStage(s:LmsState,now:number){if(s.winner||!s.players.filter(p=>p.hp>0).every(p=>s.stageDone?.includes(p.id)))return;s.phase=s.phase==='skills'?'buffs':'end';s.stageDone=[];s.rollDeadline=undefined;if(s.phase==='end'){s.endVotes=[];s.endDeadline=now+30000;s.stageDeadline=undefined;}else s.stageDeadline=now+10000;}
export function roundLmsTick(input:LmsState,now=Date.now()):LmsState{
 if(input.winner)return input;
 if(input.phase==='defense'&&input.extras?.flags['buffDefense']){return now>=(input.rollDeadline??Infinity)?roundLmsAction(input,String(input.extras.flags['buffDefense']),'defend',{},now):input;}
 if(input.phase==='end'&&now>=(input.endDeadline??Infinity))return nextRound(input,now);
 if(['skills','buffs'].includes(input.phase)){
  if(!input.stageDeadline){const s=structuredClone(input);s.stageDeadline=now+10000;s.stageDone??=[];s.revision++;return s;}
  if(now<input.stageDeadline)return input;
  const s=structuredClone(input);
  // Preserve this round's charge opportunity for players who skip or time out.
  if(s.phase==='skills')for(const p of s.players.filter(p=>p.hp>0&&!s.stageDone?.includes(p.id))){const rolls=(s.roundCharges??={})[p.id]??=[];while(rolls.length<1+CLASS_DEFINITIONS[p.classType].extraD6Rolls){const roll=rollD6();rolls.push(roll);Object.assign(p,chargeSkillPoints(p,[roll],s.round));}}
  s.stageDone=s.players.filter(p=>p.hp>0).map(p=>p.id);advanceStage(s,now);s.revision++;return s;
 }
 const legacy=structuredClone(input);legacy.turnFlow=2;const next=tickLms(legacy,now);if(next===legacy)return input;
 next.turnFlow=3;if(input.phase==='clash'&&!next.winner&&next.phase!=='defense'){next.phase='skills';next.roundCharges={};next.rollDeadline=undefined;next.stageDone=[];next.stageDeadline=now+10000;}return next;
}
