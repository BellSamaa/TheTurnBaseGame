# Weapon visual audit — 2026-11-04

Compared all 128 deployed frames with `DiceManiac_AnimationKit_v1/frames`: identical SHA-256 hashes. The kit's `abilities.json` is visual reference only; current combat rules take precedence (Aoi reflects damage, not stun).

| Weapon | Skill 1 | Skill 2 |
| --- | --- | --- |
| Greatsword | slash_light → impact_physical | slash_heavy |
| Bow | arrow → bleed | dodge_attack on caster |
| Staff | magic_orb | dodge_spell on caster |
| Revolver | reload on caster | bullet → impact_physical |
| Infinity Void | Aoi: void_blue; Akai: void_red; Immune: infinity on caster | void_blue + void_red on caster → hollow_purple on opponent / center for Purple Sky |
| Dragon Dagger | Throw: slash_light → burn_orange; Multi: slash_multi → burn_orange on caster | burn_blue on caster → slash_multi → burn_blue |
| Chronos | time_save / time_erase on caster; time_reroll / time_lock on opponent | time_erase on caster |
| Leaf Headband | burn_black | meteor_one / meteor_two → meteor_impact; panic when applied |
| Pet Rock | rock_summon on caster | rock_rage on caster → rock_roll → impact_physical; recoil targets caster |

Resolved defensive events use rock_block, infinity, dodge_attack or dodge_spell. Living Rock's followup uses rock_roll after the owner's attack. Burn ticks use burn_orange, burn_blue or burn_black based on their actual damage type. These are visual sequences; HP resolution remains atomic.

Sequences travel in battle state and are deduplicated by event ID. Each event finishes before the next renders. The selected skill form's original frame also appears in the tooltip and activation banner.

Validation: TypeScript; combat/skill and room lifecycle regression tests; Chrome tests for Aoi/Akai/Immune and an actual D20 exchange with Rock block and followup. Two-browser live network latency has not been exercised in this audit.
