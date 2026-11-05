'use client';
import {useGameStore} from '@/stores/gameStore';
import {tx} from '@/lib/uiLocale';
import {useEffect,useState} from 'react';
import {LMS_BUFFS,LMS_BUFF_HELP} from '@/lib/lmsBuffs';
import {playClickSound,playVictorySound} from '@/lib/soundEffects';
export function BuffCard({id,used=false}:{id:number;used?:boolean}){return <div className={'buff-card '+(used?'buff-card-used':'')} tabIndex={0}><img src={'/assets/progression/'+(id<0?'buff_hidden':'buff-'+id)+'.webp'} alt={id<0?tx("Buff úp"):tx(LMS_BUFFS[id])}/>{id>=0&&<div className="buff-card-tooltip"><b>{tx(LMS_BUFFS[id])}{used?tx(" · Đã dùng"):''}</b><p>{tx(LMS_BUFF_HELP[id])}</p></div>}</div>;}
export function BuffDraw({id,battleId,userId}:{id:number;battleId:string;userId:string}){
 const en=useGameStore(s=>s.settings.language)==='en';
 const [visible,setVisible]=useState(false),[cursor,setCursor]=useState(0),[done,setDone]=useState(false);
 const key='buff-draw:'+battleId+':'+userId;
 useEffect(()=>{
  if(id<0||sessionStorage.getItem(key))return;
  setVisible(true);setDone(false);const seed=Math.floor(Math.random()*20);let count=0,timer:ReturnType<typeof setTimeout>;
  const tick=()=>{if(count>=32){setCursor(id);setDone(true);playVictorySound();return;}setCursor((seed+count*7)%20);count++;playClickSound();timer=setTimeout(tick,45+Math.max(0,count-20)*17);};tick();return()=>clearTimeout(timer);
 },[id,key]);
 if(!visible)return null;
 return <div className={'buff-reveal '+(done?'buff-reveal-done':'')} role="dialog" aria-modal="true" aria-label={tx('VẬN MỆNH CỦA BẠN')}>
  <header><h2>{tx('VẬN MỆNH CỦA BẠN')}</h2><p>{tx('1 trong 20 buff · Chỉ bạn biết lá bài này')}</p></header>
  <div className="buff-reveal-stage" style={{'--buff-hue':cursor*18+'deg'} as React.CSSProperties}><div className="buff-reveal-halo" aria-hidden="true"/><div key={cursor} className="buff-reveal-art"><img className="buff-reveal-card" src={'/assets/progression/buff-'+cursor+'.webp'} alt={tx(LMS_BUFFS[cursor])}/>{en&&<span className="buff-reveal-title">{tx(LMS_BUFFS[cursor])}</span>}</div></div>
  <footer aria-live="polite">{done?<><h3>{tx(LMS_BUFFS[id])}</h3><p>{tx(LMS_BUFF_HELP[id])}</p><button autoFocus className="primary-action" onClick={()=>{sessionStorage.setItem(key,'1');setVisible(false);}}>{tx('NHẬN THẺ')}</button></>:<p>{tx('Đang rút thẻ…')}</p>}</footer>
 </div>;
}
