require('./test-dice-timing.cjs');
const assert=require('node:assert/strict');
const {createDungeon,makePlayer,tickDungeon}=require('../src/lib/dungeon.ts');
const {DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts');
const {effectDuration}=require('../src/lib/skillMotion.ts');
const person=(id,weaponId='greatsword')=>({id,name:id,weaponId,classType:'warrior',character:DEFAULT_CUSTOMIZATION,isReady:true});
const random=Math.random,clock=Date.now;Math.random=()=>.99;Date.now=()=>100000;
try{
 for(const members of [2,3,4])for(const enemies of [1,3]){
  let s=createDungeon(person('p0'));for(let i=1;i<members;i++)s.players.push(makePlayer(person('p'+i)));
  s.phase='attack';s.round=2;s.teamHp=s.teamMaxHp=members*100;s.enemies=Array.from({length:enemies},(_,i)=>{const p=makePlayer(person('e'+i));p.hp=p.maxHp=10000;return p});s.target='e'+(enemies-1);s.rolls=Object.fromEntries(s.players.map(p=>[p.id,[15]]));s.enemyRolls=Array(members).fill(10);s.botDice={stage:'result',role:'defense',readyAt:0,until:0,values:s.enemyRolls};s=tickDungeon(s,100000);
  const events=s.events.filter(e=>e.name.endsWith(' · D20'));assert.equal(events.length,members*enemies);assert.deepEqual(events.map(e=>e.caster+':'+e.target),Array.from({length:members},(_,i)=>Array.from({length:enemies},(_,j)=>'p'+i+':e'+j)).flat());
  for(const e of events){assert.equal(e.approach,true);assert.equal(e.visualOnly,e.target!==s.target);if(e.visualOnly)assert.equal(e.damage,0);}
  s.enemies.forEach(e=>assert.equal(e.hp,e.id===s.target?10000-members*15:10000,'only selected target loses real HP'));
  assert.equal(s.hitEvents.length,1);assert.equal(s.animationUntil,100000+events.reduce((n,e)=>n+effectDuration(e.effect,e.approach),0));assert.equal(s.pts,0);
 }
 console.log('PASS Dungeon party choreography: 2/3/4 players × 1/3 enemies, stable player/target order, full sequential animation lock, cosmetic targets have zero damage, selected target HP unchanged from original formula');
}finally{Math.random=random;Date.now=clock}
