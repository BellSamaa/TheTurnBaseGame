import {castUpdateSkill,updateSkillCost,updateSkillReason} from './weaponUpdateCast';
import {weaponState} from './weaponUpdateState';
import {chargeWeaponRoll,shieldCharge,outgoingDamage} from './weaponUpdateHooks';
import {decideMageBonus} from './classMechanics';
import { applyOpponentDamage, skillIsLocked } from './combatDamage';
import type { PlayerState } from '@/types/game';
import { WEAPON_DEFINITIONS } from './constants';
import { executeSkill1D6, executeSkill2D12, rollD6 } from './battleLogic';

export function skillCost(player: PlayerState, slot: 1 | 2, form?: number,round=1) {
  const custom=updateSkillCost(player,slot,round,form);if(custom!=null)return custom;
  if (player.weapon.id === "fire_headband" && slot === 2) return form === 30 ? 30 : 20;
  const weapon = WEAPON_DEFINITIONS[player.weapon.id] || player.weapon;
  return (slot === 1 ? weapon.skill1 : weapon.skill2).chargeRequired ?? (slot === 1 ? 10 : 20);
}

// Both skills spend the same balance, once, and return immutable player snapshots.
export function castChargedSkill(user: PlayerState, target: PlayerState, slot: 1 | 2, turn: number, form?: number, lockSlot?: 1 | 2,resolutionDie?:number) {
  user={...user,petRockEnraged:!!user.petRockEnraged&&turn<=(user.petRockEnrageUntilRound??turn)};
  if(slot===1&&user.weapon.id==='spirit_stone'&&(user.petRockHp??0)>0)return null;
  if (skillIsLocked(user, slot, turn)) return null;
  if (slot === 2 && user.weapon.id === 'spirit_stone' && ((user.petRockHp ?? 0) <= 0||user.petRockEnraged)) return null;
  if (slot === 2 && user.weapon.id === "infinity_ring" && ((form != null && form !== 1 && form !== 2) || (form === 2 && lockSlot !== 1 && lockSlot !== 2))) return null;
  if (slot === 1 && user.weapon.id === 'fire_headband' && user.leafSkillReadyTurn !== turn) return null;
  if (slot === 2 && user.weapon.id === "fire_headband" && form !== undefined && form !== 20 && form !== 30) return null;
  const cost = skillCost(user, slot, form,turn);
  if(updateSkillReason(user,target,slot,form,turn))return null;
  const usedTurn = slot === 1 ? user.skill1UsedTurn : user.skill2UsedTurn;
  if ((user.d12Charge ?? 0) < cost || usedTurn === turn || user.hp <= 0 || target.hp <= 0) return null;
  if (slot === 2 && user.weapon.id === 'revolver' && (user.bullets ?? 6) <= 0) return null;
  const caster = structuredClone(user), opponent = structuredClone(target);
  caster.weapon = WEAPON_DEFINITIONS[user.weapon.id] || caster.weapon;
  const forms = caster.weapon.skill1.triggerNumber;
  const secondForms=caster.weapon.skill2.triggerNumber;if(slot===2&&Array.isArray(secondForms)&&form!=null&&!secondForms.includes(form))return null;
  if (slot === 1 && Array.isArray(forms) && (form == null || !forms.includes(form))) return null;
  const custom=castUpdateSkill(caster,opponent,slot,turn,form,resolutionDie);
  if(custom){if(target.dodgeNextSkill&&!custom.piercing&&(custom.requested>0||target.hp!==opponent.hp||JSON.stringify(target.weaponUpdate||{})!==JSON.stringify(opponent.weaponUpdate||{})||target.burnTicks!==opponent.burnTicks)){Object.assign(opponent,structuredClone(target),{dodgeNextSkill:false});custom.damage=0;}if(user.weapon.id==='death_note'&&slot===2)delete opponent.weaponUpdate?.namedBy;caster.skill1UsedTurn=user.skill1UsedTurn===turn?turn:caster.skill1UsedTurn;caster.skill2UsedTurn=user.skill2UsedTurn===turn?turn:caster.skill2UsedTurn;caster.d12Charge=(user.d12Charge||0)-cost+custom.refund;if(slot===1)caster.skill1UsedTurn=turn;else caster.skill2UsedTurn=turn;return {caster,opponent,damage:custom.damage,cost,purpleSky:false,effect:custom.effect,die:custom.die,logTextEn:custom.logTextEn+' [-'+cost+' PTS]',logTextVi:custom.logTextVi+' [-'+cost+' PTS]'};}
  const result = slot === 1
    ? executeSkill1D6(form ?? rollD6(), caster, opponent, turn)
    : executeSkill2D12(user.weapon.id === "fire_headband" ? cost : 0, caster, opponent, caster.isAttacker);
  const purpleSky = slot === 2 && user.weapon.id === 'infinity_ring' && form === 2;
  if (purpleSky) {
    result.damage = 30;
    opponent.lockedSkill = lockSlot;
    opponent.skillLockTurn = turn + 1;
    result.logTextEn = 'Purple Sky: 30 damage; locks enemy Skill ' + lockSlot + ' next round.';
    result.logTextVi = 'Tử Sắc Thiên Không: 30 sát thương; khóa Skill ' + lockSlot + ' đối thủ ở hiệp kế tiếp.';
  }
  if(slot===1&&user.weapon.id==='infinity_ring'&&form===4)weaponState(caster).akaiUntil=turn+3;
  if(slot===2&&user.weapon.id==='spirit_stone')caster.petRockEnrageUntilRound=turn+5;
  caster.d12Charge = (user.d12Charge ?? 0) - cost;
  if (slot === 1) caster.skill1UsedTurn = turn;
  else caster.skill2UsedTurn = turn;
  let bonus = 0;
  if ('extraD6Roll' in result && result.extraD6Roll) {
    bonus = rollD6();
    caster.d12Charge += bonus;
  }
  let damage = outgoingDamage(caster,result.damage,turn);
  if (slot === 2 && user.weapon.id === 'spirit_stone' && caster.hp < user.hp) damage = 0;
  const offensive = damage > 0 || JSON.stringify(opponent) !== JSON.stringify(target);
  const blocked = Boolean(offensive && opponent.dodgeNextSkill);
  if (blocked) {
    // Discard offensive debuffs from the blocked cast, but retain the spent cost.
    Object.assign(opponent, structuredClone(target), { dodgeNextSkill: false });
    damage = 0;
  }
  const rockHpBefore = opponent.petRockHp ?? 0;
  damage = applyOpponentDamage(opponent, damage, turn,true,caster);
  const rockAbsorbed = rockHpBefore - (opponent.petRockHp ?? 0);
  if (rockAbsorbed > 0) {
    result.logTextEn += ' [Rock absorbs ' + rockAbsorbed + '; ' + opponent.petRockHp + '/25 HP. Owner loses ' + damage + ' HP.]';
    result.logTextVi += ' [Rock đỡ ' + rockAbsorbed + '; còn ' + opponent.petRockHp + '/25 HP. Chủ mất ' + damage + ' HP.]';
  }
  return { caster, opponent, damage, cost, purpleSky,
    logTextEn: result.logTextEn.replace(/rolled (\d+)/gi, 'selected form $1') + (blocked ? ' [BLOCKED]' : '') + ' [-' + cost + ' PTS]' + (bonus ? ' [Reload bonus +' + bonus + ' PTS]' : ''),
    logTextVi: result.logTextVi.replace(/ra mặt (\d+)/gi, 'chọn dạng $1') + ' [-' + cost + ' PTS]' + (bonus ? ' [Nạp đạn +' + bonus + ' PTS]' : '') };
}

// Read the balance BEFORE this round's roll: crossing the threshold with a 2
// does not unlock the skill. A later roll must contain 2 while already funded.
export function chargeSkillPoints(player: PlayerState, rolls: number[], turn: number): PlayerState {
  player=decideMageBonus(structuredClone(player),turn);
  rolls=rolls.map(r=>chargeWeaponRoll(player,r,turn));
  const before = player.d12Charge ?? 0;
  weaponState(player).lastChargeValue=rolls.at(-1);
  const points = rolls.reduce((sum, n) => sum + n, 0);
  const charged={ ...player, d12Charge: before + points,
    leafSkillReadyTurn: player.leafSkillReadyTurn === turn || (player.weapon.id === 'fire_headband' && before >= skillCost(player, 1) && rolls.includes(2)) ? turn : undefined };
  for(const roll of rolls)shieldCharge(charged,roll);return charged;
}
