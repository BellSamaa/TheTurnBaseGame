# Weapon New Update 1 — gameplay and validation

## Included

12 new weapons: Shield (Common); Substitute Doll and Bee Shooter (Rare); Kagutsuchi, Thunder Spear, Ice Spear, Frying Pan (Epic); Mirror of Life (Legendary); Stormfrost Twin Spears and Trinity Rings (Mythic); King Slasher and Death Note (Secret).

Names and descriptions use English when EN is selected, Vietnamese when VI is selected. Secret uses a black galaxy/white stripe/white glow theme. Sukuna and Light use the same stand positioning and facing rules as the existing Secret stands.

All 71 effects / 284 frames are installed under `public/assets/weapon-update-1`, namespaced independently of old VFX. The original 62-event visual reference is included there as `START_HERE.html`; reference animations are illustrative, gameplay values come from the engine and in-game descriptions.

## Confirmed rules

- Shield Skill 1 is automatic on D6=4 and spends 2 PTS. It refreshes +2 DEF for 2 defenses. Skill 2 adds 15 armor; armor persists until absorbed.
- Sukuna Giải deals 5 total, not per ray. Slashing covers 3 defenses; a miss triggers 7 damage only once while later hits can still reflect 3. Divine Flame burns 3 damage for 3 rounds. World Slash requires the owner's Flame Mark, deals 40 directly to owner HP and bypasses armor, summons, Rock, dodge and immunity.
- Death Note failed rolls do not create a name mark. A successful mark is on that target and survives until Judgement is used; Judgement consumes it. D6 used for resolution is separate from charge PTS.
- Weather D20 bonuses take the maximum result. A newer weather cast replaces the previous global weather. Snow passive freeze chance is 15%.
- Both Stormfrost Skill 1 forms 2/3 deal 12. Form 3 applies Superconduct with 15% chance; affected targets take +2 damage from ice/lightning weapon skills. Orb weather raises Skill 1 chances by 5 percentage points; beam weather grants a 10% PTS refund chance.
- Bee swarm deals total 1–5 per round, not per bee. Worker poison stacks to 2, refreshing the 2-round duration.
- At most 3 small summons. They absorb in summon order, overflow reaches owner. Fire Spirit explodes once and is removed. Niko also absorbs; its 3 proc actions have equal chance. Mermaid/Golem/Niko actions resolve in the skill stage, once per round, not on polling.
- Mirror swap threshold is target HP >=120% of caster HP, capped at each character's max HP. Otherwise weaken by 7 for 2 rounds. Damage cannot go below 0. Only excess healing from actual drained HP becomes armor.
- Chronos Anchor lasts 5 rounds, saves/restores player state without erasing current-round skill-use guards. Fate Seal repeats the enemy's D20 attack in its next 2 attacks. Time Slow deals 10 and biases D6 low for 2 rounds. Skill 2 costs 20; Erase Time restores recent damage received; Time Changer grants 3 consecutive attacker turns.
- Infinity Void Hollow Purple is 40 (Purple Sky stays 30); Akai remains 12 and opens a 3-round 5% echo window for a separate 5 damage shot at a D20 step. Echoes do not refresh themselves.
- Dragon Dagger S1 costs 10: throw 8, reduce the next 2 successful target attacks by 2; multi slash 5 with +4 on next successful owner hit. S2 costs 28: 20 plus 2 burn for 5 ticks.

Role-scoped counters advance on the relevant attack/defense/hit event; round windows use the existing game round number. LMS keeps its five-stage rules, no normal Defense roll, offensive Skill 1 AoE, targeted Skill 2. New buffs that adjust DEF also apply to its base defense value. Slow/D6 lock lets the player End Turn, without stranding a phase. Existing rank/reward/account tables already persist selected weapon IDs and battle JSON; no additional SQL required.

## Validation

- `scripts/test-weapon-update-1.cjs`: Purple/Dagger changes and every frame path.
- `scripts/test-weapon-update-combat.cjs`: both skills for all 12 weapons, PTS, input immutability, reuse guards, all Death Note outcomes, piercing, armor/summons, weather, poison, Chronos.
- `scripts/test-weapon-update-status.cjs`: probability branches forced deterministically, scoped counters, locks, summons skill-stage timing/idempotency, reflection and expiry.
- `scripts/test-weapon-update-modes.cjs`: all weapons cast in PvE/PvP and pass a four-player LMS stage/round cycle.
- `scripts/test-weapon-update-simulation.cjs`: all 21 weapons finish real multi-round PvE action sequences with actual PTS accrual.
- Production `next build --webpack`, including TypeScript and static generation, passed.
- Existing class, skill-priority, LMS ordered-stage, Rock and Aoi regression suites.
- Browser inspection: 1366px and 390px, new stands, weather, 3 summons, hidden World Slash, Secret gallery, broken-image and horizontal-overflow checks.
