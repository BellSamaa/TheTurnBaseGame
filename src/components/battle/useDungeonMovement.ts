'use client';
import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import {createClient} from '@supabase/supabase-js';
import {dungeonPositionAllowed} from '@/lib/dungeon';
type Pose={x:number;y:number;moving?:boolean};
/** Exploration uses 10 Hz Broadcast; database writes happen only at interactions. */
export function useDungeonMovement(code:string|undefined,actor:string|undefined,ids:string[],rest:number,enabled:boolean,position:MutableRefObject<Pose>){
 const [peers,setPeers]=useState<Record<string,Pose>>({}),members=useRef(ids);members.current=ids;
 useEffect(()=>{
  if(!code||!actor||!enabled)return;
  let closed=false,raf=0,connected=false,seq=0,previous=performance.now(),lastDraw=0;
  const targets=new Map<string,Pose>(),drawn=new Map<string,Pose>(),sequences=new Map<string,number>();
  let client:ReturnType<typeof createClient>|undefined;
  let channel:ReturnType<ReturnType<typeof createClient>['channel']>|undefined;
  const timer=setInterval(()=>{if(connected&&channel)void channel.send({type:'broadcast',event:'pose',payload:{...position.current,id:actor,seq:++seq}})},100);
  const animate=(now:number)=>{
   const alpha=1-Math.exp(-14*Math.min(.08,(now-previous)/1000));previous=now;
   for(const [id,p]of targets){const old=drawn.get(id)||p;drawn.set(id,{x:old.x+(p.x-old.x)*alpha,y:old.y+(p.y-old.y)*alpha,moving:p.moving})}
   if(!closed&&drawn.size&&now-lastDraw>=30){setPeers(Object.fromEntries(drawn));lastDraw=now;}raf=requestAnimationFrame(animate);
  };
  void (async()=>{try{
   const r=await fetch('/api/lobby/realtime'),config=await r.json();if(!r.ok||closed)return;
   client=createClient(config.url,config.key,{auth:{persistSession:false,autoRefreshToken:false}});
   channel=client.channel('dungeon:'+code+':'+(rest?'rest-'+rest:'entrance'),{config:{broadcast:{self:false}}});
   channel.on('broadcast',{event:'pose'},({payload:p})=>{
    if(!members.current.includes(p.id)||p.id===actor||!Number.isSafeInteger(p.seq)||p.seq<=(sequences.get(p.id)||0)||!dungeonPositionAllowed(p.x,p.y,rest))return;
    sequences.set(p.id,p.seq);targets.set(p.id,{x:p.x,y:p.y,moving:!!p.moving});
   }).subscribe(status=>{connected=status==='SUBSCRIBED'});
   raf=requestAnimationFrame(animate);
  }catch{}})();
  return()=>{closed=true;clearInterval(timer);cancelAnimationFrame(raf);if(client&&channel)void client.removeChannel(channel);setPeers({})};
 },[code,actor,enabled,rest,position]);
 return peers;
}
