'use client';
import { useEffect, useState } from 'react';
import type { DuelClash, DuelNotice } from '@/lib/duelRules';
import type {LmsState} from '@/lib/lms';

export function InitiativeClashPanel({clash,players,viewer,en,busy,onWager}:{clash:NonNullable<LmsState['initiativeClash']>;players:LmsState['players'];viewer?:string;en:boolean;busy:boolean;onWager?:(stake:number)=>void}){
  const [now,setNow]=useState(Date.now);
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),80);return()=>clearInterval(t);},[clash.deadline]);
  const remaining=Math.max(0,clash.deadline-now),mine=viewer&&clash.ids.includes(viewer),submitted=viewer?clash.wagers[viewer]:undefined;
  const points=players.find(p=>p.id===viewer)?.d12Charge??0;
  return <aside className="duel-clash-panel initiative-clash-panel" aria-label={en?'Clashing for attack priority':'Va chạm tranh quyền Công'}>
    <h3>✦ {en?'CLASHING · ATTACK PRIORITY':'VA CHẠM · TRANH QUYỀN CÔNG'} ✦</h3>
    <div className="initiative-clash-leaders">{clash.ids.map(id=><span key={id}>{players.find(p=>p.id===id)?.name}<strong>D20 {clash.score}</strong></span>)}</div>
    <p>{en?'Equal wagers = equal chances. Each PTS adds one draw weight. Winner chooses the target.':'Cược bằng nhau: cơ hội ngang nhau. Mỗi PTS thêm một phần cơ hội. Người thắng chọn mục tiêu.'}</p>
    <progress max={5000} value={remaining}/><span className="duel-clash-clock">{Math.ceil(remaining/1000)}s</span>
    {mine&&submitted!==undefined?<p>{en?'Wager locked':'Đã chốt cược'} · {submitted} PTS</p>:mine&&<div className="duel-wager-options">{[0,1,2,3].map(stake=><button type="button" key={stake} disabled={busy||!remaining||stake>points} onClick={()=>onWager?.(stake)}>{stake} PTS</button>)}</div>}
  </aside>;
}

export function DuelClashPanel({clash, attackerId, viewer, points, en, busy, onWager}: {
  clash: DuelClash;
  attackerId: string;
  viewer?: string;
  points: number;
  en: boolean;
  busy: boolean;
  onWager?: (stake: number) => void;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 80);
    return () => clearInterval(timer);
  }, [clash.deadline]);
  const remaining = Math.max(0, clash.deadline - now);
  if (!remaining) return null;
  const attacks = viewer === attackerId;
  const submitted = attacks ? clash.attackStake : clash.defenseStake;
  const canChoose = (attacks || viewer === clash.defenderId) && !!onWager;
  return <aside className="duel-clash-panel" aria-label={en?'Clashing wager':'Cược điểm va chạm'}>
    <h3>✦ {en?'CLASHING':'VA CHẠM'} ✦</h3>
    <div className="duel-clash-score"><strong>{clash.score}</strong><span>⚔</span><strong>{clash.score}</strong></div>
    <p>{!canChoose ? (en?'Waiting for wagers':'Đang chờ hai bên cược') :
      submitted !== undefined ? (en?'Wager locked · ':'Đã chốt cược · ')+submitted+' PTS' :
      (en?'Wager PTS · +10% win chance per point':'Cược PTS · Mỗi điểm tăng 10 điểm % cơ hội thắng')}</p>
    <progress max={5000} value={Math.min(5000,remaining)} aria-label={en?'Time remaining':'Thời gian còn lại'}/>
    <span className="duel-clash-clock">{Math.ceil(remaining/1000)}s</span>
    {canChoose && submitted === undefined && <div className="duel-wager-options">{[0,1,2,3].map(stake=>
      <button type="button" key={stake} disabled={busy||stake>points} onClick={()=>onWager(stake)}>
        <b>{stake} PTS</b><small>{(attacks?65:35)+stake*10}% {en?'vs. 0 PTS':'khi đối thủ cược 0'}</small>
      </button>
    )}</div>}
  </aside>;
}

export function DuelResultNotice({notice,en}: {notice?: DuelNotice;en:boolean}) {
  const [visible,setVisible]=useState<string>();
  useEffect(()=>{
    if(!notice)return;
    setVisible(notice.id);
    const timer=setTimeout(()=>setVisible(undefined),2400);
    return()=>clearTimeout(timer);
  },[notice?.id]);
  if(!notice||visible!==notice.id)return null;
  return <div role="status" className={'duel-result-notice duel-result-'+notice.kind}>✦ {en?notice.en:notice.vi}</div>;
}
