require('./test-charged-skills.cjs');
const assert=require('node:assert/strict');
const {lobbyPositionAllowed:allowed,LOBBY_FOOTPRINTS}=require('../src/lib/lobbyMovement.ts');
const at=(u,v)=>allowed((u-.5)*20,(v-.56)*15);
for(const [a,b,c,d] of LOBBY_FOOTPRINTS) assert.equal(at((a+c)/2,(b+d)/2),false,'Furniture must block feet');
for(const [u,v] of [[.5,.5],[.25,.5],[.75,.5],[.06,.58],[.94,.58],[.5,.9],[.28,.75],[.72,.75]]) assert.ok(at(u,v),'Visible aisle must stay open');
for(const [u,v] of [[0,.5],[1,.5],[.5,.2],[.5,1]])assert.equal(at(u,v),false);
// Walk both routes from the spawn point, around the sofas, to the door mats.
for(const sign of [-1,1]){
 for(let x=0;Math.abs(x)<4.5;x+=sign*.05)assert.ok(allowed(x,5));
 for(let z=5;z>0;z-=.05)assert.ok(allowed(sign*4.5,z));
 for(let x=4.5;x<8.8;x+=.05)assert.ok(allowed(sign*x,0));
}
console.log('PASS: furniture, perimeter, rug, both connected door routes');
