require('./test-dice-timing.cjs');
const assert=require('node:assert/strict');
const {WEAPON_DEFINITIONS:W,CLASS_DEFINITIONS:C,DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts');
const {weaponBaseDamage}=require('../src/lib/weaponStats.ts');
const {calculateD20Combat}=require('../src/lib/battleLogic.ts');
const {rollDungeonD20,rollTimedD20}=require('../src/lib/diceTiming.ts');
const {createDungeon,makePlayer,tickDungeon}=require('../src/lib/dungeon.ts');
const make=(id,tier)=>({id,name:id,weapon:{...W.greatsword,tier},classType:'warrior',hp:100,maxHp:100});
for(const [tier,bonus]of Object.entries({common:0,rare:1,epic:2,legendary:3,mythic:4,secret:5})){
 assert.equal(weaponBaseDamage(tier),bonus);const p=make('p',tier),t=make('t','common');
 assert.equal(calculateD20Combat(12,6,C.warrior,C.warrior,p,t,1).damage,6+bonus);
 assert.equal(calculateD20Combat(6,12,C.warrior,C.warrior,p,t,2).damage,0);
}
const random=Math.random;try{
 let p=make('p','common');p.diceTiming={round:1,role:'attack',startedAt:0,quality:1};let seq=[.799,.99];Math.random=()=>seq.shift();assert.equal(rollDungeonD20(p,1,'attack'),20);assert.equal(p.diceTiming,undefined);
 p.diceTiming={round:1,role:'attack',startedAt:0,quality:1};seq=[.8,.99];assert.equal(rollDungeonD20(p,1,'attack'),17);
 p.diceTiming={round:1,role:'attack',startedAt:0,quality:0};seq=[.149,0];assert.equal(rollDungeonD20(p,1,'attack'),18);
 p.diceTiming={round:1,role:'defense',startedAt:0,quality:1};seq=[.399,0];assert.equal(rollDungeonD20(p,1,'defense'),18);
 p.diceTiming={round:1,role:'defense',startedAt:0,quality:1};seq=[.4,0];assert.equal(rollDungeonD20(p,1,'defense'),1);
 p.diceTiming={round:1,role:'defense',startedAt:0,quality:1};seq=[.249,0];assert.equal(rollTimedD20(p,1,'defense',()=>1),20);
 p.diceTiming={round:1,role:'defense',startedAt:0,quality:1};seq=[.25,0];assert.equal(rollTimedD20(p,1,'defense',()=>20),1);
 Math.random=()=>.99;assert.equal(rollDungeonD20(p,1,'attack',0,()=>7),7);
 const member={id:'a',name:'A',weaponId:'greatsword',classType:'warrior',character:DEFAULT_CUSTOMIZATION,isReady:true};
 for(const difference of [9,10]){let s=createDungeon(member);s.phase='attack';s.round=1;s.teamHp=100;s.teamMaxHp=100;s.enemies=[makePlayer({...member,id:'enemy'})];s.enemies[0].hp=1000;s.enemies[0].maxHp=1000;s.target='enemy';s.rolls={a:[20]};s.enemyRolls=[20-difference];s.botDice={stage:'result',role:'defense',readyAt:0,until:0,values:[20-difference]};s=tickDungeon(s,1);assert.equal(s.comparison.critical,difference>=10);assert.equal(s.comparison.damage,difference>=10?20:9);}
}finally{Math.random=random;}
console.log('PASS: six tiers +0–5 on hit only; Dungeon Focus ATK 80% / DEF 40% for 18–20; other modes ATK 50% / DEF 25%, fallback/no-focus; Team Crit threshold 10');
