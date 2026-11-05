require('./test-charged-skills.cjs');
const assert=require('node:assert/strict');
const {createLms,lmsAction}=require('../src/lib/lms.ts');
// Verify serialized events consumed by PvE/LMS retain each effect's actual target.
for(const [weapon,slot,form,expected] of [
 ['infinity_ring',1,6,[['infinity','caster']]],
 ['infinity_ring',2,2,[['void_blue','caster'],['void_red','caster'],['hollow_purple','center']]],
 ['spirit_stone',1,undefined,[['rock_summon','caster']]],
 ['spirit_stone',2,undefined,[['rock_rage','caster'],['rock_roll','opponent'],['impact_physical','opponent']]],
 ['fire_headband',2,30,[['meteor_two','opponent'],['meteor_impact','opponent']]],
]) {
 const state=createLms([0,1].map(i=>({id:'p'+i,name:'P'+i,character:{},classType:'mage',weaponId:weapon,isReady:true})),true);
 const caster=state.order[state.active],opponent=state.players.find(p=>p.id!==caster).id;
 state.phase='skills';state.target=opponent;
 state.players.forEach(p=>{p.d12Charge=100;p.petRockHp=slot===1?0:30;});
 const result=lmsAction(state,caster,'skill',{slot,form,target:opponent,lockSlot:1});
 assert.deepEqual(result.lastEvent.cues,expected.map(([effect,target])=>({effect,target:target==='caster'?caster:target==='opponent'?opponent:'center'})),weapon+' '+slot);
 assert.deepEqual(JSON.parse(JSON.stringify(result)).lastEvent.cues,result.lastEvent.cues);
}
console.log('PASS: self aura, center Purple Sky, Rock and meteor sequences survive network serialization with correct targets');
