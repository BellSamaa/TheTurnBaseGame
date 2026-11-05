'use client';

import {useGameStore} from '@/stores/gameStore';
import type { PlayerState } from '@/types/game';

export function hasLivingRock(player: PlayerState) {
  return ['spirit_stone', 'pet_rock'].includes(player.weapon.id) && (player.petRockHp ?? 0) > 0;
}

export function RockHealthBar({ player }: { player: PlayerState }) {
  const round=useGameStore(st=>st.battleState?.lms?.round||st.battleState?.currentTurn||1);
  if (!hasLivingRock(player)) return null;
  const max=25;
  const hp = Math.min(max, Math.max(0, player.petRockHp ?? 0));
  return <div className="rock-health" aria-label={`${player.name} — Rock`}>
    <div className="rock-health-label"><span>ROCK {player.petRockEnraged&&round<=(player.petRockEnrageUntilRound??0)?" · RAGE "+((player.petRockEnrageUntilRound??round)-round+1)+"R · 5 DMG":""}</span><span>{hp}/{max}</span></div>
    <div className="rock-health-track" role="progressbar" aria-label={`${player.name} — Rock HP`} aria-valuemin={0} aria-valuemax={max} aria-valuenow={hp}>
      <div className={hp <= 10 ? 'rock-health-fill rock-health-low' : 'rock-health-fill'} style={{ width: `${hp / max * 100}%` }} />
    </div>
  </div>;
}

export function RockCompanion({ player, side }: { player: PlayerState; side: 'left' | 'right' }) {
  if (!hasLivingRock(player)) return null;
  return <div className={`rock-companion rock-companion-${side}`} aria-label={`${player.name} — Pet Rock`}>
    <img src={player.weapon.image} alt="Pet Rock" width={52} height={52} />
    <span aria-hidden="true" />
  </div>;
}
