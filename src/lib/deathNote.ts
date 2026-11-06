import type {PlayerState} from '@/types/game';
import {weaponState,queueWeaponEvent} from './weaponUpdateState';
export function deathNoteMode(player:PlayerState,round:number){
 const state=player.weaponUpdate;
 return state?.deathHiddenReady?2:1;
}
export function judgementAttack(attacker:PlayerState,target:PlayerState,hit:boolean,round:number){
 const trial=target.weaponUpdate?.judgement;
 if(!trial||trial.owner!==attacker.id)return undefined;
 if(trial.lastAttackRound===round)return {damage:0,resolved:false,hits:trial.hits,attacksLeft:trial.attacksLeft};
 trial.lastAttackRound=round;
 trial.attacksLeft--;
 if(hit)trial.hits++;
 const resolved=trial.hits>=2||trial.attacksLeft<=0;
 const damage=!resolved?0:trial.hits>=2?target.hp:trial.hits===1?Math.ceil(target.hp/2):Math.min(20,target.hp);
 if(resolved){delete weaponState(target).judgement;queueWeaponEvent(attacker,target,'dn:purge',damage);}
 return {damage,resolved,hits:trial.hits,attacksLeft:trial.attacksLeft};
}
