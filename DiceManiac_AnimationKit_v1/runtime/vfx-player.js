/* Pure visual runtime: never rolls dice, changes HP, or consumes charge/ammo.
 * Caller owns animation clock and render loop. All positions are WORLD pixels.
 * Node export supports tests; browser global is DiceVfxPlayer. */
(function(root){
'use strict';
class VfxPlayer {
 constructor(manifest,images,{maxInstances=120}={}){this.manifest=manifest;this.images=images;this.maxInstances=maxInstances;this.instances=[];this.serial=0;}
 spawn(effectId,options={}){
  const def=this.manifest.effects[effectId];if(!def)throw new Error('Unknown effect '+effectId);
  if(!this.images[def.sheet])throw new Error('Texture not loaded '+def.sheet);
  const id=options.id||`vfx-${++this.serial}`;this.stop(id);
  if(this.instances.length>=this.maxInstances)return null;
  const durationMs=options.durationMs??def.durationMs;if(!(durationMs>0))throw new Error('durationMs must be positive');
  if(options.ttlMs!==undefined&&!(options.ttlMs>0))throw new Error('ttlMs must be positive');
  this.instances.push({id,effectId,def,options,elapsed:0,durationMs,sequence:options.sequence||def.sequence});return id;
 }
 stop(id){this.instances=this.instances.filter(i=>i.id!==id);}
 clear(){this.instances.length=0;}
 update(dtMs){if(!Number.isFinite(dtMs)||dtMs<0)throw new Error('Invalid dt');const dt=Math.min(dtMs,100);
  this.instances=this.instances.filter(i=>{i.elapsed+=dt;const end=i.options.ttlMs??(i.options.loop?Infinity:i.durationMs);return i.elapsed<end;});
 }
 draw(ctx){
  for(const i of this.instances){const o=i.options,resolve=p=>typeof p==='function'?p():p;
   const from=resolve(o.from||o.at)||{x:0,y:0},to=resolve(o.to)||from;
   if(!from||!to||![from.x,from.y,to.x,to.y].every(Number.isFinite))continue;
   const motionDuration=o.travelMs||i.durationMs,t=Math.min(1,i.elapsed/motionDuration);
   const x=from.x+(to.x-from.x)*t,y=from.y+(to.y-from.y)*t;
   const seq=i.sequence,cycle=o.loop?i.elapsed%i.durationMs:Math.min(i.elapsed,i.durationMs-0.001);
   const index=seq[Math.min(seq.length-1,Math.floor(cycle/i.durationMs*seq.length))],frame=i.def.frames[index];
   if(!frame)continue;
   const [sx,sy,sw,sh]=frame.rect,[w,h]=o.size||i.def.suggestedWorldSize,[px,py]=o.pivot||i.def.pivot;
   let angle=o.rotation||0;
   if(o.orientToPath&&Math.hypot(to.x-from.x,to.y-from.y)>0){const a={right:0,left:Math.PI,'down-right':Math.PI/4,none:0}[i.def.canonicalDirection]||0;angle+=Math.atan2(to.y-from.y,to.x-from.x)-a;}
   const offset=frame.offset||[0,0];ctx.save();ctx.imageSmoothingEnabled=false;
   ctx.globalAlpha=o.opacity??1;ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);ctx.scale(o.flipX?-1:1,1);
   ctx.drawImage(this.images[i.def.sheet],sx,sy,sw,sh,Math.round(-w*px+offset[0]),Math.round(-h*py+offset[1]),w,h);ctx.restore();
  }
 }
 dispose(){this.clear();this.images={};}
}
root.DiceVfxPlayer=VfxPlayer;if(typeof module!=='undefined')module.exports={VfxPlayer};
})(typeof globalThis!=='undefined'?globalThis:this);
