import {recordCombatHit} from './combatHits';
import {deathNoteMode} from './deathNote';
import {effectFrame} from './weaponUpdateAssets';
import {syncWeather} from './weaponUpdateState';
import {canUsePvpSkill} from './skillPriority';
import type {BattleState} from '@/types/game';
import {castChargedSkill} from './chargedSkills';
import {skillPresentation,skillEffectPlan} from './skillPresentation';

export function castPvpSkill(input:BattleState,actor:string,slot:1|2,form?:number,lockSlot?:1|2):BattleState {
  if(input.winnerId||input.phase==='game_over'||input.turnStep!=='d12'||(slot!==1&&slot!==2))throw Error('Skills are available after charging D6.');
  const isP1=input.player1.id===actor;
  if(!isP1&&input.player2.id!==actor)throw Error('Not a participant');
  if(isP1?input.p1EndedTurn:input.p2EndedTurn)throw Error('Your turn has ended.');
  const user=isP1?input.player1:input.player2,foe=isP1?input.player2:input.player1;
  if(!canUsePvpSkill(input,actor))throw Error('Attacker uses skills first. Wait for their skill or End Turn.');
  if(user.weapon.id==='death_note'&&slot===2)form??=deathNoteMode(user,input.currentTurn);
  const cast=castChargedSkill(user,foe,slot,input.currentTurn,form,lockSlot);
  if(!cast)throw Error('Skill already used, locked, or insufficient PTS.');
  const next=structuredClone(input),art=skillPresentation(user,slot,form),caster=isP1?'p1':'p2',opponent=isP1?'p2':'p1';
  recordCombatHit(next,cast.damage,user.id,foe.id);
  next.player1=isP1?cast.caster:cast.opponent;next.player2=isP1?cast.opponent:cast.caster;syncWeather([next.player1,next.player2]);
  next.activeSkillBanner={id:crypto.randomUUID(),weaponId:user.weapon.id,skillNameEn:art.nameEn+(cast.die?' · D6 '+cast.die:''),skillNameVi:art.nameVi+(cast.die?' · D6 '+cast.die:''),slot,icon:effectFrame(cast.effect||art.effect,1),casterName:user.name,auraColor:art.color};
  const rolledBack=user.weapon.id==='spirit_stone'&&slot===2&&cast.caster.hp<user.hp;
  next.vfxSequence=skillEffectPlan(user,slot,form).map(cue=>({id:crypto.randomUUID(),effect:cast.effect||cue.effect,size:slot===2?180:130,target:cue.target==='caster'||rolledBack?caster:cue.target==='center'?'center':opponent}));
  if(user.weapon.id==='death_note'&&slot===1)next.vfxSequence.unshift({id:crypto.randomUUID(),effect:'wu1:name_write',target:opponent,size:140});
  for(const [show,effect]of [[(foe.petRockHp??0)>(cast.opponent.petRockHp??0),'rock_block'],[foe.immuneDamageNext&&!cast.opponent.immuneDamageNext,'infinity'],[foe.dodgeNextSkill&&!cast.opponent.dodgeNextSkill,'dodge_spell']]as const)if(show)next.vfxSequence.push({id:crypto.randomUUID(),effect,target:opponent,size:140});
  if(cast.purpleSky)next.purpleSky={id:crypto.randomUUID(),startedAt:Date.now()};
  next.battleLog.unshift({turn:input.currentTurn,type:'skill',message:cast.logTextEn,messageVi:cast.logTextVi,timestamp:Date.now()});
  if(next.player1.hp<=0||next.player2.hp<=0){next.winnerId=next.player1.hp<=0?next.player2.id:next.player1.id;next.phase='game_over';}
  next.revision=(input.revision??0)+1;return next;
}

// Legacy dice/turn updates must never roll back an acknowledged skill cast.
export function validatePvpSnapshot(before:BattleState,after:BattleState){
  if(after.currentTurn<before.currentTurn||after.currentTurn>before.currentTurn+1)throw Error('Invalid round transition');
  for(const key of ['player1','player2']as const){
    const a=before[key],b=after[key];
    if(a.id!==b.id||a.weapon.id!==b.weapon.id||a.classType!==b.classType||a.maxHp!==b.maxHp)throw Error('Equipment is fixed for this match');
    for(const field of ['skill1UsedTurn','skill2UsedTurn']as const)if(a[field]!==b[field])throw Error('Skill state changed; synchronize and try again');
  }
}
