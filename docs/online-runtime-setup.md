# Ranked PvP / LMS runtime

Run `sql/20261104-online-runtime.sql` in the Supabase SQL editor after the existing rooms/users and social migrations. It is rerunnable and preserves existing accounts/rooms. Keep `SUPABASE_SERVICE_ROLE_KEY` on the server. No key goes in the client bundle.

The migration creates durable matchmaking tickets, room invitations and idempotent rank results. It also repairs missing uniqueness on rooms.id/code and prevents direct browser reads of private room/buff state. Existing duplicate room identifiers must be resolved before a UNIQUE constraint can be added; the migration never deletes such rows automatically.

Matchmaking derives the account and loadout from the signed session. One transaction serializes pairing and creates the room, so separate serverless instances share one queue. Finished matches can requeue. PvE remains the explicitly selected bot mode.

Rank settlement locks the room and accounts, uses Elo K=32, records one result per battle ID, and updates tier/wins/losses. LMS winner gains the sum of the losses from the other participants. Draws leave rank unchanged. API polls retry settlement after a transient failure.

## LMS rules reconciled

- 3–4 players, 200 base HP (Assassin 150, Juggernaut 300).
- Hit only when Attack > Defense. Damage is 15 + difference, then class modifiers and shields. This supersedes the experimental 300 HP / 10 base damage proposal.
- Highest initial D20 goes first; initiative order breaks ties by seat. Mage clicks D6 twice; other classes once.
- Skills before Attack; choose a target, roll Attack, target rolls Defense, then 5-second Clash. Each ±1 Attack costs 3 PTS, clamped to 1–20.
- One hidden random buff per player, once per match; other accounts receive no unrevealed buff ID. The UI lists every buff's actual timing/condition.
- AoE attacks queue each surviving defender. Greatsword Skill 2 and Staff Skill 1 affect all other living players, charging PTS once.
- A kill grants 30 HP (capped at max) and 5 PTS. Environmental damage never resurrects an eliminated player through kill rewards.
- Bombs deal 40 unblocked HP after two full rounds. Sudden death starts at round 8: 10 HP to all living players, +5 each following round. Meteor buff advances that start by one round.
- Death skips future turns. Simultaneous elimination produces a draw. Returning to the lobby preserves all participants and resets ready states.

## Verification

- `node scripts/test-lms-buffs.cjs`: all 20 activations and once-only guards, plus shield/revival/insurance/theft/trade/bomb/storm/draw/dead-attacker outcomes, along with weapon regression tests.
- `node scripts/test-online-runtime.cjs`: real PostgreSQL engine via PGlite, durable pairing, shared room IDs, rerunnable SQL, requeue, 4-player rank and replay-safe settlement, private table permissions.
- Four isolated Chrome contexts run charge/target/attack/defend/clash/end through UI against a simulated HTTP backend and agree on player state. Mobile layout tested at 390px. This does not claim a live Supabase match before the operator runs the migration.
