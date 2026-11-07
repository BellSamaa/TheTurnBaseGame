require('./test-dice-timing.cjs');
const assert = require('node:assert/strict');
const {chromium} = require('../desktop/dist/browser-test/node_modules/playwright');
const {createLms} = require('../src/lib/lms.ts');
const {createDungeon, makePlayer} = require('../src/lib/dungeon.ts');
const {DEFAULT_CUSTOMIZATION} = require('../src/lib/constants.ts');

const member = (id, weaponId) => ({id, name:id, weaponId, classType:'warrior', character:DEFAULT_CUSTOMIZATION, isReady:true});

(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true, args:['--autoplay-policy=no-user-gesture-required']});
  try {
    const page = await browser.newPage({viewport:{width:1366, height:900}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.introClips = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        if (this.src.includes('/secret-intros/')) window.introClips.push(this);
        if (this.src.endsWith('gomen-amanai-jjk.mp3')) return play.call(this);
        return Promise.resolve();
      };
      const pause = HTMLMediaElement.prototype.pause;
      HTMLMediaElement.prototype.pause = function () {
        this.dataset.paused = 'true';
        pause.call(this);
      };
    });
    let run, room;
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname;
      const data = path === '/api/pve' ? {run} : path === '/api/dungeon' ? {room} : path === '/api/auth/session' ? {userId:'a'} : {players:[], gems:0, rubies:0, exp:0};
      return route.fulfill({json:data});
    });
    await page.goto('http://127.0.0.1:3101');
    await page.waitForFunction(() => window.__gameStore);

    async function open(mode) {
      await page.evaluate(() => window.__gameStore.setState({currentPage:'home'}));
      await page.evaluate(mode => {
        sessionStorage.setItem('dice-dungeon', 'DINTRO');
        window.__gameStore.setState({currentPage:mode, currentUser:{id:'a', username:'a'}});
      }, mode);
    }

    async function expectIntro(weapon, side, filename, playCount) {
      const overlay = page.locator(`.secret-stand-intro[data-weapon="${weapon}"][data-side="${side}"]`);
      await overlay.waitFor();
      assert.equal(await page.locator('.secret-stand-intro').count(), 1);
      assert.equal(await page.locator(`[data-stand="${weapon}"][data-intro-hidden]`).count(), 1);
      const bounds = await overlay.boundingBox();
      const width = await page.evaluate(() => innerWidth);
      assert.ok(side === 'left' ? bounds.x + bounds.width < width / 2 : bounds.x > width / 2);
      assert.equal(await page.evaluate(() => window.introClips.length), playCount);
      assert.ok((await page.evaluate(() => window.introClips.at(-1).src)).endsWith(filename));
      if (weapon === 'infinity_ring') {
        await page.waitForFunction(() => window.introClips.at(-1).currentTime > 0);
      } else {
        await page.evaluate(() => window.introClips.at(-1).dispatchEvent(new Event('ended')));
      }
      await overlay.waitFor({state:'detached'});
      assert.equal(await page.locator(`[data-stand="${weapon}"][data-intro-hidden]`).count(), 0);
    }

    const pve = (id, left, right) => ({id, revision:1, state:{stage:1, combat:createLms([member('a',left),member('pve_bot',right)],true), reward:{gems:1,rubies:0,exp:1}}});
    run = pve('left-first', 'infinity_ring', 'death_note');
    await open('pve');
    await expectIntro('infinity_ring', 'left', 'gomen-amanai-jjk.mp3', 1);
    await expectIntro('death_note', 'right', 'death-note-light-yagami-is-sus.mp3', 2);
    await open('pve');
    await page.waitForSelector('.combat-arena');
    assert.equal(await page.locator('.secret-stand-intro').count(), 0);

    run.state.stage=2;
    await open('pve');
    await page.waitForSelector('.combat-arena');
    assert.equal(await page.locator('.secret-stand-intro').count(),0);
    run = pve('resumed-stage-two','infinity_ring','death_note');run.state.stage=2;
    await open('pve');await page.waitForSelector('.combat-arena');
    assert.equal(await page.locator('.secret-stand-intro').count(),0);

    run = pve('musashi-last', 'musashi', 'king_slasher');
    await open('pve');
    await expectIntro('king_slasher', 'right', 'sukuna-domain-theme.mp3', 3);
    await expectIntro('musashi', 'left', 'musashi-vs-hokusai-fight-intro.mp3', 4);

    const dungeon = createDungeon(member('a','fire_headband'));
    dungeon.players.push(makePlayer(member('b','musashi')));
    dungeon.enemies = [makePlayer(member('enemy','death_note'))];
    Object.assign(dungeon, {phase:'attack', floor:1, encounter:1, round:1, encounterStartRound:1, teamHp:200, teamMaxHp:200, target:'enemy'});
    room = {code:'DINTRO', revision:1, state:dungeon};
    await page.setViewportSize({width:390, height:844});
    await open('dungeon');
    await expectIntro('fire_headband', 'left', 'madara-ika.mp3', 5);
    await page.waitForSelector('.secret-stand-intro[data-weapon="musashi"]');
    await page.evaluate(() => window.__gameStore.getState().updateSettings({sfxMuted:true}));
    assert.equal(await page.evaluate(() => window.introClips.at(-1).muted), true);
    await page.evaluate(() => window.__gameStore.setState({currentPage:'home'}));
    await page.waitForSelector('.secret-stand-intro', {state:'detached'});
    assert.equal(await page.evaluate(() => window.introClips.at(-1).dataset.paused), 'true');
    for(const changes of [{round:2},{round:1,encounter:2},{floor:2,encounter:1,round:1}]){
      Object.assign(dungeon,changes);room={...room,revision:room.revision+1,state:dungeon};
      // Even without a prior session marker, later rounds/encounters/floors cannot replay.
      await page.evaluate(()=>sessionStorage.removeItem('dice-secret-intro:dungeon:DINTRO'));
      await open('dungeon');await page.waitForSelector('.dungeon-fighting');
      assert.equal(await page.locator('.secret-stand-intro').count(),0);
    }
    assert.equal(await page.evaluate(()=>window.introClips.length),6);
    assert.deepEqual(errors, []);
    console.log('PASS Secret Stand intros: five clips, left/right and Musashi-last ordering, one-time playback, desktop/mobile, audio mute and exit cleanup');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error.stack); process.exitCode = 1;});
