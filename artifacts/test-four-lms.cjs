require('../scripts/test-charged-skills.cjs');
const {createLms,lmsAction}=require('../src/lib/lms.ts');
const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const contexts=[];let state,initial;
for(let i=0;i<4;i++){
 const ctx=await browser.newContext({viewport:{width:i===3?390:1200,height:900}});contexts.push(ctx);const p=await ctx.newPage();
 await p.route('**/api/rooms/4444',async route=>{let status=200,error;const req=route.request();if(req.method()==='POST'){const body=req.postDataJSON();try{if(body.expectedRevision!==state.revision){status=409;throw Error('revision conflict');}state=lmsAction(state,'p'+i,body.move,body.args,Date.now());}catch(e){error=e.message;if(status===200)status=400;}}
 const view=structuredClone(state);if(view?.extras)for(const [id,b]of Object.entries(view.extras.buffs))if(id!=='p'+i&&!b.revealed)b.id=-1;
 await route.fulfill({status,json:{error,room:{battleState:{...initial,lms:view}}}});});
 await p.goto('http://localhost:3100',{waitUntil:'domcontentloaded',timeout:180000});await p.waitForFunction(()=>!!window.__gameStore);
 if(i===0){initial=await p.evaluate(()=>window.__gameStore.getState().startNewBattle({mode:'local',mapId:'castle'}));state=createLms([0,1,2,3].map(n=>({id:'p'+n,name:'Player '+n,character:initial.player1.character,classType:n===0?'mage':'warrior',weaponId:'greatsword',isReady:true})));state.order=['p0','p1','p2','p3'];state.extras.buffs.p0.id=15;}
 await p.evaluate(({initial,state,i})=>{window.__gameStore.setState({currentUser:{id:'p'+i,username:'Player '+i},onlineRoomCode:'4444',currentPage:'battle',battleState:{...initial,lms:state}});},{initial,state,i});
}
const pages=contexts.map(c=>c.pages()[0]);await pages[0].getByRole('button',{name:/TUNG D6/}).click();await pages[0].getByRole('button',{name:/TUNG D6/}).click();assert.equal(state.rolls.length,2);assert.equal(state.players[0].d12Charge,state.rolls[0]+state.rolls[1]);
await pages[0].getByRole('button',{name:'CHỌN MỤC TIÊU'}).click();await pages[0].getByRole('button',{name:'TUNG D20 CÔNG'}).click();await pages[1].getByRole('button',{name:'TUNG D20 THỦ'}).click();assert.equal(state.phase,'clash');await pages[0].getByRole('button',{name:'TÍNH SÁT THƯƠNG'}).click({timeout:15000});await pages[0].getByRole('button',{name:'KẾT THÚC LƯỢT'}).click();assert.equal(state.order[state.active],'p1');
for(const p of pages)await p.waitForFunction(revision=>window.__gameStore.getState().battleState.lms.revision>=revision,state.revision);
for(let i=0;i<4;i++){const v=await pages[i].evaluate(()=>window.__gameStore.getState().battleState.lms);assert.deepEqual(v.players,JSON.parse(JSON.stringify(state.players)));assert.equal(await pages[i].locator('.lms-seat').count(),4);}
await pages[3].screenshot({path:'artifacts/lms-four-browser-mobile.png',fullPage:true});assert.equal(await pages[3].evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);console.log('PASS: four isolated browsers, actual UI actions, mage exact D6, attack/defend/clash/end, same state on all clients; simulated HTTP backend');await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
