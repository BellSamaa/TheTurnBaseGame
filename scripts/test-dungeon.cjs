const fs=require('fs'),path=require('path'),ts=require('typescript'),Module=require('module'),assert=require('assert/strict');const resolve=Module._resolveFilename;Module._resolveFilename=function(r,p,...a){return resolve.call(this,r.startsWith('@/')?path.resolve('src',r.slice(2)):r,p,...a)};require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {createDungeon,dungeonAction:A,tickDungeon:T,makePlayer,dungeonArea,dungeonInteractionPoints}=require('../src/lib/dungeon.ts'),{DUNGEON_FLOORS:F}=require('../src/lib/dungeonCatalog.ts');const {DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts');
const participant=(id,c='warrior')=>({id,name:id,classType:c,weaponId:'greatsword',character:DEFAULT_CUSTOMIZATION,isReady:true});
function settleBot(state){
 assert.equal(state.botDice.stage,'rolling');
 assert.equal(T(state,state.botDice.readyAt-1),state);
 const result=T(state,state.botDice.readyAt);
 assert.equal(result.phase,state.phase);
 assert.equal(result.botDice.stage,'result');
 assert.ok(result.botDice.values.length);
 assert.equal(T(result,result.botDice.until-1),result);
 assert.throws(()=>A(result,result.host,'roll'),/enemy dice result/);
 const settled=T(result,result.botDice.until);
 assert.equal(settled.botDice,undefined);
 if(settled.clash){let next=settled;for(const p of settled.players)next=A(next,p.id,'clash_wager',{stake:0},settled.clash.deadline-1);return next;}
 return settled;
}
const random=Math.random;Math.random=()=>.6;
try{
for(const count of [1,2,3,4]){let s=createDungeon(participant('a'));for(let i=1;i<count;i++)s.players.push(makePlayer(participant('p'+i)));s=A(s,'a','start');assert.equal(s.teamHp,s.players.reduce((n,p)=>n+p.maxHp,0));for(const p of s.players){s.positions[p.id]={x:.5,y:.6};s=A(s,p.id,'ready',{},0)}s=T(s,3001);assert.equal(s.phase,'attack');assert.equal(s.enemies[0].maxHp,Math.round(50*[0,.4,.6,.8,1][count]));assert.equal(s.rolls.a,undefined);
for(const p of s.players)s=A(s,p.id,'roll');s=settleBot(s);assert.equal(s.phase,'defense');for(const p of s.players)s=A(s,p.id,'roll');s=settleBot(s);assert.equal(s.phase,'charge');for(const p of s.players)s=A(s,p.id,'roll');s=settleBot(s);assert.equal(s.phase,'skills');s.pts=100;const old=s.pts;s=A(s,'a','skill',{slot:1});assert.ok(s.pts<old);assert.throws(()=>A(s,'a','skill',{slot:1}));for(const p of s.players)s=A(s,p.id,'end',{},100);assert.equal(s.phase,'enemy_skills');s=T(s,3000);assert.equal(s.phase,'end');for(const p of s.players)s=A(s,p.id,'end');assert.equal(s.phase,'attack');
// All fifty encounters progress, HP scale and floor reward checkpoint maintained.
for(let floor=1;floor<=10;floor++)for(let encounter=1;encounter<=5;encounter++){s.floor=floor;s.encounter=encounter;s.phase='defense';s.rolls={};s.teamHp=s.teamMaxHp;for(const e of s.enemies)e.hp=0;for(const p of s.players)s=A(s,p.id,'roll');s=settleBot(s);assert.equal(s.phase,floor===10&&encounter===5?'victory':'cleared');if(encounter===5)assert.equal(s.rewardFloor,floor);if(s.phase==='victory')continue;for(const p of s.players)s=A(s,p.id,'next');if(s.phase==='rest'){assert.equal(s.teamHp,s.teamMaxHp);for(const p of s.players){s.positions[p.id]=dungeonInteractionPoints(dungeonArea(s)).portal;s=A(s,p.id,'ready',{},0)}s=T(s,3001)}assert.ok(s.enemies.every(p=>p.hp>0));}}
let s=createDungeon(participant('b','boxer'));s=A(s,'b','start');s.positions.b={x:.5,y:.6};s=A(s,'b','ready',{},0);s=T(s,3001);s=A(s,'b','roll');assert.equal(s.phase,'attack');assert.throws(()=>A(s,'b','timing'));s=A(s,'b','roll');s=settleBot(s);assert.equal(s.phase,'defense');
for(const id of ['guardian','devil','throne','underdog','musashi','helena','summoner','instinct','slayer','weather']){
 let b=createDungeon(participant('buff'));b=A(b,'buff','start');b.coins=10000;b.positions.buff={x:.8,y:.62};b=A(b,'buff','shop',{item:id});assert.equal(b.coins,9500);assert.ok(b.buffs.some(x=>x.id===id));assert.throws(()=>A(b,'buff','shop',{item:id}));if(id==='devil')assert.equal(b.teamHp,b.teamMaxHp-15);
 if(['guardian','weather'].includes(id)){b=A(b,'buff','buff',{id});assert.ok(b.buffs[0].active);assert.throws(()=>A(b,'buff','buff',{id}));}
 if(id==='underdog'){assert.throws(()=>A(b,'buff','buff',{id}));b.encounter=5;b=A(b,'buff','buff',{id});assert.ok(b.buffs[0].active);}
}
console.log('PASS ten Dungeon buffs: prices, duplicate purchase guards, activation, boss condition and Devil HP cost');
console.log('PASS Dungeon: 1–4 players, shared HP/PTS, Boxer, phase votes, double-cast guard, 50 encounters/team sizes and floor checkpoints');
}finally{Math.random=random}
(async()=>{const {PGlite}=require('@electric-sql/pglite');const db=new PGlite();await db.exec('CREATE ROLE anon; CREATE ROLE authenticated;CREATE ROLE service_role;CREATE TABLE credits(uid text,event text,g int,r int,x int,PRIMARY KEY(uid,event));CREATE FUNCTION game_credit(text,text,int,int,int) RETURNS void LANGUAGE SQL AS $$INSERT INTO credits VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING$$;');const sql=fs.readFileSync('sql/20261106-dungeon.sql','utf8');await db.exec(sql);await db.exec(sql);await db.query('INSERT INTO game_dungeons(code,state) VALUES($1,$2)', ['DTEST',{runId:'run',rewardFloor:0}]);const state={runId:'run',rewardFloor:1,rewardUsers:['a','b']};await db.query('SELECT game_save_dungeon($1,$2,$3)', ['DTEST',0,state]);await assert.rejects(()=>db.query('SELECT game_save_dungeon($1,$2,$3)',['DTEST',0,state]));await db.query('SELECT game_save_dungeon($1,$2,$3)',['DTEST',1,state]);assert.equal((await db.query('SELECT * FROM credits')).rows.length,2);await db.close();console.log('PASS SQL: repeatable migration, version lock, once-only floor rewards');})().catch(e=>{console.error(e);process.exitCode=1});
