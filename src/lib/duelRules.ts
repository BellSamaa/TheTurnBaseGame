import type { PlayerState, WeaponTier } from '@/types/game';

export interface DuelClash {
  score: number;
  defenderId: string;
  deadline: number;
  attackStake?: number;
  defenseStake?: number;
}

export interface DuelNotice {
  id: string;
  kind: 'attack' | 'defense' | 'crit' | 'clash';
  en: string;
  vi: string;
}

export function critChance(tier: WeaponTier) {
  return tier === 'secret' ? 0.75 : tier === 'mythic' ? 0.6 : 0.5;
}

export function openDuelClash(attack: number, defense: number, defenderId: string, now: number): DuelClash | undefined {
  if (attack === defense && attack > 0 && attack < 20) {
    return { score: attack, defenderId, deadline: now + 5000 };
  }
}

export function submitClashWager(clash: DuelClash, attackerId: string, actor: PlayerState, stake: unknown) {
  if (actor.id !== attackerId && actor.id !== clash.defenderId) throw Error('Only duel participants can wager.');
  const side = actor.id === attackerId ? 'attackStake' : 'defenseStake';
  if (clash[side] !== undefined) return clash;
  const points = actor.d12Charge ?? 0;
  if (typeof stake !== 'number' || !Number.isInteger(stake) || stake < 0 || stake > 3 || stake > points) {
    throw Error('Choose an affordable wager from 0 to 3 PTS.');
  }
  return { ...clash, [side]: stake };
}

export function clashCanResolve(clash: DuelClash, now: number) {
  return now >= clash.deadline || (clash.attackStake !== undefined && clash.defenseStake !== undefined);
}

export function rollLuckyAttack(player: PlayerState, roll: () => number, random = Math.random) {
  const first = roll();
  const luck = player.duelLuck?.mode;
  if (!luck || random() >= 0.5) return first;
  const second = roll();
  return luck === 'unlucky' ? Math.max(first, second) : Math.min(first, second);
}

export function recordDuelComparison(attacker: PlayerState, defender: PlayerState, attack: number, defense: number): DuelNotice | undefined {
  const difference = attack - defense;
  const luck = attacker.duelLuck ??= { hits: 0, misses: 0 };
  if (luck.mode === 'unlucky') {
    if (difference > 0) attacker.duelLuck = { hits: 0, misses: 0 };
  } else if (luck.mode === 'lucky') {
    attacker.duelLuck = { hits: 0, misses: 0 };
  } else {
    luck.hits = difference > 0 ? luck.hits + 1 : 0;
    luck.misses = difference < 0 ? luck.misses + 1 : 0;
    if (luck.hits >= 3) luck.mode = 'lucky';
    if (luck.misses >= 3) luck.mode = 'unlucky';
  }
  if (difference <= 15 && difference > -15) return;
  const attacking = difference > 15;
  const winner = attacking ? attacker : defender;
  winner.d12Charge = (winner.d12Charge ?? 0) + 10;
  return {
    id: crypto.randomUUID(),
    kind: attacking ? 'attack' : 'defense',
    en: (attacking ? 'Nice Attack' : 'Nice Defense') + ' · ' + winner.name + ' +10 PTS',
    vi: (attacking ? 'Tấn công xuất sắc' : 'Phòng thủ xuất sắc') + ' · ' + winner.name + ' +10 PTS',
  };
}
