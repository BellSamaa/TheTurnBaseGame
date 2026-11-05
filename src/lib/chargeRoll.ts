import {d6Allowance,decideMageBonus} from './classMechanics';
import type { BattleState } from '@/types/game';
import { CLASS_DEFINITIONS } from './constants';
import { chargeSkillPoints } from './chargedSkills';

// One click rolls one die. Keep the phase until this player's allowance is used.
export function applyChargeRoll(state: BattleState, isP1: boolean, roll: number): BattleState | null {
  const player = isP1 ? state.player1 : state.player2;
  const attacking = state.attackerId === player.id;
  if (state.phase === 'game_over' || state.turnStep !== (attacking ? 'd6_atk' : 'd6_def') || !Number.isInteger(roll) || roll < 1 || roll > 6) return null;
  const key = isP1 ? 'player1' : 'player2';
  const previous = state.d6Results?.[key] ?? [];
  const charged=chargeSkillPoints(player,[roll],state.currentTurn);
  const allowance=d6Allowance(charged,state.currentTurn);
  if (previous.length >= allowance) return null;
  const rolls = [...previous, roll];
  return { ...state,
    [key]: charged,
    d6Results: { player1: state.d6Results?.player1 ?? [], player2: state.d6Results?.player2 ?? [], [key]: rolls },
    [isP1 ? 'p1D6' : 'p2D6']: rolls.reduce((sum, value) => sum + value, 0),
    turnStep: rolls.length < allowance ? state.turnStep : attacking ? 'd6_def' : 'd12',
  };
}
