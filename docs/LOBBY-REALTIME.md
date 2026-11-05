# Lobby movement transport

- Coordinates: Supabase Realtime Broadcast `pose` on `game-lobby:v2`, maximum 10 updates/second while moving. Idle snapshots once/second help late joiners.
- Roster and character metadata: Realtime Presence, one key per browser session; visual roster deduplicates accounts.
- Rendering: frame-rate-independent exponential Lerp in requestAnimationFrame. Never assign incoming walking coordinates directly to a rendered character.
- Ordering: packets carry a per-session increasing sequence; out-of-order packets are ignored. Invalid coordinates are rejected.
- Reconnection: SDK reconnects; subscription re-tracks Presence and sends a new pose. There is no HTTP movement fallback.
- HTTP/database: one join/leave request, explicit seat interaction requests, and chat persistence/history requests only. `/api/lobby` rejects bare coordinate writes.
- Chat: a successful message write sends a Broadcast notification; peers fetch history on notification/reconnect, without interval polling.

## Configuration

Vercel requires `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`) and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `SUPABASE_ANON_KEY`). Only the anon/public key is returned to the browser. Never expose the service-role key.
The project must permit public Realtime channels. This channel carries lobby display/presence data; battle outcomes and account changes continue using authenticated server APIs.
No new database migration is required.

## Verification

Start Next dev on port 3100, then run `node scripts/test-lobby-broadcast-browser.cjs` with Playwright and Chrome installed. It opens two real browser clients against an in-process mock of the Supabase WebSocket protocol (including binary outgoing Broadcast packets), samples remote DOM positions and checks zero HTTP coordinate writes, chat notification delivery and Presence leave.
`node scripts/test-lobby-interpolation.cjs` checks intermediate positions, convergence across 30/60/144fps and invalid packet rejection.

In production DevTools > Network > WS, movement appears on the Supabase WebSocket. There must be no recurring POST/PATCH of coordinates to `/api/lobby` or PostgREST while walking. Explicit chat and seat requests are expected.

These tests do not certify production latency or 100-player capacity. Dedicated authoritative in-memory servers and load tests are a separate scaling milestone.

Reference: https://supabase.com/docs/guides/realtime/broadcast
