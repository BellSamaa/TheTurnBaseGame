'use client';
import {useEffect,useState} from 'react';
import type {DungeonState} from '@/lib/dungeon';
import {clashCounterChance} from '@/lib/duelRules';

export default function DungeonClash({state,viewer,en,busy,onWager}:{state:DungeonState;viewer:string;en:boolean;busy:boolean;onWager:(stake:number)=>void}){
 const clash=state.clash!;const [now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),100);return()=>clearInterval(timer)},[clash.deadline]);
 const total=Object.values(clash.wagers).reduce((n,v)=>n+v,0),attacks=clash.role==='attack';
 const counter=clashCounterChance(attacks?total:clash.enemyStake,attacks?clash.enemyStake:total);
 const submitted=clash.wagers[viewer],remaining=Math.max(0,clash.deadline-now);
 return <aside className="duel-clash-panel dungeon-clash-panel" role="dialog" aria-label={en?'Team Clashing wager':'Cược va chạm cả đội'}>
  <h3>✦ {en?'TEAM CLASHING':'VA CHẠM ĐỒNG ĐỘI'} ✦</h3>
  <div className="duel-clash-score"><strong>{clash.score}</strong><span>⚔</span><strong>{clash.score}</strong></div>
  <p>{en?'Shared pool':'Quỹ chung'}: {state.pts} PTS · {en?'Team wager':'Đội cược'}: {total} PTS</p>
  <p>{en?'Team win chance':'Cơ hội đội thắng'}: {Math.round((attacks?1-counter:counter)*100)}%</p>
  <p>{state.players.map(p=>p.name+': '+(clash.wagers[p.id]===undefined?'…':clash.wagers[p.id]+' PTS')).join(' · ')}</p>
  <progress max={5000} value={remaining}/><span className="duel-clash-clock">{Math.ceil(remaining/1000)}s</span>
  <p>{submitted===undefined?(en?'Each player may wager 0–3 shared PTS.':'Mỗi người cược 0–3 PTS từ quỹ chung.'):(en?'Your wager is locked.':'Đã chốt điểm cược của bạn.')}</p>
  {submitted===undefined&&<div className="duel-wager-options">{[0,1,2,3].map(stake=><button key={stake} type="button" disabled={busy||remaining===0||stake>state.pts} onClick={()=>onWager(stake)}><b>{stake} PTS</b></button>)}</div>}
 </aside>;
}
