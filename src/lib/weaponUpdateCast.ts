import {deathNoteMode} from './deathNote';
import type {PlayerState} from '@/types/game';
import {activeWeather,weaponState,type WeatherKind} from './weaponUpdateState';
import {applyOpponentDamage} from './combatDamage';
import {UPDATE_IDS} from './weaponUpdateCatalog';
export function updateSkillCost(p:PlayerState,slot:1|2,round:number,form?:number){
 if(p.weapon.id==='death_note'&&slot===2)return (form??deathNoteMode(p,round))===2?20:(form??deathNoteMode(p,round))===3?5:32;
 if(slot===1&&activeWeather(p,round)){if(p.weapon.id==='thunder_spear'&&form!==1&&activeWeather(p,round)?.kind==='rain')return 5;if(p.weapon.id==='ice_spear'&&activeWeather(p,round)?.kind==='snow')return 5;}return undefined;
}
export function updateSkillReason(p:PlayerState,t:PlayerState,slot:1|2,form:number|undefined,round:number){
 const s=p.weaponUpdate||{},v=t.weaponUpdate||{};
 if(s.slowChargeRound===round&&s.slowChargeBlocked)return 'D6 is locked this round; End Turn';
 if(p.weapon.id==='shield'&&slot===1)return 'Automatic · D6 = 4';
 if(p.weapon.id==='king_slasher'&&slot===2&&form===2&&(v.markedBy!==p.id||(v.markUntil??0)<round))return 'Target needs your Flame Mark';
 if(p.weapon.id==='death_note'&&slot===2){const mode=form??deathNoteMode(p,round);if(![1,2,3].includes(mode))return 'Invalid Death Note mode';if(mode===2&&(!s.deathHiddenReady||(s.deathEyeUntil??-1)>=round))return 'Eye unavailable';if(mode===3&&((s.deathEyeUntil??-1)<round||t.weaponUpdate?.judgement))return 'Purging Judgement unavailable';if(mode===1&&v.namedBy!==p.id)return 'Write the target name successfully first';}
 if(p.weapon.id==='thunder_spear'&&slot===1&&form!==1&&activeWeather(p,round)?.kind!=='rain')return 'Rain required';
 if(p.weapon.id==='elemental_rings'&&slot===1&&(s.summons?.filter(x=>x.hp>0).length??0)>=3)return 'Three living summons already';
 return '';
}
export function castUpdateSkill(u:PlayerState,t:PlayerState,slot:1|2,round:number,form?:number,resolutionDie?:number){
 if(u.weapon.id==='chronos_watch'){
  const s=weaponState(u),v=weaponState(t);let damage=0,effect='time_save';
  if(slot===1&&form===2){if(s.anchor&&round<=(s.anchorUntil??0)){const saved=structuredClone(s.anchor);Object.assign(u,saved,{id:u.id,weapon:u.weapon});delete weaponState(u).anchor;delete weaponState(u).anchorUntil;effect='time_erase';}else{const saved=structuredClone(u);delete saved.weaponUpdate?.anchor;s.anchor=saved;s.anchorUntil=round+5;}}
  else if(slot===1&&form===4){v.chronoRerollAttacks=2;v.chronoCaster=u.id;effect='time_reroll';}
  else if(slot===1){damage=applyOpponentDamage(t,10,round);v.luckUntil=round+2;effect='time_lock';}
  else if(form===2){s.extraAttacks=2;effect='time_lock';}
  else{const healing=t.id===u.id?0:((u.opponentDamageTurn??-1)>=round-1?u.opponentDamageAmount||0:0);u.hp=Math.min(u.maxHp,u.hp+healing);effect='time_erase';}
  return {damage,requested:damage,piercing:false,die:undefined,effect,refund:0,logTextEn:'Chronos · '+(slot===1?(form===2?'Time Anchor / Rewind':form===4?'Fate Seal':'Time Slow'):form===2?'Time Changer':'Erase Time')+': '+damage+' damage.',logTextVi:'Chronos · '+(slot===1?(form===2?'Neo / Tua Ngược':form===4?'Phong Ấn Vận Mệnh':'Chậm Thời Gian'):form===2?'Đổi Thời Gian':'Xóa Thời Gian')+': '+damage+' sát thương.'};
 }
 if(!UPDATE_IDS.has(u.weapon.id))return undefined;
 const s=weaponState(u),v=weaponState(t),weather=activeWeather(u,round);let damage=0,piercing=false,drain=false;let die:number|undefined;let effect='';
 const rng=()=>Math.random(),roll=()=>resolutionDie??1+Math.floor(rng()*6);const hit=(n:number)=>{damage=n;};
 const climate=(kind:WeatherKind,n:number,variant?:number)=>{s.weather={kind,until:round+n,remainingTurns:n,fresh:true,started:Math.max(Date.now(),s.weather?.started||0,v.weather?.started||0)+1,owner:u.id,variant};};
 switch(u.weapon.id){
 case 'shield':s.armor=(s.armor||0)+7;effect='shield_armor';break;
 case 'king_slasher':
  if(slot===1){if(form===1){hit(1);s.cleaveAttacks=3;effect='white_cross';}else if(form===2){hit(5);s.slashDefenses=3;s.slashMissTriggered=false;effect='white_triple';}else{hit(12);v.markedBy=u.id;v.markUntil=round+3;effect='fire_arrow';}}
  else if(form===2){hit(40);piercing=true;delete v.markUntil;delete v.markedBy;effect='world_slash';}else{hit(28);t.burnTicks=3;t.burnDmgPerTurn=3;v.burnOwner=u.id;effect='giant_fire_arrow';}break;
 case 'substitute_doll':if(slot===1){hit(Math.round((s.lastSuccessfulDamage||0)*2/3));effect='doll_reflect';}else{hit(10);s.nailHits=2;effect='giant_nail';}break;
 case 'death_note':if(slot===1){die=roll();s.lastNameDie=die;s.deathFailureRounds=(s.deathFailureRounds??[]).filter(r=>r>=round-9&&r<=round);if(die<=2&&!s.deathFailureRounds.includes(round))s.deathFailureRounds.push(round);s.deathFailures=s.deathFailureRounds.length;if(s.deathFailures>=2)s.deathHiddenReady=true;effect=die<=2?'name_reject':'name_success';if(die<=2){u.hp=Math.max(0,u.hp-3);hit(5);}else{hit(die<=4?Math.ceil(die*2.5):die*3);v.namedBy=u.id;}}else{const mode=form??deathNoteMode(u,round);if(mode===2){s.deathEyeUntil=round+4;s.deathHiddenReady=false;s.deathFailures=0;s.deathFailureRounds=[];effect='dn:eye';}else if(mode===3){v.judgement={owner:u.id,hits:0,attacksLeft:4};effect='dn:purge';}else{hit(Math.ceil(t.hp*.75));delete v.namedBy;effect='judgement';}}break;
 case 'kagutsuchi':hit(10);if(slot===1){s.dodgeHits=2;effect='red_multi_slash';}else{climate('rain',3);effect='rain_cast';}break;
 case 'bee_shooter':if(slot===1){hit(1);v.poisonStacks=Math.min(2,(v.poisonStacks||0)+1);v.poisonUntil=round+2;effect='worker_bee';}else{hit(3);v.queenDefenseTurns=5;v.swarmUntil=round+5;v.swarmOwner=u.id;effect='queen_bee';}break;
 case 'thunder_spear':if(slot===2){climate('rain',5);effect='weather_rain';}else if(form===3){v.blueUntil=round+3;v.blueOwner=u.id;v.blueTick=0;effect='lightning_blue';}else{hit(form===2?15:10);v.paralysisAttacks=5;v.paralysisChance=form===2?.1:.05;effect=form===2?'lightning_red':'lightning_yellow';}break;
 case 'ice_spear':if(slot===2){climate('snow',5);effect='weather_snow';}else{const enhanced=weather?.kind==='snow';hit(enhanced?15:10);v.slowUntil=round+5;if(enhanced&&rng()<.3){v.frozenAttacks=1;v.freezeDefense=1;v.freezeDefenseChance=1;}effect=enhanced?'giant_ice_spear':'ice_spear';}break;
 case 'frying_pan':if(slot===2){climate('heat',5);u.hp=Math.min(u.maxHp,u.hp+5);s.mealUntil=round+2;effect='meal_heal';}else{hit(7+((s.mealUntil??0)>=round?2:0));t.isStunned=true;effect='pan_bonk';if(weather?.kind==='heat'){if(rng()<.25)damage+=5;if(rng()<.1)damage+=7+((s.mealUntil??0)>=round?2:0);}}break;
 case 'dual_spears':if(slot===2){hit(form===2?30:25);climate('superconduct',5,form??1);effect=form===2?'superconduct_beam':'superconduct_orb';}else{hit(12);const bonus=weather?.kind==='superconduct'&&weather.variant===1?.05:0;if(form===1){v.chargeBlockUntil=round+3;v.chargeBlockChance=.1+bonus;effect='lightning_yellow';}else if(form===2){v.freezeDefense=2;v.freezeDefenseChance=.1+bonus;effect='ice_spears_three';}else{if(rng()<.15+bonus)v.superconductUntil=round+3;effect='dual_slash';}}break;
 case 'mirror_of_life':if(slot===1){if(t.hp>=u.hp*1.2){const old=u.hp;u.hp=Math.min(u.maxHp,t.hp);t.hp=Math.min(t.maxHp,old);}else v.weakUntil=round+2;effect='hp_swap';}else{hit(Math.min(20,t.hp));drain=true;effect='life_drain';}break;
 case 'elemental_rings':
  if(slot===1){die=roll();const kind=die<=2?'golem':die<=4?'fire_person':'mermaid',hp=kind==='golem'?10:kind==='fire_person'?5:3;(s.summons??=[]).push({id:crypto.randomUUID(),kind,hp,maxHp:hp,activeUntil:round+5,lastActionRound:round});hit(kind==='fire_person'?10:kind==='mermaid'?5:0);effect=kind;}
  else{s.summons=[{id:crypto.randomUUID(),kind:'niko',hp:25,maxHp:25,activeUntil:round+5}];hit(20);effect='elemental_beam';}break;
 }
 if((v.superconductUntil??0)>=round&&['thunder_spear','ice_spear','dual_spears'].includes(u.weapon.id)&&damage>0)damage+=2;
 if((s.weakUntil??0)>=round)damage=Math.max(0,damage-7);
 if(die!=null)s.lastSkillDie=die;
 const requested=damage;const before=t.hp;
 if(piercing){t.hp=Math.max(0,t.hp-damage);damage=before-t.hp;}
 else{if(t.dodgeNextSkill&&damage>0){t.dodgeNextSkill=false;damage=0;}damage=applyOpponentDamage(t,damage,round,true,u);}
 if(drain){const missing=u.maxHp-u.hp;u.hp=Math.min(u.maxHp,u.hp+damage);s.armor=(s.armor||0)+Math.max(0,damage-missing);}
 if(u.weapon.id==='death_note'&&slot===2&&effect.startsWith('dn:'))return {damage:0,requested:0,piercing:false,die,effect,refund:0,logTextEn:u.name+' · '+(effect==='dn:eye'?'Eye of Death active for 5 rounds.':'Purging Judgement on '+t.name+' · 2 hits in 4 attack turns.'),logTextVi:u.name+' · '+(effect==='dn:eye'?'Đôi Mắt Tử Thần tồn tại 5 vòng.':'Phán quyết lên '+t.name+' · 2 đòn trúng trong 4 lượt công.')};
 let refund=0;if(u.weapon.id==='dual_spears'&&slot===1&&weather?.kind==='superconduct'&&weather.variant===2&&rng()<.1)refund=10;
 return {damage,requested,piercing,die,effect:effect.startsWith('dn:')?effect:'wu1:'+effect,refund,logTextEn:u.weapon.name+' · '+(slot===1?u.weapon.skill1.name:u.weapon.skill2.name)+(die?' · D6 '+die:'')+': '+damage+' damage'+(requested!==damage?' ('+requested+' before defenses)':'')+'.',logTextVi:u.weapon.nameVi+' · '+(slot===1?u.weapon.skill1.nameVi:u.weapon.skill2.nameVi)+(die?' · D6 '+die:'')+': '+damage+' sát thương.'};
}
