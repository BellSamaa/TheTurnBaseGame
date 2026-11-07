require('./test-dice-timing.cjs');
const assert=require('node:assert/strict');const {WEAPON_DEFINITIONS:W,DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts');const {createDungeon,makePlayer,dungeonAction:A,tickDungeon:T,dungeonPositionAllowed,dungeonInteractionPoints}=require('../src/lib/dungeon.ts');const {castChargedSkill}=require('../src/lib/chargedSkills.ts');const {dungeonPathAllowed}=require('../src/lib/dungeonGeometry.ts');
const participant=(id,weaponId)=>({id,name:id,weaponId,classType:'warrior',character:DEFAULT_CUSTOMIZATION,isReady:true});
const state=(id='greatsword',extra=[])=>{let s=createDungeon(participant('p0',id));for(const [i,w] of extra.entries())s.players.push(makePlayer(participant('p'+(i+1),w)));s.phase='skills';s.round=5;s.teamHp=250;s.teamMaxHp=400;s.pts=500;s.enemies=[makePlayer(participant('enemy','greatsword'))];s.enemies[0].hp=s.enemies[0].maxHp=10000;s.target='enemy';return s;};
let count=0;const random=Math.random,clock=Date.now;Date.now=()=>100000;Math.random=()=>.99;
const normalize=x=>{const v=structuredClone(x);if(v)delete v.events;for(const p of v?.summons||[])delete p.id;return v;};
try{
for(const weapon of Object.values(W))for(const slot of [1,2]){
 if(weapon.id==='shield'&&slot===1)continue;
 const forms=Array.isArray(weapon['skill'+slot].triggerNumber)?weapon['skill'+slot].triggerNumber:weapon.id==='infinity_ring'&&slot===2?[1,2]:weapon.id==='fire_headband'&&slot===2?[20,30]:[undefined];
 for(const form of forms){let s=state(weapon.id);let p=s.players[0],enemy=s.enemies[0];p.leafSkillReadyTurn=s.round;if(weapon.id==='spirit_stone'&&slot===2)p.petRockHp=25;if(weapon.id==='death_note'&&slot===2)enemy.weaponUpdate={namedBy:p.id};if(weapon.id==='king_slasher'&&slot===2&&form===2)enemy.weaponUpdate={markedBy:p.id,markUntil:10};if(weapon.id==='thunder_spear'&&slot===1&&form!==1)p.weaponUpdate={weather:{kind:'rain',until:10,remainingTurns:5,started:1,owner:p.id}};
 if(weapon.id==='musashi'&&slot===2&&form===2){p.weaponUpdate={weather:{kind:'mist',until:10,remainingTurns:5,started:1,owner:p.id}};enemy.weaponUpdate={musashiMarkUntil:10};}
 const owner={...structuredClone(p),hp:s.teamHp,maxHp:s.teamMaxHp,d12Charge:s.pts},expected=castChargedSkill(owner,enemy,slot,s.round,form,1);assert.ok(expected,weapon.id+' '+slot+' '+form);
 const result=A(s,p.id,'skill',{slot,form,lockSlot:1});assert.equal(result.teamHp,expected.caster.hp,weapon.id+' pooled HP');assert.equal(result.pts,expected.caster.d12Charge,weapon.id+' shared PTS');assert.equal(result.enemies[0].hp,expected.opponent.hp,weapon.id+' damage');
 for(const key of ['petRockHp','petRockEnraged','immuneDamageNext','dodgeNextAttack','dodgeNextSkill','bullets','flameBladeBuff','weaponUpdate'])assert.deepEqual(normalize(result.players[0][key]),normalize(expected.caster[key]),weapon.id+' '+key);
 count++;
 }}
function settle(s,attack=12,defense=10,phase='defense'){s.phase=phase;s.rolls=Object.fromEntries(s.players.map(p=>[p.id,[defense/s.players.length]]));s.enemyRolls=[attack];s.botDice={stage:'result',role:phase==='attack'?'defense':'attack',readyAt:0,until:0,values:[attack]};return T(s,1);}
let s=state('greatsword',['spirit_stone']);s.players[1].petRockHp=25;s=settle(s);assert.equal(s.players[1].petRockHp,23);assert.equal(s.teamHp,250);assert.ok(s.events.some(e=>e.effect==='rock_block'));
s=state('greatsword',['infinity_ring']);s.players[1].immuneDamageNext=true;s=settle(s);assert.equal(s.teamHp,250);assert.equal(s.players[1].immuneDamageNext,false);assert.ok(s.events.some(e=>e.effect==='infinity'));
s=state('king_slasher');s=A(s,'p0','skill',{slot:1,form:2});let hp=s.enemies[0].hp;s=settle(s);assert.equal(s.players[0].weaponUpdate.slashDefenses,2);assert.equal(s.enemies[0].hp,hp-3);assert.ok(s.events.some(e=>e.effect==='wu1:white_triple'));
s=state('king_slasher');s=A(s,'p0','skill',{slot:1,form:1});s=settle(s,10,12,'attack');assert.equal(s.players[0].weaponUpdate.cleaveAttacks,2);assert.ok(s.events.some(e=>e.effect==='wu1:white_cross'));
// Chronos grants its owner exactly two additional attack passes before enemy defense.
s=state('chronos_watch',['greatsword']);s.players[0].weaponUpdate={extraAttacks:2};for(let i=0;i<3;i++){s=settle(s,10,12,'attack');assert.equal(s.phase,i<2?'attack':'defense');if(i<2){assert.deepEqual(s.attackActors,['p0']);assert.deepEqual(s.rolls.p1,[0]);}}
// Player two's blue tick and golem must target enemies, not allies; all enemy ticks run once.
s=state('greatsword',['elemental_rings']);s.players[1].weaponUpdate={summons:[{id:'g',kind:'golem',hp:10,maxHp:10,activeUntil:20}]};s.phase='charge';s.botDice={stage:'result',role:'charge',readyAt:0,until:0,values:[3]};hp=s.enemies[0].hp;s=T(s,1);assert.equal(s.enemies[0].hp,hp-2);assert.equal(s.teamHp,250);
s=state('greatsword',['thunder_spear']);s.phase='end';s.enemies[0].weaponUpdate={blueOwner:'p1',blueUntil:20};s=A(s,'p0','end');s=A(s,'p1','end');assert.equal(s.enemies[0].hp,9995);
// No blank/missing skill events when several summons and casts resolve together.
assert.ok(new Set(s.events.map(e=>e.id)).size===s.events.length);
console.log('PASS Dungeon parity: '+count+' weapon skill forms, pooled HP/PTS, exact status/armor/summons; second-seat Rock/Immune, Cleave/Slash VFX/counters, no summon friendly fire, second-seat DOT owner');
// Collision: all spawn pads and interaction areas stay reachable; furniture and wall paths are blocked.
for(let area=0;area<=4;area++){
 const spawns=area?[.30,.44,.58,.72].map(x=>({x,y:.62})):[.235,.410,.585,.760].map(x=>({x,y:.75}));for(const p of spawns)assert.ok(dungeonPositionAllowed(p.x,p.y,area),'spawn '+area+' '+p.x);
 const start=area?{x:.30,y:.62}:{x:.24,y:.75},queue=[start],seen=new Set([Math.round(start.x*100)+','+Math.round(start.y*100)]);
 for(let i=0;i<queue.length;i++){const p=queue[i];for(const [dx,dy]of [[.01,0],[-.01,0],[0,.01],[0,-.01]]){const q={x:Math.round((p.x+dx)*100)/100,y:Math.round((p.y+dy)*100)/100},key=Math.round(q.x*100)+','+Math.round(q.y*100);if(!seen.has(key)&&dungeonPathAllowed(p,q,area)){seen.add(key);queue.push(q);}}}
 const points=dungeonInteractionPoints(area);for(const [name,p]of Object.entries(points)){assert.ok(queue.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<(name==='portal'?.10:.14)),'reachable '+area+' '+name);}
 for(const [name,p]of Object.entries(points)){let near=false;for(let x=p.x-.08;x<=p.x+.08;x+=.02)for(let y=p.y-.08;y<=p.y+.08;y+=.02)if(dungeonPositionAllowed(x,y,area))near=true;assert.ok(near,area+' '+name+' approach');}
 assert.equal(dungeonPositionAllowed(.01,.5,area),false);
}
for(const [area,x,y]of [[0,.18,.60],[1,.5,.82],[1,.1,.73],[2,.32,.84],[2,.5,.86],[3,.23,.80],[4,.28,.82]])assert.equal(dungeonPositionAllowed(x,y,area),false,'furniture '+area);
assert.equal(dungeonPathAllowed({x:.24,y:.72},{x:.42,y:.72},2),true);assert.equal(dungeonPathAllowed({x:.24,y:.84},{x:.42,y:.84},2),false);
console.log('PASS Dungeon collision: five maps, spawn pads, NPC/portal approaches, furniture, bounds and swept path');
}finally{Math.random=random;Date.now=clock;}
