'use client';
import {attackerHasActed} from '@/lib/skillPriority';
import {useEffect,useRef,useState} from 'react';
import {flushProfile} from '@/lib/profileSync';
import {tx} from '@/lib/uiLocale';
import {useGameStore} from '@/stores/gameStore';
import type {PveState} from '@/lib/pve';
import {loadProgress,WalletBar} from '@/components/progression/AccountPanel';
import CombatArena from './CombatArena';
import CombatSkills from './CombatSkills';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
type Run={id:string;revision:number;state:PveState};
export default function PveTower(){
 const {currentUser,setPage,setAuthModal,settings}=useGameStore(),en=settings.language==='en';
 const [run,setRun]=useState<Run|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),lock=useRef(false);
 const alive=useRef(true);useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{if(!currentUser)return;let alive=true;setBusy(true);lock.current=true;
 (async()=>{try{await flushProfile();const r=await fetch('/api/pve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({move:'resume'})});const b=await r.json();if(!r.ok)throw Error(tx(b.error));if(alive){setRun(b.run);}}catch(e){if(alive)setError((e as Error).message);}finally{if(alive){setBusy(false);lock.current=false;}}})();return()=>{alive=false;};},[currentUser?.id]);
 async function act(move:string,args:Record<string,unknown>={}){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{if(move!=='duel_wager'&&move!=='resolve')await flushProfile();const r=await fetch('/api/pve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({move,args,id:run?.id,revision:run?.revision})});const b=await r.json();if(!r.ok){if(b.run)setRun(b.run);throw Error(tx(b.error));}if(b.abandoned){setRun(null);setPage('play');return;}for(const frame of b.frames||[]){if(!alive.current)return;setRun({...b.run,state:frame});if(frame.combat.duelClash?.defenderId===currentUser?.id)continue;await new Promise(resolve=>setTimeout(resolve,2600));}if(!alive.current)return;if(b.run)setRun(b.run);if(b.run.state.combat.winner===currentUser?.id)loadProgress().catch(()=>{});}
  catch(e){setError(e instanceof Error?e.message:tx('Mất kết nối'));}finally{lock.current=false;setBusy(false);}
 }
 const s=run?.state.combat,me=s?.players.find(p=>p.id===currentUser?.id),mine=s?.order[s.active]===me?.id,won=s?.winner===me?.id;
 const pendingClash=s?.duelClash;
 useEffect(()=>{
  if(!pendingClash||busy||pendingClash.defenderId!==currentUser?.id)return;
  const timer=setTimeout(()=>void act('resolve'),Math.max(error?1000:120,pendingClash.deadline-Date.now()+120));
  return()=>clearTimeout(timer);
 },[pendingClash?.deadline,busy,run?.revision,currentUser?.id]);
 const attacker=s?.players.find(p=>p.id===s.order[s.active]);
 const skillPriority=mine||!!attacker&&attackerHasActed(attacker,s!.round,!!s?.skillDone?.includes(attacker.id));
 const chargeBlocked=!!me&&['charge','charge_defense'].includes(s!.phase)&&me.weaponUpdate?.slowChargeRound===s!.round&&me.weaponUpdate.slowChargeBlocked;
 const action=(label:string,move:string)=><button className="combat-roll action-beacon" disabled={busy} onClick={()=>act(move)}><img src={'/assets/sprites/ui/frames/'+(move==='end'?'btn_end_turn':'btn_roll_dice')+'.png'} alt=""/><span>{label}</span></button>;
 return <div className="pve-tower">{(!s||!me||s.winner&&!won)&&<header><button onClick={()=>setPage('play')}>{tx('← Quay lại')}</button><h2>{tx('THÁP XÚC XẮC · TẦNG')} {run?.state.stage||1}</h2><WalletBar/></header>}
 {!currentUser?<button onClick={()=>setAuthModal('login')}>{tx('Đăng nhập để lưu phần thưởng')}</button>:!s||!me||s.winner&&!won?<div className="pve-entry"><h2>{en?'THE DICE TOWER':'THÁP XÚC XẮC'}</h2><p>{en?'Common to Secret · Defeat each boss to climb higher.':'Thường đến Bí mật · Hạ từng boss để lên tầng tiếp theo.'}</p><button className="primary-action" disabled={busy} onClick={()=>act('start')}>{tx('BẮT ĐẦU CHUỖI MỚI')}</button></div>:<CombatArena state={s} viewer={me.id} busy={busy} onDuelWager={stake=>void act('duel_wager',{stake})} onBack={()=>setPage('play')} title={(en?'DICE TOWER · FLOOR ':'THÁP XÚC XẮC · TẦNG ')+run!.state.stage} onSurrender={()=>{if(window.confirm(en?'Abandon this run?':'Dừng chuỗi này?'))act('surrender');}}>
 <div role="status" className="combat-status">{error|| (won?tx('TẦNG ĐÃ VƯỢT QUA'):s.phase==='skills'?(s.skillDone?.includes(me.id)?(en?'Waiting for opponent to finish':'Chờ đối thủ kết thúc'):(en?'Use skills or End Turn':'Dùng kỹ năng hoặc Kết thúc lượt')):s.phase==='charge_defense'&&s.target===me.id?(en?'Roll D6 · Defender':'Tung D6 · Bên thủ'):s.phase==='defense'&&s.target===me.id?tx('Bạn cần tung phòng thủ'):mine?tx('Lượt của bạn'):tx('Đang chờ ')+'Boss')}</div>
 <div className="pve-reward-preview">◆ {run!.state.reward.gems} Gem · ♦ {run!.state.reward.rubies} Ruby · +{run!.state.reward.exp} EXP</div>
 {won?<button className="primary-action" disabled={busy} onClick={()=>act('next')}>{tx('ĐI TIẾP TẦNG')} {run!.state.stage+1}</button>:<>
 <div className="four-commands">
 <button aria-label={en?'Roll dice':'Tung xúc xắc'} className="combat-roll" disabled={busy||chargeBlocked||!((mine&&['charge','target','attack'].includes(s.phase))||(['defense','charge_defense'].includes(s.phase)&&s.target===me.id))} onClick={()=>act(['charge','charge_defense'].includes(s.phase)?'charge':s.phase==='target'?'target':s.phase==='defense'?'defend':'attack')}><img src="/assets/sprites/ui/frames/btn_roll_dice.png" alt=""/></button>
 <button aria-label={en?'End turn':'Kết thúc lượt'} className="combat-roll" disabled={busy||!((chargeBlocked&&(mine||s.target===me.id))||(mine&&s.phase==='end')||(s.phase==='skills'&&!s.skillDone?.includes(me.id)))} onClick={()=>act(chargeBlocked?'charge':'end')}><img src="/assets/sprites/ui/frames/btn_end_turn.png" alt=""/></button>
 <CombatSkills players={s.players} player={me} round={s.round} enabled={skillPriority&&s.phase==='skills'&&!s.skillDone?.includes(me.id)} busy={busy} onCast={args=>act('skill',{...args,target:'pve_bot'})}/>
 </div></>}
 </CombatArena>}
 {won&&run&&<div className="pve-victory-overlay"><PixelFrame variant="gold" title={en?'FLOOR CLEARED!':'VƯỢT TẦNG!'}><div className="pve-victory-content"><h2>{en?'Victory':'Chiến thắng'} · {run.state.stage}</h2><p>◆ {run.state.reward.gems} Gem · ♦ {run.state.reward.rubies} Ruby · +{run.state.reward.exp} EXP</p><small>{en?'Rewards saved. Rest now or challenge the next floor.':'Đã lưu phần thưởng. Nghỉ tại đây hoặc thử sức tầng kế tiếp.'}</small><div><button disabled={busy} onClick={()=>setPage('play')}>{en?'Claim & rest':'Nhận thưởng & nghỉ'}</button><button disabled={busy} onClick={()=>act('next')}>{en?'Continue':'Tiếp tục'}</button></div></div></PixelFrame></div>}{error&&!s&&<p role="alert">{error}</p>}</div>;
}
