require('./test-dice-timing.cjs');
const assert=require('node:assert/strict');
const {createDungeon,makePlayer,dungeonAction:A,tickDungeon:T}=require('../src/lib/dungeon.ts');
const {DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts');
const {clashCounterChance}=require('../src/lib/duelRules.ts');
const {skillEffectPlan}=require('../src/lib/skillPresentation.ts');
const member=id=>({id,name:id,weaponId:'greatsword',classType:'warrior',character:DEFAULT_CUSTOMIZATION,isReady:true});
function state(role='attack',score=12){const s=createDungeon(member('a'));s.players.push(makePlayer(member('b')));s.phase=role;s.round=5;s.teamHp=s.teamMaxHp=200;s.pts=6;s.enemies=[makePlayer(member('enemy'))];s.enemies[0].d12Charge=3;s.enemies[0].hp=s.enemies[0].maxHp=200;s.target='enemy';s.rolls={a:[score],b:[score]};s.enemyRolls=[score,score];s.botDice={stage:'result',role:role==='attack'?'defense':'attack',readyAt:0,until:0,values:[score,score]};return s;}
const original=Math.random;try{
 Math.random=()=>.99;let s=T(state(),100);assert.equal(s.clash.score,24);assert.equal(s.teamHp,200);assert.equal(s.enemies[0].hp,200);assert.equal(s.clash.enemyStake,3);assert.equal(s.enemies[0].d12Charge,0);assert.equal(s.clash.deadline,5100);
 assert.throws(()=>A(s,'a','roll',{},101),/Clashing/);assert.throws(()=>A(s,'a','clash_wager',{stake:4},101),/affordable/);assert.throws(()=>A(s,'outsider','clash_wager',{stake:0},101),/Not in/);
 s=A(s,'a','clash_wager',{stake:3},101);assert.equal(s.pts,3);s=A(s,'a','clash_wager',{stake:3},102);assert.equal(s.pts,3);assert.ok(s.clash);assert.equal(T(s,5099),s);
 Math.random=()=>.5;s=A(s,'b','clash_wager',{stake:3},103);assert.equal(s.clash,undefined);assert.equal(s.pts,0);assert.equal(s.comparison.damage,16);assert.equal(s.enemies[0].hp,184);assert.equal(s.teamHp,200);assert.equal(s.phase,'defense');assert.equal(s.hitEvents.length,1);
 // Deadline defaults missing wagers to zero, pays the enemy once, and cannot replay.
 Math.random=()=>.99;s=T(state(),100);s=T(s,5100);assert.equal(s.pts,6);assert.equal(s.enemies[0].d12Charge,0);assert.equal(s.enemies[0].hp,184);assert.equal(s.phase,'defense');assert.equal(T(s,5101),s);
 // Team defends and counters. Shared Rock absorbs the counter from enemies on a lost clash.
 Math.random=()=>0;s=T(state('defense'),100);s=A(s,'a','clash_wager',{stake:0},101);s=A(s,'b','clash_wager',{stake:0},102);assert.equal(s.enemies[0].hp,184);assert.equal(s.teamHp,200);assert.equal(s.phase,'charge');
 Math.random=()=>0;s=T(state(),100);s.players[1].weapon=require('../src/lib/constants.ts').WEAPON_DEFINITIONS.spirit_stone;s.players[1].petRockHp=25;s=A(s,'a','clash_wager',{stake:0},101);s=A(s,'b','clash_wager',{stake:0},102);assert.equal(s.teamHp,189);assert.equal(s.players[1].petRockHp,20);
 // Simultaneous clients cannot overspend the shared balance.
 s=state();s.pts=2;s=T(s,100);s=A(s,'a','clash_wager',{stake:2},101);assert.throws(()=>A(s,'b','clash_wager',{stake:1},102),/affordable/);s=A(s,'b','clash_wager',{stake:0},102);assert.equal(s.pts,0);
 s=T(state('attack',20),100);assert.equal(s.clash,undefined);assert.equal(s.phase,'defense');
 s=state();s.enemyRolls=[10,10];s=T(s,100);assert.equal(s.clash,undefined);assert.equal(s.enemies[0].hp,196);
 assert.equal(clashCounterChance(0,0),.35);assert.equal(clashCounterChance(0,3),.65);assert.equal(clashCounterChance(3,0),.05);assert.equal(clashCounterChance(12,0),0);assert.equal(clashCounterChance(0,12),1);
 const {WEAPON_DEFINITIONS:W}=require('../src/lib/constants.ts');assert.deepEqual(skillEffectPlan({...s.players[0],weapon:W.death_note},2,2).map(c=>[c.effect,c.target]),[['dn:eye','caster'],['dn:purge','opponent']]);
 console.log('PASS Dungeon Clashing: party totals >20, 5s deadline, every teammate wager, pooled affordability/idempotence, both roles, shared Rock, damage/hit history, natural-20 exception, unchanged non-ties and shared duel odds; Death Note eye/target cue anchors');
}finally{Math.random=original;}
