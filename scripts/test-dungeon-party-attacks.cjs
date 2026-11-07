require('./test-dice-timing.cjs');
const assert=require('node:assert/strict');
const {createDungeon,makePlayer,tickDungeon}=require('../src/lib/dungeon.ts');
const {DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts');
const {effectDuration}=require('../src/lib/skillMotion.ts');
const person=(id,weaponId='greatsword')=>({id,name:id,weaponId,classType:'warrior',character:DEFAULT_CUSTOMIZATION,isReady:true});
function attack(s){s.phase='attack';s.rolls=Object.fromEntries(s.players.map(p=>[p.id,[15]]));s.enemyRolls=Array(s.players.length).fill(10);s.botDice={stage:'result',role:'defense',readyAt:0,until:0,values:s.enemyRolls};s.events=[];s.event=undefined;s.animationUntil=undefined;return tickDungeon(s,100000)}
const random=Math.random,clock=Date.now;Math.random=()=>.99;Date.now=()=>100000;
try{
 for(const members of [2,3,4])for(const enemies of [1,3]){
  let s=createDungeon(person('p0'));for(let i=1;i<members;i++)s.players.push(makePlayer(person('p'+i)));s.round=2;s.teamHp=s.teamMaxHp=members*100;s.enemies=Array.from({length:enemies},(_,i)=>{const p=makePlayer(person('e'+i));p.hp=p.maxHp=10000;return p});s.target='e0';s=attack(s);
  const events=s.events.filter(e=>e.name.endsWith(' · D20'));assert.equal(events.length,members);assert.deepEqual(events.map(e=>e.caster+':'+e.target),Array.from({length:members},(_,i)=>'p'+i+':e0'));assert.ok(events.every(e=>e.approach&&e.damage===members*15));s.enemies.forEach(e=>assert.equal(e.hp,e.id==='e0'?10000-members*15:10000));assert.equal(s.hitEvents.length,1);assert.equal(s.animationUntil,100000+events.reduce((n,e)=>n+effectDuration(e.effect,e.approach),0));assert.equal(s.pts,0);
  if(enemies===3){for(const target of [0,1]){s.enemies[target].hp=1;s.target='e'+target;s.round++;s=attack(s);assert.equal(s.enemies[target].hp,0);assert.ok(s.events.every(e=>e.target==='e'+target),'whole party still finishes animation on defeated target');s.round++;s=attack(s);assert.equal(s.target,'e'+(target+1));assert.equal(s.events.length,members);assert.ok(s.events.every(e=>e.target==='e'+(target+1)));}}
 }
 console.log('PASS Dungeon party focus: exactly one ordered animation per attacker for 1/3 mobs; all target same enemy, next living mob only after current dies, shared damage unchanged and animation lock covers full sequence');
}finally{Math.random=random;Date.now=clock}
