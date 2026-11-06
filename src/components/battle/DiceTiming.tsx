'use client';
import {useEffect,useState} from 'react';
import type {DiceTimingState} from '@/lib/diceTiming';
import {timingPosition} from '@/lib/diceTiming';

export default function DiceTiming({state,enabled,busy,en,onPress}:{state?:DiceTimingState;enabled:boolean;busy:boolean;en:boolean;onPress?:()=>void}){
  const [now,setNow]=useState(Date.now);
  useEffect(()=>{
    if(!enabled||!state||state.quality!==undefined)return;
    let frame=0;
    const tick=()=>{setNow(Date.now());frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame);
  },[enabled,state?.startedAt,state?.quality]);
  const position=state?.quality!==undefined ? state.position??.5 : state ? timingPosition(now-state.startedAt) : .5;
  return <div className="dice-timing">
    <div className="dice-timing-track" aria-hidden="true">
      <svg viewBox="226 24 158 1488" preserveAspectRatio="none"><image href="/assets/sprites/ui/frames/timing-meter.png" width="1024" height="1536"/></svg>
      <span className="dice-timing-pointer" style={{top:(8+position*84)+'%'}}/>
    </div>
    <button disabled={!enabled||busy||state?.quality!==undefined||!onPress} onClick={onPress}>
      {state?.quality!==undefined?'+'+(state.quality*10).toFixed(1)+'%':state?(en?'STOP':'DỪNG'):(en?'FOCUS':'CANH')}
    </button>
    <small>{en?'D20 = 20':'D20 = 20'}</small>
  </div>;
}
