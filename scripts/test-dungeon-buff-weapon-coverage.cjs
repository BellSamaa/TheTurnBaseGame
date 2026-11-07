require('./test-dice-timing.cjs');
const assert=require('node:assert/strict');
const {createDungeon,makePlayer,dungeonAction:A,tickDungeon:T}=require('../src/lib/dungeon.ts');
const {WEAPON_DEFINITIONS:W,DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts');
const {isBladeWeapon}=require('../src/lib/weaponTraits.ts');
const member=(id,weaponId)=>({id,name:id,weaponId,classType:'warrior',character:DEFAULT_CUSTOMIZATION,isReady:true});
function state(weapon='greatsword',buffs=['helena']){const s=createDungeon(member('a',weapon));s.players.push(makePlayer(member('b','greatsword')));s.phase='skills';s.round=5;s.teamHp=100;s.teamMaxHp=200;s.pts=500;s.coins=1000;s.enemies=[makePlayer(member('enemy','greatsword'))];s.enemies[0].hp=s.enemies[0].maxHp=10000;s.target='enemy';s.buffs=buffs.map(id=>({id,active:true,remaining:1e9}));return s;}
const round=s=>{s.phase='end';s.votes=[];s=A(s,'a','end');return A(s,'b','end')};
const original=Math.random;try{
 Math.random=()=>0;
 for(const id of ['greatsword','dagger','king_slasher','kagutsuchi','musashi']){assert.equal(isBladeWeapon(W[id]),true,id);let s=state(id,['musashi']);s.phase='attack';s=A(s,'a','roll');assert.equal(s.rolls.a[0],20,id);assert.ok(s.log.some(l=>l.includes('Musashi buff')),id)}
 for(const id of ['bow','staff','wind_wand','astghik_staff','dual_spears','shield','spirit_stone']){assert.equal(isBladeWeapon(W[id]),false,id);let s=state(id,['musashi']);s.phase='attack';s=A(s,'a','roll');assert.equal(s.rolls.a[0],1,id);assert.ok(!s.log.some(l=>l.includes('Musashi buff')),id)}
 const heals=[['spirit_stone',2,undefined,10],['frying_pan',2,undefined,5],['mirror_of_life',2,undefined,20],['chronos_watch',2,1,10],['astghik_staff',1,1,10],['musashi',1,3,10]];
 for(const [weapon,slot,form,amount]of heals)for(const enabled of [false,true]){let s=state(weapon,enabled?['helena']:[]);if(weapon==='spirit_stone')s.players[0].petRockHp=25;if(weapon==='chronos_watch'){s.players[0].opponentDamageTurn=5;s.players[0].opponentDamageAmount=10}s=A(s,'a','skill',{slot,form,target:'enemy'});assert.equal(s.teamHp,100+Math.round(amount*(enabled?1.2:1)),weapon+' '+enabled);}
 let s=state('spirit_stone');s.teamHp=195;s.players[0].petRockHp=25;s=A(s,'a','skill',{slot:2});assert.equal(s.teamHp,200);
 s=state();s.players[1].weapon=W.spirit_stone;s.players[1].petRockHp=25;s=A(s,'b','skill',{slot:2});assert.equal(s.teamHp,112,'teammate Rock heals shared HP');
 s=state('mirror_of_life');s.teamMaxHp=400;s.enemies[0].hp=150;s=A(s,'a','skill',{slot:1});assert.equal(s.teamHp,150,'HP swap is not healing');
 s=state();s.phase='end';s=A(s,'a','shop',{item:'hp'});assert.equal(s.teamHp,120,'potions are not amplified');
 s=state('astghik_staff');s.players[0].weaponUpdate={weather:{kind:'rain',until:20,remainingTurns:5,started:1,owner:'a'}};s=round(s);assert.equal(s.teamHp,106,'rain passive heals 6');
 s=state('astghik_staff');s.players[0].weaponUpdate={weather:{kind:'rain',until:20,remainingTurns:5,started:1,owner:'a'}};s.enemies[0].weaponUpdate={haloOwner:'a',haloUntil:20};let values=[.99,.1,.1];Math.random=()=>values.shift()??.99;s=round(s);assert.equal(s.teamHp,112,'halo life drain heals 12');
 Math.random=()=>0;s=state('thunder_spear');s.enemies[0].weaponUpdate={blueOwner:'a',blueUntil:20,blueTick:2};s=round(s);assert.equal(s.teamHp,112,'blue lightning heals 12');
 s=state('wind_wand');s.players[0].weaponUpdate={cycloneAttacks:1};s.phase='attack';s.rolls={a:[15],b:[15]};s.enemyRolls=[10,10];s.botDice={stage:'result',role:'defense',readyAt:0,until:0,values:[10,10]};s=T(s,1);assert.equal(s.teamHp,106,'cyclone heals 6');
 s=state('elemental_rings');s.players[0].weaponUpdate={summons:[{id:'m',kind:'mermaid',hp:3,maxHp:3,activeUntil:20}]};s.phase='charge';s.botDice={stage:'result',role:'charge',readyAt:0,until:0,values:[1]};s=T(s,1);assert.equal(s.teamHp,104,'Mermaid heals 4 once');
 s=state('elemental_rings',['helena','summoner']);s.players[0].weaponUpdate={summons:[{id:'n',kind:'niko',hp:30,maxHp:30,activeUntil:20}]};s.phase='charge';s.botDice={stage:'result',role:'charge',readyAt:0,until:0,values:[1]};s=T(s,1);assert.equal(s.teamHp,117,'Niko +2 damage, then +20% healing');assert.equal(s.enemies[0].hp,9986);
 s=state('elemental_rings',['summoner']);s=A(s,'a','skill',{slot:1});assert.equal(s.players[0].weaponUpdate.summons[0].hp,15);s.enemies[0].immuneDamageNext=true;s.round++;s.phase='charge';s.botDice={stage:'result',role:'charge',readyAt:0,until:0,values:[1]};s=T(s,1);assert.equal(s.enemies[0].hp,10000,'summon bonus does not bypass immune');assert.equal(s.enemies[0].immuneDamageNext,false);
 const {tickWeaponRound,weaponD20}=require('../src/lib/weaponUpdateHooks.ts');
 for(const [kind,value,expected]of [['golem',0,4],['fire_person',0,7],['niko',.4,7]]){const owner=makePlayer(member('owner','elemental_rings')),foe=makePlayer(member('foe','greatsword'));owner.summonDamageBonus=2;owner.weaponUpdate={summons:[{id:'s',kind,hp:10,maxHp:10,activeUntil:20}]};const hp=foe.hp;let sequence=kind==='niko'?[0,0,value]:[0,0];Math.random=()=>sequence.shift()??0;tickWeaponRound([owner,foe],6,'summons');assert.equal(hp-foe.hp,expected,kind+' +2 before defense');}
 const voidOwner=makePlayer(member('void','infinity_ring')),voidTarget=makePlayer(member('target','greatsword'));voidOwner.summonDamageBonus=2;voidOwner.weaponUpdate={akaiUntil:20};Math.random=()=>0;const hpBefore=voidTarget.hp;weaponD20(voidOwner,10,'attack',6,voidTarget);assert.equal(hpBefore-voidTarget.hp,5,'Akai is not a summon');
 console.log('PASS Dungeon buff coverage: all five blade weapons + seven exclusions; Helena direct heals incl Rock/Chronos/Astghik/Musashi, weather/passives/drain/summons, shared teammate HP, max cap, no double boost or potion/HP-swap boost; Summoner damage before immunity and combined Niko healing');
}finally{Math.random=original}
