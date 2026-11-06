Object.defineProperty(global,'localStorage',{value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},configurable:true});
require('./test-dice-timing.cjs');
const assert=require('node:assert/strict');
const db=require('../src/lib/serverDb.ts');
const {CLASS_DEFINITIONS:C,DEFAULT_CUSTOMIZATION}=require('../src/lib/constants.ts');
const {useGameStore}=require('../src/stores/gameStore.ts');
const {createPve}=require('../src/lib/pve.ts');
const {createLms}=require('../src/lib/lms.ts');
const {createDungeon,dungeonAction}=require('../src/lib/dungeon.ts');
const participant=(id,classType)=>({id,name:id,classType,weaponId:'greatsword',character:DEFAULT_CUSTOMIZATION,isReady:true});
const check=(p,expected)=>{assert.equal(p.hp,expected);assert.equal(p.maxHp,expected)};
(async()=>{
 const originalGet=db.getRoomByCodeAsync,originalUpdate=db.updateRoom;
 try{
  let room;db.getRoomByCodeAsync=async()=>structuredClone(room);db.updateRoom=async r=>{room=r};
  const {POST}=require('../src/app/api/rooms/[code]/route.ts');
  for(const [type,info]of Object.entries(C)){
   const host=participant('a',type),guest=participant('b',type),expected=Math.round(200*info.hpModifier);
   const ranked=db.createRankedBattleState('1234',host,guest,'castle');check(ranked.player1,expected);check(ranked.player2,expected);
   room={code:'1234',host,guest,participants:[host,guest],mode:'casual',gameMode:'classic',status:'ready',mapId:'castle'};
   const response=await POST(new Request('http://localhost/api/rooms/1234',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_battle',userId:'a'})}),{params:Promise.resolve({code:'1234'})});
   assert.equal(response.status,200);const body=await response.json();check(body.room.battleState.player1,expected);check(body.room.battleState.player2,expected);
   useGameStore.setState({profile:{...useGameStore.getState().profile,classType:type}});
   for(const mode of ['ranked','casual','local']){const battle=useGameStore.getState().startNewBattle({mode,opponentClass:type});check(battle.player1,expected);check(battle.player2,expected)}
   check(useGameStore.getState().startNewBattle({mode:'pve',opponentClass:type}).player1,info.baseHp);
   check(createPve(host).combat.players[0],Math.round(100*info.hpModifier));
   check(createLms([host,guest,participant('c',type)]).players[0],Math.round(150*info.hpModifier));
   const dungeon=dungeonAction(createDungeon(host),'a','start');assert.equal(dungeon.teamMaxHp,Math.round(100*info.hpModifier));
  }
  console.log('PASS all six classes: ranked factory, real casual start route and local PvP use 200 base HP; Assassin 150, Juggernaut 300; PvE 100/LMS 150/Dungeon unchanged');
 }finally{db.getRoomByCodeAsync=originalGet;db.updateRoom=originalUpdate;}
})().catch(e=>{console.error(e.message);process.exitCode=1});
