require('./test-new-combat-balance.cjs');
const assert=require('node:assert/strict');
const {castChargedSkill:cast,skillCost}=require('../src/lib/chargedSkills.ts');
const {WEAPON_DEFINITIONS:W}=require('../src/lib/constants.ts');
const {calculateDuelCombat}=require('../src/lib/battleLogic.ts');
const {deathNoteMode}=require('../src/lib/deathNote.ts');
const make=(id='death_note')=>({id,name:id,classType:'warrior',weapon:W[id],hp:100,maxHp:100,d12Charge:200});
let p=make(),t=make('greatsword');
let c=cast(p,t,1,1,undefined,undefined,1);assert.equal(c.caster.weaponUpdate.deathHiddenReady,undefined);
c=cast(c.caster,c.opponent,1,2,undefined,undefined,2);p=c.caster;t=c.opponent;
assert.equal(deathNoteMode(p,2),2);assert.equal(skillCost(p,2,undefined,2),20);
c=cast(p,t,2,2);assert.equal(c.cost,20);assert.equal(c.effect,'dn:eye');p=c.caster;t=c.opponent;
assert.equal(deathNoteMode(p,6),3);assert.equal(deathNoteMode(p,7),1);
assert.equal(cast(p,t,2,2),null);assert.equal(cast(p,t,2,7,3),null);
c=cast(p,t,2,3);assert.equal(c.cost,5);assert.equal(c.effect,'dn:purge');assert.equal(c.caster.weaponUpdate.judgement,undefined);p=c.caster;t=c.opponent;assert.equal(t.weaponUpdate.judgement.hits,0);
let r=calculateDuelCombat(18,3,p,t,4);assert.equal(r.damage,0);assert.equal(t.weaponUpdate.judgement.hits,1);assert.equal(t.weaponUpdate.judgement.attacksLeft,3);
r=calculateDuelCombat(18,3,p,t,4);assert.equal(r.damage,0);assert.equal(t.weaponUpdate.judgement.hits,1);
// The defender's turn never counts against the owner's four offensive turns.
calculateDuelCombat(1,20,t,p,5);assert.equal(t.weaponUpdate.judgement.attacksLeft,3);
r=calculateDuelCombat(20,1,p,t,6);assert.equal(r.damage,t.hp);assert.equal(r.critical,false);assert.equal(t.weaponUpdate.judgement,undefined);
for(const hits of [0,1]){p=make();t=make('greatsword');t.hp=81;t.weaponUpdate={judgement:{owner:p.id,hits:0,attacksLeft:4}};for(let i=1;i<=4;i++){r=calculateDuelCombat(hits&&i===1?18:1,10,p,t,i);if(i<4)assert.equal(r.damage,0);}assert.equal(r.damage,hits?41:20);assert.equal(t.weaponUpdate.judgement,undefined);}
// A successful name interrupts the consecutive-failure streak.
p=make();t=make('greatsword');for(const [i,die]of [1,3,2].entries()){c=cast(p,t,1,i+1,undefined,undefined,die);p=c.caster;t=c.opponent;}assert.equal(p.weaponUpdate.deathFailures,1);assert.equal(p.weaponUpdate.deathHiddenReady,undefined);assert.equal(skillCost(p,2),32);
c=cast(make('shield'),make(),2,1);assert.equal(c.cost,20);assert.equal(c.caster.weaponUpdate.armor,7);
console.log('PASS: Death Note consecutive failures, 20/5/32 PTS, five-round Eye expiry, target-only HP trial, no D20 HP/double counting, execution/half/20, Shield 7 armor at 20 PTS');
