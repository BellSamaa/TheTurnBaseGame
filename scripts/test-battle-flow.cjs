require('./test-charged-skills.cjs');
const assert=require('node:assert/strict');
const {createLms,lmsAction}=require('../src/lib/lms.ts');
for(const count of [2,3,4]){
 let s=createLms(Array.from({length:count},(_,i)=>({id:'p'+i,name:'P'+i,character:{},classType:'mage',weaponId:'infinity_ring',isReady:true})),count===2);
 const a=s.order[0],d=s.players.find(p=>p.id!==a).id,outsider=s.players.find(p=>p.id!==a&&p.id!==d)?.id;
 if(s.phase==='target')s=lmsAction(s,a,'target',{target:d});
 assert.throws(()=>lmsAction(s,a,'charge'));
 assert.throws(()=>lmsAction(s,a,'skill',{slot:1,target:d,form:3}));
 s=lmsAction(s,a,'attack');assert.equal(s.phase,'defense');assert.throws(()=>lmsAction(s,a,'defend'));
 s=lmsAction(s,d,'defend',{},1000);s=lmsAction(s,a,'resolve',{},6000);assert.equal(s.phase,'charge');
 assert.throws(()=>lmsAction(s,d,'charge'));s=lmsAction(s,a,'charge');assert.equal(s.phase,'charge');s=lmsAction(s,a,'charge');assert.equal(s.phase,'charge_defense');
 assert.throws(()=>lmsAction(s,a,'charge'));s=lmsAction(s,d,'charge');assert.equal(s.phase,'charge_defense');s=lmsAction(s,d,'charge');assert.equal(s.phase,'skills');
 assert.equal(s.rolls.length,2);assert.equal(s.defenderRolls.length,2);
 for(const id of [a,d]){const pl=s.players.find(p=>p.id===id);assert.equal(pl.d12Charge,(id===a?s.rolls:s.defenderRolls).reduce((n,v)=>n+v,0));pl.d12Charge=100;}
 assert.throws(()=>lmsAction(s,a,'charge'));if(outsider)assert.throws(()=>lmsAction(s,outsider,'skill',{target:a,slot:1,form:3}));
 const form=s.players[0].weapon.skill1.triggerNumber[0];
 for(const [actor,target] of [[a,d],[d,a]]){s=lmsAction(s,actor,'skill',{target,slot:1,form});assert.throws(()=>lmsAction(s,actor,'skill',{target,slot:1,form}));}
 s=lmsAction(s,d,'end');assert.equal(s.phase,'skills');assert.throws(()=>lmsAction(s,d,'end'));assert.throws(()=>lmsAction(s,d,'skill',{target:a,slot:2,form:1}));
 s=lmsAction(s,a,'end');assert.ok(['target','attack'].includes(s.phase));assert.notEqual(s.order[s.active],a);assert.deepEqual(s.rolls,[]);assert.deepEqual(s.defenderRolls,[]);
}
console.log('PASS: 2/3/4 players, exact five-step order, Mage two rolls per side, manual skills, duplicate/replay and spectator gates, both end confirmations');
