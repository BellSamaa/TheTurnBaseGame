require('./test-new-combat-balance.cjs');
const assert = require('node:assert/strict');
const { calculateDuelCombat } = require('../src/lib/battleLogic.ts');
const { critChance, recordDuelComparison, rollLuckyAttack } = require('../src/lib/duelRules.ts');
const { WEAPON_DEFINITIONS } = require('../src/lib/constants.ts');
const { createPve, advancePve } = require('../src/lib/pve.ts');
const { rollDuelDefense, resolveDuelClash } = require('../src/lib/pvpDuel.ts');
const { createRoundLms, roundLmsAction } = require('../src/lib/lmsRound.ts');
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
const submit = (state, actor, stake, now = 2000) => resolveDuelClash(state, now, { actor, stake });
assert.throws(() => submit(pending, 'spectator', 3));
assert.throws(() => submit(pending, 'def', 4));
assert.throws(() => submit({ ...pending, player2: { ...pending.player2, d12Charge: 1 } }, 'def', 2));
for (const attackStake of [0, 1, 2, 3]) {
  const locked = submit(pending, 'atk', attackStake);
  assert.equal(locked.duelClash.attackStake, attackStake);
  assert.equal(locked.player1.d12Charge, 3);
  assert.equal(submit(locked, 'atk', (attackStake + 1) % 4), locked);
  assert.equal(resolveDuelClash(locked, 5999), locked);
  for (const defenseStake of [0, 1, 2, 3]) {
    const chance = (35 + (defenseStake - attackStake) * 10) / 100;
    const counter = random(chance - .001, () => submit(locked, 'def', defenseStake));
    assert.equal(counter.player1.hp, 94);
    assert.equal(counter.player2.hp, 100);
    assert.equal(counter.player1.d12Charge, 3 - attackStake);
    assert.equal(counter.player2.d12Charge, 3 - defenseStake);
    assert.equal(counter.turnStep, 'd6_atk');
    assert.equal(counter.revision, 8);
    assert.throws(() => submit(counter, 'def', defenseStake));
    const attack = random(chance, () => submit(locked, 'def', defenseStake));
    assert.equal(attack.player2.hp, 94);
  }
}
assert.equal(pending.player2.d12Charge, 3);
const expired = random(.2, () => submit(submit(pending, 'atk', 2), 'def', 3, 6000));
assert.equal(expired.player2.hp, 94);
assert.equal(expired.player1.d12Charge, 1);
assert.equal(expired.player2.d12Charge, 3);

for (const [weapon, tier, chance] of [['greatsword', 'common', .5], ['chronos_watch', 'mythic', .6], ['infinity_ring', 'secret', .75]]) {
  assert.equal(critChance(tier), chance);
  assert.equal(random(chance - .001, () => calculateDuelCombat(20, 20, player('a', weapon), player('b'), 1)).damage, 20 + require('../src/lib/weaponStats.ts').weaponBaseDamage(tier));
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
let attackRun = createPve(participant('hero'));
attackRun.combat.players[0].d12Charge = 3;
attackRun = random(.42, () => advancePve(attackRun, 'hero', 'attack'));
assert.equal(attackRun.combat.duelClash.defenseStake, 0);
attackRun = random(.2, () => advancePve(attackRun, 'hero', 'duel_wager', { stake: 2 }));
assert.equal(attackRun.combat.players[1].hp, 94);
assert.equal(attackRun.combat.players[0].d12Charge, 1);

let lms = createRoundLms([participant('chrono', 'chronos_watch'), participant('winner'), participant('target')]);
lms.players[0].weaponUpdate = { extraAttacks: 2 };
lms = random(.2, () => roundLmsAction(lms, 'chrono', 'initiative', {}, 1000));
assert.equal(lms.players[0].weaponUpdate.extraAttacks, 1);
lms = random(.6, () => roundLmsAction(lms, 'target', 'initiative', {}, 1000));
lms = random(.8, () => roundLmsAction(lms, 'winner', 'initiative', {}, 1000));
assert.equal(lms.order[0], 'winner');
assert.throws(() => roundLmsAction(lms, 'chrono', 'target', { target: 'target' }, 1000));
lms = roundLmsAction(lms, 'winner', 'target', { target: 'target' }, 1000);
assert.equal(lms.attack, 17);
assert.throws(() => roundLmsAction(lms, 'chrono', 'clash', { delta: -1 }, 1001));
lms = roundLmsAction(lms, 'winner', 'resolve', {}, 6000);
assert.equal(lms.players[2].hp, 133);
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
