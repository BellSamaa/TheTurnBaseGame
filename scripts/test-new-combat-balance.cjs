// Run with node scripts/test-room-lifecycle.cjs. Uses isolated temporary storage.
const fs = require('fs'), path = require('path'), ts = require('typescript');
const Module = require('module'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (r, parent, ...args) {
  return resolve.call(this, r.startsWith('@/') ? path.join(root, 'src', r.slice(2)) : r, parent, ...args);
};
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, f);


const {WEAPON_DEFINITIONS,CLASS_DEFINITIONS}=require('../src/lib/constants.ts');
const {createLms}=require('../src/lib/lms.ts');const {createRoundLms,roundLmsAction}=require('../src/lib/lmsRound.ts');const {activateBuff}=require('../src/lib/lmsBuffs.ts');const {calculateD20Combat}=require('../src/lib/battleLogic.ts');const {castChargedSkill}=require('../src/lib/chargedSkills.ts');const {applyOpponentDamage}=require('../src/lib/combatDamage.ts');
const people=Array.from({length:4},(_,i)=>({id:'p'+i,name:'P'+i,character:{},classType:'warrior',weaponId:'infinity_ring',isReady:true}));
for(const klass of Object.values(CLASS_DEFINITIONS)){const roster=people.map(p=>({...p,classType:klass.id}));assert.equal(createLms(roster,true).players[0].maxHp,Math.round(100*klass.hpModifier));assert.equal(createRoundLms(roster).players[0].maxHp,Math.round(150*klass.hpModifier));}
function base(){const s=createRoundLms(people);s.phase='buffs';s.order=people.map(p=>p.id);s.active=0;s.target='p1';s.attack=20;s.defense=0;s.initiative=people.map((p,i)=>({id:p.id,roll:20-i}));s.players.forEach(p=>{p.hp=100;p.maxHp=150;p.d12Charge=50;});return s;}
for(let id=0;id<20;id++){let s=base(),actor='p2',args={target:'p3'};if([0,1,2,3,4].includes(id)){s.phase='clash';actor='p1';args.target='p2';if(id===1)s.players[1].hp=10;}if([12,14,17,18].includes(id))s.phase='clash';if(id===11)s.phase='target';if(id===8)s.players[3].hp=20;if(id===9){s.extras.lastKill={killer:'p0',hp:30,pts:5,round:1};}s.extras.buffs[actor]={id,used:false,revealed:false};activateBuff(s,actor,args);assert.equal(s.extras.buffs[actor].used,true,'buff '+id);assert.throws(()=>activateBuff(s,actor,args));if(id===4){assert.equal(s.phase,'defense');s=roundLmsAction(s,actor,'defend');assert.ok(s.defense>=1);};if(id===13)assert.equal(s.players[3].d12Charge,25);if(id===19)assert.equal(s.players[0].hp,75);}
let s=base();s.phase='target';s=roundLmsAction(s,'p0','target',{target:'p1'},1000);assert.equal(s.phase,'clash');assert.equal(s.defense,0);assert.throws(()=>roundLmsAction(s,'p1','defend'));
const player=()=>({id:'a',name:'A',weapon:WEAPON_DEFINITIONS.spirit_stone,hp:100,maxHp:100,d12Charge:100,petRockHp:50});let u=player(),foe={...player(),id:'b'};for(let i=0;i<5;i++)applyOpponentDamage(u,1,1);assert.ok(!u.petRockEnraged);const cast=castChargedSkill(u,foe,2,2);assert.equal(cast.caster.petRockHp,u.petRockHp);assert.equal(cast.caster.hp,Math.min(u.maxHp,u.hp+10));assert.equal(cast.caster.petRockEnrageUntilRound,7);assert.equal(cast.damage,0);assert.equal(cast.opponent.hp,100);assert.equal(cast.caster.d12Charge,82);assert.equal(castChargedSkill(cast.caster,foe,2,3),null);const rock=cast.caster;applyOpponentDamage(rock,12,2);assert.equal(rock.hp,u.hp-5);
assert.equal(calculateD20Combat(20,5,CLASS_DEFINITIONS.warrior,CLASS_DEFINITIONS.warrior,{...foe,weapon:WEAPON_DEFINITIONS.greatsword},{...foe,weapon:WEAPON_DEFINITIONS.greatsword}).damage,15);
console.log('PASS: six class HP scales, all 20 revised buff activations/single use, no normal Defense, dice-only damage, PTS Rock rage owner heal 10/5 rounds/7 block/no roll/no auto-rage');

for(const [id,hp,expected] of [[0,100,100],[1,10,1],[3,100,85],[4,100,null]]){let st=base();st.phase='clash';st.deadline=6000;st.players[1].hp=hp;st.extras.buffs.p1={id,used:false,revealed:false};st=roundLmsAction(st,'p1','buff',{},1000);if(id===4)st=roundLmsAction(st,'p1','defend',{},1000);const defense=st.defense;st=roundLmsAction(st,'p0','resolve',{},6000);if(expected!==null)assert.equal(st.players[1].hp,expected);else assert.equal(st.players[1].hp,100-(st.duelNotice?.kind==='crit'?25:20>defense?20-defense+5:0));}
let redirected=base();redirected.phase='clash';redirected.extras.buffs.p1={id:2,used:false,revealed:false};redirected=roundLmsAction(redirected,'p1','buff',{target:'p2'});assert.equal(redirected.target,'p2');
console.log('PASS: shield, lethal revival, insurance and conditional Defense resolve real HP correctly; redirect changes actual target');
