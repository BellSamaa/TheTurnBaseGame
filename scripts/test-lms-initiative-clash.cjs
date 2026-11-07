require('./test-dice-timing.cjs');
const assert=require('node:assert/strict');
const {createRoundLms,roundLmsAction:A,roundLmsTick:T}=require('../src/lib/lmsRound.ts');
const {openDuelClash}=require('../src/lib/duelRules.ts');
const {calculateDuelCombat}=require('../src/lib/battleLogic.ts');
const {createDungeon,makePlayer,tickDungeon}=require('../src/lib/dungeon.ts');
const {DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts');
const member=id=>({id,name:id,weaponId:'greatsword',classType:'warrior',character:DEFAULT_CUSTOMIZATION,isReady:true});
function random(value,fn){const old=Math.random;Math.random=()=>value;try{return fn();}finally{Math.random=old;}}
function setup(count=3){const s=createRoundLms(Array.from({length:count},(_,i)=>member('p'+i)));s.openingReady=s.order.slice();s.rollDeadline=20000;s.players.forEach(p=>p.d12Charge=5);return s;}
function tied(count=3){let s=setup(count);for(const id of s.order)s=random(.99,()=>A(s,id,'initiative',{},1000));return s;}
assert.ok(openDuelClash(20,20,'def',1000));
for(const value of [.1,.9]){const result=random(value,()=>calculateDuelCombat(20,20,makePlayer(member('a')),makePlayer(member('b')),1));assert.equal(result.critical,false);assert.equal(result.notice.kind,'clash');assert.equal(result.counter,value<.35);assert.equal(result.counter?result.counterDamage:result.damage,13);}
for(const count of [3,4]){
 let s=tied(count);assert.equal(s.phase,'initiative');assert.equal(s.initiativeClash.ids.length,count);assert.equal(s.initiativeClash.score,20);
 assert.throws(()=>A(s,'p0','target',{target:'p1'},1100));assert.throws(()=>A(s,'p0','initiative_wager',{stake:4},1100));
 s=A(s,'p0','initiative_wager',{stake:3},1100);assert.equal(s.players[0].d12Charge,2);assert.equal(A(s,'p0','initiative_wager',{stake:3},1200),s);
 for(const id of s.order.filter(id=>id!=='p0'))s=random(.1,()=>A(s,id,'initiative_wager',{stake:0},1300));
 assert.equal(s.phase,'target');assert.equal(s.order[0],'p0');assert.equal(s.initiativeClash,undefined);assert.equal(s.duelNotice.kind,'clash');assert.ok(s.players.every(p=>p.hp===p.maxHp));
 s=A(s,'p0','target',{target:'p1'},2000);s=random(.1,()=>A(s,'p0','resolve',{},7000));assert.equal(s.duelNotice.kind,'crit');
}
let s=tied();assert.equal(T(s,5999),s);s=random(.99,()=>T(s,6000));assert.equal(s.phase,'target');assert.equal(s.order[0],'p2');assert.ok(s.players.every(p=>p.d12Charge===5));
s=tied();s.players[0].hp=0;s=random(0,()=>T(s,2000));assert.equal(s.order[0],'p1');assert.equal(s.initiativeClash,undefined);
// Untied initiative keeps the winner's displayed D20 and never opens wagering.
s=setup();for(const [id,value] of [['p0',.2],['p1',.6],['p2',.8]])s=random(value,()=>A(s,id,'initiative',{},1000));assert.equal(s.order[0],'p2');assert.equal(s.initiativeClash,undefined);
// Dungeon equal natural twenties, for both attack and defense, open a wager.
for(const phase of ['attack','defense']){const d=createDungeon(member('a'));d.phase=phase;d.floor=1;d.encounter=1;d.round=1;d.teamHp=d.teamMaxHp=100;d.enemies=[makePlayer(member('e'))];d.target='e';d.rolls={a:[20]};d.enemyRolls=[20];d.botDice={stage:'result',role:phase==='attack'?'defense':'attack',values:[20],readyAt:0,until:0};const next=tickDungeon(d,1000);assert.equal(next.clash.score,20);}
console.log('PASS: 20=20 clashes in duels/Dungeon; LMS 3–4-way priority wagers, timeout, duplicate protection, departure, untied rolls and critical hits');
