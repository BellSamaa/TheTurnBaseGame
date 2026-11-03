import { applyOpponentDamage, skillIsLocked } from './combatDamage';
import type { PlayerState } from '@/types/game';
import { WEAPON_DEFINITIONS } from './constants';
import { executeSkill1D6, executeSkill2D12, rollD6 } from './battleLogic';

export function skillCost(player: PlayerState, slot: 1 | 2, form?: number) {
  if (player.weapon.id === "fire_headband" && slot === 2) return form === 30 ? 30 : 20;
  const weapon = WEAPON_DEFINITIONS[player.weapon.id] || player.weapon;
  return (slot === 1 ? weapon.skill1 : weapon.skill2).chargeRequired ?? (slot === 1 ? 10 : 20);
}

// Both skills spend the same balance, once, and return immutable player snapshots.
export function castChargedSkill(user: PlayerState, target: PlayerState, slot: 1 | 2, turn: number, form?: number, lockSlot?: 1 | 2) {
  if (skillIsLocked(user, slot, turn)) return null;
  if (slot === 2 && user.weapon.id === "infinity_ring" && ((form != null && form !== 1 && form !== 2) || (form === 2 && lockSlot !== 1 && lockSlot !== 2))) return null;
  if (slot === 1 && user.weapon.id === 'fire_headband' && user.leafSkillReadyTurn !== turn) return null;
  if (slot === 2 && user.weapon.id === "fire_headband" && form !== undefined && form !== 20 && form !== 30) return null;
  const cost = skillCost(user, slot, form);
  const usedTurn = slot === 1 ? user.skill1UsedTurn : user.skill2UsedTurn;
  if ((user.d12Charge ?? 0) < cost || usedTurn === turn || user.hp <= 0 || target.hp <= 0) return null;
  if (slot === 2 && user.weapon.id === 'revolver' && (user.bullets ?? 6) <= 0) return null;
  const caster = structuredClone(user), opponent = structuredClone(target);
  caster.weapon = WEAPON_DEFINITIONS[user.weapon.id] || caster.weapon;
  const forms = caster.weapon.skill1.triggerNumber;
  if (slot === 1 && Array.isArray(forms) && (form == null || !forms.includes(form))) return null;
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
  caster.d12Charge = (user.d12Charge ?? 0) - cost;
  if (slot === 1) caster.skill1UsedTurn = turn;
  else caster.skill2UsedTurn = turn;
  let bonus = 0;
  if ('extraD6Roll' in result && result.extraD6Roll) {
    bonus = rollD6();
    caster.d12Charge += bonus;
  }
  let damage = result.damage;
  if (slot === 2 && user.weapon.id === 'spirit_stone' && caster.hp < user.hp) damage = 0;
  const offensive = damage > 0 || JSON.stringify(opponent) !== JSON.stringify(target);
  const blocked = Boolean(offensive && opponent.dodgeNextSkill);
  if (blocked) {
    // Discard offensive debuffs from the blocked cast, but retain the spent cost.
    Object.assign(opponent, structuredClone(target), { dodgeNextSkill: false });
    damage = 0;
  }
  const rockHpBefore = opponent.petRockHp ?? 0;
  damage = applyOpponentDamage(opponent, damage, turn);
  const rockAbsorbed = rockHpBefore - (opponent.petRockHp ?? 0);
  if (rockAbsorbed > 0) {
    result.logTextEn += ' [Rock absorbs ' + rockAbsorbed + '; ' + opponent.petRockHp + '/50 HP. Owner loses ' + damage + ' HP.]';
    result.logTextVi += ' [Rock đỡ ' + rockAbsorbed + '; còn ' + opponent.petRockHp + '/50 HP. Chủ mất ' + damage + ' HP.]';
  }
  return { caster, opponent, damage, cost, purpleSky,
    logTextEn: result.logTextEn.replace(/rolled (\d+)/gi, 'selected form $1') + (blocked ? ' [BLOCKED]' : '') + ' [-' + cost + ' PTS]' + (bonus ? ' [Reload bonus +' + bonus + ' PTS]' : ''),
    logTextVi: result.logTextVi.replace(/ra mặt (\d+)/gi, 'chọn dạng $1') + ' [-' + cost + ' PTS]' + (bonus ? ' [Nạp đạn +' + bonus + ' PTS]' : '') };
}

// Read the balance BEFORE this round's roll: crossing the threshold with a 2
// does not unlock the skill. A later roll must contain 2 while already funded.
export function chargeSkillPoints(player: PlayerState, rolls: number[], turn: number): PlayerState {
  const before = player.d12Charge ?? 0;
  const points = rolls.reduce((sum, n) => sum + n, 0);
  return { ...player, d12Charge: before + points,
    leafSkillReadyTurn: player.leafSkillReadyTurn === turn || (player.weapon.id === 'fire_headband' && before >= skillCost(player, 1) && rolls.includes(2)) ? turn : undefined };
}
