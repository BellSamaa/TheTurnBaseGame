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
assert.equal(blocked.caster.d12Charge, 92);
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
