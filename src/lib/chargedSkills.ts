import type { PlayerState } from '@/types/game';
import { WEAPON_DEFINITIONS } from './constants';
import { executeSkill1D6, executeSkill2D12, rollD6 } from './battleLogic';

export function skillCost(player: PlayerState, slot: 1 | 2) {
  const weapon = WEAPON_DEFINITIONS[player.weapon.id] || player.weapon;
  return (slot === 1 ? weapon.skill1 : weapon.skill2).chargeRequired ?? (slot === 1 ? 10 : 20);
}

// Both skills spend the same balance, once, and return immutable player snapshots.
export function castChargedSkill(user: PlayerState, target: PlayerState, slot: 1 | 2, turn: number, form?: number) {
  const cost = skillCost(user, slot);
  const usedTurn = slot === 1 ? user.skill1UsedTurn : user.skill2UsedTurn;
  if ((user.d12Charge ?? 0) < cost || usedTurn === turn || user.hp <= 0 || target.hp <= 0) return null;
  if (slot === 2 && user.weapon.id === 'revolver' && (user.bullets ?? 6) <= 0) return null;
  const caster = structuredClone(user), opponent = structuredClone(target);
  caster.weapon = WEAPON_DEFINITIONS[user.weapon.id] || caster.weapon;
  const forms = caster.weapon.skill1.triggerNumber;
  if (slot === 1 && Array.isArray(forms) && (form == null || !forms.includes(form))) return null;
  const result = slot === 1
    ? executeSkill1D6(form ?? rollD6(), caster, opponent)
    : executeSkill2D12(0, caster, opponent, caster.isAttacker);
  caster.d12Charge = (user.d12Charge ?? 0) - cost;
  if (slot === 1) caster.skill1UsedTurn = turn;
  else caster.skill2UsedTurn = turn;
  let bonus = 0;
  if ('extraD6Roll' in result && result.extraD6Roll) {
    bonus = rollD6();
    caster.d12Charge += bonus;
  }
  let damage = result.damage;
  if (opponent.dodgeNextSkill) {
    // Discard offensive debuffs from the blocked cast, but retain the spent cost.
    Object.assign(opponent, structuredClone(target), { dodgeNextSkill: false });
    damage = 0;
  } else if (opponent.immuneDamageNext && damage > 0) {
    opponent.immuneDamageNext = false;
    damage = 0;
  }
  opponent.hp = Math.max(0, opponent.hp - damage);
  return { caster, opponent, damage, cost,
    logTextEn: result.logTextEn.replace(/rolled (\d+)/gi, 'selected form $1') + ' [-' + cost + ' PTS]' + (bonus ? ' [Reload bonus +' + bonus + ' PTS]' : ''),
    logTextVi: result.logTextVi.replace(/ra mặt (\d+)/gi, 'chọn dạng $1') + ' [-' + cost + ' PTS]' + (bonus ? ' [Nạp đạn +' + bonus + ' PTS]' : '') };
}
