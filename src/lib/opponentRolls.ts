import type {LmsState} from './lms';
export interface OpponentRoll {key:string;playerId:string;name:string;die:'D20'|'D6';role:'ATK'|'DEF';values:number[]}
/** Read shared results, never locally generate an opponent's dice. */
export function opponentRolls(state:LmsState,viewer?:string):OpponentRoll[]{
 const out:OpponentRoll[]=[];
 for(const [id,role,d20,d6] of [[state.order[state.active],'ATK',state.attack,state.rolls],[state.target,'DEF',state.defense,state.defenderRolls||[]]] as const){
  if(!id||id===viewer)continue;
  const player=state.players.find(p=>p.id===id);if(!player)continue;
  for(const [die,values] of [['D20',d20===undefined?[]:[d20]],['D6',d6]] as const){
   if(!values.length)continue;
   out.push({key:[state.round,state.active,id,role,die,...values].join(':'),playerId:id,name:player.name,die,role,values:[...values]});
  }
 }
 return out;
}
