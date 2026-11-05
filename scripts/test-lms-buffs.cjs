// Uses the same TS loader as the combat audit.
require('./test-charged-skills.cjs');
const assert=require('node:assert/strict');
const {createLms,lmsAction}=require('../src/lib/lms.ts');
const {LMS_BUFFS}=require('../src/lib/lmsBuffs.ts');
const people=[0,1,2,3].map(i=>({id:'p'+i,name:'P'+i,character:{},classType:'warrior',weaponId:'greatsword',isReady:true}));
function base(id){const s=createLms(people);s.order=people.map(p=>p.id);s.active=0;s.phase='clash';s.target='p1';s.attack=20;s.defense=1;s.deadline=6000;s.players.forEach(p=>{p.hp=200;p.d12Charge=50});s.extras.buffs.p0={id,used:false,revealed:false};return s;}
for(let id=0;id<20;id++){
 let s=base(id),actor='p0',args={target:'p2'};
 if([0,1,3,4].includes(id)){actor='p1';s.extras.buffs.p1={id,used:false,revealed:false};if(id===1)s.players[1].hp=10;}
 if([2,14].includes(id)){s.phase='attack';if(id===2){actor='p1';s.extras.buffs.p1={id,used:false,revealed:false};}}
 if([5,6,8].includes(id))s.phase='target';
 if(id===7)s.phase='attack';
 if(id===8)s.players[2].hp=20;
 if(id===9){s.phase='end';actor='p1';s.extras.buffs.p1={id,used:false,revealed:false};s.extras.lastKill={killer:'p0',round:1,hp:30,pts:5};}
 if([11,13].includes(id))s.phase='target';
 if(id===16)s.phase='end';
 if(id===17){actor='p2';s.extras.buffs.p2={id,used:false,revealed:false};}
 if(id===19){s.active=3;s.phase='end';actor='p3';s.extras.buffs.p3={id,used:false,revealed:false};}
 const out=lmsAction(s,actor,'buff',args,1000);
 assert.equal(out.extras.buffs[actor].used,true,LMS_BUFFS[id]);assert.equal(out.extras.buffs[actor].revealed,true);
 assert.throws(()=>lmsAction(out,actor,'buff',args,1000),'one use '+id);
}
const s=base(0);assert.throws(()=>lmsAction(s,'p0','buff'), 'shield cannot be used by un-attacked actor');
const hidden=base(1);assert.equal(hidden.extras.buffs.p0.revealed,false);
let aoe=base(6);aoe.phase='target';aoe=lmsAction(aoe,'p0','buff');aoe=lmsAction(aoe,'p0','target',{target:'p1'});aoe=lmsAction(aoe,'p0','attack');assert.equal(aoe.remainingTargets.length,2);
console.log('PASS: all 20 buffs activate only once; invalid shield rejected; AoE queues all three defenders');
// Semantic outcomes, not only activation flags.
let shield=base(0);shield.extras.buffs.p1={id:0,used:false,revealed:false};shield=lmsAction(shield,'p1','buff',{},1000);shield=lmsAction(shield,'p0','resolve',{},6000);assert.equal(shield.players[1].hp,200);assert.equal(shield.players[0].hp,183);
let phoenix=base(1);phoenix.players[1].hp=10;phoenix.extras.buffs.p1={id:1,used:false,revealed:false};phoenix=lmsAction(phoenix,'p1','buff',{},1000);phoenix=lmsAction(phoenix,'p0','resolve',{},6000);assert.equal(phoenix.players[1].hp,1);assert.equal(phoenix.players[1].d12Charge,70);
let insurance=base(3);insurance.extras.buffs.p1={id:3,used:false,revealed:false};insurance=lmsAction(insurance,'p1','buff',{},1000);insurance=lmsAction(insurance,'p0','resolve',{},6000);assert.equal(insurance.players[1].hp,185);assert.equal(insurance.players[1].d12Charge,53);
let thief=base(13);thief.phase='target';thief=lmsAction(thief,'p0','buff',{target:'p2'});assert.equal(thief.players[0].d12Charge,75);assert.equal(thief.players[2].d12Charge,25);
let trade=base(15);trade.players[0].hp=100;trade=lmsAction(trade,'p0','buff',{choice:'hp',target:'4'});assert.equal(trade.players[0].hp,80);assert.equal(trade.players[0].d12Charge,54);
let storm=base(19);storm.phase='end';storm.active=3;storm.round=8;storm=lmsAction(storm,'p3','end');assert.equal(storm.round,9);assert.equal(storm.players[0].hp,185);
let bomb=base(10);bomb.phase='end';bomb.active=3;bomb.round=2;bomb.extras.bombs=[{target:'p1',round:3}];bomb=lmsAction(bomb,'p3','end');assert.equal(bomb.players[1].hp,160);assert.equal(bomb.extras.bombs.length,0);
let mutual=base(19);mutual.active=3;mutual.phase='end';mutual.players.forEach(p=>p.hp=20);mutual.extras.buffs.p3={id:19,used:false,revealed:false};mutual=lmsAction(mutual,'p3','buff');assert.equal(mutual.winner,'draw');
let reflected=base(0);reflected.players[0].hp=5;reflected.extras.buffs.p1={id:0,used:false,revealed:false};reflected=lmsAction(reflected,'p1','buff',{},1000);reflected=lmsAction(reflected,'p2','resolve',{},6000);assert.equal(reflected.players[0].hp,0);reflected=lmsAction(reflected,'p0','end');assert.equal(reflected.phase,'target');
console.log('PASS: reflect, revival, insurance, theft, trade, storm, bomb, draw and dead attacker end turn');
