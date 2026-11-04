'use client';
import {useEffect,useRef,useState} from 'react';
import {flushProfile} from '@/lib/profileSync';
import {tx} from '@/lib/uiLocale';
import {useGameStore} from '@/stores/gameStore';
import type {PveState} from '@/lib/pve';
import {loadProgress,WalletBar} from '@/components/progression/AccountPanel';
import CombatArena from './CombatArena';
import CombatSkills from './CombatSkills';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
type Run={id:string;revision:number;state:PveState};
export default function PveTower(){
 const {currentUser,setPage,setAuthModal,settings}=useGameStore(),en=settings.language==='en';
 const [run,setRun]=useState<Run|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),lock=useRef(false);
 const [notice,setNotice]=useState('');
 useEffect(()=>{if(!currentUser)return;let alive=true;setBusy(true);lock.current=true;
 (async()=>{try{await flushProfile();const r=await fetch('/api/pve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({move:'resume'})});const b=await r.json();if(!r.ok)throw Error(tx(b.error));if(alive){setRun(b.run);if(b.loadoutSynced)setNotice(en?'Equipment synced. This floor restarted with your equipped weapon.':'Đã đồng bộ trang bị. Tầng hiện tại bắt đầu lại với vũ khí bạn đang dùng.');}}catch(e){if(alive)setError((e as Error).message);}finally{if(alive){setBusy(false);lock.current=false;}}})();return()=>{alive=false;};},[currentUser?.id]);
 async function act(move:string,args:Record<string,unknown>={}){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{await flushProfile();const r=await fetch('/api/pve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({move,args,id:run?.id,revision:run?.revision})});const b=await r.json();if(b.run)setRun(b.run);if(!r.ok)throw Error(tx(b.error));if(b.run.state.combat.winner===currentUser?.id)loadProgress().catch(()=>{});}
  catch(e){setError(e instanceof Error?e.message:tx('Mất kết nối'));}finally{lock.current=false;setBusy(false);}
 }
 const s=run?.state.combat,me=s?.players.find(p=>p.id===currentUser?.id),mine=s?.order[s.active]===me?.id,won=s?.winner===me?.id;
 const action=(label:string,move:string)=><button className="combat-roll action-beacon" disabled={busy} onClick={()=>act(move)}><img src={'/assets/sprites/ui/frames/'+(move==='end'?'btn_end_turn':'btn_roll_dice')+'.png'} alt=""/><span>{label}</span></button>;
 return <div className="pve-tower">{(!s||!me||s.winner&&!won)&&<header><button onClick={()=>setPage('play')}>{tx('← Quay lại')}</button><h2>{tx('THÁP XÚC XẮC · TẦNG')} {run?.state.stage||1}</h2><WalletBar/></header>}
 {!currentUser?<button onClick={()=>setAuthModal('login')}>{tx('Đăng nhập để lưu phần thưởng')}</button>:!s||!me||s.winner&&!won?<div className="pve-entry"><h2>{en?'THE DICE TOWER':'THÁP XÚC XẮC'}</h2><p>{en?'Common to Secret · Defeat each boss to climb higher.':'Thường đến Bí mật · Hạ từng boss để lên tầng tiếp theo.'}</p><button className="primary-action" disabled={busy} onClick={()=>act('start')}>{tx('BẮT ĐẦU CHUỖI MỚI')}</button></div>:<CombatArena state={s} viewer={me.id} busy={busy} onBack={()=>setPage('play')} title={(en?'DICE TOWER · FLOOR ':'THÁP XÚC XẮC · TẦNG ')+run!.state.stage} onSurrender={()=>{if(window.confirm(en?'Abandon this run?':'Dừng chuỗi này?'))act('surrender');}}>
 <div role="status" className="combat-status">{error|| (won?tx('TẦNG ĐÃ VƯỢT QUA'):s.phase==='defense'&&s.target===me.id?tx('Bạn cần tung phòng thủ'):mine?tx('Lượt của bạn'):tx('Đang chờ ')+'Boss')}</div>
 {notice&&<p className="equipment-sync-notice">{notice}</p>}
 <div className="pve-reward-preview">◆ {run!.state.reward.gems} Gem · ♦ {run!.state.reward.rubies} Ruby · +{run!.state.reward.exp} EXP</div>
 {won?<button className="primary-action" disabled={busy} onClick={()=>act('next')}>{tx('ĐI TIẾP TẦNG')} {run!.state.stage+1}</button>:<>
 <div className="four-commands">
 <button aria-label={en?'Roll dice':'Tung xúc xắc'} className="combat-roll" disabled={busy||!((mine&&['charge','target','attack'].includes(s.phase))||(s.phase==='defense'&&s.target===me.id))} onClick={()=>act(s.phase==='charge'?'charge':s.phase==='target'?'target':s.phase==='defense'?'defend':'attack')}><img src="/assets/sprites/ui/frames/btn_roll_dice.png" alt=""/></button>
 <button aria-label={en?'End turn':'Kết thúc lượt'} className="combat-roll" disabled={busy||!mine||s.phase!=='end'} onClick={()=>act('end')}><img src="/assets/sprites/ui/frames/btn_end_turn.png" alt=""/></button>
 <CombatSkills player={me} round={s.round} enabled={mine&&['target','attack'].includes(s.phase)} busy={busy} onCast={args=>act('skill',{...args,target:'pve_bot'})}/>
 </div></>}
 </CombatArena>}{error&&!s&&<p role="alert">{error}</p>}</div>;
}
