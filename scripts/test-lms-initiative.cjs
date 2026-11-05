require('./test-charged-skills.cjs');
const assert=require('node:assert/strict');
const {createLms,lmsAction}=require('../src/lib/lms.ts');
for(const count of [3,4]){
 const people=Array.from({length:count},(_,i)=>({id:'p'+i,name:'P'+i,classType:'mage',weaponId:'infinity_ring',character:{},isReady:true}));
 for(const sequence of [people,[...people].reverse()]){
  let s=createLms(people);assert.equal(s.phase,'initiative');assert.deepEqual(s.initiative,[]);assert.equal(s.target,undefined);
  assert.ok(s.players.every(p=>!p.isAttacker));
  for(const [i,p] of sequence.entries()){
   assert.throws(()=>lmsAction(s,p.id,'target',{target:'p1'}));assert.throws(()=>lmsAction(s,p.id,'charge'));
   const prev=structuredClone(s);s=lmsAction(s,p.id,'initiative');assert.equal(s.initiative.length,i+1);
   assert.deepEqual(prev.initiative,s.initiative.slice(0,-1));assert.throws(()=>lmsAction(s,p.id,'initiative'));
   assert.equal(s.phase,i===count-1?'target':'initiative');
  }
  const first=s.order[0];assert.equal(s.initiative.find(r=>r.id===first).roll,Math.max(...s.initiative.map(r=>r.roll)));
  assert.throws(()=>lmsAction(s,s.order[1],'target',{target:first}));
  s=lmsAction(s,first,'target',{target:s.order[1]});assert.equal(s.phase,'attack');
 }
 let gone=createLms(people);gone=lmsAction(gone,'p0','initiative');gone=lmsAction(gone,'p1','initiative');for(let i=2;i<count;i++)gone=lmsAction(gone,'p'+i,'surrender');assert.equal(gone.phase,'target');
}
console.log('PASS: all 3/4 participants manually roll once in any order; no prefilled points or early attack; highest roll selects target; surrender cannot block start');
