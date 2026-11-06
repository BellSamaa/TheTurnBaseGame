'use client';
import {useEffect,useState,type RefObject} from 'react';
import {isMeleeEffect,projectileColor} from '@/lib/skillMotion';
import {animationSpec} from '@/lib/weaponUpdate2Effects';
type Event={id:string;effect:string;caster:string;target:string;damage?:number};
/** Visual children move; authoritative fighter anchors never move. */
export function useMeleeMotion(event:Event|undefined,root:RefObject<HTMLDivElement|null>){
 const [impact,setImpact]=useState<string>();
 useEffect(()=>{
  if(!event){setImpact(undefined);return}
  const scope=root.current,melee=isMeleeEffect(event.effect),color=projectileColor(event.effect);
  const find=(id:string)=>scope?.querySelector<HTMLElement>('[data-fighter-id="'+CSS.escape(id)+'"]');
  const caster=find(event.caster),target=find(event.target),sprite=caster?.querySelector<HTMLElement>('.character-motion')||caster?.querySelector<HTMLElement>(':scope > img'),victim=target?.querySelector<HTMLElement>('.character-motion')||target?.querySelector<HTMLElement>(':scope > img')||target;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!sprite||!victim||event.caster===event.target||event.target==='center'){setImpact(event.id);return}
  const from=sprite.getBoundingClientRect(),to=victim.getBoundingClientRect(),direction=to.x+to.width/2>=from.x+from.width/2?1:-1;
  const travelMs=reduced?0:melee?250:color?360:0,clip=animationSpec(event.effect).ms;
  const nodes:HTMLElement[]=[],animations:Animation[]=[],timers:ReturnType<typeof setTimeout>[]=[];
  const old={position:sprite.style.position,zIndex:caster!.style.zIndex};
  setImpact(travelMs?undefined:event.id);
  if(melee&&!reduced){
   const dx=to.x+to.width/2-(from.x+from.width/2)-direction*(to.width*.45+from.width*.4),dy=to.bottom-from.bottom;
   sprite.style.position='relative';caster!.style.zIndex='35';
   const x=dx/Math.max(.1,from.width/Math.max(1,sprite.offsetWidth)),y=dy/Math.max(.1,from.height/Math.max(1,sprite.offsetHeight));
   const duration=clip+550,travel=x+'px '+y+'px';
   animations.push(sprite.animate([{translate:'0px 0px',offset:0},{translate:travel,offset:250/duration},{translate:travel,offset:(clip+250)/duration},{translate:'0px 0px',offset:1}],{duration,easing:'ease-in-out'}));
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
