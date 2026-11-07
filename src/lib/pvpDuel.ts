import {effectDuration} from './skillMotion';
import {recordCombatHit} from './combatHits';
import type { BattleState, BattleLogEntry } from '@/types/game';
import {rollTimedD20,updateDiceTiming} from './diceTiming';
import { calculateDuelCombat, rollD20 } from './battleLogic';
import { clashCanResolve, openDuelClash, submitClashWager } from './duelRules';
import { applyOpponentDamage, recordOpponentDamage } from './combatDamage';
import { normalAttackEffect } from './skillPresentation';
import { prepareWeaponCharge, weaponD20 } from './weaponUpdateHooks';
import { drainWeaponEvents } from './weaponUpdateState';

function settleDefense(state: BattleState, now: number) {
  const firstAttacks = state.attackerId === state.player1.id;
  const attacker = firstAttacks ? state.player1 : state.player2;
  const defender = firstAttacks ? state.player2 : state.player1;
  const attack = (firstAttacks ? state.p1D20 : state.p2D20) ?? 0;
  const defense = (firstAttacks ? state.p2D20 : state.p1D20) ?? 0;
  const round = state.currentTurn;
  const result = calculateDuelCombat(attack, defense, attacker, defender, round, state.duelClash?.attackStake, state.duelClash?.defenseStake);
  recordCombatHit(state,result.damage,attacker.id,defender.id);
  recordOpponentDamage(defender, Math.min(defender.hp, result.damage), round);
  defender.hp = Math.max(0, defender.hp - result.damage);
  const attackSide = firstAttacks ? 'p1' : 'p2';
  const defenseSide = firstAttacks ? 'p2' : 'p1';
  const hitSide = result.counter ? attackSide : defenseSide;
  const damage = result.counter ? result.counterDamage : result.damage;
  const effect = result.counter ? normalAttackEffect(defender.weapon.id,defender) :
    result.isImmune ? 'infinity' : result.isDodged ? 'dodge_attack' :
    result.absorbedByRock ? 'rock_block' : result.damage > 0 ? normalAttackEffect(attacker.weapon.id,attacker) : 'guard';
  const log = (message: string, messageVi: string, type: BattleLogEntry['type'] = 'system') => {
    state.battleLog.unshift({ turn: round, type, timestamp: now, message, messageVi });
  };
  log(result.logTextEn, result.logTextVi, damage > 0 ? 'damage' : 'defend');
  if (result.notice && result.notice.kind !== 'clash') log(result.notice.en, result.notice.vi);
  state.activeSkillBanner = null;
  state.activeVfx = null;
  state.vfxSequence = [{ damage, id: crypto.randomUUID(), effect, target: hitSide, size: 160 }];
  state.damagePopup = {
    id: crypto.randomUUID(), target: hitSide,
    type: result.critical ? 'crit' : damage > 0 ? 'damage' : 'block',
    text: damage > 0 ? `${result.critical ? 'CRIT! ' : ''}-${damage} DMG` : result.isImmune ? 'IMMUNE!' : result.isDodged ? 'EVADED!' : 'BLOCKED!',
  };
  if (result.isHit && attacker.weapon.id === 'spirit_stone' && (attacker.petRockHp ?? 0) > 0 && defender.hp > 0) {
    const petBefore = defender.petRockHp ?? 0;
    const wasImmune = defender.immuneDamageNext;
    const raging = attacker.petRockEnraged && round <= (attacker.petRockEnrageUntilRound ?? 0);
    const rockDamage = applyOpponentDamage(defender, raging ? 5 : 2, round);recordCombatHit(state,rockDamage,attacker.id,defender.id);
    state.vfxSequence.push({ id: crypto.randomUUID(), effect: 'rock_roll', target: defenseSide });
    if ((defender.petRockHp ?? 0) < petBefore) state.vfxSequence.push({ id: crypto.randomUUID(), effect: 'rock_block', target: defenseSide });
    else if (wasImmune && !defender.immuneDamageNext) state.vfxSequence.push({ id: crypto.randomUUID(), effect: 'infinity', target: defenseSide });
    log(`Pet Rock follows its owner: ${rockDamage} damage.`, `Pet Rock đánh phụ ${rockDamage} sát thương.`, 'damage');
  }
  for (const event of drainWeaponEvents([attacker, defender])) {
    if(event.damage)recordCombatHit(state,event.damage,event.caster,event.target);
    state.vfxSequence.push({ id: crypto.randomUUID(), caster:event.caster===state.player1.id?'p1':'p2',damage:event.damage,effect: event.effect, target: event.target === state.player1.id ? 'p1' : 'p2' });
    log(event.text, event.textVi);
  }
  prepareWeaponCharge(attacker, round);
  prepareWeaponCharge(defender, round);
  state.duelNotice = result.notice;
  state.duelClash = undefined;
  state.animationUntil=now+(state.vfxSequence||[]).reduce((n,e)=>n+effectDuration(e.effect),0);
  state.turnStep = 'd6_atk';
  if (attacker.hp <= 0 || defender.hp <= 0) {
    state.phase = 'game_over';
    state.winnerId = attacker.hp <= 0 && defender.hp <= 0 ? 'draw' : attacker.hp <= 0 ? defender.id : attacker.id;
  }
  return state;
}

