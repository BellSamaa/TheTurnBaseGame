import {drainWeaponEvents} from './weaponUpdateState';
import {tickWeaponRound} from './weaponUpdateHooks';
import {d6Allowance,decideMageBonus} from './classMechanics';
import type { BattleState } from '@/types/game';
import { CLASS_DEFINITIONS } from './constants';
import { chargeSkillPoints } from './chargedSkills';

// One click rolls one die. Keep the phase until this player's allowance is used.
export function applyChargeRoll(state: BattleState, isP1: boolean, roll: number): BattleState | null {
  state=structuredClone(state);
  const player = isP1 ? state.player1 : state.player2;
  const attacking = state.attackerId === player.id;
  if (state.phase === 'game_over' || state.turnStep !== (attacking ? 'd6_atk' : 'd6_def') || !Number.isInteger(roll) || roll < 1 || roll > 6) return null;
  const key = isP1 ? 'player1' : 'player2';
  const previous = state.d6Results?.[key] ?? [];
  const charged=chargeSkillPoints(player,[roll],state.currentTurn);
  const allowance=d6Allowance(charged,state.currentTurn);
  if (previous.length >= allowance&&allowance>0) return null;
  const rolls = allowance===0?previous:[...previous, charged.weaponUpdate?.lastChargeValue??roll];
  const result:BattleState={ ...state,
    [key]: charged,
    d6Results: { player1: state.d6Results?.player1 ?? [], player2: state.d6Results?.player2 ?? [], [key]: rolls },
    [isP1 ? 'p1D6' : 'p2D6']: rolls.reduce((sum, value) => sum + value, 0),
    turnStep: rolls.length < allowance ? state.turnStep : attacking ? 'd6_def' : 'd12',
  };
  if(result.turnStep==='d12'){for(const e of tickWeaponRound([result.player1,result.player2],state.currentTurn,'summons'))result.battleLog=[{turn:state.currentTurn,type:'system',message:e.text,messageVi:e.textVi,timestamp:Date.now()},...(result.battleLog||[])];}
  const events=drainWeaponEvents([result.player1,result.player2]);for(const e of events){result.battleLog=[{turn:state.currentTurn,type:'system',message:e.text,messageVi:e.textVi,timestamp:Date.now()},...(result.battleLog||[])];result.vfxSequence=[...(result.vfxSequence||[]),{id:crypto.randomUUID(),effect:e.effect,target:e.target===result.player1.id?'p1':'p2'}];}return result;
}
