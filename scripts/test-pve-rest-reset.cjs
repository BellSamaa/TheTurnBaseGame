require('./test-dice-timing.cjs');
const assert=require('node:assert/strict'),Module=require('node:module');
const {createPve}=require('../src/lib/pve.ts');
const {DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts');
const hero={id:'hero',name:'Hero',classType:'warrior',weaponId:'greatsword',character:DEFAULT_CUSTOMIZATION,isReady:true};
const state=createPve(hero,3);state.combat.winner=hero.id;state.combat.phase='finished';
let rows=[{id:'old-run',user_id:hero.id,active:true,revision:2,state}],rpcCalls=0;
const db={from(table){assert.equal(table,'game_pve_runs');let filters=[],change,inserted;const query={
 select(){return query},eq(key,value){filters.push([key,value]);return query},order(){return query},limit(){return query},
 update(value){change=value;return query},insert(value){inserted=value;return query},
 async single(){if(inserted){const row={id:'new-run',active:true,revision:0,...inserted};rows.push(row);return{data:structuredClone(row)}}return{data:structuredClone(rows.find(r=>filters.every(([k,v])=>r[k]===v)))||null}},
 async maybeSingle(){return{data:structuredClone(rows.find(r=>filters.every(([k,v])=>r[k]===v)))||null}},
 then(resolve){const matches=rows.filter(r=>filters.every(([k,v])=>r[k]===v));if(change)matches.forEach(r=>Object.assign(r,change));return Promise.resolve({data:matches.map(r=>({id:r.id}))}).then(resolve)}
 };return query},rpc(){rpcCalls++;throw Error('Rest must not save/reward a completed floor again.')}};
const original=Module._load;Module._load=function(name,...args){if(name==='@/lib/serverAuth')return{sessionUser:async()=>hero.id,sameOrigin:()=>true};if(name==='@/lib/onlineRuntime')return{onlineDb:()=>db};if(name==='@/lib/serverDb')return{getUserByIdAsync:async()=>({username:hero.name,avatarConfig:hero.character,selectedClass:hero.classType,selectedWeapon:hero.weaponId})};return original.call(this,name,...args)};
const route=require('../src/app/api/pve/route.ts');Module._load=original;
const post=body=>route.POST(new Request('http://localhost/api/pve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
(async()=>{
 const response=await post({move:'rest',id:'old-run',revision:2});assert.equal(response.status,200);assert.equal((await response.json()).rested,true);assert.equal(rows[0].active,false);assert.equal(rows[0].revision,3);
 assert.equal((await(await route.GET()).json()).run,null);assert.equal((await(await post({move:'resume'})).json()).run,null);
 assert.equal((await post({move:'next',id:'old-run',revision:2})).status,409);
 assert.equal((await(await post({move:'rest',id:'old-run',revision:2})).json()).rested,true);
 const fresh=(await(await post({move:'start'})).json()).run;assert.equal(fresh.state.stage,1);assert.equal(fresh.active,true);assert.notEqual(fresh.id,'old-run');assert.equal(rpcCalls,0);
 assert.equal((await post({move:'rest',id:fresh.id,revision:0})).status,400);assert.equal(rows[1].active,true);
 console.log('PASS Claim & Rest: closes completed run, advances revision against stale saves, no duplicate rewards, resume returns null, restart creates floor 1, unfinished rest rejected');
})().catch(e=>{console.error(e);process.exitCode=1});
