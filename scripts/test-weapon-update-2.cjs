require('./test-dice-timing.cjs');
const assert=require('node:assert/strict'),fs=require('fs');
const {WEAPON_DEFINITIONS:W,WEAPONS_BY_TIER,DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts');
const {castChargedSkill:C,chargeSkillPoints}=require('../src/lib/chargedSkills.ts');
const {prepareWeapon2Attack:prepare,weapon2Defense,weapon2Reactions,tickWeapon2,musashiHidden}=require('../src/lib/weaponUpdate2Logic.ts');
const {weaponD20,tickWeaponRound}=require('../src/lib/weaponUpdateHooks.ts');
const {activeWeather,syncWeather,advanceWeather}=require('../src/lib/weaponUpdateState.ts');
const {skillIsLocked}=require('../src/lib/combatDamage.ts');
const {calculateDuelCombat}=require('../src/lib/battleLogic.ts');
const {createDungeon,makePlayer,dungeonAction:A}=require('../src/lib/dungeon.ts');
const {createRoundLms,roundLmsAction}=require('../src/lib/lmsRound.ts');
const {skillEffectPlan}=require('../src/lib/skillPresentation.ts');
const {effectDuration,presentationDuration,projectileColor,isTravelingEffect}=require('../src/lib/skillMotion.ts');
const {rollTimedD20,rollDungeonD20}=require('../src/lib/diceTiming.ts');
const participant=(id,weaponId)=>({id,name:id,weaponId,classType:'warrior',character:DEFAULT_CUSTOMIZATION,isReady:true});
const make=id=>({...makePlayer(participant(id,id)),hp:200,maxHp:200,d12Charge:500});
let random=Math.random;try{
 Math.random=()=>0;
 let p=make('vine_staff'),t=make('greatsword'),c=C(p,t,1,1);assert.equal(c.damage,5);assert.equal(c.caster.d12Charge,490);t=c.opponent;
 for(let r=2;r<=5;r++)tickWeaponRound([t],r);assert.equal(t.hp,192);
 t=c.opponent;let charged=chargeSkillPoints(t,[6,6],2);assert.ok(charged.d12Charge<=506);assert.ok(charged.weaponUpdate.lastChargeValue<=3);charged=chargeSkillPoints(charged,[6],5);assert.equal(charged.weaponUpdate.lastChargeValue,6);
 c=C(p,make('greatsword'),2,1);t=c.opponent;assert.equal(skillIsLocked(t,1,1),false);prepare(t,2,p);assert.equal(skillIsLocked(t,1,2),true);assert.equal(skillIsLocked(t,2,2),true);prepare(t,3,p);assert.equal(skillIsLocked(t,1,3),false);
 p=make('wind_wand');c=C(p,make('greatsword'),1,1,1);t=c.opponent;for(let r=2;r<=4;r++){assert.equal(prepare(t,r,p),true);prepare(t,r,p)}assert.equal(t.hp,175);assert.equal(prepare(t,5,p),false);
 Math.random=()=>.19;c=C(p,make('greatsword'),1,1,2);assert.equal(c.opponent.weaponUpdate.windSkipNext,true);Math.random=()=>.2;c=C(p,make('greatsword'),1,1,2);assert.equal(c.opponent.weaponUpdate.windSkipNext,undefined);
 Math.random=()=>0;p.hp=100;c=C(p,make('greatsword'),2,1);p=c.caster;t=c.opponent;for(let r=2;r<=6;r++)prepare(t,r,p);assert.equal(p.hp,125);assert.equal(p.weaponUpdate.cycloneAttacks,0);prepare(t,7,p);assert.equal(p.hp,125);
 p=make('astghik_staff');p.hp=100;c=C(p,make('greatsword'),1,1,1);assert.equal(c.caster.hp,110);
 c=C(p,make('greatsword'),1,1,2);p=c.caster;t=c.opponent;weapon2Defense(p,true,2);weapon2Defense(p,true,3);weapon2Defense(p,false,4);assert.equal(p.weaponUpdate.wallCollapse,true);const hp=t.hp;prepare(p,5,t);assert.equal(t.hp,hp-5);assert.equal(p.weaponUpdate.wallCollapse,false);
 for(const branch of [0,1,2]){p=make('astghik_staff');p.hp=100;c=C(p,make('greatsword'),2,1);p=c.caster;t=c.opponent;syncWeather([p,t]);let values=[.99,.1,(branch+.1)/3];Math.random=()=>values.shift()??.99;tickWeapon2([p,t],2);assert.equal(t.hp,200-[10,5,3][branch]);if(branch===0)assert.equal(p.hp,110);if(branch===1){Math.random=()=>0;assert.equal(chargeSkillPoints(t,[6],2).weaponUpdate.lastChargeValue,1)}if(branch===2)assert.equal(p.weaponUpdate.critBonusPending,.1);}
 Math.random=()=>0;p=make('musashi');t=make('greatsword');c=C(p,t,1,1,1);assert.equal(c.damage,12);p=c.caster;t=c.opponent;const markedHp=t.hp;tickWeaponRound([t],2);assert.equal(t.hp,markedHp);c=C(p,t,1,2,2);assert.equal(c.damage,15);assert.equal(c.opponent.weaponUpdate.musashiMarkUntil,undefined);
 p=make('musashi');p.hp=100;t=make('greatsword');t.weaponUpdate={musashiMarkUntil:9};c=C(p,t,1,1,3);assert.equal(c.damage,17);assert.equal(c.caster.hp,110);assert.equal(c.opponent.weaponUpdate.musashiMarkUntil,undefined);
 p=make('musashi');t=make('greatsword');assert.equal(C(p,t,2,1,2),null);c=C(p,t,2,1,1);p=c.caster;t=c.opponent;syncWeather([p,t]);assert.equal(musashiHidden(p,t,2),true);c=C(p,t,2,2,2);assert.equal(c.damage,30);p=c.caster;t=c.opponent;assert.equal(musashiHidden(p,t,2),false);const start=t.hp;for(let r=3;r<=6;r++)weapon2Reactions(p,t,r);assert.equal(t.hp,start-15);assert.equal(p.weaponUpdate.musashiSmokeAttacks,0);
 p=make('musashi');p.weaponUpdate={weather:{kind:'mist',until:8,remainingTurns:6,started:1,owner:p.id}};t=make('greatsword');const dodge=calculateDuelCombat(20,1,t,p,2);assert.equal(dodge.damage,0);assert.equal(dodge.isDodged,true);for(let r=1;r<=7;r++)advanceWeather([p],r);assert.equal(activeWeather(p,8),undefined);
 p=make('musashi');weaponD20(p,12,'attack',1);const first=p.weaponUpdate.musashiRed;weaponD20(p,17,'attack',1);assert.equal(p.weaponUpdate.musashiRed,first);weaponD20(p,12,'attack',2);assert.equal(p.weaponUpdate.musashiRed,!first);
 for(const slot of [1,2]){let s=createDungeon(participant('a','vine_staff'));s.phase='skills';s.round=5;s.teamHp=s.teamMaxHp=200;s.pts=100;s.enemies=['x','y','z'].map(id=>makePlayer(participant(id,'greatsword')));s.target='x';s=A(s,'a','skill',{slot,target:'x'});assert.equal(s.pts,100-(slot===1?10:15));assert.ok(s.enemies.every(e=>e.hp===95));assert.ok(s.enemies.every(e=>slot===1?e.weaponUpdate.vineUntil===8:e.weaponUpdate.sealAttacks===1));}
 let lms=createRoundLms([participant('a','vine_staff'),participant('b','greatsword'),participant('c','greatsword')]);lms.phase='skills';lms.round=5;lms.order=['a','b','c'];lms.stageOrder=['a','b','c'];lms.stagePart='use';lms.stageDone=[];lms.roundCharges={a:[6]};lms.players[0].d12Charge=100;lms=roundLmsAction(lms,'a','skill',{slot:2,target:'b'},100);assert.equal(lms.players[1].hp,145);assert.equal(lms.players[2].hp,145);assert.equal(lms.players[2].weaponUpdate.sealAttacks,1);
 // The halo adds exactly ten percentage points, including a focused D20, only when attacking.
 for(const [value,expected]of [[.599,true],[.6,false]]){p=make('astghik_staff');p.weaponUpdate={critBonusPending:.1};p.diceTiming={round:2,role:'attack',quality:1,startedAt:0};Math.random=()=>value;assert.equal(rollTimedD20(p,2,'attack',()=>1)===20,expected)}
 for(const [value,expected]of [[.899,true],[.9,false]]){p=make('astghik_staff');p.weaponUpdate={critBonusPending:.1};p.diceTiming={round:2,role:'attack',quality:1,startedAt:0};Math.random=()=>value;assert.equal(rollDungeonD20(p,2,'attack')>=18,expected)}
 const plan=skillEffectPlan(make('musashi'),1,3);assert.deepEqual(plan.map(x=>x.effect),['mu:S1_C_Blue_Wave','mu:S1_C_Red_Wave']);assert.equal(presentationDuration({effect:plan[0].effect,cues:plan}),3100);assert.ok(effectDuration('mu:S1_B_Dash_Cut')<2900);assert.equal(effectDuration('mu:S2_B_20_Cuts'),1700);assert.equal(effectDuration('mu:S1_B_Dash_Cut'),1700);assert.equal(effectDuration('mu:D20_Red'),1500);assert.equal(projectileColor('dn:purge'),undefined);assert.equal(projectileColor('mu:S1_C_Blue_Wave'),undefined);assert.equal(isTravelingEffect('mu:S1_C_Blue_Wave'),true);for(const effect of ['wu1:white_triple','wu1:white_flurry','wu1:world_slash','mu:S2_A_Void_Flash']){assert.equal(isTravelingEffect(effect),true);assert.equal(projectileColor(effect),undefined);}assert.equal(isTravelingEffect('wu1:white_cross'),false);assert.equal(W.vine_staff.tier,'uncommon');assert.ok(WEAPONS_BY_TIER.indexOf(W.vine_staff)>WEAPONS_BY_TIER.indexOf(W.shield));
 for(const a of JSON.parse(fs.readFileSync('Musashi_Secret_Animation_v2/animations.json')).animations)for(let i=0;i<24;i++)assert.ok(fs.existsSync('public/assets/weapon-update-2/musashi/'+a.id+'/'+i+'.webp'));
 console.log('PASS update 2: skill costs/forms, vine D6-only + DOT + next-attack seals, wind lock probabilities/durations, water wall/heal/halo branches, Musashi mark/no DOT/explosion/waves/hidden/mist/dodge/smoke/alternating cuts, Dungeon + LMS AOE, animation timing and all Musashi frames');
}finally{Math.random=random}

assert.match(require('../src/lib/weaponUpdateAssets.ts').skillIconFrame('mu:S2_A_Void_Flash'),/S2_A_Void_Flash\/8.webp$/);
