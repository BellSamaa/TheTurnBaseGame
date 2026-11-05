require('./test-new-combat-balance.cjs');
const assert=require('node:assert/strict');
const {createRoundLms,roundLmsAction:act,roundLmsTick:tick,stageActor}=require('../src/lib/lmsRound.ts');
const people=Array.from({length:4},(_,i)=>({id:'p'+i,name:'P'+i,character:{},classType:'warrior',weaponId:'infinity_ring',isReady:true}));
let s=createRoundLms(people),now=Date.now();
assert.equal(s.initiative.length,0);assert.equal(s.rollDeadline,undefined);
assert.equal(tick(s,now+10000),s);
s=act(s,'p0','ready_opening',{},now);s=act(s,'p0','initiative',{},now+1000);assert.equal(s.rollDeadline,undefined);assert.equal(s.initiative.length,1);
for(const p of people.slice(1))s=act(s,p.id,'ready_opening',{},now+2000);
assert.equal(s.rollDeadline,now+22000);assert.equal(tick(s,now+21999),s);
s=tick(s,now+22000);assert.equal(s.initiative.length,4);assert.equal(s.phase,'target');
// Migrating an in-progress room starts a fresh ordered charge pass.
s=createRoundLms(people);Object.assign(s,{phase:'skills',round:2,initiative:[20,15,15,4].map((roll,i)=>({id:'p'+i,roll}))});
s=tick(s,1000);assert.equal(s.stagePart,'charge');assert.equal(stageActor(s),'p0');assert.equal(s.stageOrder[3],'p3');assert.deepEqual(new Set(s.stageOrder.slice(1,3)),new Set(['p1','p2']));assert.equal(s.tieNotice.groups[0].roll,15);
const order=[...s.stageOrder];assert.throws(()=>act(s,'p3','charge',{},1100));assert.throws(()=>act(s,'p0','skill',{slot:1,target:'p1'},1100));
for(const id of order){assert.equal(stageActor(s),id);s=act(s,id,'charge',{},2000);}
assert.equal(s.stagePart,'skill');assert.equal(stageActor(s),'p0');assert.ok(people.every(p=>s.roundCharges[p.id].length===1));assert.throws(()=>act(s,'p0','charge',{},2100));
s.players[0].d12Charge=100;s=act(s,'p0','skill',{slot:1,form:4,target:'p1'},2100);assert.equal(stageActor(s),order[1]);
for(const id of order.slice(1))s=act(s,id,'end',{},2200);
assert.equal(s.phase,'buffs');assert.equal(stageActor(s),'p0');assert.equal(s.stageOrder.at(-1),'p3');assert.equal(s.tieNotice.phase,'buffs');
const buffOrder=[...s.stageOrder];for(const id of buffOrder){assert.equal(stageActor(s),id);s=act(s,id,'end',{},3000);}
assert.equal(s.phase,'end');assert.equal(s.endDeadline,33000);assert.equal(tick(s,32999),s);
s=tick(s,33000);assert.equal(s.round,3);assert.equal(s.phase,'initiative');assert.equal(s.initiative.length,0);assert.equal(s.rollDeadline,53000);
// AFK applies to one actor at a time, each receiving a fresh 20 seconds.
Object.assign(s,{phase:'skills',stagePart:'charge',stageDone:[],stageOrder:order,stageDeadline:50000,roundCharges:{}});
s=tick(s,50000);assert.equal(stageActor(s),order[1]);assert.equal(s.stageDeadline,70000);assert.equal(s.roundCharges.p0.length,1);assert.equal(tick(s,69999),s);
// Tie draws are not permanently biased by roster order.
const winners=new Set();for(let i=0;i<50;i++){let x=createRoundLms(people);Object.assign(x,{phase:'buffs',initiative:people.map(p=>({id:p.id,roll:10}))});x=tick(x,1000);winners.add(stageActor(x));}assert.ok(winners.size>1);
console.log('PASS: opening-card readiness, no early round-1 auto-roll, 20s roll/action timers, ordered all-charge then skills, randomized ties, ordered buffs, 30s final end, fresh next-round dice');

// An eliminated/forfeiting current actor cannot stall or restart the ordered pass.
let gone=createRoundLms(people);Object.assign(gone,{phase:'buffs',initiative:[20,15,10,5].map((roll,i)=>({id:'p'+i,roll}))});gone=tick(gone,1000);gone=act(gone,'p0','surrender',{},1500);assert.equal(gone.phase,'buffs');assert.equal(stageActor(gone),'p1');
// Three-player rooms give every survivor a charge and a skill opportunity too.
let trio=createRoundLms(people.slice(0,3));Object.assign(trio,{phase:'skills',round:2,initiative:[20,12,4].map((roll,i)=>({id:'p'+i,roll}))});trio=tick(trio,1000);for(const p of people.slice(0,3))trio=act(trio,p.id,'charge',{},2000);assert.equal(trio.stagePart,'skill');for(const p of people.slice(0,3))trio=act(trio,p.id,'end',{},3000);assert.equal(trio.phase,'buffs');
console.log('PASS: 3/4-player ordered turns and surrender skip without stage reset');
