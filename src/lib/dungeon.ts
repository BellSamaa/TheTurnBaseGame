import type {PlayerState} from '@/types/game';
import type {RoomParticipant} from './serverDb';
import {CLASS_DEFINITIONS,WEAPON_DEFINITIONS} from './constants';
import {DUNGEON_FLOORS,dungeonReward} from './dungeonCatalog';
import {createLms} from './lms';
import {rollD6,rollD20} from './battleLogic';
import {castChargedSkill,chargeSkillPoints} from './chargedSkills';
import {recordAttackRoll,d6Allowance} from './classMechanics';
import {rollTimedD20,updateDiceTiming} from './diceTiming';
import {normalSetup,normalReactions,weaponD20,tickWeaponRound} from './weaponUpdateHooks';
import {drainWeaponEvents,syncWeather,advanceWeather} from './weaponUpdateState';
import {skillPresentation} from './skillPresentation';
import {applyOpponentDamage} from './combatDamage';
import {warriorBonus} from './classMechanics';

type Position={x:number;y:number};
type Buff={id:string;remaining:number;active:boolean};
export interface DungeonState {
  players:PlayerState[];
  requests?:string[];
  host:string;
  floor:number;
  encounter:number;
  round:number;
  phase:'room'|'entrance'|'loading'|'attack'|'defense'|'charge'|'skills'|'enemy_skills'|'end'|'cleared'|'rest'|'victory'|'defeat';
  teamHp:number;
  teamMaxHp:number;
  pts:number;
  coins:number;
  enemies:PlayerState[];
  votes:string[];
  rolls:Record<string,number[]>;
  enemyRolls:number[];
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
  event?:{id:string;effect:string;caster:string;target:string;name:string};
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
function add(s:DungeonState,text:string){s.log=[text,...s.log].slice(0,150);}
function activeBuff(s:DungeonState,id:string){return s.buffs.find(b=>b.id===id&&b.active&&b.remaining>0);}
function isBoss(s:DungeonState){return s.encounter===3||s.encounter===5;}
function pooled(s:DungeonState,p:PlayerState){return {...structuredClone(p),hp:s.teamHp,maxHp:s.teamMaxHp,d12Charge:s.pts};}
function savePooled(s:DungeonState,p:PlayerState,updated:PlayerState){
  s.teamHp=updated.hp;s.teamMaxHp=updated.maxHp;s.pts=updated.d12Charge??0;
  const personalHp=p.maxHp;
  Object.assign(p,updated,{hp:personalHp,maxHp:personalHp});
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
  s.round++;s.rolls={};s.lastD20={};s.enemyRolls=[];s.votes=[];s.target=s.enemies[0].id;
  s.phase='attack';s.deadline=Date.now()+20000;
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
function damageTeam(s:DungeonState,n:number,recipient?:PlayerState){
  if(n<=0)return 0;
  const guardian=activeBuff(s,'guardian');
  if(guardian){guardian.remaining=0;add(s,'Guardian blocks '+n+' damage.');return 0;}
  const p=recipient||s.players[0],pooledPlayer=pooled(s,p);
  const damage=applyOpponentDamage(pooledPlayer,n,s.round);
  savePooled(s,p,pooledPlayer);
  return damage;
}
function dice(s:DungeonState,p:PlayerState,role:'attack'|'defense'){
  const timing=p.diceTiming;
  const quality=timing?.round===s.round&&timing.role===role?timing.quality??0:0;
  let value=rollTimedD20(p,s.round,role,rollD20);
  let chance=.05+.1*quality+(s.lucky[p.id]>0?.1:0);
  if(activeBuff(s,'underdog'))chance-=.2;
  if(activeBuff(s,'underdog_reward'))chance+=.2;
  if(chance!==.05)value=Math.random()<Math.max(0,Math.min(1,chance))?20:1+Math.floor(Math.random()*19);
  if(role==='attack'&&activeBuff(s,'musashi')&&['greatsword','dagger','king_slasher'].includes(p.weapon.id)&&Math.random()<.2)value=Math.max(value,Math.random()<.85?20:rollD20());
  return weaponD20(p,value,role,s.round,s.enemies.find(p=>p.hp>0));
}
function beginBotDice(s:DungeonState,role:'attack'|'defense'|'charge',now:number){
  s.botDice={stage:'rolling',role,readyAt:now+1400,values:[]};
  s.deadline=undefined;
}
function finishDice(s:DungeonState,now:number){
  if(!s.enemies.some(p=>p.hp>0)){progressEncounter(s);return;}
  let total=Object.values(s.rolls).flat().reduce((a,b)=>a+b,0);
  // The visible result was rolled and held by tickDungeon; never roll it again here.
  let enemyTotal=s.enemyRolls.reduce((a,b)=>a+b,0),floor=DUNGEON_FLOORS[s.floor-1];
  if(s.phase==='attack'){
    const victim=s.enemies.find(p=>p.id===s.target&&p.hp>0)||s.enemies.find(p=>p.hp>0)!;
    let weaponBonus=0;
    for(const player of s.players){
      const owner=pooled(s,player),value=s.rolls[player.id]?.[0]||0;
      const setup=normalSetup(owner,victim,value,enemyTotal/s.players.length,s.round);
      total+=setup.atk-value;
      enemyTotal+=Math.round(setup.def-enemyTotal/s.players.length);
      if(setup.cancel||setup.dodge||owner.isStunned||owner.timeLockActive){total-=value;owner.isStunned=false;owner.timeLockActive=false;}
      if(owner.weapon.id==='revolver'){if((owner.bullets??6)<=0)total-=Math.max(0,value);else owner.bullets=(owner.bullets??6)-1;}
      if(setup.cleave)weaponBonus+=total>enemyTotal?4:5;
      if(owner.flameBladeBuff&&total>enemyTotal){weaponBonus+=4;owner.flameBladeBuff=false;}
      if((owner.daggerBurnHits??0)>0&&total>enemyTotal){weaponBonus-=2;owner.daggerBurnHits!--;}
      if((owner.panicTurns??0)>0){total-=owner.panicAttackDebuff??0;owner.panicTurns!--;}
      savePooled(s,player,owner);
    }
    let damage=Math.max(0,total-enemyTotal)+weaponBonus;
    if(damage>0){
      const modifier=s.players.reduce((sum,p)=>sum+CLASS_DEFINITIONS[p.classType].damageModifier,0)/s.players.length;
      damage=Math.round(damage*modifier)+s.players.reduce((sum,p)=>sum+warriorBonus({...p,hp:s.teamHp,maxHp:s.teamMaxHp}),0);
      if(activeBuff(s,'devil'))damage+=5;
      const slayer=activeBuff(s,'slayer');
      if(isBoss(s)&&slayer){damage+=5;slayer.remaining--;}
      damage=applyOpponentDamage(victim,Math.max(0,damage),s.round);
      for(const player of s.players){const owner=pooled(s,player);normalReactions(owner,victim,damage>0,Math.round(damage/s.players.length),Math.round(enemyTotal/s.players.length),s.round);savePooled(s,player,owner);}
      for(const p of s.players)if(p.weapon.id==='spirit_stone'&&(p.petRockHp??0)>0&&victim.hp>0){
        const follow=applyOpponentDamage(victim,(p.petRockEnraged?5:2)+(activeBuff(s,'summoner')?2:0),s.round);
        add(s,p.name+' · Pet Rock follow-up '+follow+' damage');
      }
    }
    add(s,'Team ATK '+total+' vs DEF '+enemyTotal+' · '+victim.name+' −'+damage+' HP');
    s.phase='defense';
  }else{
    for(const player of s.players){
      const owner=pooled(s,player),enemy=s.enemies.find(p=>p.hp>0)!;
      const ownDef=s.rolls[player.id]?.[0]||0;
      const setup=normalSetup(enemy,owner,enemyTotal/s.players.length,ownDef,s.round);
      total+=setup.def-ownDef;
      if(setup.cancel||setup.dodge){enemyTotal-=Math.round(enemyTotal/s.players.length);}
      savePooled(s,player,owner);
    }
    let damage=Math.max(0,enemyTotal-total);
    if(damage>0&&isBoss(s))damage+=floor.attack[s.encounter===3?0:1];
    const reduction=s.players.reduce((sum,p)=>sum+CLASS_DEFINITIONS[p.classType].damageReduction,0)/s.players.length;
    damage=damageTeam(s,Math.round(damage*reduction));
    add(s,'Enemy ATK '+enemyTotal+' vs DEF '+total+' · Team −'+damage+' HP');
    s.phase='charge';
  }
  for(const event of drainWeaponEvents([...s.players,...s.enemies]))add(s,event.text);
  s.rolls={};s.deadline=now+20000;progressEncounter(s);
}
function finishCharge(s:DungeonState,values:number[],now:number){
  for(const [i,enemy] of s.enemies.filter(p=>p.hp>0).entries())Object.assign(enemy,chargeSkillPoints(enemy,[values[i]],s.round));
  s.phase='skills';s.votes=[];s.deadline=now+20000;
  for(const player of s.players){
    const owner=pooled(s,player);
    for(const event of tickWeaponRound([owner,...s.enemies],s.round,'summons')){
      add(s,event.text);
      if(activeBuff(s,'summoner')&&event.target!==owner.id){const foe=s.enemies.find(e=>e.id===event.target);if(foe)applyOpponentDamage(foe,2,s.round);}
    }
    savePooled(s,player,owner);
  }
  progressEncounter(s);
}
export function dungeonAction(input:DungeonState,actor:string,action:string,args:Record<string,unknown>={},now=Date.now()){
  const s=structuredClone(input),p=s.players.find(p=>p.id===actor);
  for(const player of s.players)if(s.round>(player.petRockEnrageUntilRound??Infinity))player.petRockEnraged=false;
  if(!p)throw Error('Not in this Dungeon.');
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
    if(Math.hypot(x-previous.x,y-previous.y)>.09)throw Error('Move too far.');
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
      if(s.players.every(p=>(s.rolls[p.id]?.length||0)>=d6Allowance(p,s.round))){
        beginBotDice(s,'charge',now);
      }
    }else{
      if(existing.length)throw Error('Already rolled.');
      const value=dice(s,p,s.phase as 'attack'|'defense');
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
    if(activeBuff(s,'instinct')&&(!before.immuneDamageNext&&cast.caster.immuneDamageNext||!before.dodgeNextAttack&&cast.caster.dodgeNextAttack||!before.dodgeNextSkill&&cast.caster.dodgeNextSkill)&&Math.random()<.5){
      (s.instinctReuse??={})[actor]={round:s.round+1,slot};
      // One free reuse next round; this round remains single-use.
      cast.caster.weaponUpdate??={};
      add(s,'Ultra Instinct · reusable next round');
    }
    if(activeBuff(s,'helena')&&cast.caster.hp>before.hp)cast.caster.hp=Math.min(s.teamMaxHp,cast.caster.hp+Math.round((cast.caster.hp-before.hp)*.2));
    const summoner=activeBuff(s,'summoner');
    if(summoner){
      if((cast.caster.petRockHp??0)>(before.petRockHp??0))cast.caster.petRockHp!+=5;
      for(const pet of cast.caster.weaponUpdate?.summons||[])if(!(before.weaponUpdate?.summons||[]).some(old=>old.id===pet.id)){pet.hp+=5;pet.maxHp+=5;}
    }
    if(activeBuff(s,'weather')&&cast.caster.weaponUpdate?.weather?.fresh){cast.caster.weaponUpdate.weather.remainingTurns!+=2;cast.caster.weaponUpdate.weather.until+=2;activeBuff(s,'weather')!.remaining=0;}
    const art=skillPresentation(p,slot,args.form as number|undefined);
    savePooled(s,p,cast.caster);Object.assign(target,cast.opponent);syncWeather([...s.players,...s.enemies]);
    s.event={id:crypto.randomUUID(),effect:cast.effect||art.effect,caster:p.id,target:art.target==='caster'?p.id:target.id,name:art.nameEn};
    add(s,cast.logTextEn);progressEncounter(s);
  }else if(action==='end'){
    if(!['skills','end'].includes(s.phase))throw Error('Cannot end this phase.');
    if(!s.votes.includes(actor))s.votes.push(actor);
    if(s.players.every(p=>s.votes.includes(p.id))){
      s.votes=[];
      if(s.phase==='skills'){s.phase='enemy_skills';s.deadline=now+2500;}
      else{
        advanceWeather([...s.players,...s.enemies],s.round);
        s.round++;s.rolls={};s.lastD20={};s.phase='attack';s.deadline=now+20000;
        for(const p of s.players){p.diceTiming=undefined;}
        for(const p of s.players){
          const before=pooled(s,p);before.hp=s.teamHp;
          for(const event of tickWeaponRound([before,...s.enemies],s.round))add(s,event.text);
          if((before.burnTicks??0)>0){applyOpponentDamage(before,before.burnDmgPerTurn??1,s.round,false);before.burnTicks!--;}
          savePooled(s,p,before);
        }
        for(const enemy of s.enemies)if((enemy.burnTicks??0)>0){applyOpponentDamage(enemy,enemy.burnDmgPerTurn??1,s.round,false);enemy.burnTicks!--;}
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
        if(completed%2===0){s.coins+=[300,450,600,800][completed/2-1];s.phase='rest';s.votes=[];s.positions=Object.fromEntries(s.players.map((p,i)=>[p.id,{x:.235+i*.175,y:.61}]));}
        else encounterEnemies(s);
      }else{s.encounter++;encounterEnemies(s);}
    }
  }else throw Error('Unknown Dungeon action.');
  return s;
}
export function tickDungeon(input:DungeonState,now=Date.now()){
  if(input.botDice){
    if(input.botDice.stage==='rolling'){
      if(now<input.botDice.readyAt)return input;
      const s=structuredClone(input),pending=s.botDice!;
      const bonus=[0,0,.1,.1,.2,.2,.3,.3,.5,.5][s.floor-1];
      pending.values=pending.role==='charge'?s.enemies.filter(p=>p.hp>0).map(()=>rollD6()):s.players.map(()=>Math.random()<.05+bonus?20:rollD20());
      pending.stage='result';pending.until=now+3500;
      if(pending.role!=='charge')s.enemyRolls=[...pending.values];
      s.lastRoll={id:'dungeon_enemies',values:[...pending.values],die:pending.role==='charge'?'D6':'D20',at:now};
      add(s,'Enemies · '+s.lastRoll.die+' '+pending.values.join(' + '));return s;
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
      const p=s.players[Math.floor(Math.random()*s.players.length)],target=pooled(s,p);
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
        const cast=castChargedSkill(enemyCaster,target,effectiveSlot,s.round,form);
        if(!cast)continue;
        const damage=target.hp-cast.opponent.hp;
        const equipped=enemy.weapon;
        if(final){cast.caster.weapon=equipped;cast.caster.skill1UsedTurn=slot===1?s.round:enemy.skill1UsedTurn;cast.caster.skill2UsedTurn=slot===2?s.round:enemy.skill2UsedTurn;}
        Object.assign(enemy,cast.caster);
        if(damage>0){
          const guardian=activeBuff(s,'guardian');
          if(guardian)guardian.remaining=0;
          else{
            savePooled(s,p,cast.opponent);
            s.teamHp=Math.max(0,s.teamHp-(isBoss(s)?floor.skill[s.encounter===3?0:1]:0));
          }
        }else savePooled(s,p,cast.opponent);
        if(s.floor===6&&isBoss(s)&&slot===(s.encounter===3?1:2)){
          const poisoned=pooled(s,p);poisoned.weaponUpdate??={};poisoned.weaponUpdate.poisonStacks=5;poisoned.weaponUpdate.poisonUntil=s.round+3;delete poisoned.weaponUpdate.swarmUntil;savePooled(s,p,poisoned);
        }
        if(s.floor===8&&s.encounter===5&&slot===1&&damage>0)damageTeam(s,Math.max(0,12-damage),p);
        Object.assign(target,pooled(s,p));
        add(s,cast.logTextEn);
        const art=skillPresentation(enemy,slot,form);
        s.event={id:crypto.randomUUID(),effect:cast.effect||art.effect,caster:enemy.id,target:art.target==='caster'?enemy.id:p.id,name:art.nameEn};
        if(s.floor===7&&s.encounter===5&&slot===1){enemy.d12Charge=(enemy.d12Charge??0)+rollD6()+rollD6();}
        if(s.floor===8&&s.encounter===3)s.pts=Math.max(0,s.pts-2);
      }

    }
    s.phase='end';s.votes=[];s.deadline=now+20000;progressEncounter(s);return s;
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
export function dungeonPositionAllowed(x:number,y:number,rest:boolean|number=false){
 const area=Number(rest);
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<.08||x>.94||y<(area?.46:.54)||y>.9)return false;
 if(!area)return true;
 if(area===2)return !((x<.13&&y>.71)||(x>.88&&y>.71)||(x>.13&&x<.24&&y>.80)||(x>.27&&x<.39&&y>.76)||(x>.42&&x<.59&&y>.77)||(x>.61&&x<.73&&y>.76)||(x>.75&&x<.87&&y>.80));
 if(area===3)return !((x<.27&&y<.61)||(x<.35&&y>.74)||(x>.68&&y>.74)||(y>.84&&(x<.43||x>.57)));
 if(area===4)return !((y>.75&&(x<.40||x>.60))||(y>.82&&(x<.44||x>.56)));
 return !((x<.20&&y>.62)||(x>.83&&y>.62)||(x>.35&&x<.69&&y>.77)||(x>.455&&x<.555&&y>.70)||(x>.69&&x<.83&&y>.70));
}
export {dungeonReward};
