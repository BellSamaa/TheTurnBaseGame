import type { PlayerState } from '@/types/game';
export function recordOpponentDamage(player: PlayerState, amount: number, turn: number) {
  if (amount <= 0) return;
  player.opponentDamageAmount = (player.opponentDamageTurn === turn ? player.opponentDamageAmount ?? 0 : 0) + amount;
  player.opponentDamageTurn = turn;
}
export function reflectedDamage(player: PlayerState, turn: number) {
  return player.opponentDamageTurn != null && player.opponentDamageTurn >= turn - 1 ? player.opponentDamageAmount ?? 0 : 0;
}
export function skillIsLocked(player: PlayerState, slot: 1 | 2, turn: number) {
  return player.lockedSkill === slot && player.skillLockTurn === turn;
}
// Damage from an opponent (including a companion and burn) consumes immunity once.
export function absorbWithRock(player: PlayerState, amount: number) {
  if (!['spirit_stone', 'pet_rock'].includes(player.weapon.id)) return 0;
  player.petRockHp ??= 0;
  player.petRockHits ??= 0;
  if (amount <= 0 || player.petRockHp <= 0) return 0;
  const absorbed = Math.min(5, amount, player.petRockHp!);
  player.petRockHp! -= absorbed;
  player.petRockHits = (player.petRockHits ?? 0) + 1;
  if (player.petRockHits >= 5) player.petRockEnraged = true;
  return absorbed;
}

export function applyOpponentDamage(player: PlayerState, amount: number, turn: number, directHit = true) {
  if (amount <= 0) return 0;
  if (directHit && player.immuneDamageNext) { player.immuneDamageNext = false; return 0; }
  if (directHit) amount -= absorbWithRock(player, amount);
  const lost = Math.min(player.hp, amount);
  player.hp = Math.max(0, player.hp - amount);
  recordOpponentDamage(player, lost, turn);
  return lost;
}
