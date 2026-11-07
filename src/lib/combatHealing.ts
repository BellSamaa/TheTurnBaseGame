import type {PlayerState} from '@/types/game';
export function scaledHealingAmount(player:PlayerState,amount:number,multiplier=player.healingMultiplier??1){return Math.max(0,Math.round(amount*multiplier));}
/** Healing modifiers apply once, before the max-HP cap. HP swaps/rewinds are not healing. */
export function healPlayer(player:PlayerState,amount:number,multiplier=player.healingMultiplier??1){
 const gained=Math.min(Math.max(0,player.maxHp-player.hp),scaledHealingAmount(player,amount,multiplier));
 player.hp+=gained;return gained;
}
