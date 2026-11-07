import {niceComparisonKind,type DuelNotice} from './duelRules';
import {scaledHealingAmount} from './combatHealing';
import {isBladeWeapon} from './weaponTraits';
import {effectDuration,projectileColor,isTravelingEffect} from './skillMotion';
import {prepareWeapon2Attack} from './weaponUpdate2Logic';
import {recordCombatHit,type CombatHit} from './combatHits';
import {prepareDungeonDefense} from './dungeonProtection';
import {dungeonFloorAllowed,dungeonPathAllowed} from './dungeonGeometry';
import {deathNoteMode} from './deathNote';
import {clashCounterChance} from './duelRules';
import {weaponBaseDamage} from './weaponStats';
import {judgementAttack} from './deathNote';
import type {PlayerState} from '@/types/game';
import type {RoomParticipant} from './serverDb';
import {CLASS_DEFINITIONS,WEAPON_DEFINITIONS} from './constants';
import {DUNGEON_FLOORS,dungeonReward} from './dungeonCatalog';
import {createLms} from './lms';
import {rollD6,rollD20} from './battleLogic';
import {castChargedSkill,chargeSkillPoints} from './chargedSkills';
import {recordAttackRoll,d6Allowance} from './classMechanics';
import {rollDungeonD20,updateDiceTiming} from './diceTiming';
import {normalSetup,normalReactions,weaponD20,tickWeaponRound} from './weaponUpdateHooks';
import {drainWeaponEvents,syncWeather,advanceWeather} from './weaponUpdateState';
import {normalAttackEffect,skillPresentation,skillEffectPlan} from './skillPresentation';
import {applyOpponentDamage,absorbWithRock,recordOpponentDamage} from './combatDamage';
import {takeArmorAndSummons} from './weaponUpdateState';
import {warriorBonus} from './classMechanics';

