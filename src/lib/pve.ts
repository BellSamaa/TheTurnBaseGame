import {createLms,lmsAction,type LmsState} from './lms';
import type {RoomParticipant} from './serverDb';
import {PVE_WEAPONS,pveReward} from './progression';
import {skillCost} from './chargedSkills';
export interface PveState {stage:number;combat:LmsState;reward:ReturnType<typeof pveReward>}
export function createPve(hero:RoomParticipant,stage=1):PveState{
 const weaponId=PVE_WEAPONS[Math.min(7,stage-1)];
 const combat=createLms([hero,{...hero,id:'pve_bot',name:'Tầng '+stage+' · '+weaponId,classType:'warrior',weaponId}],true);
 combat.order=[hero.id,'pve_bot'];combat.active=0;combat.players[1].hp=combat.players[1].maxHp=150+15*(stage-1);
 combat.extras!.suddenRound=999;Object.values(combat.extras!.buffs).forEach(b=>{b.used=true;b.id=-1;});
 return {stage,combat,reward:pveReward(stage)};
}
export function advancePve(input:PveState,actor:string,move:string,args:Parameters<typeof lmsAction>[3]={}):PveState{
 const out=structuredClone(input);out.combat=lmsAction(out.combat,actor,move,move==='target'?{...args,target:'pve_bot'}:args);
 for(let step=0;step<30;step++){
  let s=out.combat;if(s.phase==='finished')break;
  const bot=s.players.find(p=>p.id==='pve_bot')!,active=s.order[s.active];
  if(s.phase==='clash'){s.deadline=0;out.combat=lmsAction(s,s.players.find(p=>p.hp>0)!.id,'resolve');continue;}
  if(s.phase==='defense'&&s.target==='pve_bot'){out.combat=lmsAction(s,'pve_bot','defend');continue;}
  if(active!=='pve_bot')break;
  if(s.phase==='charge'){out.combat=lmsAction(s,'pve_bot','charge');continue;}
  if(s.phase==='target'){
   const slot=(bot.d12Charge??0)>=skillCost(bot,2)&&bot.weapon.id!=='spirit_stone'?2:1;
   const forms=bot.weapon.skill1.triggerNumber;
   try{if((bot.d12Charge??0)>=skillCost(bot,slot))out.combat=lmsAction(s,'pve_bot','skill',{target:actor,slot,form:slot===1&&Array.isArray(forms)?forms[0]:slot===2&&bot.weapon.id==='fire_headband'?20:slot===2&&bot.weapon.id==='infinity_ring'?1:undefined});}catch{}
   if(out.combat.phase==='finished')break;
   out.combat=lmsAction(out.combat,'pve_bot','target',{target:actor});continue;
  }
  if(s.phase==='attack'){out.combat=lmsAction(s,'pve_bot','attack');continue;}
  if(s.phase==='end'){out.combat=lmsAction(s,'pve_bot','end');continue;}
  break;
 }
 return out;
}
