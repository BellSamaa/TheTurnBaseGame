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
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_URL;
delete process.env.VERCEL;
const db = require('../src/lib/serverDb.ts');
const api = require('../src/app/api/rooms/[code]/route.ts');
process.chdir(fs.mkdtempSync(path.join(require('os').tmpdir(), 'room-lifecycle-')));
(async () => {
  const host = { id: 'host', name: 'Host', classType: 'warrior', weaponId: 'revolver', isReady: true };
  const guest = { ...host, id: 'guest', name: 'Guest' };
  const room = await db.createRoom(host);
  const context = { params: Promise.resolve({ code: room.code }) };
  const post = (action, extra = {}) => api.POST(new Request('http://localhost', {
    method: 'POST', body: JSON.stringify({ action, ...extra }),
  }), context);
  await post('join', { guest });
  await post('ready', { userId: 'guest', isReady: true });
  const start = await (await post('start_battle', { userId: 'host' })).json();
  assert.equal(start.room.status, 'playing');
  assert.equal((await post('return_lobby', { userId: 'host' })).status, 409);
  const finished = { ...start.room.battleState, phase: 'game_over', winnerId: 'host' };
  assert.equal((await post('battle_update', { userId: 'host', expectedRevision: 0, battleState: finished })).status, 200);
  await post('return_lobby', { userId: 'host' });
  let lobby = await db.getRoomByCodeAsync(room.code);
  assert.equal(lobby.status, 'ready');
  assert.equal(lobby.guest.id, 'guest');
  assert.equal(lobby.host.isReady, false);
  assert.equal(lobby.guest.isReady, false);
  assert.equal(lobby.battleState.winnerId, 'host', 'Keep result for opponent still polling');
  await post('ready', { userId: 'host', isReady: true });
  await post('return_lobby', { userId: 'guest' });
  assert.equal((await db.getRoomByCodeAsync(room.code)).host.isReady, true, 'Second return must not reset ready');
  await post('ready', { userId: 'guest', isReady: true });
  const replay = await (await post('start_battle', { userId: 'host' })).json();
  assert.notEqual(replay.room.battleState.id, start.room.battleState.id);
  assert.equal(replay.room.battleState.winnerId, null);
  assert.equal(replay.room.code, room.code);
  await post('leave', { userId: 'host' });
  assert.equal(await db.getRoomByCodeAsync(room.code), null);
  const stale = await db.createRoom(host);
  const file = path.join(process.cwd(), 'data/db.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.rooms[stale.code].lastActive = Date.now() - 6 * 60 * 1000;
  fs.writeFileSync(file, JSON.stringify(data));
  assert.equal((await db.listOpenRooms()).length, 0);
  assert.equal(await db.getRoomByCodeAsync(stale.code), null);
  console.log('PASS: rematch, both participants retained, ready reset, late result delivery, host exit, stale room expiry');
})().catch(e => { console.error(e); process.exitCode = 1; });
