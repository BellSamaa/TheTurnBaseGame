import type {PlayerState} from '@/types/game';
import {activeWeather,weaponState,takeArmorAndSummons,queueWeaponEvent} from './weaponUpdateState';
import {applyOpponentDamage} from './combatDamage';
const rnd=()=>Math.random();const die=(n:number)=>1+Math.floor(rnd()*n);
export function outgoingDamage(p:PlayerState,amount:number,round:number){return Math.max(0,amount-((p.weaponUpdate?.weakUntil??0)>=round?7:0));}
export function prepareWeaponCharge(p:PlayerState,round:number){const s=weaponState(p);if(s.slowChargeRound!==round){s.slowChargeRound=round;s.slowChargeBlocked=((s.slowUntil??0)>=round&&rnd()<.05)||((s.chargeBlockUntil??0)>=round&&rnd()<(s.chargeBlockChance??.1));}return !!s.slowChargeBlocked;}
export function chargeWeaponRoll(p:PlayerState,value:number,round:number){const s=weaponState(p);if(prepareWeaponCharge(p,round))return 0;if((s.luckUntil??0)>=round&&rnd()<.8)return Math.min(value,die(2));return value;}
export function shieldCharge(p:PlayerState,value:number){if(p.weapon.id==='shield'&&value===4&&(p.d12Charge??0)>=2){p.d12Charge!-=2;weaponState(p).shieldDefenses=2;(weaponState(p).events??=[]).push({effect:'wu1:shield_proc',target:p.id,text:p.name+' · Fortify: +2 DEF for 2 defenses. [-2 PTS]',textVi:p.name+' · Gia Cố: +2 Thủ trong 2 lượt thủ. [-2 PTS]'});}}
export function weaponD20(p:PlayerState,value:number,role:'attack'|'defense',round:number,foe?:PlayerState){
 const s=weaponState(p),weather=activeWeather(p,round);if(s.lastD20Round===round&&s.lastD20Role===role)return value;s.lastD20Round=round;s.lastD20Role=role;

 const thunder=['thunder_spear','dual_spears'].includes(p.weapon.id),fire=p.weapon.id==='kagutsuchi';
 if((weather?.kind==='rain'||weather?.kind==='superconduct')&&(thunder||fire)&&rnd()<(thunder?.1:.05))value=Math.max(value,die(20));
 if(weather?.kind==='superconduct'&&p.weapon.id==='dual_spears'&&role==='attack'&&rnd()<.2)value=10+Math.floor(rnd()*11);
 if(role==='attack'&&(s.chronoRerollAttacks??0)>0){const previous=value;value=die(20);s.chronoRerollAttacks!--;(s.events??=[]).push({effect:'time_reroll',target:p.id,text:p.name+' · Fate Seal repeats D20 ATK: '+previous+' → '+value,textVi:p.name+' · Phong Ấn tung lại D20 Công: '+previous+' → '+value});}
 if(p.weapon.id==='infinity_ring'&&(s.akaiUntil??0)>=round&&s.akaiRound!==round&&foe){s.akaiRound=round;if(rnd()<.05){const lost=applyOpponentDamage(foe,outgoingDamage(p,5,round),round);queueWeaponEvent(p,foe,'void_red_echo',lost);s.akaiProcs=(s.akaiProcs||0)+1;s.nextNormalEffect='wu1:void_red_echo';}}
 return value;
}
export function normalSetup(a:PlayerState,d:PlayerState,atk:number,def:number,round:number){
 const s=weaponState(a),v=weaponState(d);let cancel=false,dodge=false;
 if((s.frozenAttacks??0)>0){s.frozenAttacks!--;cancel=true;}
 if((s.paralysisAttacks??0)>0){s.paralysisAttacks!--;if(rnd()<(s.paralysisChance??.05))cancel=true;}
 if((v.shieldDefenses??0)>0){def+=2;v.shieldDefenses!--;}
 if((v.queenDefenseTurns??0)>0){def=Math.max(0,def-3);v.queenDefenseTurns!--;}
 if((v.freezeDefense??0)>0){v.freezeDefense!--;if(rnd()<(v.freezeDefenseChance??.1))def=0;}
 if(atk>def&&(v.dodgeHits??0)>0){v.dodgeHits!--;dodge=rnd()<.5;}
 const cleave=(s.cleaveAttacks??0)>0;if(cleave){s.cleaveAttacks!--;(s.events??=[]).push({effect:'wu1:white_cross',target:d.id,text:a.name+' · Cleave enchant activates on '+d.name+'.',textVi:a.name+' · Bát cường hóa kích hoạt lên '+d.name+'.'});}
 return {atk,def,cancel,dodge,cleave};
}
export function normalReactions(a:PlayerState,d:PlayerState,hit:boolean,damage:number,defDie:number,round:number){
 const s=weaponState(a),v=weaponState(d),weather=activeWeather(a,round);
 if(hit)v.lastSuccessfulDamage=damage;
 if((v.slashDefenses??0)>0){v.slashDefenses!--;if(hit){const n=applyOpponentDamage(a,outgoingDamage(d,3,round),round);queueWeaponEvent(d,a,'white_triple',n);}else if(!v.slashMissTriggered){const n=applyOpponentDamage(a,outgoingDamage(d,7,round),round);queueWeaponEvent(d,a,'white_flurry',n);v.slashMissTriggered=true;}}
 if(hit&&(v.nailHits??0)>0){v.nailHits!--;const n=applyOpponentDamage(a,outgoingDamage(d,3,round),round);queueWeaponEvent(d,a,'doll_counter',n);}
 if(hit&&(v.earthReflects??0)>0){v.earthReflects!--;const n=applyOpponentDamage(a,outgoingDamage(d,Math.round(damage*2/3),round),round);queueWeaponEvent(d,a,'earth_shield',n);}
 if(hit&&['snow','superconduct'].includes(activeWeather(a,round)?.kind||'')&&['ice_spear','dual_spears'].includes(a.weapon.id)&&rnd()<.15)weaponState(d).frozenAttacks=1;
 if(a.weapon.id==='kagutsuchi'&&weather?.kind==='rain'&&rnd()<.1){const n=applyOpponentDamage(d,outgoingDamage(a,3,round),round);queueWeaponEvent(a,d,'rain_counter',n);}
 if(d.weapon.id==='kagutsuchi'&&activeWeather(d,round)?.kind==='rain'&&rnd()<.1){const n=applyOpponentDamage(a,outgoingDamage(d,defDie>15?Math.ceil(defDie/2):defDie,round),round);queueWeaponEvent(d,a,'rain_counter',n);}
}
export function tickWeaponRound(players:PlayerState[],round:number,scope:'round'|'summons'='round',canTarget?:(owner:PlayerState,target:PlayerState)=>boolean,healingScale?:(owner:PlayerState)=>number){
 const events:{caster:string;target:string;effect:string;text:string;textVi:string}[]=[];
 for(const p of players){const s=weaponState(p);s.summons=s.summons?.filter(x=>x.hp>0&&x.activeUntil>=round);if(p.hp<=0){s.summons=[];continue;}if(scope==='round'){if(s.lastRoundTick===round)continue;s.lastRoundTick=round;if((s.anchorUntil??Infinity)<round){delete s.anchor;delete s.anchorUntil;}}
 const emit=(target:PlayerState,effect:string,n:number)=>events.push({caster:p.id,target:target.id,effect:'wu1:'+effect,text:p.name+' · '+effect+': '+n+' damage.',textVi:p.name+' · '+effect+': '+n+' sát thương.'});
 if(scope==='round'){
 if((s.poisonUntil??0)>=round&&(s.poisonStacks??0)>0){const n=applyOpponentDamage(p,s.poisonStacks!,round,false);emit(p,'bee_poison',n);}else s.poisonStacks=0;
 if((s.swarmUntil??0)>=round&&s.swarmOwner){const owner=players.find(x=>x.id===s.swarmOwner);if(owner?.hp){const n=applyOpponentDamage(p,outgoingDamage(owner,die(5),round),round);emit(p,'bee_swarm',n);}}
 if((s.blueUntil??0)>=round&&s.blueOwner){const owner=players.find(x=>x.id===s.blueOwner);if(owner?.hp){s.blueTick=(s.blueTick||0)+1;let damage=5;if(rnd()<.05){if(s.blueTick===1)damage+=5;else if(s.blueTick===2)owner.d12Charge=(owner.d12Charge||0)+5;else if(s.blueTick===3)owner.hp=Math.min(owner.maxHp,owner.hp+10);}const n=applyOpponentDamage(p,outgoingDamage(owner,damage,round),round);emit(p,'lightning_blue',n);}}
 }
 if(scope==='summons')for(const pet of s.summons||[]){if(pet.hp<=0||pet.activeUntil<round||pet.lastActionRound===round)continue;pet.lastActionRound=round;const foes=players.filter(x=>x.id!==p.id&&x.hp>0&&(!canTarget||canTarget(p,x))),foe=foes[Math.floor(rnd()*foes.length)];if(pet.kind==='mermaid'){const heal=Math.min(Math.round(3*(healingScale?.(p)??1)),p.maxHp-p.hp);p.hp+=heal;events.push({caster:p.id,target:p.id,effect:'wu1:water_orb',text:p.name+' · Mermaid heals '+heal+' HP.',textVi:p.name+' · Nhân Ngư hồi '+heal+' HP.'});}else if(foe){if(pet.kind==='golem'){emit(foe,'earth_shield',applyOpponentDamage(foe,outgoingDamage(p,2,round),round));}else if(pet.kind==='fire_person'&&!pet.exploded&&rnd()<.1){pet.exploded=true;pet.hp=0;foe.burnTicks=5;foe.burnDmgPerTurn=1;weaponState(foe).burnOwner=p.id;emit(foe,'fire_bomb',applyOpponentDamage(foe,outgoingDamage(p,5,round),round));}else if(pet.kind==='niko'&&rnd()<.3){const action=die(3);if(action===1){const n=applyOpponentDamage(foe,outgoingDamage(p,12,round),round);p.hp=Math.min(p.maxHp,p.hp+Math.round(n*(healingScale?.(p)??1)));emit(foe,'life_drain',n);}else if(action===2){const n=applyOpponentDamage(foe,outgoingDamage(p,5,round),round);if(rnd()<.5){foe.burnTicks=5;foe.burnDmgPerTurn=1;}emit(foe,'fire_bomb',n);}else{s.armor=(s.armor||0)+15;s.earthReflects=2;emit(p,'earth_shield',0);}}}}
 s.summons=s.summons?.filter(x=>x.hp>0);
 }
 return events;
}
export function updateNormalDamage(p:PlayerState,damage:number,cleave:boolean,round:number){return outgoingDamage(p,damage+(cleave?4:0),round);}
export function absorbUpdateDamage(p:PlayerState,damage:number){return takeArmorAndSummons(p,damage);}

export function nextWeaponAttacker(players:PlayerState[],current:string,next:string){const p=players.find(p=>p.id===current);if(p&&p.hp>0&&(weaponState(p).extraAttacks??0)>0){weaponState(p).extraAttacks!--;return current;}return next;}
