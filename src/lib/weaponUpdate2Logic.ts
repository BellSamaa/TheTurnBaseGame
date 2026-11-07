import {healPlayer} from './combatHealing';
import {weapon2Presentation} from './weaponUpdate2Effects';
import type {PlayerState} from '@/types/game';
import {activeWeather,weaponState,queueWeaponEvent} from './weaponUpdateState';
import {applyOpponentDamage} from './combatDamage';
export const NEW_WEAPON_IDS=new Set(['vine_staff','wind_wand','astghik_staff','musashi']);
export function musashiHidden(p:PlayerState,target:PlayerState,round:number){return p.weapon.id==='musashi'&&activeWeather(p,round)?.kind==='mist'&&(target.weaponUpdate?.musashiMarkUntil??-1)>=round&&(p.weaponUpdate?.musashiSmokeAttacks??0)<=0;}
export function castWeapon2(u:PlayerState,t:PlayerState,slot:1|2,round:number,form=1,bonus=0){
 if(!NEW_WEAPON_IDS.has(u.weapon.id))return;
 const s=weaponState(u),v=weaponState(t);let damage=0,requested=0,effect='';
 const hit=(n:number)=>{requested+=n+bonus;damage+=applyOpponentDamage(t,n+bonus,round,true,u)};
 const heal=(n:number)=>{healPlayer(u,n)};
 const weather=(kind:'rain'|'mist',turns:number)=>{s.weather={kind,until:round+turns,remainingTurns:turns,fresh:true,started:Math.max(Date.now(),s.weather?.started||0,v.weather?.started||0)+1,owner:u.id}};
 if(u.weapon.id==='vine_staff'){hit(5);if(slot===1){v.vineUntil=round+3;v.vineBleedUntil=round+3;v.vineRollRound=undefined;effect='nw:vine_bind'}else{v.sealAttacks=1;effect='nw:skill_seal'}}
 if(u.weapon.id==='wind_wand'){hit(10);if(slot===1){if(form===2){if(Math.random()<.2)v.windSkipNext=true;effect='nw:gale_beam'}else{v.windAttacks=3;v.windChance=.1;effect='nw:tornado'}}else{s.cycloneAttacks=5;effect='nw:storm_armor'}}
 if(u.weapon.id==='astghik_staff'){
  if(slot===1&&form===1){heal(10);s.regenUntil=round+3;effect='nw:water_heal'}
  else if(slot===1){hit(5);s.waterWallAttacks=3;s.wallCollapse=false;effect='nw:water_wall'}
  else{weather('rain',5);v.haloUntil=round+5;v.haloOwner=u.id;effect='nw:water_halo'}
 }
 if(u.weapon.id==='musashi'){
  const mark=(v.musashiMarkUntil??-1)>=round;
  const detonate=()=>{if(mark){hit(5);delete v.musashiMarkUntil;queueWeaponEvent(u,t,'mu:Bleed_Explosion',5)}};
  if(slot===1&&form===1){hit(12);v.musashiMarkUntil=round+5;effect='mu:S1_A_12_Cuts'}
  else if(slot===1&&form===2){hit(10);detonate();effect='mu:S1_B_Dash_Cut'}
  else if(slot===1){hit(6);if(Math.random()<.5){heal(10);s.musashiHealAt=Date.now()}hit(6);detonate();effect='mu:S1_C_Blue_Wave'}
  else if(form===2){hit(30);s.musashiSmokeAttacks=3;effect='mu:S2_B_20_Cuts'}
  else{hit(30);v.musashiMarkUntil=round+5;weather('mist',6);effect='mu:S2_A_Void_Flash'}
 }
 const art=weapon2Presentation(u,slot,form);
 return {damage,requested,piercing:false,die:undefined,effect,refund:0,logTextEn:u.name+' · '+(art?.nameEn||u.weapon.name)+' · '+damage+' damage.',logTextVi:u.name+' · '+(art?.nameVi||u.weapon.nameVi)+' · '+damage+' sát thương.'};
}
/** Called once before an offensive D20, before Boxer rolls or a defender is asked to roll. */
export function prepareWeapon2Attack(p:PlayerState,round:number,foe?:PlayerState){
 const s=weaponState(p);if(s.attackStartRound===round)return s.blockedAttackRound===round;s.attackStartRound=round;
 if((s.sealAttacks??0)>0){s.sealAttacks!--;s.sealActiveRound=round}
 s.critBonus=s.critBonusPending??0;s.critBonusPending=0;s.critBonusRound=round;
 let blocked=!!s.windSkipNext;s.windSkipNext=false;
 if((s.windAttacks??0)>0){s.windAttacks!--;blocked||=Math.random()<(s.windChance??.1)}
 if(blocked){s.blockedAttackRound=round;p.hp=Math.max(0,p.hp-5);queueWeaponEvent(p,p,'nw:d20_lock',5)}
 if(s.wallCollapse&&foe){s.wallCollapse=false;queueWeaponEvent(p,foe,'nw:wall_collapse',applyOpponentDamage(foe,5,round,true,p))}
 if(foe){const v=weaponState(foe);if(v.cycloneRound!==round){v.cycloneRound=round;if((v.cycloneAttacks??0)>0){v.cycloneAttacks!--;v.cycloneActiveRound=round;if(Math.random()<.5){healPlayer(foe,5);queueWeaponEvent(foe,foe,'nw:wind_heal',0)}}}}
 return blocked;
}
export function weapon2Defense(d:PlayerState,hit:boolean,round:number){
 const v=weaponState(d);if(v.waterWallRound!==round){v.waterWallRound=round;if((v.waterWallAttacks??0)>0){v.waterWallAttacks!--;v.waterWallActiveRound=round;if(v.waterWallAttacks===0&&!hit)v.wallCollapse=true}}
 return v.waterWallActiveRound===round;
}
export function weapon2Reactions(a:PlayerState,d:PlayerState,round:number){
 const s=weaponState(a);if(s.v2ReactionRound===round)return;s.v2ReactionRound=round;
 if(a.weapon.id==='musashi'&&(s.musashiSmokeAttacks??0)>0){s.musashiSmokeAttacks!--;if(Math.random()<.5){const effect=Math.random()<.5?'mu:Aura_Extra_White':'mu:Aura_Extra_Black';queueWeaponEvent(a,d,effect,applyOpponentDamage(d,5,round,true,a))}}
}
export function tickWeapon2(players:PlayerState[],round:number,canTarget?:(a:PlayerState,b:PlayerState)=>boolean){
 for(const p of players){const s=weaponState(p);
  if((s.vineBleedUntil??-1)>=round)queueWeaponEvent(p,p,'nw:bleed',applyOpponentDamage(p,1,round,false));
  if(p.weapon.id==='astghik_staff'&&activeWeather(p,round)?.kind==='rain'&&Math.random()<.2){healPlayer(p,5);queueWeaponEvent(p,p,'nw:rain_passive',0)}
  if((s.haloUntil??-1)>=round&&s.haloOwner){const owner=players.find(x=>x.id===s.haloOwner&&x.hp>0);if(owner&&(!canTarget||canTarget(owner,p))&&Math.random()<.5){const branch=Math.floor(Math.random()*3),amount=branch===0?10:branch===1?5:3;const damage=applyOpponentDamage(p,amount,round,true,owner);queueWeaponEvent(owner,p,'nw:halo_rays',damage);if(branch===0)healPlayer(owner,damage);if(branch===1)s.d6OneRound=round;if(branch===2)weaponState(owner).critBonusPending=.1}}
 }
}
