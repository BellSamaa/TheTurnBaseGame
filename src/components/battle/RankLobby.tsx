'use client';
import {tx} from '@/lib/uiLocale';
import {useState} from 'react';
import {rankProgress} from '@/lib/progression';
import AccountPanel,{useProgress} from '@/components/progression/AccountPanel';
import RankedMatchmakingModal from './RankedMatchmakingModal';
export default function RankLobby({isOpen,onClose}:{isOpen:boolean;onClose:()=>void}){
 const p=useProgress(),r=rankProgress(p.rankPoints),[queue,setQueue]=useState(false),[gifts,setGifts]=useState(false);
 if(!isOpen)return null;
 return <div className="progress-modal"><section className="rank-lobby"><button className="modal-close" onClick={onClose}>{tx("Đóng ✕")}</button><h2>{tx("ĐẤU HẠNG 1V1")}</h2>
 {r.rank>0?<img className="rank-emblem" src={'/assets/progression/rank-'+r.rank+'.webp'} alt={tx(r.name)}/>:null}
 <h3 className={r.rank===0?"bronze-rank-title":"rank-title"}>{tx(r.name)}</h3><div className="rank-stars">{Array.from({length:5},(_,i)=><img key={i} src={'/assets/progression/'+(i<r.stars?'star_fill':'star_frame')+'.webp'} alt={i<r.stars?'★':'☆'}/>)}</div>
 <progress value={r.points} max={r.required}/><p>{r.points}/{r.required}{" " + tx("điểm cho sao kế tiếp")}</p><p>{tx("Ghép trận với người chơi thật. Thắng/thua thay đổi điểm, sao và rank.")}</p>
 <div className="rank-actions"><button onClick={()=>setGifts(!gifts)}>{tx("Quà rank & khung")}</button><button className="primary-action" onClick={()=>setQueue(true)}>{tx("TÌM TRẬN")}</button></div>{gifts&&<AccountPanel/>}
 <RankedMatchmakingModal isOpen={queue} onClose={()=>setQueue(false)}/></section></div>;
}
