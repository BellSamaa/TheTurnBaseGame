'use client';
import {useEffect,useRef} from 'react';
import type {CombatHit} from '@/lib/combatHits';
import {playHitSound,preloadHitSounds} from '@/lib/soundEffects';
/** Play confirmed damage once, including multiple actions received in one online poll. */
export function useCombatHits(events:CombatHit[]|undefined){
 useEffect(()=>{preloadHitSounds()},[]);
 const seen=useRef(new Set((events||[]).map(e=>e.id)));
 useEffect(()=>{
  const fresh=(events||[]).filter(e=>!seen.current.has(e.id));
  for(const event of fresh){seen.current.add(event.id);if(event.damage>0&&event.caster!==event.target&&Date.now()-event.at<10000)playHitSound();}
  if(seen.current.size>200)seen.current=new Set((events||[]).map(e=>e.id));
 },[events]);
}
