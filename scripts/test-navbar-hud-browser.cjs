require('./test-dice-timing.cjs');
const assert=require('node:assert/strict'),{chromium}=require('../desktop/dist/browser-test/node_modules/playwright');
const {EMPTY_PROGRESS}=require('../src/lib/progression.ts');
const {DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts');
const {createDungeon,makePlayer}=require('../src/lib/dungeon.ts');
const {createLms}=require('../src/lib/lms.ts');
const {createRoundLms}=require('../src/lib/lmsRound.ts');
const member=(id,weaponId='greatsword')=>({id,name:id,weaponId,classType:'warrior',character:DEFAULT_CUSTOMIZATION,isReady:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1366,height:900},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const progress={...EMPTY_PROGRESS,gems:999999,rubies:999999,exp:1000};let room,run,battle;
 await page.route('**/api/**',r=>{const path=new URL(r.request().url()).pathname;const json=path==='/api/progression'?progress:path==='/api/auth/session'?{userId:'a'}:path==='/api/dungeon'?{room}:path==='/api/pve'?{run}:path.startsWith('/api/rooms/')?{room:{battleState:battle}}:{players:[],gems:0,rubies:0,exp:0};return r.fulfill({json});});
 await page.goto('http://127.0.0.1:3101');await page.waitForFunction(()=>window.__gameStore);
 await page.evaluate(character=>window.__gameStore.setState({currentPage:'home',authModal:'none',currentUser:{id:'a',username:'Bell',avatarConfig:character}}),DEFAULT_CUSTOMIZATION);
 await page.waitForFunction(()=>document.querySelector('.wallet-bar')?.textContent.includes('999,999'));
 async function walletFits(){const spans=await page.locator('.wallet-bar').first().locator(':scope>span').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return{h:r.height,w:r.width,items:[...e.querySelectorAll('b,small:not(.sr-only),img')].map(x=>{const b=x.getBoundingClientRect();return{x:b.x-r.x,y:b.y-r.y,w:b.width,h:b.height}})}}));assert.equal(spans.length,3);assert.ok(spans.every(s=>Math.abs(s.h-spans[0].h)<1));for(const span of spans)for(const child of span.items)assert.ok(child.x>=0&&child.y>=0&&child.x+child.w<=span.w+1&&child.y+child.h<=span.h+1,'wallet label/icon/value stays inside its frame: '+JSON.stringify({span,child}));}
 for(const width of [1366,768,390,320]){await page.setViewportSize({width,height:900});await walletFits();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'artifacts/navbar-'+width+'-check.png'});}
 await page.getByRole('button',{name:'Tiếng Việt',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Tiếng Việt',exact:true}).getAttribute('aria-pressed'),'true');await page.getByRole('button',{name:'English',exact:true}).click();
 const bgm=page.locator('.hud-bgm');const before=await bgm.getAttribute('aria-pressed');await bgm.click();assert.notEqual(await bgm.getAttribute('aria-pressed'),before);await bgm.click();
 await page.locator('.hud-sfx').click();assert.equal(await page.locator('.hud-sfx').getAttribute('aria-pressed'),'false');
 async function settingsInPlace(){const mode=await page.evaluate(()=>window.__gameStore.getState().currentPage);await page.getByRole('button',{name:'Settings',exact:true}).click();await page.waitForSelector('.game-settings-dialog');assert.equal(await page.evaluate(()=>window.__gameStore.getState().currentPage),mode);await page.keyboard.press('Escape');await page.waitForSelector('.game-settings-dialog',{state:'detached'});assert.equal(await page.evaluate(()=>window.__gameStore.getState().currentPage),mode);}
 await settingsInPlace();
 const combat=createLms([member('a'),member('pve_bot')],true);combat.round=2;run={id:'hud-pve',revision:1,state:{stage:1,combat,reward:{gems:1,rubies:0,exp:1}}};
 await page.evaluate(()=>window.__gameStore.setState({currentPage:'pve'}));await page.waitForSelector('.combat-arena');await walletFits();await settingsInPlace();
 const lms=createRoundLms([member('a'),member('b'),member('c')]);lms.round=2;battle={id:'hud-lms',lms};await page.evaluate(b=>window.__gameStore.setState({currentPage:'battle',battleState:b,onlineRoomCode:'1234'}),battle);await page.waitForSelector('.combat-party');await settingsInPlace();
 const d=createDungeon(member('a'));d.enemies=[makePlayer(member('e'))];Object.assign(d,{phase:'attack',round:2,teamHp:100,teamMaxHp:100,comparison:{id:'hud-math',attack:30,defense:12,difference:18,damage:30,critical:true,target:'Enemy'}});room={code:'DHUD',revision:1,state:d};await page.evaluate(()=>{sessionStorage.setItem('dice-dungeon','DHUD');window.__gameStore.setState({currentPage:'dungeon'});});await page.waitForSelector('.dungeon-fighting');await settingsInPlace();
 assert.ok(await page.locator('.dungeon-outcome svg.math-sign').count()>0);
 const math=await page.locator('.dungeon-outcome svg.math-sign').first().boundingBox();assert.ok(math.width>=6&&Math.abs(math.width-math.height)<1);
 assert.deepEqual(errors,[]);console.log('PASS navbar: new artwork, 999,999 balances fit at 320/390/768/1366px, language/audio controls, Settings preserves Home/PvE/LMS/Dungeon, scalable Dungeon math symbols');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
