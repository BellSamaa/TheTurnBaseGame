import type {PlayerState,BattleState} from '@/types/game';
export function attackerHasActed(attacker:PlayerState,round:number,ended:boolean){return ended||attacker.skill1UsedTurn===round||attacker.skill2UsedTurn===round;}
export function canUsePvpSkill(state:BattleState,actor:string){const attacker=state.player1.id===state.attackerId?state.player1:state.player2;return actor===attacker.id||attackerHasActed(attacker,state.currentTurn,attacker.id===state.player1.id?!!state.p1EndedTurn:!!state.p2EndedTurn);}
