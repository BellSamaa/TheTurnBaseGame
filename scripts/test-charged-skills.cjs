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

const { WEAPON_DEFINITIONS } = require('../src/lib/constants.ts');
const { castChargedSkill, skillCost } = require('../src/lib/chargedSkills.ts');
const make = weapon => ({ id: weapon.id, name: weapon.name, weapon, hp: 100, maxHp: 100, d12Charge: 100, leafSkillReadyTurn: 1, isAttacker: true });
for (const weapon of Object.values(WEAPON_DEFINITIONS)) {
  const user = make(weapon), foe = make(WEAPON_DEFINITIONS.greatsword);
  const form = Array.isArray(weapon.skill1.triggerNumber) ? weapon.skill1.triggerNumber[0] : undefined;
  const first = castChargedSkill(user, foe, 1, 1, form);
  assert.ok(first, weapon.id + ' skill1');
  assert.equal(user.d12Charge, 100, 'input must not mutate');
  if (weapon.id !== 'revolver') assert.equal(first.caster.d12Charge, 100 - skillCost(user, 1));
  else assert.ok(first.caster.d12Charge >= 100 - skillCost(user, 1) + 1 && first.caster.d12Charge <= 100 - skillCost(user, 1) + 6);
  assert.equal(castChargedSkill(first.caster, first.opponent, 1, 1, form), null, 'no repeat in same round');
  const second = castChargedSkill(first.caster, first.opponent, 2, 1);
  assert.ok(second, weapon.id + ' skill2');
  assert.equal(second.caster.d12Charge, first.caster.d12Charge - skillCost(user, 2), 'deduct exactly once from shared balance');
  assert.equal(castChargedSkill({ ...user, d12Charge: 0 }, foe, 1, 1, form), null);
  assert.equal(castChargedSkill({ ...user, d12Charge: 0, petRockEnraged: true }, foe, 2, 1), null);
}
const gun = make(WEAPON_DEFINITIONS.revolver), foe = make(WEAPON_DEFINITIONS.greatsword);
assert.equal(castChargedSkill({ ...gun, bullets: 0 }, foe, 2, 1), null);
const sword = make(WEAPON_DEFINITIONS.greatsword);
const blocked = castChargedSkill(sword, { ...foe, dodgeNextSkill: true }, 1, 1);
assert.equal(blocked.damage, 0); assert.equal(blocked.opponent.dodgeNextSkill, false);
assert.equal(blocked.caster.d12Charge, 100 - skillCost(sword, 1));
const ring = make(WEAPON_DEFINITIONS.infinity_ring);
assert.equal(castChargedSkill(ring, foe, 1, 1, 1), null, 'invalid form costs nothing');
const { calculateD20Combat } = require('../src/lib/battleLogic.ts');
const { CLASS_DEFINITIONS } = require('../src/lib/constants.ts');
const rock = make(WEAPON_DEFINITIONS.spirit_stone);
calculateD20Combat(15, 5, CLASS_DEFINITIONS.warrior, CLASS_DEFINITIONS.warrior, sword, rock);
assert.equal(rock.petRockHp, 0, 'Rock must be manually summoned');
const summoned = castChargedSkill(rock, foe, 1, 1);
assert.equal(summoned.caster.petRockHp, 50);
console.log('PASS: 18 weapon skills, shared balance, exact costs, once per round, insufficient PTS, ammo, shield, form selection, manual Rock summon');

