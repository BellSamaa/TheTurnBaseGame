require('./test-dice-timing.cjs');
const assert=require('node:assert/strict'),fs=require('fs');const {HIT_SOUND_FILES,createHitSoundPicker,recordCombatHit}=require('../src/lib/combatHits.ts');const {createLms,lmsAction}=require('../src/lib/lms.ts');const {rollDuelDefense}=require('../src/lib/pvpDuel.ts');const {castPvpSkill}=require('../src/lib/pvpSkills.ts');const {createDungeon,makePlayer,dungeonAction:A,tickDungeon:T}=require('../src/lib/dungeon.ts');const {DEFAULT_CUSTOMIZATION,WEAPON_DEFINITIONS:W}=require('../src/lib/constants.ts');
assert.equal(HIT_SOUND_FILES.length,15);assert.equal(new Set(HIT_SOUND_FILES).size,15);for(const file of HIT_SOUND_FILES)assert.deepEqual(fs.readFileSync('Hit Effect/'+file),fs.readFileSync('public/assets/sounds/hits/'+file));
for(const rng of [()=>0,()=>.999,Math.random]){const pick=createHitSoundPicker(rng),heard=[];for(let i=0;i<1500;i++){const sound=pick();assert.ok(!heard.slice(-2).includes(sound));heard.push(sound);if((i+1)%15===0)assert.equal(new Set(heard.slice(-15)).size,15);}}
const member=(id,weaponId='greatsword')=>({id,name:id,weaponId,classType:'warrior',character:DEFAULT_CUSTOMIZATION,isReady:true});const random=Math.random;Math.random=()=>.99;
try{
 let s={};recordCombatHit(s,0,'a','b');recordCombatHit(s,5,'a','a');recordCombatHit(s,NaN,'a','b');assert.equal(s.hitEvents,undefined);
 const duel=()=>{const s=createLms([member('a'),member('b')],true);s.order=['a','b'];s.active=0;s.target='b';s.round=1;s.phase='clash';s.attack=18;s.defense=4;s.deadline=0;return s;};
 s=lmsAction(duel(),'a','resolve',{},1000);assert.equal(s.hitEvents.length,1);assert.equal(s.hitEvents[0].damage,14);
 let blocked=duel();blocked.players[1].immuneDamageNext=true;s=lmsAction(blocked,'a','resolve',{},1000);assert.equal(s.hitEvents,undefined);
 blocked=duel();blocked.attack=3;blocked.defense=18;s=lmsAction(blocked,'a','resolve',{},1000);assert.equal(s.hitEvents,undefined);
 s=duel();s.phase='skills';s.players[0].d12Charge=200;s=lmsAction(s,'a','skill',{slot:1,target:'b'});assert.equal(s.hitEvents.length,1);
 s=duel();s.phase='skills';s.players[0].weapon=W.infinity_ring;s.players[0].d12Charge=200;s=lmsAction(s,'a','skill',{slot:1,form:6,target:'b'});assert.equal(s.hitEvents,undefined);
 const raw=()=>{const s=duel();return{player1:s.players[0],player2:s.players[1],attackerId:'a',currentTurn:1,phase:'combat',turnStep:'d20_def',p1D20:18,battleLog:[],revision:0}};
 Math.random=()=>0;s=rollDuelDefense(raw(),'b');assert.equal(s.hitEvents.length,1);let f=raw();f.player2.immuneDamageNext=true;s=rollDuelDefense(f,'b');assert.equal(s.hitEvents,undefined);
 f=raw();f.turnStep='d12';f.player1.d12Charge=100;s=castPvpSkill(f,'a',1);assert.equal(s.hitEvents.length,1);
 f=raw();f.turnStep='d12';f.player1.weapon=W.shield;f.player1.d12Charge=100;s=castPvpSkill(f,'a',2);assert.equal(s.hitEvents,undefined);
 const dungeon=()=>{const s=createDungeon(member('a'));s.teamHp=100;s.teamMaxHp=100;s.pts=100;s.round=1;s.phase='skills';s.enemies=[makePlayer(member('enemy'))];s.enemies[0].hp=1000;s.target='enemy';return s;};
 s=A(dungeon(),'a','skill',{slot:1});assert.equal(s.hitEvents.length,1);
 s=dungeon();s.players[0].weapon=W.death_note;s=A(s,'a','skill',{slot:1});assert.ok(s.hitEvents.every(e=>e.target!=='a'));
 s=dungeon();s.players[0].weapon=W.spirit_stone;s=A(s,'a','skill',{slot:1});assert.equal(s.hitEvents,undefined);
 s=dungeon();s.phase='enemy_skills';s.deadline=0;s.enemies[0].d12Charge=6;s=T(s,1);assert.equal(s.hitEvents.length,1);
 s=dungeon();s.players[0].weapon=W.spirit_stone;s.players[0].petRockHp=25;s.phase='enemy_skills';s.deadline=0;s.enemies[0].d12Charge=6;s=T(s,1);assert.equal(s.hitEvents,undefined);
 s=dungeon();s.phase='end';s.players[0].burnTicks=2;s.players[0].burnDmgPerTurn=2;s=A(s,'a','end');assert.ok(s.teamHp<100);assert.equal(s.hitEvents,undefined);
 console.log('PASS: all 15 exact audio assets; 4,500 picks no repeats within 3 consecutive hits, all 15 per shuffle; PvE/LMS/PvP/Dungeon direct hit/skill metadata; no hit for block/Immune/support/summon/self-damage/burn');
}finally{Math.random=random;}
