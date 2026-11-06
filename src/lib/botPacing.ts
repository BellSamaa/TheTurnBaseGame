import {presentationDuration} from './skillMotion';
import type { PveState } from './pve';
import { opponentRolls } from './opponentRolls';

export const PVE_BOT_RESULT_MS = 4200;

export function pveFrameHold(previous: PveState | undefined, next: PveState) {
  if (!previous) return 0;
  const state = next.combat;
  const before = previous.combat;
  if(state.lastEvent&&state.lastEvent.id!==before.lastEvent?.id)return Math.max(state.lastEvent.caster==='pve_bot'?3400:1100,presentationDuration(state.lastEvent));
  const oldRolls = new Set(opponentRolls(before).map(roll => roll.key));
  if (opponentRolls(state).some(roll => roll.playerId === 'pve_bot' && !oldRolls.has(roll.key))) {
    return PVE_BOT_RESULT_MS;
  }
  if (state.lastEvent?.caster === 'pve_bot' && state.lastEvent.id !== before.lastEvent?.id) return 3400;
  const oldDice = JSON.stringify([before.attack, before.defense, before.rolls, before.defenderRolls]);
  const newDice = JSON.stringify([state.attack, state.defense, state.rolls, state.defenderRolls]);
  return oldDice === newDice ? 0 : 1100;
}
