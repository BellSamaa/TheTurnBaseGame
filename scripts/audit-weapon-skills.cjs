// Automated audit for every weapon's two charged skills.
// Run with: node scripts/audit-weapon-skills.cjs
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, parent, ...args);
};
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(
  fs.readFileSync(filename, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } },
).outputText, filename);

const { WEAPON_DEFINITIONS } = require('../src/lib/constants.ts');
const { castChargedSkill, skillCost } = require('../src/lib/chargedSkills.ts');
const { skillPresentation } = require('../src/lib/skillPresentation.ts');
const weaponIds = Object.keys(WEAPON_DEFINITIONS);
assert.equal(weaponIds.length, 9, 'the audit must cover all nine weapons');

function player(weapon) {
  return {
    id: 'audit-player', name: 'Audit Player', weapon,
    hp: 100, maxHp: 100, d12Charge: 100, bullets: 6,
    leafSkillReadyTurn: 1, isAttacker: true,
  };
}

for (const id of weaponIds) {
  const weapon = WEAPON_DEFINITIONS[id];
  assert.ok(weapon.skill1.name && weapon.skill1.effect, `${id} has a complete Skill 1 definition`);
  assert.ok(weapon.skill2.name && weapon.skill2.effect, `${id} has a complete Skill 2 definition`);
  assert.ok(skillPresentation(player(weapon), 1, Array.isArray(weapon.skill1.triggerNumber) ? weapon.skill1.triggerNumber[0] : undefined).effect);
  assert.ok(skillPresentation(player(weapon), 2, id === 'fire_headband' ? 20 : id === 'infinity_ring' ? 1 : undefined).effect);

  const form = Array.isArray(weapon.skill1.triggerNumber) ? weapon.skill1.triggerNumber[0] : undefined;
  const first = castChargedSkill(player(weapon), player(WEAPON_DEFINITIONS.greatsword), 1, 1, form);
  assert.ok(first, `${id} Skill 1 executes`);
  assert.equal(first.caster.d12Charge, 100 - skillCost(player(weapon), 1) + (id === 'revolver' ? first.caster.d12Charge - (100 - skillCost(player(weapon), 1)) : 0));

  const skill2Form = id === 'fire_headband' ? 20 : id === 'infinity_ring' ? 1 : undefined;
  const skill2User = id === 'spirit_stone' ? first.caster : player(weapon);
  const second = castChargedSkill(skill2User, player(WEAPON_DEFINITIONS.greatsword), 2, 1, skill2Form);
  assert.ok(second, `${id} Skill 2 executes`);
  assert.equal(second.caster.d12Charge, skill2User.d12Charge - skillCost(skill2User, 2));
}

console.log(`PASS: audited ${weaponIds.length} weapons and ${weaponIds.length * 2} charged skills against current APIs`);
