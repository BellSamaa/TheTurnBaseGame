# Dungeon update

- Run `sql/20261106-dungeon.sql` after the existing progression migration. It creates its own room table, RLS/service permissions, revision-locked state saves and transactional once-only floor rewards. It does not reset accounts.
- Dungeon supports 1–4 accounts in code-based rooms, ten weapon floors with five encounters each, shared HP/PTS/coins, class modifiers, NPC shops and four rest areas. HP scaling is evaluated at the next encounter when someone leaves.
- Each cleared floor rewards each present account with `20 × floor` Gems and `50 × floor` EXP. Ruby starts at floor five, with `floor(floor / 2)` Ruby. Lucky lasts two encounters. Rest coins: 300, 450, 600, 800.
- Combat follows team attack, team defense, charge, team skills, enemy skills, end. Team skills and end require all member votes; inactive actions time out after twenty seconds.
- Exploration coordinates use Supabase Broadcast at 10 Hz with client interpolation. Position is saved only when interacting with an NPC or portal. Movement does not send database updates.
- The optional timing meter works before attack/defense D20 rolls. The center adds ten percentage points to the chance of face 20. It is not a damage-crit modifier. Rolling first locks the timing meter, including Boxer's first die.
- Lobby chest interaction opens the armory. Party, Custom Match, Infinity PTS and Story remain locked.
- Dungeon PNG originals remain in the source pack; deployed images are WebP.

Validation commands:

```
node scripts/test-dungeon.cjs
node scripts/test-dice-timing.cjs
node scripts/test-weapon-update-combat.cjs
node scripts/test-weapon-update-modes.cjs
npx tsc --noEmit
npx next build --webpack
```

`test-dungeon-browser.cjs` uses mocked accounts/rooms in Chrome on port 3101. `test-dungeon-live.cjs` checks Supabase locking with a temporary TEST room and deletes it; it does not credit real accounts. These tests do not replace a playthrough with four real players.
