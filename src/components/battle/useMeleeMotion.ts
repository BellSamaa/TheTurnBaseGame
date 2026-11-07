'use client';
import {useEffect,useState,type RefObject} from 'react';
import {isMeleeEffect,isTravelingEffect,isSupersonicEffect,projectileColor} from '@/lib/skillMotion';
import {effectFrame} from '@/lib/weaponUpdateAssets';
import {animationSpec} from '@/lib/weaponUpdate2Effects';
type Event={id:string;effect:string;caster:string;target:string;damage?:number};
function addSpeedTrail(sprite:HTMLElement,from:DOMRect,dx:number,dy:number,nodes:HTMLElement[],animations:Animation[]){
 const angle=Math.atan2(dy,dx)+'rad',length=Math.hypot(dx,dy);
 for(let i=0;i<4;i++){
  const line=document.createElement('div');line.className='combat-speed-streak';line.style.left=(from.x+from.width/2)+'px';line.style.top=(from.y+from.height*(.25+i*.13))+'px';line.style.width=length+'px';line.style.transform='rotate('+angle+')';line.style.background='linear-gradient(90deg,transparent,'+(i%2?'#75c9ff':'#ff537d')+',#fff,transparent)';document.body.append(line);nodes.push(line);animations.push(line.animate([{opacity:0,scale:'.1 1'},{opacity:.9,scale:'1 1',offset:.25},{opacity:0,scale:'1 1'}],{duration:300,delay:i*15,fill:'forwards'}));
 }
 for(const amount of [.15,.4,.7]){
  const wrap=document.createElement('div'),ghost=sprite.cloneNode(true) as HTMLElement;wrap.className='combat-speed-ghost';wrap.style.left=(from.x+dx*amount)+'px';wrap.style.top=(from.y+dy*amount)+'px';wrap.style.width=from.width+'px';wrap.style.height=from.height+'px';ghost.style.width=sprite.offsetWidth+'px';ghost.style.height=sprite.offsetHeight+'px';ghost.style.transformOrigin='top left';ghost.style.transform='scale('+from.width/Math.max(1,sprite.offsetWidth)+','+from.height/Math.max(1,sprite.offsetHeight)+')';
  const originals=sprite.querySelectorAll('canvas');ghost.querySelectorAll('canvas').forEach((canvas,i)=>{if(originals[i])canvas.getContext('2d')?.drawImage(originals[i],0,0)});wrap.append(ghost);document.body.append(wrap);nodes.push(wrap);animations.push(wrap.animate([{opacity:.45},{opacity:0}],{duration:260,delay:amount*80,fill:'forwards'}));
 }
}
/** Visual children move; authoritative fighter anchors never move. */
export function useMeleeMotion(event:Event|undefined,root:RefObject<HTMLDivElement|null>){
 const [impact,setImpact]=useState<string>();
 useEffect(()=>{
  if(!event){setImpact(undefined);return}
  const scope=root.current,melee=isMeleeEffect(event.effect),flying=isTravelingEffect(event.effect),color=projectileColor(event.effect);
  const find=(id:string)=>scope?.querySelector<HTMLElement>('[data-fighter-id="'+CSS.escape(id)+'"]');
  const caster=find(event.caster),target=find(event.target),sprite=caster?.querySelector<HTMLElement>('.character-motion')||caster?.querySelector<HTMLElement>(':scope > img'),victim=target?.querySelector<HTMLElement>('.character-motion')||target?.querySelector<HTMLElement>(':scope > img')||target;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!sprite||!victim||event.caster===event.target||event.target==='center'){setImpact(event.id);return}
  const from=sprite.getBoundingClientRect(),to=victim.getBoundingClientRect(),direction=to.x+to.width/2>=from.x+from.width/2?1:-1;
  const travelMs=reduced?0:melee?(isSupersonicEffect(event.effect)?90:event.effect.startsWith('mu:D20_')?140:250):color?360:0,clip=animationSpec(event.effect).ms;
  const nodes:HTMLElement[]=[],animations:Animation[]=[],timers:ReturnType<typeof setTimeout>[]=[];
  const old={position:sprite.style.position,zIndex:caster!.style.zIndex};
  setImpact(travelMs||flying&&!reduced?undefined:event.id);
  if(melee&&!reduced){
   const dx=to.x+to.width/2-(from.x+from.width/2)-direction*(to.width*.45+from.width*.4),dy=to.bottom-from.bottom;
   sprite.style.position='relative';caster!.style.zIndex='35';
   const x=dx/Math.max(.1,from.width/Math.max(1,sprite.offsetWidth)),y=dy/Math.max(.1,from.height/Math.max(1,sprite.offsetHeight));
   const duration=clip+travelMs*2+50,travel=x+'px '+y+'px';
   animations.push(sprite.animate([{translate:'0px 0px',offset:0},{translate:travel,offset:travelMs/duration},{translate:travel,offset:(clip+travelMs)/duration},{translate:'0px 0px',offset:1}],{duration,easing:event.effect.startsWith('mu:')?'linear':'ease-in-out'}));
   if(isSupersonicEffect(event.effect))addSpeedTrail(sprite,from,dx,dy,nodes,animations);
  }else if(flying&&!reduced){
   const wave=document.createElement('div'),art=document.createElement('img'),size=Math.min(innerWidth<600?110:320,Math.max(90,Math.min(190,from.height*1.3))*(event.effect==='wu1:world_slash'||event.effect==='mu:S2_A_Void_Flash'?1.5:1));wave.className='combat-skill-projectile';wave.dataset.waveEffect=event.effect;wave.style.width=wave.style.height=size+'px';wave.style.left=(from.x+from.width/2-size/2)+'px';wave.style.top=(from.y+from.height*.5-size/2)+'px';art.src=effectFrame(event.effect,0);art.alt='';art.style.transform=direction<0?'scaleX(-1)':'';wave.append(art);document.body.append(wave);nodes.push(wave);if(event.effect==='mu:S2_A_Void_Flash'){const flash=document.createElement('div');flash.className='musashi-screen-flash';document.body.append(flash);nodes.push(flash);}
   const dx=to.x+to.width/2-(from.x+from.width/2),dy=to.y+to.height*.5-(from.y+from.height*.5);
   animations.push(wave.animate([{transform:'translate(0px,0px)',offset:0},{transform:'translate('+dx+'px,'+dy+'px)',offset:.65},{transform:'translate('+dx+'px,'+dy+'px)',offset:1}],{duration:clip,easing:'ease-out',fill:'forwards'}));
   const frameCount=animationSpec(event.effect).frames;let frame=0;const interval=setInterval(()=>{frame++;if(frame>=frameCount){clearInterval(interval);return}art.src=effectFrame(event.effect,frame)},clip/frameCount);timers.push(interval);
  }else if(color&&!reduced){
   const ray=document.createElement('div');ray.className='combat-projectile';ray.style.background=color;ray.style.boxShadow='0 0 8px #fff,0 0 22px '+color;ray.style.left=(from.x+from.width/2-48)+'px';ray.style.top=(from.y+from.height*.5)+'px';document.body.append(ray);nodes.push(ray);
   const dx=to.x+to.width/2-(from.x+from.width/2),dy=to.y+to.height*.5-(from.y+from.height*.5),angle=Math.atan2(dy,dx)+'rad';
   animations.push(ray.animate([{transform:'translate(0px,0px) rotate('+angle+') scaleX(.4)',opacity:0},{opacity:1,offset:.12},{transform:'translate('+dx+'px,'+dy+'px) rotate('+angle+') scaleX(1)',opacity:1},{opacity:0}],{duration:360,fill:'forwards'}));
  }
  if(travelMs)timers.push(setTimeout(()=>setImpact(event.id),travelMs));
  const damaging=(event.damage??0)>0;
  if(damaging)timers.push(setTimeout(()=>{
   const box=victim.getBoundingClientRect();
   for(let i=0;i<(reduced?3:9);i++){const blood=document.createElement('i');blood.className='combat-blood-particle';blood.style.left=(box.x+box.width/2)+'px';blood.style.top=(box.y+box.height*.45)+'px';document.body.append(blood);nodes.push(blood);const angle=(i/9)*Math.PI*2;animations.push(blood.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+Math.cos(angle)*45+'px,'+(Math.sin(angle)*32+20)+'px) scale(.2)',opacity:0}],{duration:380,fill:'forwards'}))}
  },travelMs+clip));
  return()=>{timers.forEach(clearTimeout);animations.forEach(a=>a.cancel());nodes.forEach(n=>n.remove());sprite.style.position=old.position;caster!.style.zIndex=old.zIndex};
 },[event?.id,root]);
 return !event||impact===event.id;
}
