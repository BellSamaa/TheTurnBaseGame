import type {PlayerState} from '@/types/game';
/** Snapshot the Mage proc on the first D6 of each turn, never on render/poll. */
export function decideMageBonus(p:PlayerState,round:number,rng:()=>number=Math.random):PlayerState{return p.classType==='mage'&&p.mageBonusRound!==round?{...p,mageBonusRound:round,mageBonusD6:rng()<.55}:p;}
export function d6Allowance(p:PlayerState,round:number){return 1+Number(p.classType==='mage'&&p.mageBonusRound===round&&p.mageBonusD6);}
/** +3 below 30%; another +1 for each additional 5 percentage points lost. */
export function warriorBonus(p:PlayerState|undefined){if(!p||p.classType!=='warrior'||p.hp<=0||p.maxHp<=0||p.hp/p.maxHp>=.3)return 0;return 3+Math.floor((30-p.hp/p.maxHp*100)/5);}
export function attackDice(p:PlayerState,roll:()=>number){const first=roll();return p.classType==='boxer'?Math.max(first,roll()):first;}

/** Persist the first Boxer die so each click rolls exactly once. */
export function recordAttackRoll(p:PlayerState,round:number,value:number){
 const previous=p.boxerAttackRound===round?p.boxerAttackRolls||[]:[];
 const rolls=p.classType==='boxer'?[...previous,value].slice(0,2):[value];
 return {player:{...p,boxerAttackRound:round,boxerAttackRolls:rolls},value:Math.max(...rolls),done:rolls.length>=(p.classType==='boxer'?2:1),rolls};
}