export function rollDuelDefense(input: BattleState, actor: string, now = Date.now()) {
  if (input.turnStep !== 'd20_def' || input.winnerId) throw Error('Defense roll is unavailable.');
  const state = structuredClone(input);
  const firstAttacks = state.attackerId === state.player1.id;
  const attacker = firstAttacks ? state.player1 : state.player2;
  const defender = firstAttacks ? state.player2 : state.player1;
  if (actor !== defender.id) throw Error('Only the defender can roll defense.');
  const attack = firstAttacks ? state.p1D20 : state.p2D20;
  if (attack == null) throw Error('The attack roll is missing.');
  const defense = weaponD20(defender, rollTimedD20(defender,state.currentTurn,'defense',rollD20), 'defense', state.currentTurn, attacker);
  if (firstAttacks) state.p2D20 = defense;
  else state.p1D20 = defense;
  state.battleLog.unshift({ turn:state.currentTurn, type:'defend', timestamp:now, message:`${defender.name} rolls D20 DEF: ${defense}`, messageVi:`${defender.name} tung D20 Thủ: ${defense}` });
  state.duelClash = openDuelClash(attack, defense, defender.id, now);
  state.duelNotice = undefined;
  state.revision = (input.revision ?? 0) + 1;
  if (state.duelClash) {
    state.turnStep = 'clash';
    state.activeSkillBanner = null;
    state.activeVfx = null;
    state.vfxSequence = [];
    state.damagePopup = null;
    return state;
  }
  return settleDefense(state, now);
}

export function timeDuelRoll(input: BattleState, actor: string, now = Date.now(), elapsedMs?:number) {
  const next = structuredClone(input);
  const player = [next.player1,next.player2].find(p=>p.id===actor);
  const attack = input.turnStep==='d20_atk' && actor===input.attackerId;
  const defense = input.turnStep==='d20_def' && actor!==input.attackerId;
  if(!player||input.winnerId||(!attack&&!defense)||(attack&&player.boxerAttackRound===input.currentTurn&&(player.boxerAttackRolls?.length??0)>0))throw Error('Use timing before rolling D20.');
  updateDiceTiming(player,input.currentTurn,attack?'attack':'defense',now,elapsedMs);
  next.revision=(input.revision??0)+1;
  return next;
}

export function resolveDuelClash(input: BattleState, now = Date.now(), submission?: {actor: string; stake: unknown}) {
  const clash = input.duelClash;
  if (!clash || input.turnStep !== 'clash' || input.winnerId) throw Error('No clash is open.');
  const next = structuredClone(input);
  if (submission && now < clash.deadline) {
    const actor = [input.player1, input.player2].find(player => player.id === submission.actor);
    if (!actor) throw Error('Only duel participants can wager.');
    next.duelClash = submitClashWager(clash, input.attackerId, actor, submission.stake);
    if (next.duelClash === clash) return input;
  }
  if (clashCanResolve(next.duelClash!, now)) settleDefense(next, now);
  else if (!submission) return input;
  next.revision = (input.revision ?? 0) + 1;
  return next;
}
