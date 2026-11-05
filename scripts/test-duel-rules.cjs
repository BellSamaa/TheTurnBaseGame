require('./test-new-combat-balance.cjs');
const assert = require('node:assert/strict');
const { calculateDuelCombat } = require('../src/lib/battleLogic.ts');
const { critChance, recordDuelComparison, rollLuckyAttack } = require('../src/lib/duelRules.ts');
const { WEAPON_DEFINITIONS } = require('../src/lib/constants.ts');
const { createPve, advancePve } = require('../src/lib/pve.ts');
const { rollDuelDefense, settleDuelClash } = require('../src/lib/pvpDuel.ts');
const { activeWeather, advanceWeather, syncWeather } = require('../src/lib/weaponUpdateState.ts');

const participant = (id, weaponId = 'greatsword') => ({
  id, name: id, weaponId, classType: 'warrior', character: {}, isReady: true,
});
const player = (id, weaponId = 'greatsword') => ({
  ...participant(id, weaponId), weapon: WEAPON_DEFINITIONS[weaponId], hp: 100, maxHp: 100, d12Charge: 3,
});
function random(value, run) {
  const original = Math.random;
  Math.random = () => value;
  try { return run(); } finally { Math.random = original; }
}

const duel = { player1: player('atk'), player2: player('def'), attackerId: 'atk',
  currentTurn: 1, turnStep: 'd20_def', phase: 'combat', p1D20: 9, battleLog: [], revision: 5 };
assert.throws(() => rollDuelDefense(duel, 'atk'));
const pending = random(.42, () => rollDuelDefense(duel, 'def', 1000));
assert.equal(pending.turnStep, 'clash');
assert.equal(pending.duelClash.deadline, 6000);
assert.equal(pending.revision, 6);
assert.throws(() => settleDuelClash(pending, 'atk', 3, 2000));
assert.throws(() => settleDuelClash(pending, 'def', 4, 2000));
assert.throws(() => settleDuelClash({ ...pending, player2: { ...pending.player2, d12Charge: 1 } }, 'def', 2, 2000));
for (const stake of [0, 1, 2, 3]) {
  const chance = (35 + stake * 10) / 100;
  const counter = random(chance - .001, () => settleDuelClash(pending, 'def', stake, 2000));
  assert.equal(counter.player1.hp, 94);
  assert.equal(counter.player2.hp, 100);
  assert.equal(counter.player2.d12Charge, 3 - stake);
  assert.equal(counter.turnStep, 'd6_atk');
  assert.equal(counter.revision, 7);
  assert.throws(() => settleDuelClash(counter, 'def', stake, 2000));
  const attack = random(chance, () => settleDuelClash(pending, 'def', stake, 2000));
  assert.equal(attack.player2.hp, 94);
}
assert.equal(pending.player2.d12Charge, 3);
const expired = random(.4, () => settleDuelClash(pending, 'def', 3, 6000));
assert.equal(expired.player2.hp, 94);
assert.equal(expired.player2.d12Charge, 3);

for (const [weapon, tier, chance] of [['greatsword', 'common', .05], ['chronos_watch', 'mythic', .06], ['infinity_ring', 'secret', .075]]) {
  assert.equal(critChance(tier), chance);
  assert.equal(random(chance - .001, () => calculateDuelCombat(20, 20, player('a', weapon), player('b'), 1)).damage, 20);
  assert.equal(random(chance, () => calculateDuelCombat(20, 20, player('a', weapon), player('b'), 1)).damage, 0);
}
const a = player('a'), b = player('b');
assert.equal(recordDuelComparison(a, b, 16, 1), undefined);
assert.equal(recordDuelComparison(a, b, 17, 1).kind, 'attack');
assert.equal(recordDuelComparison(a, b, 1, 16).kind, 'defense');
assert.equal(a.d12Charge, 13);
assert.equal(b.d12Charge, 13);
for (let i = 0; i < 3; i++) recordDuelComparison(a, b, 4, 8);
assert.equal(a.duelLuck.mode, 'unlucky');
recordDuelComparison(a, b, 7, 7);
assert.equal(a.duelLuck.mode, 'unlucky');
let rolls = [7, 12];
assert.equal(rollLuckyAttack(a, () => rolls.shift(), () => .499), 12);
recordDuelComparison(a, b, 8, 7);
assert.equal(a.duelLuck.mode, undefined);
for (let i = 0; i < 3; i++) recordDuelComparison(a, b, 8, 4);
rolls = [12, 7];
assert.equal(rollLuckyAttack(a, () => rolls.shift(), () => .499), 7);
rolls = [12, 7];
assert.equal(rollLuckyAttack(a, () => rolls.shift(), () => .5), 12);
recordDuelComparison(a, b, 8, 7);
assert.equal(a.duelLuck.mode, undefined);

let run = createPve(participant('hero'));
Object.assign(run.combat, { phase: 'defense', active: 1, attack: 9, target: 'hero' });
run.combat.players[0].d12Charge = 3;
run = random(.42, () => advancePve(run, 'hero', 'defend'));
assert.equal(run.combat.phase, 'clash');
const wager = random(.64, () => advancePve(run, 'hero', 'duel_wager', { stake: 3 }));
assert.equal(wager.combat.players[1].hp, 94);
assert.equal(wager.combat.players[0].d12Charge, 0);
assert.ok(wager.combat.log.some(line => line.includes('6 HP')));
let luckyRun = createPve(participant('hero'));
luckyRun.combat.players[0].duelLuck = { hits: 0, misses: 3, mode: 'unlucky' };
const sequence = [.2, .1, .75, .1, .9];
const original = Math.random;
try {
  Math.random = () => sequence.shift() ?? .9;
  luckyRun = advancePve(luckyRun, 'hero', 'attack');
} finally { Math.random = original; }
assert.equal(luckyRun.combat.attack, 16);

for (const duration of [3, 5]) {
  a.weaponUpdate = { weather: { kind: 'rain', owner: 'a', started: 1, until: 1 + duration, remainingTurns: duration, fresh: true } };
  syncWeather([a, b]);
  advanceWeather([a, b], 1);
  for (let turn = 0; turn < duration; turn++) {
    assert.equal(activeWeather(a, 2).remainingTurns, duration - turn);
    assert.equal(activeWeather(b, 2).remainingTurns, duration - turn);
    advanceWeather([a, b], 2 + turn);
  }
  assert.equal(activeWeather(a, 2), undefined);
  assert.equal(activeWeather(b, 2), undefined);
}
console.log('PASS: duel wagers, exact odds, crit tiers, streaks, PvE clash and weather expiry');
