require('./test-dice-timing.cjs');
const assert=require('node:assert/strict');const {createDungeon,makePlayer,dungeonAction:A,tickDungeon:T}=require('../src/lib/dungeon.ts');const {WEAPON_DEFINITIONS:W,DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts');const {isMeleeEffect}=require('../src/lib/skillMotion.ts');
const member=(id,weaponId='greatsword')=>({id,name:id,weaponId,classType:'warrior',character:DEFAULT_CUSTOMIZATION,isReady:true});
const state=(weapon='greatsword',partner='spirit_stone')=>{const s=createDungeon(member('a',weapon));s.players.push(makePlayer(member('b',partner)));s.phase='skills';s.round=5;s.teamHp=100;s.teamMaxHp=200;s.pts=500;s.enemies=[makePlayer(member('enemy'))];s.enemies[0].hp=s.enemies[0].maxHp=10000;s.target='enemy';return s;};
const skillHit=s=>{s.phase='enemy_skills';s.deadline=0;s.enemies[0].d12Charge=6;return T(s,1);};
const strike=s=>{s.phase='attack';s.rolls={a:[15],b:[15]};s.enemyRolls=[10,10];s.botDice={stage:'result',role:'defense',readyAt:0,until:0,values:[10,10]};return T(s,1);};
const random=Math.random;Math.random=()=>0;
try{
 let s=state('king_slasher');s.players[1].petRockHp=25;s=skillHit(s);assert.equal(s.teamHp,100);assert.equal(s.players[1].petRockHp,23);assert.equal(s.players[0].weapon.id,'king_slasher');
 s=state('king_slasher','shield');s.players[1].weaponUpdate={armor:7};s=skillHit(s);assert.equal(s.teamHp,100);assert.equal(s.players[1].weaponUpdate.armor,5);assert.equal(s.players[0].weaponUpdate.armor,undefined);
 s=state('king_slasher','elemental_rings');s.players[1].weaponUpdate={summons:[{id:'g',kind:'golem',hp:10,maxHp:10,activeUntil:9}]};s=skillHit(s);assert.equal(s.teamHp,100);assert.equal(s.players[1].weaponUpdate.summons[0].hp,8);assert.equal(s.players[0].weaponUpdate.summons,undefined);
 s=state('king_slasher','infinity_ring');s.players[1].immuneDamageNext=true;s=skillHit(s);assert.equal(s.teamHp,100);assert.equal(s.players[1].immuneDamageNext,false);
 s=state('king_slasher','bow');s.players[1].dodgeNextSkill=true;s=skillHit(s);assert.equal(s.teamHp,100);assert.equal(s.players[1].dodgeNextSkill,false);
 // Guardian takes precedence and preserves Rock, armor and immunity for the next hit.
 s=state();s.players[1].petRockHp=25;s.buffs=[{id:'guardian',active:true,remaining:1}];s=skillHit(s);assert.equal(s.teamHp,100);assert.equal(s.players[1].petRockHp,25);assert.equal(s.buffs[0].remaining,0);
 // Devil/Boss Slayer apply even to Team Crit, then expire/consume exactly as described.
 s=state();s.encounter=5;s.buffs=[{id:'devil',active:true,remaining:10},{id:'slayer',active:true,remaining:2}];s=strike(s);assert.equal(s.comparison.damage,41);assert.equal(s.buffs[1].remaining,1);
 // Helena boosts actual weapon healing by 20%.
 s=state('frying_pan');s.buffs=[{id:'helena',active:true,remaining:1e9}];s=A(s,'a','skill',{slot:2});assert.equal(s.teamHp,106);
 // Summoner boosts both summoned HP and actual outgoing damage.
 s=state('elemental_rings');s.buffs=[{id:'summoner',active:true,remaining:1e9}];s=A(s,'a','skill',{slot:1});assert.equal(s.players[0].weaponUpdate.summons[0].hp,15);s.round++;s.phase='charge';s.botDice={stage:'result',role:'charge',readyAt:0,until:0,values:[1]};const hp=s.enemies[0].hp;s=T(s,1);assert.equal(s.enemies[0].hp,hp-4);assert.equal(s.teamHp,100);
 // Expired summons are removed and cannot keep shielding forever.
 s.phase='end';s.round=20;s.votes=[];s=A(s,'a','end');s=A(s,'b','end');assert.equal(s.players[0].weaponUpdate.summons.length,0);
 // Instinct recognizes Kagutsuchi's dodge aura too; one next-round free reuse.
 s=state('kagutsuchi');s.buffs=[{id:'instinct',active:true,remaining:1e9}];s=A(s,'a','skill',{slot:1});assert.equal(s.instinctReuse.a.round,6);s.round=6;s.pts=0;s=A(s,'a','skill',{slot:1});assert.equal(s.pts,0);
 // Forecast extends only a newly created weather effect, not an unrelated skill.
 s=state('thunder_spear');s=A(s,'a','skill',{slot:2});s.buffs=[{id:'weather',active:true,remaining:1}];s=A(s,'a','skill',{slot:1,form:1});assert.equal(s.buffs[0].remaining,1);s.round++;s=A(s,'a','skill',{slot:2});assert.equal(s.players[0].weaponUpdate.weather.remainingTurns,7);assert.equal(s.buffs[0].remaining,0);
 // Throne and Underdog trigger their ten/five encounter rewards exactly once.
 s=state();s.buffs=[{id:'throne',active:true,remaining:1},{id:'underdog',active:true,remaining:1}];s.enemies[0].hp=0;s.phase='defense';s.botDice={stage:'result',role:'attack',readyAt:0,until:0,values:[1]};s=T(s,1);assert.equal(s.coins,1000);assert.equal(s.buffs[1].id,'underdog_reward');
 // Musashi raises the actual roll and can affect Kagutsuchi blades.
 s=state('kagutsuchi');s.buffs=[{id:'musashi',active:true,remaining:1e9}];s.phase='attack';s=A(s,'a','roll');assert.equal(s.rolls.a[0],20);
 for(const effect of ['slash_light','slash_heavy','wu1:pan_bonk','wu1:red_multi_slash','wu1:dual_slash','wu1:white_cross'])assert.equal(isMeleeEffect(effect),true);
 for(const effect of ['arrow','void_red','hollow_purple','wu1:white_triple','wu1:world_slash','wu1:lightning_blue','dn:purge','infinity'])assert.equal(isMeleeEffect(effect),false);
 console.log('PASS: incoming skills share Rock/armor/summons/Immune/dodge without changing gear; all ten Dungeon buffs have real effects; expired summons removed; contact/ranged classifications');
}finally{Math.random=random;}

