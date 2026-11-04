'use client';
import {useEffect,useState} from 'react';
import {LMS_BUFFS,LMS_BUFF_HELP} from '@/lib/lmsBuffs';
import {playClickSound,playVictorySound} from '@/lib/soundEffects';
export function BuffCard({id,used=false}:{id:number;used?:boolean}){return <div className={'buff-card '+(used?'buff-card-used':'')} tabIndex={0}><img src={'/assets/progression/'+(id<0?'buff_hidden':'buff-'+id)+'.webp'} alt={id<0?'Buff úp':LMS_BUFFS[id]}/>{id>=0&&<div className="buff-card-tooltip"><b>{LMS_BUFFS[id]}{used?' · Đã dùng':''}</b><p>{LMS_BUFF_HELP[id]}</p></div>}</div>;}
export function BuffDraw({id,battleId,userId}:{id:number;battleId:string;userId:string}){
 const [visible,setVisible]=useState(false),[cursor,setCursor]=useState(0),[done,setDone]=useState(false);
 const key='buff-draw:'+battleId+':'+userId;
 useEffect(()=>{if(id<0||sessionStorage.getItem(key))return;setVisible(true);let timer:ReturnType<typeof setTimeout>;let count=0;const tick=()=>{if(count>=26){setCursor(20+id);setDone(true);playVictorySound();return;}count++;setCursor(count);playClickSound();timer=setTimeout(tick,50+count*5);};timer=setTimeout(tick,100);return()=>clearTimeout(timer);},[id,key]);
 if(!visible)return null;
 return <div className="progress-modal buff-draw"><section><h2>VẬN MỆNH CỦA BẠN</h2><p>1 trong 20 buff · Chỉ bạn biết lá bài này</p><div className="gacha-window"><div className="gacha-track" style={{transform:`translateX(${100-cursor*100}px)`}}>{Array.from({length:60},(_,i)=><img key={i} src={'/assets/progression/buff-'+i%20+'.webp'} alt=""/>)}</div><span className="gacha-pointer">▼</span></div>{done?<><h3>{LMS_BUFFS[id]}</h3><p>{LMS_BUFF_HELP[id]}</p><button className="primary-action" onClick={()=>{sessionStorage.setItem(key,'1');setVisible(false);}}>NHẬN THẺ</button></>:<p>Đang rút thẻ…</p>}</section></div>;
}
