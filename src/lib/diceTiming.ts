import type { PlayerState } from '@/types/game';

export type DiceTimingState = {
  round: number;
  role: 'attack' | 'defense';
  startedAt: number;
  quality?: number;
  position?: number;
};

export function timingPosition(elapsed: number) {
  const progress = Math.max(0, elapsed) / 550 % 2;
  return progress <= 1 ? progress : 2 - progress;
}

export function updateDiceTiming(player: PlayerState, round: number, role: 'attack' | 'defense', now: number, elapsedMs?:number) {
  const current = player.diceTiming;
  if (current?.round === round && current.role === role) {
    if (current.quality !== undefined) return;
    const elapsed=Number.isFinite(elapsedMs)?Math.max(0,Math.min(elapsedMs!,now-current.startedAt+250)):now-current.startedAt;
    current.position = timingPosition(elapsed);
    current.quality = Math.max(0, 1 - Math.abs(timingPosition(elapsed) * 2 - 1));
    return;
  }
  player.diceTiming = { round, role, startedAt: now };
}

export function rollTimedD20(player: PlayerState, round: number, role: 'attack' | 'defense', roll: () => number) {
  const timing = player.diceTiming;
  if (timing?.round !== round || timing.role !== role || timing.quality === undefined) return roll();
  const bonus = (role==='defense'?.2:.45) * timing.quality;
  delete player.diceTiming;
  return Math.random() < .05 + bonus ? 20 : 1 + Math.floor(Math.random() * 19);
}

export function timeLmsRoll(state: import('./lms').LmsState, actor: string, now: number, elapsedMs?:number) {
  const player = state.players.find(p => p.id === actor && p.hp > 0);
  if (!player || state.winner) throw Error('Timing is unavailable.');
  const attack = state.phase === 'initiative'
    ? !state.initiative?.some(roll => roll.id === actor)
    : state.phase === 'attack' && state.order[state.active] === actor;
  const defense = state.phase === 'defense' && state.target === actor;
  if ((!attack && !defense) || (attack && player.boxerAttackRound === state.round && (player.boxerAttackRolls?.length ?? 0) > 0)) {
    throw Error('Use timing before rolling D20.');
  }
  updateDiceTiming(player, state.round, attack ? 'attack' : 'defense', now, elapsedMs);
}

/** Dungeon alone: a perfect Focus gives a 80% total chance of rolling 18–20. */
export function rollDungeonD20(player:PlayerState,round:number,role:'attack'|'defense',bonusChance=0,roll=()=>1+Math.floor(Math.random()*20)){
 const timing=player.diceTiming;
 const focused=timing?.round===round&&timing.role===role&&timing.quality!==undefined;
 if(focused){delete player.diceTiming;const chance=Math.max(0,Math.min(1,.15+(role==='defense'?.25:.65)*timing.quality!+bonusChance));return Math.random()<chance?18+Math.floor(Math.random()*3):1+Math.floor(Math.random()*17);}
 if(!bonusChance)return roll();
 return Math.random()<Math.max(0,Math.min(1,.05+bonusChance))?20:1+Math.floor(Math.random()*19);
}
