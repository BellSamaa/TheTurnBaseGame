require('./test-dice-timing.cjs');
const {chromium}=require('../desktop/dist/browser-test/node_modules/playwright');
const assert=require('assert/strict');const {createDungeon,makePlayer}=require('../src/lib/dungeon.ts');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1366,height:900}});let room;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',r=>r.fulfill({json:r.request().url().includes('/api/dungeon')?{room}:{players:[]}}));
 await page.goto('http://127.0.0.1:3101');await page.waitForFunction(()=>window.__gameStore);
 const char=await page.evaluate(()=>window.__gameStore.getState().profile.character);
 const p={id:'p0',name:'Bell',weaponId:'death_note',classType:'warrior',character:char,isReady:true};let s=createDungeon(p);s.round=3;s.phase='skills';s.teamHp=100;s.teamMaxHp=100;s.pts=100;s.players[0].weaponUpdate={deathEyeUntil:6};s.enemies=[makePlayer({...p,id:'boss',name:'Boss',weaponId:'greatsword'})];s.enemies[0].weaponUpdate={judgement:{owner:'p0',hits:1,attacksLeft:3}};s.target='boss';s.deadline=Date.now()+20000;room={code:'DTEST',revision:1,state:s};
 await page.evaluate(()=>{sessionStorage.setItem('dice-dungeon','DTEST');window.__gameStore.setState({currentPage:'dungeon',currentUser:{id:'p0',username:'Bell'}})});
 await page.waitForSelector('.death-eye');await page.waitForSelector('.death-judgement-frame');
 assert.equal(await page.locator('.death-judgement-frame').count(),1);
 assert.ok((await page.locator('.combat-skill-cost').last().innerText()).includes('5 PTS'));
 for(const selector of ['.death-eye','.death-judgement-frame img','.death-hidden-ready .weapon-skill-art'])await page.locator(selector).evaluate(x=>x.decode());
 await page.screenshot({path:'artifacts/death-note-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/death-note-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log('PASS browser: Eye on caster, opponent-only Judgement frame/mark, 5 PTS enhanced icon; assets load; desktop/mobile no horizontal overflow or runtime errors');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
