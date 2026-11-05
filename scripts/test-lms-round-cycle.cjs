require('./test-charged-skills.cjs');const assert=require('node:assert/strict');const {createRoundLms}=require('../src/lib/lmsRound.ts');const {lmsAction,tickLms}=require('../src/lib/lms.ts');
for(const n of [3,4]){
 let s=createRoundLms(Array.from({length:n},(_,i)=>({id:'p'+i,name:'P'+i,character:{},classType:'mage',weaponId:'infinity_ring',isReady:true})));
 s=tickLms(s,s.rollDeadline);assert.equal(s.phase,'target');const a=s.order[0],target=s.order[1],atk=s.initiative.find(r=>r.id===a).roll;
 s=lmsAction(s,a,'target',{target});assert.equal(s.phase,'defense');assert.equal(s.attack,atk);s=lmsAction(s,target,'defend',{},1000);s=tickLms(s,6000);assert.equal(s.phase,'skills');
 for(const p of s.players){s=lmsAction(s,p.id,'charge');s=lmsAction(s,p.id,'charge');s.players.find(x=>x.id===p.id).d12Charge=100;}
 const caster=s.order[n-1],hp=s.players.map(p=>p.hp);s=lmsAction(s,caster,'skill',{slot:1,form:4,target:a});for(let i=0;i<n;i++)if(s.players[i].id!==caster)assert.equal(s.players[i].hp,hp[i]-12,'Akai hits all opponents');assert.equal(s.players.find(p=>p.id===caster).d12Charge,95);
 const before=s.players.map(p=>p.hp);s=lmsAction(s,caster,'skill',{slot:2,form:1,target:a});for(let i=0;i<n;i++)if(s.players[i].id!==a)assert.equal(s.players[i].hp,before[i],'Skill2 single target');
 s=lmsAction(s,a,'next_stage');assert.equal(s.phase,'buffs');s=lmsAction(s,a,'next_stage',{},9000);assert.equal(s.phase,'end');assert.equal(s.endDeadline,39000);assert.throws(()=>lmsAction(s,a,'skill',{slot:1,form:4,target}));
 let voted=lmsAction(s,a,'end');assert.equal(voted.phase,'end');assert.throws(()=>lmsAction(voted,a,'end'));for(const p of voted.players.filter(p=>p.hp>0&&p.id!==a))voted=lmsAction(voted,p.id,'end');assert.equal(voted.phase,'initiative');assert.equal(voted.round,2);assert.deepEqual(voted.initiative,[]);
 assert.equal(tickLms(s,38999),s);const timed=tickLms(s,39000);assert.equal(timed.round,2);assert.equal(timed.phase,'initiative');
}
console.log('PASS: all-player D20 each round, winner uses rolled attack, everyone charges/casts, Skill1 AoE one cost, Skill2 targeted, all end votes, 30s fallback');
