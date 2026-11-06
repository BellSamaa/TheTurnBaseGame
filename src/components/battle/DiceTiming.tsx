'use client';
import {useEffect,useRef,useState} from 'react';
import type {DiceTimingState} from '@/lib/diceTiming';
import {playClickSound} from '@/lib/soundEffects';
import {timingPosition} from '@/lib/diceTiming';
export default function DiceTiming({state,enabled,busy,en,onPress}:{state?:DiceTimingState;enabled:boolean;busy:boolean;en:boolean;onPress?:(elapsedMs?:number)=>void}){
 const [now,setNow]=useState(Date.now),[frozen,setFrozen]=useState<number>();
 const [attempt,setAttempt]=useState(0);const callback=useRef(onPress);callback.current=onPress;
 useEffect(()=>{if(!enabled){setAttempt(0);setFrozen(undefined);return}if(state||busy||attempt>=4||!callback.current)return;const timer=setTimeout(()=>{callback.current?.();setAttempt(n=>n+1)},attempt?400:0);return()=>clearTimeout(timer)},[enabled,busy,state?.startedAt,attempt]);
 useEffect(()=>{setFrozen(undefined)},[state?.startedAt]);
 useEffect(()=>{if(!enabled||!state||state.quality!==undefined||frozen!==undefined)return;let frame=0;const tick=()=>{setNow(Date.now());frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[enabled,state?.startedAt,state?.quality,frozen]);
 const position=frozen!==undefined?timingPosition(frozen):state?.quality!==undefined?state.position??.5:state?timingPosition(now-state.startedAt):.5;
 const stop=()=>{if(!state||state.quality!==undefined||frozen!==undefined)return;playClickSound();const elapsed=Date.now()-state.startedAt;setFrozen(elapsed);onPress?.(elapsed)};
 const quality=frozen!==undefined?Math.max(0,1-Math.abs(position*2-1)):state?.quality;
 return <div className="dice-timing"><div className="dice-timing-track" aria-hidden="true"><svg viewBox="226 24 158 1488" preserveAspectRatio="none"><image href="/assets/sprites/ui/frames/timing-meter.png" width="1024" height="1536"/></svg><span className="dice-timing-pointer" style={{top:(8+position*84)+'%'}}/></div><button disabled={!enabled||busy||!state||quality!==undefined||!onPress} onClick={stop}>{quality!==undefined?'+'+(quality*10).toFixed(1)+'%':en?'FOCUS':'CANH'}</button><small>D20 = 20</small></div>;
}
