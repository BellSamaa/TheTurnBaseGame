require('./test-dice-timing.cjs');
const assert=require('node:assert/strict'),{chromium}=require('../desktop/dist/browser-test/node_modules/playwright');
const {createDungeon,makePlayer}=require('../src/lib/dungeon.ts');
const {createPve}=require('../src/lib/pve.ts');
const {EMPTY_PROGRESS}=require('../src/lib/progression.ts');
const {DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts');
const member=id=>({id,name:id,classType:'warrior',weaponId:'greatsword',character:DEFAULT_CUSTOMIZATION,isReady:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1366,height:900},hasTouch:true});let room,run,restCalls=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',r=>{const path=new URL(r.request().url()).pathname;let json={players:[],messages:[],gems:0,rubies:0,exp:0};
  if(path==='/api/progression')json=EMPTY_PROGRESS;
  if(path==='/api/auth/session')json={userId:'a'};
  if(path==='/api/dungeon')json={room};
  if(path==='/api/pve'){if(r.request().method()==='POST'){const b=r.request().postDataJSON();if(b.move==='rest'){restCalls++;run=null;json={run:null,rested:true};}else if(b.move==='start'){run={id:'fresh',revision:0,state:createPve(member('a'))};json={run};}else json={run};}else json={run};}
  return r.fulfill({json});
 });
 await page.goto('http://127.0.0.1:3101');await page.waitForFunction(()=>window.__gameStore);
 await page.evaluate(character=>window.__gameStore.setState({currentPage:'play',authModal:'none',currentUser:{id:'a',username:'A',avatarConfig:character}}),DEFAULT_CUSTOMIZATION);
 await page.waitForSelector('.lobby-walker canvas');
 const sizes=[[1366,900],[800,700],[768,700],[600,844],[390,844],[320,640],[844,390]];
 for(const [width,height]of sizes){await page.setViewportSize({width,height});await page.waitForTimeout(120);const dims=await page.evaluate(()=>{const root=document.querySelector('.world-lobby').getBoundingClientRect(),canvas=document.querySelector('.lobby-walker canvas').getBoundingClientRect(),motion=document.querySelector('.lobby-walker .character-motion').getBoundingClientRect(),shadow=document.querySelector('.lobby-walker .character-motion>div.absolute').getBoundingClientRect();return{map:Math.min(root.width,root.height*1.777),body:canvas.height,width:canvas.width,outer:motion.height,shadow:shadow.width}});assert.ok(Math.abs(dims.body/dims.map-.06)<.0001);assert.ok(Math.abs(dims.body-dims.outer)<1);assert.ok(dims.shadow<=dims.width);}
 const original=await page.locator('.lobby-walker canvas').boundingBox();await page.keyboard.down('d');await page.waitForTimeout(200);assert.equal((await page.locator('.lobby-walker canvas').boundingBox()).height,original.height);await page.keyboard.up('d');
 const d=createDungeon(member('a'));for(let i=1;i<4;i++)d.players.push(makePlayer(member('p'+i)));d.phase='entrance';room={code:'DSCALE',revision:1,state:d};
 await page.evaluate(()=>{sessionStorage.setItem('dice-dungeon','DSCALE');window.__gameStore.setState({currentPage:'dungeon'});});await page.waitForSelector('.dungeon-exploring');
 for(const floor of [1,3,5,7,9]){d.floor=floor;d.phase=floor===1?'entrance':'rest';room={...room,revision:room.revision+1,state:d};await page.waitForTimeout(850);
  for(const [width,height]of sizes){await page.setViewportSize({width,height});const dims=await page.evaluate(()=>{const map=document.querySelector('.dungeon-stage').getBoundingClientRect();return[...document.querySelectorAll('.dungeon-hero')].map(hero=>{const c=hero.querySelector('canvas').getBoundingClientRect(),shadow=hero.querySelector('.character-motion>div.absolute').getBoundingClientRect();return{map:map.width,height:c.height,width:c.width,shadow:shadow.width}})});assert.equal(dims.length,4);for(const c of dims){assert.ok(Math.abs(c.height/c.map-.05742)<.0001);assert.ok(c.shadow<=c.width);}}
 }
 await page.screenshot({path:'artifacts/exploration-landscape-scale-check.png'});
 const victory=createPve(member('a'),4);victory.combat.winner='a';victory.combat.phase='finished';run={id:'won-run',revision:4,state:victory};
 await page.evaluate(()=>window.__gameStore.setState({currentPage:'pve'}));await page.getByRole('button',{name:'Claim & rest',exact:true}).click();await page.waitForSelector('.world-lobby');assert.equal(restCalls,1);
 await page.evaluate(()=>window.__gameStore.setState({currentPage:'pve'}));await page.waitForSelector('.pve-entry');assert.equal(await page.locator('.pve-victory-overlay').count(),0);await page.locator('.pve-entry .primary-action').click();await page.waitForSelector('.combat-arena');assert.equal(run.state.stage,1);
 assert.deepEqual(errors,[]);console.log('PASS walking scale: Lobby + Entrance + all 4 Rest Rooms, 4 players, 320–1366px and landscape; shadows fit, moving does not resize; Claim & Rest closes then new PvE starts on floor 1');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
