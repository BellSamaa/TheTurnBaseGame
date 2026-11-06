'use client';
import {useEffect,useState} from 'react';

export default function DungeonLoading({startedAt,en}:{startedAt?:number;en:boolean}){
 const [start]=useState(()=>startedAt??Date.now()),[now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60);return()=>clearInterval(timer)},[]);
 const progress=Math.min(100,Math.max(0,(now-start)/30));
 return <div className="lobby-loading dungeon-entry-loading" role="status" aria-live="polite">
  <img src="/assets/dungeon/Entrance/Dungeon_Entrance.webp" alt=""/>
  <div className="dungeon-loading-motes" aria-hidden="true">{Array.from({length:16},(_,i)=><span key={i} style={{left:(i*37%100)+'%',animationDelay:-(i*.43)+'s',animationDuration:(4+i%4)+'s'}}>✦</span>)}</div>
  <div className="dungeon-loading-content"><span className="dungeon-loading-sigil" aria-hidden="true">✧</span><strong>{en?'WELCOME TO DUNGEON':'CHÀO MỪNG ĐẾN DUNGEON'}</strong><p>{en?'Good Luck, Traveler!':'Chúc nhà lữ hành may mắn!'}</p><div className="dungeon-loading-track" role="progressbar" aria-label={en?'Loading Dungeon':'Đang tải Dungeon'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(progress)}><div style={{width:progress+'%'}}/></div><small>{en?'Gathering your party…':'Đang tập hợp đội…'} {Math.floor(progress)}%</small></div>
 </div>;
}
