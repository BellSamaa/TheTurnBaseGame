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
c=cast(p,t,2,2);assert.equal(c.cost,20);assert.equal(c.effect,'dn:purge');p=c.caster;t=c.opponent;
assert.equal(p.weaponUpdate.deathEyeUntil,6);assert.equal(deathNoteMode(p,6),1);
assert.equal(cast(p,t,2,2),null);assert.equal(cast(p,t,2,7,3),null);
assert.equal(c.caster.weaponUpdate.judgement,undefined);assert.equal(t.weaponUpdate.judgement.hits,0);
assert.equal(t.weaponUpdate.judgement.attacksLeft,4);assert.equal(cast(p,t,2,3,2),null);
let r=calculateDuelCombat(18,3,p,t,4);assert.equal(r.damage,0);assert.equal(t.weaponUpdate.judgement.hits,1);assert.equal(t.weaponUpdate.judgement.attacksLeft,3);
r=calculateDuelCombat(18,3,p,t,4);assert.equal(r.damage,0);assert.equal(t.weaponUpdate.judgement.hits,1);
// The defender's turn never counts against the owner's four offensive turns.
calculateDuelCombat(1,20,t,p,5);assert.equal(t.weaponUpdate.judgement.attacksLeft,3);
r=calculateDuelCombat(20,1,p,t,6);assert.equal(r.damage,t.hp);assert.equal(r.critical,false);assert.equal(t.weaponUpdate.judgement,undefined);
for(const hits of [0,1]){p=make();t=make('greatsword');t.hp=81;t.weaponUpdate={judgement:{owner:p.id,hits:0,attacksLeft:4}};for(let i=1;i<=4;i++){r=calculateDuelCombat(hits&&i===1?18:1,10,p,t,i);if(i<4)assert.equal(r.damage,0);}assert.equal(r.damage,hits?41:20);assert.equal(t.weaponUpdate.judgement,undefined);}
// Success between two failures does not reset the rolling ten-round window.
p=make();t=make('greatsword');for(const [i,die]of [1,3,2].entries()){c=cast(p,t,1,i+1,undefined,undefined,die);p=c.caster;t=c.opponent;}assert.equal(p.weaponUpdate.deathFailures,2);assert.equal(p.weaponUpdate.deathHiddenReady,true);assert.equal(skillCost(p,2,1),32);
// Inclusive window: rounds 1 and 10 qualify; rounds 1 and 11 do not.
for(const [last,ready]of [[10,true],[11,false]]){p=make();t=make('greatsword');for(const round of [1,last]){c=cast(p,t,1,round,undefined,undefined,1);p=c.caster;t=c.opponent;}assert.equal(!!p.weaponUpdate.deathHiddenReady,ready);assert.deepEqual(p.weaponUpdate.deathFailureRounds,ready?[1,10]:[11]);}
// Activating the eye consumes the failures; they cannot unlock it again for free.
p=make();t=make('greatsword');for(const round of [1,3]){c=cast(p,t,1,round,undefined,undefined,2);p=c.caster;t=c.opponent;}c=cast(p,t,2,3);assert.deepEqual(c.caster.weaponUpdate.deathFailureRounds,[]);assert.equal(deathNoteMode(c.caster,8),1);
c=cast(make('shield'),make(),2,1);assert.equal(c.cost,20);assert.equal(c.caster.weaponUpdate.armor,7);
// Server PvP/Rank and shared PvE/LMS paths must send the eye to its caster and trial to its victim.
const {castPvpSkill}=require('../src/lib/pvpSkills.ts');
const {createLms,lmsAction}=require('../src/lib/lms.ts');
const participant=(id,weaponId='greatsword')=>({id,name:id,weaponId,classType:'warrior',character:{},isReady:true});
let duel=createLms([participant('a','death_note'),participant('b')],true);duel.phase='skills';duel.round=5;duel.order=['a','b'];duel.active=0;duel.target='b';duel.players[0].weaponUpdate={deathHiddenReady:true};duel.players[0].d12Charge=50;
const resolved=lmsAction(duel,'a','skill',{slot:2,target:'b'},100);
assert.equal(resolved.players[0].d12Charge,30);assert.equal(resolved.players[1].weaponUpdate.judgement.hits,0);assert.deepEqual(resolved.lastEvent.cues.map(c=>[c.effect,c.target]),[['dn:eye','a'],['dn:purge','b']]);
const online=castPvpSkill({player1:duel.players[0],player2:duel.players[1],attackerId:'a',currentTurn:5,turnStep:'d12',phase:'combat',battleLog:[],revision:0},'a',2);
assert.equal(online.player1.d12Charge,30);assert.equal(online.player2.weaponUpdate.judgement.hits,0);assert.deepEqual(online.vfxSequence.map(c=>[c.effect,c.target]),[['dn:eye','p1'],['dn:purge','p2']]);
console.log('PASS: Death Note two failures within ten rounds, success in-between, exact window boundaries and consumed unlock, single 20 PTS eye + immediate trial, no 5 PTS recast, 32 PTS normal, five-round Eye expiry, target-only HP trial, no D20 HP/double counting, execution/half/20, Shield 7 armor at 20 PTS');
