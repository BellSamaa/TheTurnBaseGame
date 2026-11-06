require('./test-dice-timing.cjs');
const {chromium}=require('../desktop/dist/browser-test/node_modules/playwright');
const assert=require('node:assert/strict');
const {createDungeon,makePlayer,dungeonAction}=require('../src/lib/dungeon.ts');
const {WEAPON_DEFINITIONS:W}=require('../src/lib/constants.ts');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];let room;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',async route=>{if(route.request().url().includes('/api/dungeon')){if(route.request().method()==='POST'){const body=route.request().postDataJSON();room={...room,revision:room.revision+1,state:dungeonAction(room.state,'a',body.action,body.args)};}return route.fulfill({json:{room}});}return route.fulfill({json:{players:[],gems:0,rubies:0,exp:0}})});
 await page.goto('http://127.0.0.1:3101');await page.waitForFunction(()=>window.__gameStore);
 const character=await page.evaluate(()=>window.__gameStore.getState().profile.character),member=id=>({id,name:id,weaponId:'greatsword',classType:'warrior',character,isReady:true});
 const s=createDungeon(member('a'));s.players.push(makePlayer(member('b')));s.phase='loading';s.startedAt=Date.now();s.teamHp=s.teamMaxHp=200;s.round=5;room={code:'DTEST',revision:1,state:s};
 await page.evaluate(()=>{sessionStorage.setItem('dice-dungeon','DTEST');window.__gameStore.setState({currentPage:'dungeon',currentUser:{id:'a',username:'a'}})});
 await page.waitForSelector('.dungeon-entry-loading');const bar=page.getByRole('progressbar');const first=+(await bar.getAttribute('aria-valuenow'));await page.waitForTimeout(300);assert.ok(+(await bar.getAttribute('aria-valuenow'))>first);await page.locator('.dungeon-entry-loading>img').evaluate(img=>img.decode());
 await page.screenshot({path:'artifacts/dungeon-loading-new.png'});
 for(const width of [390,320]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);const bounds=await page.locator('.dungeon-loading-content').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width);}
 room={...room,revision:2,state:{...s,phase:'attack',pts:6,enemies:[makePlayer(member('enemy'))],rolls:{a:[12],b:[12]},enemyRolls:[12,12],clash:{score:24,role:'attack',wagers:{},enemyStake:0,target:'enemy',deadline:Date.now()+5000}}};
 await page.waitForSelector('.dungeon-clash-panel');await page.getByRole('button',{name:'1 PTS',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.dungeon-clash-panel')?.textContent.includes('Your wager is locked'));assert.equal(room.state.pts,5);assert.equal(room.state.clash.wagers.a,1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.setViewportSize({width:1366,height:900});await page.screenshot({path:'artifacts/dungeon-clashing-new.png'});
 const hidden={...s,phase:'skills',pts:50,enemies:[makePlayer(member('enemy'))],target:'enemy'};hidden.players[0].weapon=W.death_note;hidden.players[0].weaponUpdate={deathHiddenReady:true,deathFailureRounds:[1,3]};room={...room,revision:4,state:hidden};
 await page.waitForSelector('.dungeon-clash-panel',{state:'detached'});await page.waitForFunction(()=>document.querySelector('.combat-skill-cost:last-of-type')||document.querySelector('.death-hidden-ready'));
 await page.locator('.combat-skill-cast').last().click();await page.waitForSelector('.death-eye');await page.waitForSelector('.death-judgement-frame');assert.equal(room.state.pts,30);assert.equal(room.state.enemies[0].weaponUpdate.judgement.hits,0);assert.equal(room.state.enemies[0].hp,room.state.enemies[0].maxHp);assert.equal(room.state.players[0].weaponUpdate.deathHiddenReady,false);
 assert.deepEqual(errors,[]);console.log('PASS browser: Dungeon loading progress/background, desktop + 320/390px fit, each-member shared wager locks once; one hidden Death Note click creates Eye + opponent HP trial for exactly 20 PTS');
}finally{await browser.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
