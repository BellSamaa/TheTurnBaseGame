'use client';
import {useEffect,useState,type RefObject} from 'react';
import {isMeleeEffect} from '@/lib/skillMotion';
type Event={id:string;effect:string;caster:string;target:string};
/** Animate the caster's visual only; the target and both layout anchors stay fixed. */
export function useMeleeMotion(event:Event|undefined,root:RefObject<HTMLDivElement|null>){
 const [impact,setImpact]=useState<string>();
 useEffect(()=>{
  if(!event||!isMeleeEffect(event.effect)||event.caster===event.target||event.target==='center'){setImpact(event?.id);return;}
  const scope=root.current;if(!scope)return;
  const find=(id:string)=>scope.querySelector<HTMLElement>('[data-fighter-id="'+CSS.escape(id)+'"]');
  const caster=find(event.caster),target=find(event.target);
  const sprite=caster?.querySelector<HTMLElement>('.character-motion')||caster?.querySelector<HTMLElement>(':scope > img');
  const victim=target?.querySelector<HTMLElement>('.character-motion')||target?.querySelector<HTMLElement>(':scope > img')||target;
  if(!sprite||!victim||matchMedia('(prefers-reduced-motion: reduce)').matches){setImpact(event.id);return;}
  setImpact(undefined);
  const from=sprite.getBoundingClientRect(),to=victim.getBoundingClientRect(),direction=to.x+to.width/2>=from.x+from.width/2?1:-1;
  const dx=to.x+to.width/2-(from.x+from.width/2)-direction*(to.width*.45+from.width*.4),dy=to.bottom-from.bottom;
  const old={position:sprite.style.position,zIndex:caster!.style.zIndex};sprite.style.position='relative';caster!.style.zIndex='35';
  const scaleX=from.width/Math.max(1,sprite.offsetWidth),scaleY=from.height/Math.max(1,sprite.offsetHeight);
  const travel=dx/Math.max(.1,scaleX)+'px '+dy/Math.max(.1,scaleY)+'px';
  const animation=sprite.animate([{translate:'0px 0px',offset:0},{translate:travel,offset:.22},{translate:travel,offset:.65},{translate:'0px 0px',offset:1}],{duration:1100,easing:'ease-in-out'});
  const timer=setTimeout(()=>setImpact(event.id),245);
  return()=>{clearTimeout(timer);animation.cancel();sprite.style.position=old.position;caster!.style.zIndex=old.zIndex;};
 },[event?.id,root]);
 return !event||!isMeleeEffect(event.effect)||impact===event.id;
}