type Position={x:number;y:number};
type Buff={id:string;remaining:number;active:boolean};
export interface DungeonState {
  animationUntil?:number;
  duelNotice?:DuelNotice;
  clash?: {score:number;role:'attack'|'defense';deadline:number;wagers:Record<string,number>;enemyStake:number;target:string};
  hitEvents?:CombatHit[];
  players:PlayerState[];
  requests?:string[];
  host:string;
  floor:number;
  encounter:number;
  round:number;
  phase:'room'|'entrance'|'loading'|'attack'|'defense'|'charge'|'skills'|'enemy_skills'|'end'|'cleared'|'rest'|'victory'|'defeat';
  comparison?:{id:string;attack:number;defense:number;difference:number;damage:number;critical:boolean;target:string;clashing?:boolean};
  teamHp:number;
  teamMaxHp:number;
  pts:number;
  coins:number;
  enemies:PlayerState[];
  votes:string[];
  rolls:Record<string,number[]>;
  enemyRolls:number[];
  attackActors?:string[];
  botDice?: { stage: 'rolling' | 'result'; role: 'attack' | 'defense' | 'charge'; readyAt: number; until?: number; values: number[] };
  lastD20?:Record<string,number>;
  lastRoll?:{id:string;values:number[];die:string;at:number};
  positions:Record<string,Position>;
  buffs:Buff[];
  lucky:Record<string,number>;
  log:string[];
  rewardFloor:number;
  rewardUsers:string[];
  startedAt?:number;
  deadline?:number;
  target?:string;
  event?:{id:string;approach?:boolean;damage?:number;effect:string;caster:string;target:string;name:string;at?:number};
  events?:NonNullable<DungeonState['event']>[];
  instinctReuse?:Record<string,{round:number;slot:1|2}>;
}
const initialCoins=[0,300,600,800,1000];
const scale=[0,.4,.6,.8,1];
export function createDungeon(p:RoomParticipant):DungeonState{
  return {players:[makePlayer(p)],host:p.id,floor:1,encounter:1,round:0,phase:'room',teamHp:0,teamMaxHp:0,pts:0,coins:0,enemies:[],votes:[],rolls:{},enemyRolls:[],positions:{},buffs:[],lucky:{},log:[],rewardFloor:0,rewardUsers:[]};
}
export function makePlayer(p:RoomParticipant):PlayerState {
  return createLms([p,{...p,id:'placeholder'}],true).players[0];
}
function emitDungeon(s:DungeonState,event:NonNullable<DungeonState['event']>){event.at=Date.now();s.animationUntil=Math.max(Date.now(),s.animationUntil||0)+effectDuration(event.effect,event.approach);s.event=event;s.events=[...(s.events||[]),event].slice(-32);}
function flushWeaponEvents(s:DungeonState){for(const event of drainWeaponEvents([...s.players,...s.enemies])){if(event.damage)recordCombatHit(s,event.damage,event.caster,event.target);add(s,event.text);emitDungeon(s,{id:crypto.randomUUID(),damage:event.damage,effect:event.effect,caster:event.caster,target:event.target,name:event.text});}}
function tickDungeonWeapons(s:DungeonState,scope:'round'|'summons'){
 const hp=s.teamHp,pts=s.pts,owners=s.players.map(p=>pooled(s,p));
 const team=new Set(s.players.map(p=>p.id));
 for(const event of tickWeaponRound([...owners,...s.enemies],s.round,scope,(a,b)=>team.has(a.id)!==team.has(b.id),p=>team.has(p.id)&&activeBuff(s,'helena')?1.2:1)){if(event.damage)recordCombatHit(s,event.damage,event.caster,event.target);add(s,event.text);emitDungeon(s,{id:crypto.randomUUID(),effect:event.effect,caster:event.caster,target:event.target,name:event.text});}
 if(scope==='round')for(const p of [...owners,...s.enemies])if((p.burnTicks??0)>0){applyOpponentDamage(p,p.burnDmgPerTurn??1,s.round,false);p.burnTicks!--;}
 s.teamHp=Math.max(0,Math.min(s.teamMaxHp,hp+owners.reduce((n,p)=>n+p.hp-hp,0)));s.pts=Math.max(0,pts+owners.reduce((n,p)=>n+(p.d12Charge??pts)-pts,0));
 owners.forEach((p,i)=>Object.assign(s.players[i],p,{hp:s.players[i].maxHp,maxHp:s.players[i].maxHp}));
 flushWeaponEvents(s);
}
function add(s:DungeonState,text:string){s.log=[text,...s.log].slice(0,150);}
function activeBuff(s:DungeonState,id:string){return s.buffs.find(b=>b.id===id&&b.active&&b.remaining>0);}
function isBoss(s:DungeonState){return s.encounter===3||s.encounter===5;}
function pooled(s:DungeonState,p:PlayerState){const copy=structuredClone(p);delete copy.healingMultiplier;delete copy.summonDamageBonus;return {...copy,hp:s.teamHp,maxHp:s.teamMaxHp,d12Charge:s.pts,...(activeBuff(s,'helena')?{healingMultiplier:1.2}:{}),...(activeBuff(s,'summoner')?{summonDamageBonus:2}:{})};}
function savePooled(s:DungeonState,p:PlayerState,updated:PlayerState){
  s.teamHp=updated.hp;s.teamMaxHp=updated.maxHp;s.pts=updated.d12Charge??0;
  const personalHp=p.maxHp;
  delete p.healingMultiplier;delete p.summonDamageBonus;Object.assign(p,updated,{hp:personalHp,maxHp:personalHp});
}
function encounterEnemies(s:DungeonState){
  const floor=DUNGEON_FLOORS[s.floor-1],count=[1,3,1,3,1][s.encounter-1];
  const kind=s.encounter===3?'mini_boss':s.encounter===5?'boss':'mob';
  s.enemies=Array.from({length:count},(_,i)=>{
    const weapon=s.encounter===4?floor.support[i]:floor.weapon;
    const p=makePlayer({id:'enemy-'+i,name:kind==='boss'?floor.boss:kind==='mini_boss'?floor.mini:floor.name+' '+(i+1),weaponId:weapon,classType:'warrior',character:s.players[0].character,isReady:true});
    p.hp=p.maxHp=Math.round(floor.hp[s.encounter-1]*scale[s.players.length]);
    if(s.floor===5){p.petRockHp=s.encounter===3?75:50;if(s.encounter===5){p.petRockEnraged=true;p.petRockEnrageUntilRound=Number.MAX_SAFE_INTEGER;}}
    if(s.floor===4&&s.encounter===5)p.weaponUpdate={armor:20};
    return p;
  });
  s.duelNotice=undefined;s.event=undefined;s.events=[];s.round++;s.rolls={};s.lastD20={};s.enemyRolls=[];s.votes=[];s.target=s.enemies[0].id;
  s.phase='attack';s.attackActors=undefined;s.deadline=Date.now()+20000;
  for(const p of s.players){p.skill1UsedTurn=undefined;p.skill2UsedTurn=undefined;p.boxerAttackRound=undefined;p.boxerAttackRolls=[];p.diceTiming=undefined;}
  add(s,'Floor '+s.floor+' · Encounter '+s.encounter+' · '+s.enemies.map(p=>p.name).join(', '));
}
function progressEncounter(s:DungeonState){
  if(s.teamHp<=0){s.phase='defeat';return;}
  if(s.enemies.some(p=>p.hp>0))return;
  for(const buff of s.buffs.filter(b=>b.active&&Number.isFinite(b.remaining))){
    if(buff.id==='slayer'||buff.id==='guardian'||buff.id==='weather')continue;
    buff.remaining--;
    if(buff.id==='throne'&&buff.remaining===0){s.coins+=1000;add(s,'Throne · +1,000 Dungeon coins');}
    if(buff.id==='underdog'&&buff.remaining===0){buff.id='underdog_reward';buff.remaining=1e9;}
  }
  for(const id of Object.keys(s.lucky))s.lucky[id]=Math.max(0,s.lucky[id]-1);
  if(s.encounter===5){s.rewardFloor=s.floor;s.rewardUsers=s.players.map(p=>p.id);}
  s.phase=s.floor===10&&s.encounter===5?'victory':'cleared';
  s.votes=[];s.deadline=undefined;add(s,s.phase==='victory'?'Dungeon complete!':'Encounter cleared!');
}
function damageTeam(s:DungeonState,n:number,recipient?:PlayerState,attack=false){
  if(n<=0)return 0;
  if(attack){if(s.players.some(p=>p.weaponUpdate?.waterWallActiveRound===s.round))n=Math.ceil(n*2/3);const healer=s.players.find(p=>(p.weaponUpdate?.regenUntil??-1)>=s.round);if(healer&&Math.random()<.2)n-=Math.min(n,scaledHealingAmount(pooled(s,healer),Math.floor(n/2)));}
  const guardian=activeBuff(s,'guardian');
  if(guardian){guardian.remaining=0;add(s,'Guardian blocks '+n+' damage.');return 0;}
  const p=s.players.find(p=>p.immuneDamageNext)||(attack?s.players.find(p=>p.dodgeNextAttack):undefined)||recipient||s.players[0],pooledPlayer=pooled(s,p);
  if(attack&&pooledPlayer.dodgeNextAttack){pooledPlayer.dodgeNextAttack=false;savePooled(s,p,pooledPlayer);emitDungeon(s,{id:crypto.randomUUID(),effect:'dodge_attack',caster:p.id,target:p.id,name:p.name+' · Evasion'});return 0;}
  let remaining=n;
  if(!pooledPlayer.immuneDamageNext)for(const member of s.players.filter(x=>x.id!==p.id)){
    const rockBefore=member.petRockHp??0;remaining-=absorbWithRock(member,remaining);remaining=takeArmorAndSummons(member,remaining);
    if((member.petRockHp??0)<rockBefore)emitDungeon(s,{id:crypto.randomUUID(),effect:'rock_block',caster:member.id,target:member.id,name:member.name+' · Rock blocks '+(rockBefore-(member.petRockHp??0))});
  }
  const immune=pooledPlayer.immuneDamageNext,rockBefore=pooledPlayer.petRockHp??0;
  const damage=applyOpponentDamage(pooledPlayer,remaining,s.round);
  if(immune)emitDungeon(s,{id:crypto.randomUUID(),effect:'infinity',caster:p.id,target:p.id,name:p.name+' · Immune'});
  else if((pooledPlayer.petRockHp??0)<rockBefore)emitDungeon(s,{id:crypto.randomUUID(),effect:'rock_block',caster:p.id,target:p.id,name:p.name+' · Rock blocks '+(rockBefore-(pooledPlayer.petRockHp??0))});
  savePooled(s,p,pooledPlayer);
  for(const member of s.players)if(member.id!==p.id)recordOpponentDamage(member,damage,s.round);
  return damage;
}
function dice(s:DungeonState,p:PlayerState,role:'attack'|'defense'){
  let chance=s.lucky[p.id]>0?.1:0;
  if(activeBuff(s,'underdog'))chance-=.2;
  if(activeBuff(s,'underdog_reward'))chance+=.2;
  let value=rollDungeonD20(p,s.round,role,chance,rollD20);
  if(role==='attack'&&activeBuff(s,'musashi')&&isBladeWeapon(p.weapon)&&Math.random()<.2){const bonus=Math.random()<.85?20:rollD20(),first=value;value=Math.max(first,bonus);add(s,p.name+' · Musashi buff: D20 '+first+' / '+bonus+' → '+value);}
  return weaponD20(p,value,role,s.round,s.enemies.find(p=>p.hp>0));
}
function beginBotDice(s:DungeonState,role:'attack'|'defense'|'charge',now:number){
  s.botDice={stage:'rolling',role,readyAt:now+1400,values:[]};
  s.deadline=undefined;
}
function awardNiceComparison(s: DungeonState, attack: number, defense: number, teamAttacks: boolean) {
  const kind = niceComparisonKind(attack, defense);
  if (!kind) return;

  const teamWins = (kind === 'attack') === teamAttacks;
  if (teamWins) {
    s.pts += 10;
  } else {
    const recipient = s.enemies.find(enemy => enemy.hp > 0);
    if (!recipient) return;
    recipient.d12Charge = (recipient.d12Charge ?? 0) + 10;
  }

  const en = (kind === 'attack' ? 'Nice Attack' : 'Nice Defense') + ' · ' + (teamWins ? 'Your team' : 'Enemies') + ' +10 PTS';
  const vi = (kind === 'attack' ? 'Tấn công xuất sắc' : 'Phòng thủ xuất sắc') + ' · ' + (teamWins ? 'Đội của bạn' : 'Địch') + ' +10 PTS';
  s.duelNotice = { id: crypto.randomUUID(), kind, en, vi };
  add(s, en);
}
function finishDice(s:DungeonState,now:number){
  s.duelNotice = undefined;
  if(!s.enemies.some(p=>p.hp>0)){progressEncounter(s);return;}
  let total=Object.values(s.rolls).flat().reduce((a,b)=>a+b,0);
  // The visible result was rolled and held by tickDungeon; never roll it again here.
  let enemyTotal=s.enemyRolls.reduce((a,b)=>a+b,0),floor=DUNGEON_FLOORS[s.floor-1];
  const victim=s.enemies.find(p=>p.id===s.target&&p.hp>0)||s.enemies.find(p=>p.hp>0)!;
  // A party total can exceed 20. Only tied natural-20 rolls retain the no-clash exception.
  if(total>0&&total===enemyTotal&&!(Object.values(s.rolls).flat().every(v=>v===20)&&s.enemyRolls.every(v=>v===20))&&!victim.weaponUpdate?.judgement&& !s.players.some(p=>p.weaponUpdate?.judgement)){
    const foes=s.enemies.filter(p=>p.hp>0),points=foes.reduce((n,p)=>n+(p.d12Charge??0),0);
    const enemyStake=Math.floor(Math.random()*(Math.min(3,points)+1));
    let left=enemyStake;for(const foe of foes){const used=Math.min(left,foe.d12Charge??0);foe.d12Charge=(foe.d12Charge??0)-used;left-=used;}
    s.clash={score:total,role:s.phase as 'attack'|'defense',deadline:now+5000,wagers:{},enemyStake,target:victim.id};s.deadline=undefined;
    add(s,'CLASHING · '+total+' = '+enemyTotal+' · Each teammate may wager 0–3 shared PTS within 5 seconds.');return;
  }
  if(s.phase==='attack'){
    const victim=s.enemies.find(p=>p.id===s.target&&p.hp>0)||s.enemies.find(p=>p.hp>0)!;
    const judge=s.players.find(p=>p.id===victim.weaponUpdate?.judgement?.owner);
    if(judge){const verdict=judgementAttack(judge,victim,total>enemyTotal,s.round);if(verdict){awardNiceComparison(s,total,enemyTotal,true);recordCombatHit(s,verdict.damage,judge.id,victim.id);victim.hp=Math.max(0,victim.hp-verdict.damage);s.comparison={id:crypto.randomUUID(),attack:total,defense:enemyTotal,difference:total-enemyTotal,damage:verdict.damage,critical:false,target:victim.name};add(s,'Purging Judgement · '+verdict.hits+'/2 · '+verdict.attacksLeft+' attacks left');for(const event of drainWeaponEvents(s.players)){emitDungeon(s,{id:crypto.randomUUID(),effect:event.effect,caster:event.caster,target:event.target,name:'Purging Judgement'});}s.rolls={};s.phase='defense';s.deadline=now+20000;progressEncounter(s);return;}}
    s.target=victim.id;
    const attackers=s.players.filter(p=>!s.attackActors||s.attackActors.includes(p.id));
    let weaponBonus=0;
    for(const player of attackers){
      const owner=pooled(s,player),value=s.rolls[player.id]?.[0]||0;
      const setup=normalSetup(owner,victim,value,enemyTotal/attackers.length,s.round);
      total+=setup.atk-value;
      enemyTotal+=Math.round(setup.def-enemyTotal/attackers.length);
      if(setup.cancel||setup.dodge||owner.isStunned||owner.timeLockActive){total-=value;owner.isStunned=false;owner.timeLockActive=false;}
      if(owner.weapon.id==='revolver'){if((owner.bullets??6)<=0)total-=Math.max(0,value);else owner.bullets=(owner.bullets??6)-1;}
      if(setup.cleave)weaponBonus+=total>enemyTotal?4:5;
      if(total>enemyTotal&&(owner.weaponUpdate?.weakUntil??0)>=s.round)weaponBonus-=7;
      if(owner.flameBladeBuff&&total>enemyTotal){weaponBonus+=4;owner.flameBladeBuff=false;}
      if((owner.daggerBurnHits??0)>0&&total>enemyTotal){weaponBonus-=2;owner.daggerBurnHits!--;}
      if((owner.panicTurns??0)>0){total-=owner.panicAttackDebuff??0;owner.panicTurns!--;}
      savePooled(s,player,owner);
    }
    const critical=total-enemyTotal>=10;
    const hpBefore=victim.hp;
    const baseBonus=total>enemyTotal?attackers.reduce((n,p)=>n+weaponBaseDamage(p.weapon.tier),0):0;
    let damage=critical?total:Math.max(0,total-enemyTotal)+weaponBonus;
    if(damage>0){
      const modifier=attackers.reduce((sum,p)=>sum+CLASS_DEFINITIONS[p.classType].damageModifier,0)/attackers.length;
      damage=critical?total+weaponBonus:Math.round(damage*modifier)+attackers.reduce((sum,p)=>sum+warriorBonus({...p,hp:s.teamHp,maxHp:s.teamMaxHp}),0);
      if(activeBuff(s,'devil'))damage+=5;
      const slayer=activeBuff(s,'slayer');
      if(isBoss(s)&&slayer){damage+=5;slayer.remaining--;}
      if(victim.isBleeding){damage+=5;victim.isBleeding=false;}
      if(victim.dodgeNextAttack){victim.dodgeNextAttack=false;damage=0;emitDungeon(s,{id:crypto.randomUUID(),effect:'dodge_attack',caster:victim.id,target:victim.id,name:victim.name+' · Evasion'});}
      damage=applyOpponentDamage(victim,Math.max(0,damage+(damage>0?baseBonus:0)),s.round);recordCombatHit(s,damage,'dungeon_team',victim.id);
      for(const p of s.players)if(damage>0&&(!s.attackActors||s.attackActors.includes(p.id))&&p.weapon.id==='spirit_stone'&&(p.petRockHp??0)>0&&victim.hp>0){
        const follow=applyOpponentDamage(victim,(p.petRockEnraged?5:2)+(activeBuff(s,'summoner')?2:0),s.round);
        recordCombatHit(s,follow,p.id,victim.id);add(s,p.name+' · Pet Rock follow-up '+follow+' damage');
      }
    }
    for(const player of attackers){const owner=pooled(s,player);normalReactions(owner,victim,damage>0,Math.round(damage/attackers.length),Math.round(enemyTotal/attackers.length),s.round);savePooled(s,player,owner);}
    s.comparison={id:crypto.randomUUID(),attack:total,defense:enemyTotal,difference:total-enemyTotal,damage:hpBefore-victim.hp,critical,target:victim.name};
    if(total>enemyTotal)for(const hero of attackers){const effect=normalAttackEffect(hero.weapon.id,hero);emitDungeon(s,{id:crypto.randomUUID(),approach:!projectileColor(effect)&&!isTravelingEffect(effect),damage:hpBefore-victim.hp,effect,caster:hero.id,target:victim.id,name:hero.name+' · D20'});}
    awardNiceComparison(s,total,enemyTotal,true);
    add(s,'Team ATK '+total+' vs DEF '+enemyTotal+' · '+victim.name+' −'+damage+' HP');
    const extra=s.players.filter(p=>(p.weaponUpdate?.extraAttacks??0)>0);
    if(extra.length){s.attackActors=extra.map(p=>p.id);for(const p of extra){p.weaponUpdate!.extraAttacks!--;p.weaponUpdate!.lastD20Round=undefined;p.boxerAttackRound=undefined;p.boxerAttackRolls=[];p.diceTiming=undefined;}s.phase='attack';add(s,'Time Changer · '+extra.map(p=>p.name).join(', ')+' attacks again');}
    else{s.attackActors=undefined;s.phase='defense';const protectedMember=s.players.find(p=>(p.weaponUpdate?.cycloneAttacks??0)>0)||s.players[0],recipient=pooled(s,protectedMember);for(const foe of s.enemies.filter(p=>p.hp>0))prepareWeapon2Attack(foe,s.round,recipient);savePooled(s,protectedMember,recipient);if(s.enemies.filter(p=>p.hp>0).every(p=>p.weaponUpdate?.blockedAttackRound===s.round)){s.phase='charge';add(s,'Enemy D20 locked · defense skipped');}}
  }else{
    for(const player of s.players){
      const owner=pooled(s,player),enemy=s.enemies.find(p=>p.hp>0)!;
      const ownDef=s.rolls[player.id]?.[0]||0;
      const setup=normalSetup(enemy,owner,enemyTotal/s.players.length,ownDef,s.round);
      total+=setup.def-ownDef;
      if(setup.dodge)enemyTotal=0;
      if(setup.cancel||setup.dodge||enemy.isStunned||enemy.timeLockActive){enemyTotal-=Math.round(enemyTotal/s.players.length);enemy.isStunned=false;enemy.timeLockActive=false;}
      if(enemy.fateSealActive){enemyTotal=Math.min(enemyTotal,rollD20()*s.players.length);enemy.fateSealActive=false;}
      savePooled(s,player,owner);
    }
    const critical=enemyTotal-total>=10;
    const hpBefore=s.teamHp;
    let damage=critical?enemyTotal:Math.max(0,enemyTotal-total);
    const baseBonus=enemyTotal>total?s.enemies.filter(p=>p.hp>0).reduce((n,p)=>n+weaponBaseDamage(p.weapon.tier),0):0;
    if(!critical&&damage>0&&isBoss(s))damage+=floor.attack[s.encounter===3?0:1];
    const reduction=s.players.reduce((sum,p)=>sum+CLASS_DEFINITIONS[p.classType].damageReduction,0)/s.players.length;
    damage=damageTeam(s,(critical?damage:Math.round(damage*reduction))+baseBonus,undefined,true);recordCombatHit(s,damage,'dungeon_enemies','dungeon_team');
    const source=s.enemies.find(p=>p.hp>0)!;
    for(const member of s.players){const owner=pooled(s,member);normalReactions(source,owner,damage>0,Math.round(damage/s.players.length),s.rolls[member.id]?.[0]??0,s.round);savePooled(s,member,owner);}
    if(damage>0)for(const enemy of s.enemies.filter(p=>p.hp>0&&p.weapon.id==='spirit_stone'&&(p.petRockHp??0)>0)){const follow=damageTeam(s,enemy.petRockEnraged?5:2);recordCombatHit(s,follow,enemy.id,'dungeon_team');}
    s.comparison={id:crypto.randomUUID(),attack:enemyTotal,defense:total,difference:enemyTotal-total,damage:hpBefore-s.teamHp,critical,target:'TEAM'};
    if(hpBefore>s.teamHp)emitDungeon(s,{id:crypto.randomUUID(),damage:hpBefore-s.teamHp,effect:normalAttackEffect(source.weapon.id,source),caster:source.id,target:s.players[0].id,name:'Enemy D20'});
    awardNiceComparison(s,enemyTotal,total,false);
    add(s,'Enemy ATK '+enemyTotal+' vs DEF '+total+' · Team −'+damage+' HP');
    s.phase='charge';
  }
  flushWeaponEvents(s);
  s.rolls=s.phase==='attack'&&s.attackActors?Object.fromEntries(s.players.filter(p=>!s.attackActors!.includes(p.id)).map(p=>[p.id,[0]])):{};s.deadline=now+20000;progressEncounter(s);
}
function resolveDungeonClash(s:DungeonState,now:number){
  const clash=s.clash!;
  const teamStake=Object.values(clash.wagers).reduce((n,v)=>n+v,0),teamAttacks=clash.role==='attack';
  const counter=Math.random()<clashCounterChance(teamAttacks?teamStake:clash.enemyStake,teamAttacks?clash.enemyStake:teamStake);
  const teamWins=teamAttacks?!counter:counter;
  const victim=s.enemies.find(p=>p.id===clash.target&&p.hp>0)||s.enemies.find(p=>p.hp>0)!;
  const amount=Math.round(clash.score*2/3);
  const tierBonus=teamWins?s.players.reduce((n,p)=>n+weaponBaseDamage(p.weapon.tier),0):s.enemies.filter(p=>p.hp>0).reduce((n,p)=>n+weaponBaseDamage(p.weapon.tier),0);
  const damage=teamWins?applyOpponentDamage(victim,amount+tierBonus,s.round):damageTeam(s,amount+tierBonus,undefined,true);
  recordCombatHit(s,damage,teamWins?'dungeon_team':'dungeon_enemies',teamWins?victim.id:'dungeon_team');
  s.comparison={id:crypto.randomUUID(),attack:clash.score,defense:clash.score,difference:0,damage,critical:false,clashing:true,target:teamWins?victim.name:'TEAM'};
  add(s,'Clashing · '+(teamWins?'Team':'Enemies')+' '+(counter?'counter':'attack wins')+' · '+damage+' damage · Team wager '+teamStake+' / Enemy wager '+clash.enemyStake+' PTS');
  emitDungeon(s,{id:crypto.randomUUID(),effect:'impact_physical',caster:teamWins?s.players[0].id:victim.id,target:teamWins?victim.id:s.players[0].id,name:'Clashing · '+damage+' HP'});
  delete s.clash;s.rolls={};s.attackActors=undefined;s.phase=teamAttacks?'defense':'charge';s.deadline=now+20000;progressEncounter(s);
}
function finishCharge(s:DungeonState,values:number[],now:number){
  for(const [i,enemy] of s.enemies.filter(p=>p.hp>0).entries())Object.assign(enemy,chargeSkillPoints(enemy,[values[i]],s.round));
  s.phase='skills';s.votes=[];s.deadline=now+20000;
  tickDungeonWeapons(s,'summons');
  progressEncounter(s);
}
export function dungeonAction(input:DungeonState,actor:string,action:string,args:Record<string,unknown>={},now=Date.now()){
  const s=structuredClone(input),p=s.players.find(p=>p.id===actor);
  for(const player of s.players)if(s.round>(player.petRockEnrageUntilRound??Infinity))player.petRockEnraged=false;
  if(!p)throw Error('Not in this Dungeon.');
  if(s.clash){
    if(action!=='clash_wager')throw Error('Resolve Clashing before continuing.');
    const stake=args.stake;
    if(now>=s.clash.deadline){resolveDungeonClash(s,now);return s;}
    if(s.clash.wagers[actor]!==undefined)return s;
    if(typeof stake!=='number'||!Number.isInteger(stake)||stake<0||stake>3||stake>s.pts)throw Error('Choose an affordable wager from 0 to 3 shared PTS.');
    s.pts-=stake;s.clash.wagers[actor]=stake;add(s,p.name+' · Clashing wager '+stake+' PTS');
    if(s.players.every(p=>s.clash!.wagers[p.id]!==undefined))resolveDungeonClash(s,now);
    return s;
  }
  if(s.botDice&&['roll','timing','target','skill','end'].includes(action))throw Error('Wait for the enemy dice result.');
  const safe=['entrance','rest'].includes(s.phase);
  if(safe&&['ready','shop','equip'].includes(action)&&args.position){
    const pose=args.position as Position;
    if(!dungeonPositionAllowed(pose.x,pose.y,dungeonArea(s)))throw Error('Invalid position.');
    s.positions[actor]={x:pose.x,y:pose.y};
  }
  if(action==='start'){
    if(s.phase!=='room'||s.host!==actor)throw Error('Only the host can start.');
    s.teamMaxHp=s.players.reduce((sum,p)=>sum+p.maxHp,0);s.teamHp=s.teamMaxHp;s.coins=initialCoins[s.players.length];s.phase='entrance';
    s.positions=Object.fromEntries(s.players.map((p,i)=>[p.id,{x:.235+i*.175,y:.75}]));
  }else if(action==='move'){
    const x=Number(args.x),y=Number(args.y);
    if(!safe||!dungeonPositionAllowed(x,y,dungeonArea(s)))throw Error('Cannot move here.');
    const previous=s.positions[actor]||{x:.5,y:.75};
    if(Math.hypot(x-previous.x,y-previous.y)>.09||!dungeonPathAllowed(previous,{x,y},dungeonArea(s)))throw Error('Move too far.');
    s.positions[actor]={x,y};s.votes=s.votes.filter(id=>id!==actor);
  }else if(action==='ready'){
    if(!safe)throw Error('Not at the entrance.');
    const pos=s.positions[actor];
    if(!pos||Math.hypot(pos.x-dungeonInteractionPoints(dungeonArea(s)).portal.x,pos.y-dungeonInteractionPoints(dungeonArea(s)).portal.y)>.11)throw Error('Approach the portal.');
    if(!s.votes.includes(actor))s.votes.push(actor);
    if(s.players.every(p=>s.votes.includes(p.id))){s.phase='loading';s.startedAt=now;}
  }else if(action==='shop'){
    const item=String(args.item),potion=['lucky','hp','pts'].includes(item);
    if(!safe&&!(s.phase==='end'&&potion))throw Error('Visit a rest area or use a potion at round end.');
    const cost=item==='lucky'?200:['hp','pts'].includes(item)?150:500;
    const pos=s.positions[actor];
    const npc=dungeonInteractionPoints(dungeonArea(s))[potion?'hand':'avocado'];
    if(safe&&(!pos||Math.hypot(pos.x-npc.x,pos.y-npc.y)>.17))throw Error('Approach the NPC.');
    if(s.coins<cost)throw Error('Not enough Dungeon coins.');
    if(!['lucky','hp','pts','guardian','devil','throne','underdog','musashi','helena','summoner','instinct','slayer','weather'].includes(item))throw Error('Unknown item.');
    if(item==='lucky')s.lucky[actor]=2;
    else if(item==='hp')s.teamHp=Math.min(s.teamMaxHp,s.teamHp+20);
    else if(item==='pts')s.pts+=10;
    else{
      if(s.buffs.some(b=>b.id===item&&b.remaining>0))throw Error('Already owned.');
      s.buffs.push({id:item,active:!['guardian','underdog','weather'].includes(item),remaining:item==='devil'||item==='throne'?10:item==='slayer'?2:item==='underdog'?5:['guardian','weather'].includes(item)?1:1e9});
      if(item==='devil'){if(s.teamHp<=15)throw Error('Need more than 15 HP.');s.teamHp-=15;}
    }
    s.coins-=cost;add(s,p.name+' bought '+item+' · −'+cost+' coins');
  }else if(action==='equip'){
    const pos=s.positions[actor];
    if(!safe||!pos||Math.hypot(pos.x-dungeonInteractionPoints(dungeonArea(s)).roger.x,pos.y-dungeonInteractionPoints(dungeonArea(s)).roger.y)>.15)throw Error('Approach Roger.');
    const weapon=WEAPON_DEFINITIONS[String(args.weapon)];
    if(!weapon)throw Error('Unknown weapon.');
    p.weapon=weapon;p.petRockHp=0;p.bullets=6;add(s,p.name+' equipped '+weapon.name);
  }else if(action==='buff'){
    const buff=s.buffs.find(b=>b.id===args.id&&b.remaining>0&&!b.active);
    if(!buff)throw Error('Buff unavailable.');
    if(buff.id==='underdog'&&!isBoss(s))throw Error('Use at a boss encounter.');
    buff.active=true;add(s,'Activated '+buff.id);
  }else if(action==='target'){
    if(s.phase!=='attack'||s.rolls[actor]?.length)throw Error('Choose before rolling.');
    if(!s.enemies.some(p=>p.id===args.target&&p.hp>0))throw Error('Invalid target.');
    s.target=String(args.target);
  }else if(action==='timing'){
    if(!['attack','defense'].includes(s.phase)||s.rolls[actor]?.length||(s.phase==='attack'&&p.boxerAttackRound===s.round&&(p.boxerAttackRolls?.length??0)>0))throw Error('Use timing before D20.');
    updateDiceTiming(p,s.round,s.phase as 'attack'|'defense',now,typeof args.elapsedMs==='number'?args.elapsedMs:undefined);
  }else if(action==='roll'){
    if(!['attack','defense','charge'].includes(s.phase))throw Error('Not a dice phase.');
    const existing=s.rolls[actor]||[];
    if(s.phase==='charge'&&d6Allowance(p,s.round)===0)throw Error('Charge blocked for this round.');
    if(s.phase==='charge'){
      if(existing.length>=d6Allowance(p,s.round))throw Error('Already charged.');
      const charged=chargeSkillPoints({...p,d12Charge:s.pts},[rollD6()],s.round);
      s.pts=charged.d12Charge??s.pts;Object.assign(p,charged);
      s.rolls[actor]=[...existing,charged.weaponUpdate?.lastChargeValue??0];
      s.lastRoll={id:actor,values:s.rolls[actor],die:'D6',at:now};
      add(s,p.name+' · D6 '+s.rolls[actor].join(' + ')+' → '+s.pts+' team PTS');
      flushWeaponEvents(s);
      if(s.players.every(p=>(s.rolls[p.id]?.length||0)>=d6Allowance(p,s.round))){
        beginBotDice(s,'charge',now);
      }
    }else{
      if(existing.length)throw Error('Already rolled.');
      const value=dice(s,p,s.phase as 'attack'|'defense');flushWeaponEvents(s);
      (s.lastD20??={})[actor]=value;
      s.lastRoll={id:actor,values:[value],die:'D20',at:now};
      if(s.phase==='attack'){
        const result=recordAttackRoll(p,s.round,value);Object.assign(p,result.player);
        s.lastRoll.values=result.rolls;
        s.lastD20![actor]=result.value;
        add(s,p.name+' · D20 '+result.rolls.join(' / '));
        if(!result.done)return s;
        s.rolls[actor]=[result.value];
      }else{s.rolls[actor]=[value];add(s,p.name+' · DEF '+value);}
      if(s.players.every(p=>s.rolls[p.id]?.length))beginBotDice(s,s.phase==='attack'?'defense':'attack',now);
    }
  }else if(action==='skill'){
    if(s.phase!=='skills'||s.votes.includes(actor))throw Error('Not your skill phase.');
    const target=s.enemies.find(p=>p.id===args.target&&p.hp>0)||s.enemies.find(p=>p.hp>0);
    if(!target)throw Error('No target.');
    const slot=Number(args.slot);
    if(slot!==1&&slot!==2)throw Error('Invalid skill.');
    const before=pooled(s,p);
    const reuse=s.instinctReuse?.[actor];
    const free=reuse?.round===s.round&&reuse.slot===slot;
    if(free)before.d12Charge=1e6;
    const cast=castChargedSkill(before,target,slot,s.round,args.form as number|undefined,args.lockSlot as 1|2|undefined);
    if(!cast)throw Error('Skill unavailable.');
    if(free){cast.caster.d12Charge=s.pts;delete s.instinctReuse![actor];}
    if(activeBuff(s,'instinct')&&(!before.immuneDamageNext&&cast.caster.immuneDamageNext||!before.dodgeNextAttack&&cast.caster.dodgeNextAttack||!before.dodgeNextSkill&&cast.caster.dodgeNextSkill||(cast.caster.weaponUpdate?.dodgeHits??0)>(before.weaponUpdate?.dodgeHits??0))&&Math.random()<.5){
      (s.instinctReuse??={})[actor]={round:s.round+1,slot};
      // One free reuse next round; this round remains single-use.
      cast.caster.weaponUpdate??={};
      add(s,'Ultra Instinct · reusable next round');
    }
    const summoner=activeBuff(s,'summoner');
    if(summoner){
      if((cast.caster.petRockHp??0)>(before.petRockHp??0))cast.caster.petRockHp!+=5;
      for(const pet of cast.caster.weaponUpdate?.summons||[])if(!(before.weaponUpdate?.summons||[]).some(old=>old.id===pet.id)){pet.hp+=5;pet.maxHp+=5;}
    }
    if(activeBuff(s,'weather')&&cast.caster.weaponUpdate?.weather?.fresh&&cast.caster.weaponUpdate.weather.started!==before.weaponUpdate?.weather?.started){cast.caster.weaponUpdate.weather.remainingTurns!+=2;cast.caster.weaponUpdate.weather.until+=2;activeBuff(s,'weather')!.remaining=0;}
    const effectiveForm=(args.form as number|undefined);
    if(p.weapon.id==='vine_staff')for(const foe of s.enemies.filter(x=>x.hp>0&&x.id!==target.id)){const extra=castChargedSkill(before,foe,slot,s.round,effectiveForm);if(extra){Object.assign(foe,extra.opponent);recordCombatHit(s,extra.damage,p.id,foe.id);emitDungeon(s,{id:crypto.randomUUID(),damage:extra.damage,effect:extra.effect||'nw:vine_bind',caster:p.id,target:foe.id,name:p.weapon.name});}}
    const art=skillPresentation(p,slot,(args.form as number|undefined)??(p.weapon.id==='death_note'&&slot===2?deathNoteMode(p,s.round):undefined));
    recordCombatHit(s,cast.damage,p.id,target.id);savePooled(s,p,cast.caster);Object.assign(target,cast.opponent);syncWeather([...s.players,...s.enemies]);
    if(cast.effect==='dn:purge')emitDungeon(s,{id:crypto.randomUUID(),effect:'dn:eye',caster:p.id,target:p.id,name:'Eye of Death'});
    const cues=/^(nw|mu):/.test(cast.effect||'')?skillEffectPlan(before,slot,effectiveForm):[{effect:cast.effect||art.effect,target:art.target}];for(const cue of cues)emitDungeon(s,{id:crypto.randomUUID(),damage:cue.target==='opponent'?cast.damage:0,effect:cue.effect,caster:p.id,target:cue.target==='caster'?p.id:target.id,name:art.nameEn});
    flushWeaponEvents(s);add(s,cast.logTextEn);if(cast.caster.hp>before.hp)add(s,p.name+' · +'+(cast.caster.hp-before.hp)+' shared HP');progressEncounter(s);
  }else if(action==='end'){
    if(!['skills','end'].includes(s.phase))throw Error('Cannot end this phase.');
    if(!s.votes.includes(actor))s.votes.push(actor);
    if(s.players.every(p=>s.votes.includes(p.id))){
      s.votes=[];
      if(s.phase==='skills'){s.phase='enemy_skills';s.deadline=now+2500;}
      else{
        advanceWeather([...s.players,...s.enemies],s.round);
        s.round++;s.rolls={};s.lastD20={};s.phase='attack';s.attackActors=undefined;s.deadline=now+20000;
        for(const p of s.players){p.diceTiming=undefined;}
        tickDungeonWeapons(s,'round');
        progressEncounter(s);
      }
    }
  }else if(action==='next'){
    if(s.phase!=='cleared')throw Error('Finish the encounter first.');
    if(!s.votes.includes(actor))s.votes.push(actor);
    if(s.players.every(p=>s.votes.includes(p.id))){
      if(s.encounter===5){
        const completed=s.floor++;
        s.encounter=1;
        if(completed%2===0){s.coins+=[300,450,600,800][completed/2-1];s.phase='rest';s.teamHp=s.teamMaxHp;add(s,'Rest Area · Team fully healed');s.votes=[];s.positions=Object.fromEntries(s.players.map((p,i)=>[p.id,{x:.30+i*.14,y:.62}]));}
        else encounterEnemies(s);
      }else{s.encounter++;encounterEnemies(s);}
    }
  }else throw Error('Unknown Dungeon action.');
  return s;
}
export function tickDungeon(input:DungeonState,now=Date.now()){
  if(input.phase==='attack'&&!input.botDice&&input.players.some(p=>!input.rolls[p.id]?.length&&p.weaponUpdate?.attackStartRound!==input.round&&((p.weaponUpdate?.windAttacks??0)>0||p.weaponUpdate?.windSkipNext))){const s=structuredClone(input);for(const player of s.players){const owner=pooled(s,player);if(!s.rolls[player.id]?.length&&prepareWeapon2Attack(owner,s.round,s.enemies.find(p=>p.hp>0))){s.rolls[player.id]=[0];add(s,player.name+' · D20 locked · −5 HP');}savePooled(s,player,owner);}if(s.players.every(p=>s.rolls[p.id]?.length)){if(s.players.every(p=>p.weaponUpdate?.blockedAttackRound===s.round)){s.phase='defense';s.rolls={};s.deadline=now+20000;}else beginBotDice(s,'defense',now);}progressEncounter(s);return s;}
  if(input.clash){
    if(now<input.clash.deadline&&!input.players.every(p=>input.clash!.wagers[p.id]!==undefined))return input;
    const s=structuredClone(input);resolveDungeonClash(s,now);return s;
  }
  if(input.botDice){
    if(input.botDice.stage==='rolling'){
      if(now<input.botDice.readyAt)return input;
      const s=structuredClone(input),pending=s.botDice!;
      const bonus=[0,0,.1,.1,.2,.2,.3,.3,.5,.5][s.floor-1];
      pending.values=pending.role==='charge'?s.enemies.filter(p=>p.hp>0).map(()=>rollD6()):s.players.filter(p=>s.phase!=='attack'||!s.attackActors||s.attackActors.includes(p.id)).map((_,i)=>{const foes=s.enemies.filter(e=>e.hp>0),value=Math.random()<.05+bonus?20:rollD20();return foes.length?weaponD20(foes[i%foes.length],value,pending.role as 'attack'|'defense',s.round,s.players.find(p=>p.weaponUpdate?.cycloneActiveRound===s.round)||s.players[0]):value;});
      pending.stage='result';pending.until=now+3500;
      if(pending.role!=='charge')s.enemyRolls=[...pending.values];
      s.lastRoll={id:'dungeon_enemies',values:[...pending.values],die:pending.role==='charge'?'D6':'D20',at:now};
      add(s,'Enemies · '+s.lastRoll.die+' '+pending.values.join(' + '));flushWeaponEvents(s);return s;
    }
    if(now<(input.botDice.until??Infinity))return input;
    const s=structuredClone(input),pending=s.botDice!;delete s.botDice;
    if(pending.role==='charge')finishCharge(s,pending.values,now);else finishDice(s,now);
    return s;
  }
  if(input.phase==='loading'&&now>=(input.startedAt??now)+3000){const s=structuredClone(input);encounterEnemies(s);return s;}
  if(input.phase==='enemy_skills'&&now>=(input.deadline??Infinity)){
    const s=structuredClone(input);
    for(const enemy of s.enemies.filter(p=>p.hp>0)){
      const p=s.players[Math.floor(Math.random()*s.players.length)];
      const floor=DUNGEON_FLOORS[s.floor-1];
      for(const slot of [1,2] as const){
        const forms=enemy.weapon.skill1.triggerNumber;
        const form=slot===1&&Array.isArray(forms)?forms[0]:undefined;
        const enemyCaster=structuredClone(enemy);
        const final=s.floor===10&&s.encounter===5;
        if(final&&slot===2&&enemy.hp/enemy.maxHp>=.3)continue;
        const effectiveSlot=final?(slot===1?2:Math.random()<.5?1:2):slot;
        if(final&&slot===1)enemyCaster.weapon=WEAPON_DEFINITIONS.dagger;
        if(s.floor===2&&slot===2)enemyCaster.d12Charge=(enemyCaster.d12Charge??0)+5;
        const defense=prepareDungeonDefense(s,p),target=defense.target;
        const cast=castChargedSkill(enemyCaster,target,effectiveSlot,s.round,form,undefined,undefined,isBoss(s)?floor.skill[s.encounter===3?0:1]:0);
        if(!cast)continue;
        const damage=target.hp-cast.opponent.hp;
        const equipped=enemy.weapon;
        if(final){cast.caster.weapon=equipped;cast.caster.skill1UsedTurn=slot===1?s.round:enemy.skill1UsedTurn;cast.caster.skill2UsedTurn=slot===2?s.round:enemy.skill2UsedTurn;}
        Object.assign(enemy,cast.caster);
        const defended=defense.commit(cast.opponent);
        savePooled(s,p,defended.updated);syncWeather([...s.players,...s.enemies]);
        const actual=Math.max(0,target.hp-defended.updated.hp);if(cast.damage>0)recordCombatHit(s,actual,enemy.id,p.id);
        for(const member of s.players)if(member.id!==p.id)recordOpponentDamage(member,actual,s.round);
        if(defended.blocked){add(s,'Guardian blocks enemy skill.');emitDungeon(s,{id:crypto.randomUUID(),effect:'wu1:shield_guard',caster:p.id,target:p.id,name:'Guardian'});}
        if(s.floor===6&&isBoss(s)&&slot===(s.encounter===3?1:2)){
          const poisoned=pooled(s,p);poisoned.weaponUpdate??={};poisoned.weaponUpdate.poisonStacks=5;poisoned.weaponUpdate.poisonUntil=s.round+3;delete poisoned.weaponUpdate.swarmUntil;savePooled(s,p,poisoned);
        }
        if(s.floor===8&&s.encounter===5&&slot===1&&damage>0)damageTeam(s,Math.max(0,12-damage),p);

        add(s,cast.logTextEn+(actual!==damage?' · Shared defenses: '+actual+' HP lost.':''));
        const art=skillPresentation(enemyCaster,effectiveSlot,form??(enemyCaster.weapon.id==='death_note'&&effectiveSlot===2?deathNoteMode(enemyCaster,s.round):undefined));
        if(cast.effect==='dn:purge')emitDungeon(s,{id:crypto.randomUUID(),effect:'dn:eye',caster:enemy.id,target:enemy.id,name:'Eye of Death'});
        emitDungeon(s,{id:crypto.randomUUID(),damage:actual,effect:cast.effect||art.effect,caster:enemy.id,target:art.target==='caster'?enemy.id:p.id,name:art.nameEn});
        if(s.floor===7&&s.encounter===5&&slot===1){enemy.d12Charge=(enemy.d12Charge??0)+rollD6()+rollD6();}
        if(s.floor===8&&s.encounter===3)s.pts=Math.max(0,s.pts-2);
      }

    }
    flushWeaponEvents(s);s.phase='end';s.votes=[];s.deadline=now+20000;progressEncounter(s);return s;
  }
  if(now<(input.deadline??Infinity))return input;
  let s=input;
  if(['attack','defense','charge'].includes(s.phase)){
    for(const player of input.players){
      for(let i=0;i<2&&s.phase===input.phase;i++){
        const required=s.phase==='charge'?d6Allowance(s.players.find(p=>p.id===player.id)!,s.round):1;
        if((s.rolls[player.id]?.length??0)>=required)break;
        s=dungeonAction(s,player.id,'roll',{},now);
      }
    }
  }else if(['skills','end'].includes(s.phase)){
    for(const player of input.players)if(s.phase===input.phase&&!s.votes.includes(player.id))s=dungeonAction(s,player.id,'end',{},now);
  }
  return s;
}
export function dungeonArea(s:Pick<DungeonState,'phase'|'floor'>){return s.phase==='rest'?Math.floor((s.floor-1)/2):0;}
export function dungeonInteractionPoints(rest:boolean|number){
 const area=Number(rest);
 if(area===2)return {portal:{x:.91,y:.51},hand:{x:.30,y:.51},roger:{x:.50,y:.51},avocado:{x:.72,y:.51}};
 if(area===3)return {portal:{x:.91,y:.51},hand:{x:.33,y:.51},roger:{x:.52,y:.51},avocado:{x:.73,y:.51}};
 if(area===4)return {portal:{x:.88,y:.50},hand:{x:.19,y:.51},roger:{x:.42,y:.51},avocado:{x:.65,y:.51}};
 return area?{portal:{x:.5,y:.46},hand:{x:.18,y:.53},roger:{x:.37,y:.53},avocado:{x:.8,y:.53}}:{portal:{x:.5,y:.56},hand:{x:.18,y:.62},roger:{x:.5,y:.83},avocado:{x:.8,y:.62}};
}
export function dungeonPositionAllowed(x:number,y:number,rest:boolean|number=false){return dungeonFloorAllowed(x,y,Number(rest));}
export {dungeonReward};
