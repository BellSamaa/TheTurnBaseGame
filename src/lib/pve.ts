import {createLms,lmsAction,type LmsState} from './lms';
import type {RoomParticipant} from './serverDb';
import {PVE_WEAPONS,pveReward} from './progression';
export interface PveState {rulesVersion?:number;stage:number;combat:LmsState;reward:ReturnType<typeof pveReward>}
export function createPve(hero:RoomParticipant,stage=1):PveState{
 const weaponId=PVE_WEAPONS[Math.min(7,stage-1)];
 const combat=createLms([hero,{...hero,id:'pve_bot',name:'Tầng '+stage+' · '+weaponId,classType:'warrior',weaponId}],true);
 combat.order=[hero.id,'pve_bot'];combat.active=0;combat.target='pve_bot';combat.players[1].hp=combat.players[1].maxHp=150+15*(stage-1);
 combat.extras!.suddenRound=999;Object.values(combat.extras!.buffs).forEach(b=>{b.used=true;b.id=-1;});
 return {rulesVersion:3,stage,combat,reward:pveReward(stage)};
}
export function advancePve(input:PveState,actor:string,move:string,args:Parameters<typeof lmsAction>[3]={}):PveState{
 const out=structuredClone(input);out.combat=lmsAction(out.combat,actor,move,move==='target'?{...args,target:'pve_bot'}:args);
 for(let step=0;step<30;step++){
  let s=out.combat;if(s.phase==='finished')break;
  const bot=s.players.find(p=>p.id==='pve_bot')!,active=s.order[s.active];
  if(s.phase==='clash'){s.deadline=0;out.combat=lmsAction(s,s.players.find(p=>p.hp>0)!.id,'resolve');continue;}
  if(s.phase==='defense'&&s.target==='pve_bot'){out.combat=lmsAction(s,'pve_bot','defend');continue;}
  if(s.phase==='charge_defense'&&s.target==='pve_bot'){out.combat=lmsAction(s,'pve_bot','charge');continue;}
  if(s.phase==='skills'){
   if(s.skillDone?.includes('pve_bot'))break;
   for(const slot of [1,2] as const){
    const forms=bot.weapon.skill1.triggerNumber;
    try{out.combat=lmsAction(out.combat,'pve_bot','skill',{target:actor,slot,form:slot===1&&Array.isArray(forms)?forms[0]:slot===2&&bot.weapon.id==='fire_headband'?20:slot===2&&bot.weapon.id==='infinity_ring'?1:undefined});}catch{}
    if(out.combat.phase==='finished')break;
   }
   if(out.combat.phase==='skills'){out.combat=lmsAction(out.combat,'pve_bot','end');continue;}
   if(out.combat.phase==='finished')break;
  }
  if(active!=='pve_bot')break;
  if(s.phase==='charge'){out.combat=lmsAction(s,'pve_bot','charge');continue;}
  if(s.phase==='target'){
   out.combat=lmsAction(out.combat,'pve_bot','target',{target:actor});continue;
  }
  if(s.phase==='attack'){out.combat=lmsAction(s,'pve_bot','attack');continue;}
  if(s.phase==='end'){out.combat=lmsAction(s,'pve_bot','end');continue;}
  break;
 }
 return out;
}

// A saved run is a snapshot, not the current account loadout.
export function pveNeedsLoadoutRefresh(state:PveState,hero:RoomParticipant){
 const p=state.combat.players.find(p=>p.id===hero.id);
 return state.rulesVersion!==3||!p||p.weapon.id!==hero.weaponId||p.classType!==hero.classType||JSON.stringify(p.character)!==JSON.stringify(hero.character);
}
