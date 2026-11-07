require('./test-dice-timing.cjs');
const assert=require('node:assert/strict'),{chromium}=require('../desktop/dist/browser-test/node_modules/playwright');
const {createLms}=require('../src/lib/lms.ts'),{createRoundLms}=require('../src/lib/lmsRound.ts');
const {createDungeon,makePlayer}=require('../src/lib/dungeon.ts');
const {DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts'),{EMPTY_PROGRESS}=require('../src/lib/progression.ts');
const member=(id,weaponId='musashi')=>({id,name:id,weaponId,classType:'warrior',character:DEFAULT_CUSTOMIZATION,isReady:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];let run,room,battle;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',r=>{const path=new URL(r.request().url()).pathname;return r.fulfill({json:path==='/api/pve'?{run}:path==='/api/dungeon'?{room}:path.startsWith('/api/rooms/')?{room:{battleState:battle}}:path==='/api/progression'?EMPTY_PROGRESS:path==='/api/auth/session'?{userId:'a'}:{players:[],messages:[],gems:0,rubies:0,exp:0}});});
 await page.goto('http://127.0.0.1:3101');await page.waitForFunction(()=>window.__gameStore);
 await page.evaluate(character=>window.__gameStore.setState({currentPage:'home',authModal:'none',currentUser:{id:'a',username:'A',avatarConfig:character}}),DEFAULT_CUSTOMIZATION);
 const duel=createLms([member('a'),member('pve_bot','greatsword')],true);duel.round=2;duel.phase='skills';duel.players[0].d12Charge=100;
 run={id:'viewport-pve',revision:1,state:{stage:1,combat:duel,reward:{gems:0,rubies:0,exp:0}}};
 const lms=createRoundLms([member('a'),member('b'),member('c'),member('d')]);lms.round=2;battle={id:'viewport-lms',lms};
 const dungeon=createDungeon(member('a'));dungeon.phase='skills';dungeon.round=2;dungeon.pts=100;dungeon.teamHp=dungeon.teamMaxHp=100;dungeon.enemies=[makePlayer(member('enemy','greatsword'))];room={code:'DVIEW',revision:1,state:dungeon};
 for(const mode of ['pve','battle','dungeon']){
  await page.evaluate(({mode,battle})=>{sessionStorage.setItem('dice-dungeon','DVIEW');window.__gameStore.setState({currentPage:mode,battleState:battle,onlineRoomCode:'1234'});},{mode,battle});
  await page.waitForSelector('.skill-touch-info');
  for(const [width,height]of [[320,640],[390,844],[844,390]]){
   await page.setViewportSize({width,height});await page.locator('.skill-touch-info').first().tap();await page.waitForSelector('.skill-touch-dialog');
   const rect=await page.locator('.skill-touch-dialog').boundingBox();assert.ok(rect.x>=8&&rect.y>=8&&rect.x+rect.width<=width-8&&rect.y+rect.height<=height-8,'touch dialog fits viewport: '+JSON.stringify(rect));
   assert.equal(await page.locator('body>.skill-touch-overlay').count(),1,'portal escapes narrow/transformed command cells');assert.equal(await page.locator('.skill-touch-forms button').count(),3);
   await page.locator('.skill-touch-forms button').last().tap();await page.waitForSelector('.skill-touch-dialog',{state:'detached'});
   await page.locator('.skill-touch-info').first().tap();await page.locator('.skill-touch-forms button[aria-pressed=true]').tap();await page.waitForSelector('.skill-touch-dialog',{state:'detached'});
  }
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.__gameStore.getState().updateSettings({language:'vi'}));await page.locator('.skill-touch-info').first().tap();await page.screenshot({path:'artifacts/skill-form-dialog-mobile-check.png'});
 await page.getByRole('button',{name:'Đóng chi tiết kỹ năng'}).tap();await page.waitForSelector('.skill-touch-dialog',{state:'detached'});
 await page.locator('.skill-touch-info').first().tap();await page.touchscreen.tap(4,4);await page.waitForSelector('.skill-touch-dialog',{state:'detached'});
 assert.deepEqual(errors,[]);console.log('PASS touch skill popup: centered body portal, no viewport clipping at 320/390px or landscape across PvE/LMS/Dungeon; all Musashi forms selectable, same selection closes, VI and close button work');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
