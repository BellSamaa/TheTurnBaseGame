require('./test-dice-timing.cjs');
const assert=require('node:assert/strict');
const {chromium}=require('../desktop/dist/browser-test/node_modules/playwright');
const {createDungeon,makePlayer}=require('../src/lib/dungeon.ts');
const {createRoundLms}=require('../src/lib/lmsRound.ts');
const {DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts');
const member=(id,weaponId='greatsword')=>({id,name:id,weaponId,classType:'warrior',character:DEFAULT_CUSTOMIZATION,isReady:true});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let posts=0,room,battle;
  await page.route('**/api/**',r=>{const path=new URL(r.request().url()).pathname;if(r.request().method()==='POST')posts++;return r.fulfill({json:path==='/api/dungeon'?{room}:path.startsWith('/api/rooms/')?{room:{battleState:battle}}:{players:[],gems:0,rubies:0,exp:0}});});
  await page.goto('http://127.0.0.1:3101');await page.waitForFunction(()=>window.__gameStore);
  const d=createDungeon(member('a','infinity_ring'));for(let i=1;i<4;i++)d.players.push(makePlayer(member('p'+i)));
  Object.assign(d,{phase:'skills',round:2,teamHp:400,teamMaxHp:400,pts:100,target:'e0'});
  d.enemies=Array.from({length:3},(_,i)=>makePlayer(member('e'+i)));room={code:'DMOBILE',revision:1,state:d};
  await page.evaluate(()=>{sessionStorage.setItem('dice-dungeon','DMOBILE');window.__gameStore.setState({currentPage:'dungeon',currentUser:{id:'a',username:'a'}});});
  await page.waitForSelector('.dungeon-fighting');
  // Actual touch input: hold opens details, releases without casting, same form closes.
  const cdp=await context.newCDPSession(page);
  async function hold(slot){const rect=await page.locator('.combat-skill-cast').nth(slot).boundingBox();const x=rect.x+rect.width/2,y=rect.y+rect.height/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await page.waitForTimeout(2150);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForSelector('.skill-touch-forms');}
  const before=posts;await hold(0);assert.equal(posts,before,'holding never casts a skill');
  await page.locator('.skill-touch-forms button[aria-pressed=true]').first().tap();assert.equal(await page.locator('.skill-hover-panel').count(),0);
  await hold(0);await page.locator('.skill-touch-forms button').nth(1).tap();assert.equal(await page.locator('.skill-hover-panel').count(),0);
  await hold(1);await page.locator('.skill-touch-forms button').nth(1).tap();assert.equal(await page.locator('.skill-hover-panel').count(),0);
  // A short tap still casts normally.
  const oldPosts=posts;await page.locator('.combat-skill-cast').first().tap();await page.waitForTimeout(100);assert.ok(posts>oldPosts);
  d.pts=0;room={...room,revision:room.revision+1,state:d};
  await page.waitForFunction(()=>document.querySelectorAll('.combat-skill-cast')[0]?.disabled);
  const disabledPosts=posts;await hold(0);assert.equal(posts,disabledPosts,'disabled skills still expose details without casting');
  await page.locator('.skill-touch-forms button[aria-pressed=true]').first().tap();
  async function checkBodies(selector,stageSelector,expected){const stage=await page.locator(stageSelector).boundingBox(),boxes=await page.locator(selector).evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));assert.equal(boxes.length,expected);for(const b of boxes){assert.ok(b.x>=stage.x-1&&b.x+b.w<=stage.x+stage.width+1,'body stays inside stage horizontally');assert.ok(b.y>=stage.y+stage.height*.3&&b.y+b.h<=stage.y+stage.height+2,'body stays on the floor');}for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.ok(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)<1||Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)<1,'bodies do not overlap');}}
  for(const width of [320,390,600]){await page.setViewportSize({width,height:844});await checkBodies('.dungeon-hero canvas,.dungeon-enemy>img','.dungeon-stage',7);}await page.screenshot({path:'artifacts/mobile-dungeon-formations-check.png'});
  for(const count of [3,4]){
   const s=createRoundLms(Array.from({length:count},(_,i)=>member(i?'p'+i:'a')));Object.assign(s,{round:2,phase:'initiative',openingReady:s.order.slice(),rollDeadline:Date.now()+60000});battle={id:'mobile-lms-'+count,lms:s};
   await page.evaluate(battle=>window.__gameStore.setState({currentPage:'battle',battleState:battle,onlineRoomCode:'1234'}),battle);
   await page.waitForSelector('.combat-party');
   for(const width of [320,390,600]){await page.setViewportSize({width,height:844});await checkBodies('.combat-party .combat-avatar canvas','.combat-stage',count);}await page.screenshot({path:'artifacts/mobile-lms-formations-check.png'});
  }
  assert.deepEqual(errors,[]);console.log('PASS mobile: real 2s touch hold without casting, same/different form closes, short tap casts; Dungeon 4+3 and LMS 3–4 bodies fit without overlap at 320/390/600px');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