const leaf = make(WEAPON_DEFINITIONS.fire_headband);
assert.equal(castChargedSkill({ ...leaf, leafSkillReadyTurn: undefined }, foe, 1, 1), null);
const fire = castChargedSkill(leaf, foe, 1, 1);
assert.equal(fire.caster.hp, 95);
assert.equal(fire.opponent.hp, 100);
assert.equal(fire.opponent.burnTicks, 3);
assert.equal(fire.opponent.burnDmgPerTurn, 5);
const shield = { ...make(WEAPON_DEFINITIONS.spirit_stone), petRockHp: 50 };
const hit = calculateD20Combat(17,5,CLASS_DEFINITIONS.warrior,CLASS_DEFINITIONS.warrior,sword,shield);
assert.equal(hit.damage,7); assert.equal(shield.petRockHp,45);
assert.ok(castChargedSkill({ ...sword, skill1UsedTurn: 1 },foe,1,2));
console.log('PASS: Leaf D6 condition, 5 HP cost, 3 x 5 burn; Rock absorbs 5 of 12; skill reusable next round');
const { chargeSkillPoints } = require('../src/lib/chargedSkills.ts');
const low = { ...leaf, d12Charge: 8, leafSkillReadyTurn: undefined };
const reached = chargeSkillPoints(low,[2],1);
assert.equal(reached.d12Charge,10); assert.equal(reached.leafSkillReadyTurn,undefined);
const unlocked = chargeSkillPoints(reached,[2],2);
assert.equal(unlocked.leafSkillReadyTurn,2);
assert.equal(chargeSkillPoints(reached,[3],2).leafSkillReadyTurn,undefined);
const meteor1 = castChargedSkill({...leaf,d12Charge:30},foe,2,1,20);
assert.equal(meteor1.damage,10); assert.equal(meteor1.caster.d12Charge,10); assert.equal(meteor1.opponent.panicTurns,undefined);
const meteor2 = castChargedSkill({...leaf,d12Charge:30},foe,2,1,30);
assert.equal(meteor2.damage,30); assert.equal(meteor2.caster.d12Charge,0); assert.equal(meteor2.opponent.panicTurns,2); assert.equal(meteor2.opponent.panicAttackDebuff,5);
assert.equal(castChargedSkill({...leaf,d12Charge:29},foe,2,1,30),null);
assert.equal(castChargedSkill(leaf,foe,2,1,25),null);
console.log('PASS: later-round Leaf unlock, explicit 20/30 PTS meteors, exact costs and Panic');
const { applyOpponentDamage, reflectedDamage, skillIsLocked } = require('../src/lib/combatDamage.ts');
const hurt = make(WEAPON_DEFINITIONS.infinity_ring);
applyOpponentDamage(hurt, 12, 1);
applyOpponentDamage(hurt, 5, 1);
assert.equal(reflectedDamage(hurt, 2), 17);
assert.equal(reflectedDamage(hurt, 3), 0);
const reflection = castChargedSkill(hurt, foe, 1, 2, 3);
assert.equal(reflection.damage, 17);
assert.equal(reflection.opponent.hp, 83);
assert.equal(hurt.hp, 83, 'cast does not mutate source');
assert.equal(castChargedSkill(ring, foe, 1, 1, 4).damage, 12);
const immune = castChargedSkill(ring, foe, 1, 1, 6).caster;
assert.equal(immune.immuneDamageNext, true);
calculateD20Combat(1, 20, CLASS_DEFINITIONS.warrior, CLASS_DEFINITIONS.warrior, sword, immune);
assert.equal(immune.immuneDamageNext, true, 'miss must preserve aura');
const shieldHit = calculateD20Combat(20, 1, CLASS_DEFINITIONS.warrior, CLASS_DEFINITIONS.warrior, sword, immune);
assert.equal(shieldHit.damage, 0);
assert.equal(immune.immuneDamageNext, false);
const shielded = { ...foe, immuneDamageNext: true };
assert.equal(applyOpponentDamage(shielded, 0, 1), 0);
assert.equal(shielded.immuneDamageNext, true);
assert.equal(applyOpponentDamage(shielded, 5, 1), 0);
assert.equal(applyOpponentDamage(shielded, 5, 1), 5);
assert.equal(shielded.opponentDamageAmount, 5);
assert.equal(castChargedSkill(ring, foe, 2, 1, 1).damage, 50);
for (const locked of [1, 2]) {
  const sky = castChargedSkill(ring, foe, 2, 1, 2, locked);
  assert.equal(sky.damage, 30);
  assert.equal(sky.purpleSky, true);
  assert.equal(sky.caster.d12Charge, 72);
  assert.equal(skillIsLocked(sky.opponent, locked, 1), false);
  assert.equal(skillIsLocked(sky.opponent, locked, 2), true);
  assert.equal(castChargedSkill(sky.opponent, ring, locked, 2), null);
  assert.ok(castChargedSkill(sky.opponent, ring, locked === 1 ? 2 : 1, 2));
  assert.ok(castChargedSkill(sky.opponent, ring, locked, 3));
  assert.equal(foe.lockedSkill, undefined);
}
assert.equal(castChargedSkill(ring, foe, 2, 1, 2), null);
assert.equal(castChargedSkill(ring, foe, 2, 1, 3), null);
console.log('PASS: Infinity reflection, Akai 12, one-hit immunity, Purple 50, Purple Sky 30, selected next-round lock and expiry');
const { applyChargeRoll } = require('../src/lib/chargeRoll.ts');
for (const mageFirst of [true, false]) {
  let state = { player1: { ...ring, id: 'p1', classType: mageFirst ? 'mage' : 'warrior', d12Charge: 0 }, player2: { ...foe, id: 'p2', classType: mageFirst ? 'warrior' : 'mage', d12Charge: 0 }, currentTurn: 1, attackerId: 'p1', phase: 'battle', turnStep: 'd6_atk', d6Results: null };
  for (const isP1 of [true, false]) {
    const key = isP1 ? 'player1' : 'player2';
    const phase = isP1 ? 'd6_atk' : 'd6_def';
    const mage = state[key].classType === 'mage';
    const first = applyChargeRoll(state, isP1, 3);
    assert.equal(first[key].d12Charge, 3);
    assert.deepEqual(first.d6Results[key], [3]);
    assert.equal(state[key].d12Charge, 0, 'source unchanged');
    if (mage) {
      assert.equal(first.turnStep, phase, 'Mage must click again');
      state = applyChargeRoll(JSON.parse(JSON.stringify(first)), isP1, 5);
      assert.equal(state[key].d12Charge, 8);
      assert.deepEqual(state.d6Results[key], [3, 5]);
    } else state = first;
    assert.equal(state.turnStep, isP1 ? 'd6_def' : 'd12');
    assert.equal(applyChargeRoll(state, isP1, 6), null, 'no extra roll after allowance');
  }
  const nextRound = { ...state, currentTurn: 2, attackerId: 'p2', turnStep: 'd6_atk', d6Results: null };
  assert.ok(applyChargeRoll(nextRound, false, 2));
}
const readyLeaf = { ...make(WEAPON_DEFINITIONS.fire_headband), leafSkillReadyTurn: 4 };
assert.equal(require('../src/lib/chargedSkills.ts').chargeSkillPoints(readyLeaf, [3], 4).leafSkillReadyTurn, 4);
console.log('PASS: Mage two separate D6 clicks, both sides, shared-state round trip, exact PTS, roll limit, next-round reset');
const petTarget = { ...make(WEAPON_DEFINITIONS.spirit_stone), petRockHp: 50 };
const akaiVsRock = castChargedSkill(ring, petTarget, 1, 1, 4);
assert.equal(akaiVsRock.opponent.petRockHp, 45, 'skill hit spends Rock HP');
assert.equal(akaiVsRock.opponent.hp, 93, '12 damage splits 5 Rock + 7 owner');
assert.equal(petTarget.petRockHp, 50, 'input snapshot unchanged');
const nearlyDeadRock = { ...petTarget, petRockHp: 3 };
assert.equal(applyOpponentDamage(nearlyDeadRock, 12, 1), 9);
assert.equal(nearlyDeadRock.petRockHp, 0);
assert.equal(applyOpponentDamage(nearlyDeadRock, 12, 1), 12);
const smallHitRock = { ...petTarget };
assert.equal(applyOpponentDamage(smallHitRock, 2, 1), 0);
assert.equal(smallHitRock.petRockHp, 48);
const shieldRock = { ...petTarget, immuneDamageNext: true };
assert.equal(applyOpponentDamage(shieldRock, 12, 1), 0);
assert.equal(shieldRock.petRockHp, 50, 'immune damage does not hurt Rock');
const summonedAgain = castChargedSkill(akaiVsRock.opponent, foe, 1, 2);
assert.equal(summonedAgain.caster.petRockHp, 45, 'summon must not refill living Rock');
assert.equal(JSON.parse(JSON.stringify(akaiVsRock.opponent)).petRockHp, 45);
console.log('PASS: Rock absorbs skill and companion hits, loses real HP, handles death/immune, and cannot refill while alive');
const deadPet = { ...petTarget, petRockHp: 0, petRockEnraged: true, petRockHits: 10 };
assert.equal(castChargedSkill(deadPet, foe, 2, 3), null, 'dead Rock cannot use Skill 2');
const revivedPet = castChargedSkill(deadPet, foe, 1, 3);
assert.equal(revivedPet.caster.petRockHp, 50);
assert.equal(revivedPet.caster.petRockEnraged, false);
assert.equal(revivedPet.caster.petRockHits, 0);
assert.equal(revivedPet.caster.d12Charge, deadPet.d12Charge - skillCost(deadPet, 1));
console.log('PASS: dead Rock requires paid Skill 1 resummon and resets summon status');
const { skillPresentation, normalAttackEffect } = require('../src/lib/skillPresentation.ts');
const manifest = require('../public/assets/vfx/manifest.json');
for (const weapon of Object.values(WEAPON_DEFINITIONS)) {
  const user = make(weapon);
  const forms = Array.isArray(weapon.skill1.triggerNumber) ? weapon.skill1.triggerNumber : [undefined];
  for (const slot of [1, 2]) for (const form of slot===1 ? forms : weapon.id==='fire_headband' ? [20,30] : weapon.id==='infinity_ring' ? [1,2] : [undefined]) {
    const view = skillPresentation(user, slot, form);
    assert.ok(manifest.effects[view.effect], weapon.id + ' actual VFX asset exists');
    assert.ok(view.nameEn && view.nameVi);
  }
  assert.ok(manifest.effects[normalAttackEffect(weapon.id)]);
}
for(const [id,slot,form,effect,target] of [
  ['revolver',1,undefined,'reload','caster'], ['bow',2,undefined,'dodge_attack','caster'],
  ['staff',2,undefined,'dodge_spell','caster'], ['spirit_stone',1,undefined,'rock_summon','caster'],
  ['spirit_stone',2,undefined,'rock_rage','opponent'], ['infinity_ring',1,3,'void_blue','opponent'],
  ['infinity_ring',1,4,'void_red','opponent'], ['infinity_ring',1,6,'infinity','caster'],
  ['infinity_ring',2,2,'hollow_purple','center'], ['chronos_watch',1,2,'time_save','caster'],
  ['chronos_watch',1,4,'time_reroll','opponent'], ['chronos_watch',1,6,'time_lock','opponent'],
  ['chronos_watch',2,undefined,'time_erase','caster'], ['fire_headband',2,20,'meteor_one','opponent'],
  ['fire_headband',2,30,'meteor_two','opponent']]) {
  const view=skillPresentation(make(WEAPON_DEFINITIONS[id]),slot,form);
  assert.equal(view.effect,effect);assert.equal(view.target,target);
}
assert.equal(skillPresentation({...make(WEAPON_DEFINITIONS.chronos_watch), timeAnchorHp:80},1,2).nameEn,'Time Rewind');
assert.notEqual(normalAttackEffect('chronos_watch'),'time_lock');
assert.notEqual(normalAttackEffect('fire_headband'),'burn_black');
console.log('PASS: each skill/form uses a real effect asset, correct caster/opponent target, and chosen form name');
const { skillEffectPlan } = require('../src/lib/skillPresentation.ts');
const crypto = require('crypto');
for(const [effect, definition] of Object.entries(manifest.effects)) for(let frame=0;frame<4;frame++) {
  const dest=fs.readFileSync(path.join(root,'public/assets/vfx/frames',effect,frame+'.png'));
  const source=fs.readFileSync(path.join(root,'DiceManiac_AnimationKit_v1/frames',effect,frame+'.png'));
  assert.equal(crypto.createHash('sha256').update(dest).digest('hex'),crypto.createHash('sha256').update(source).digest('hex'),effect+' uses original kit image');
}
assert.deepEqual(skillEffectPlan(ring,2,1).map(c=>c.effect),['void_blue','void_red','hollow_purple']);
assert.deepEqual(skillEffectPlan(petTarget,2).map(c=>c.effect),['rock_rage','rock_roll','impact_physical']);
assert.equal(skillEffectPlan(petTarget,2)[0].target,'caster');
assert.deepEqual(skillEffectPlan(make(WEAPON_DEFINITIONS.bow),1).map(c=>c.effect),['arrow','bleed']);
assert.deepEqual(skillEffectPlan(make(WEAPON_DEFINITIONS.fire_headband),2,30).map(c=>c.effect),['meteor_two','meteor_impact']);
console.log('PASS: all 128 effect frames match original kit; multi-stage Purple, Rock, Bow and Meteor effects');
