'use client';
import {useEffect,useRef,useState} from 'react';
import {useGameStore} from '@/stores/gameStore';
import type {DungeonState} from '@/lib/dungeon';
import {dungeonArea,dungeonPositionAllowed,dungeonInteractionPoints} from '@/lib/dungeon';
import {DUNGEON_BUFFS,DUNGEON_RULES_EN,DUNGEON_RULES_VI,dungeonReward} from '@/lib/dungeonCatalog';
import {WEAPONS_BY_TIER} from '@/lib/constants';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import {useDungeonMovement} from './useDungeonMovement';
import WeaponStand from './WeaponStand';
import {WeaponAura,WeaponStatus,WeaponWeather,WeaponSummons} from './WeaponWorldEffects';
import {RockCompanion} from './RockCompanion';
import CombatSkills from './CombatSkills';
import DiceTiming from './DiceTiming';
import DiceRoller3D from './DiceRoller3D';
import BattleWeaponPreview from './BattleWeaponPreview';
import VfxAnimationPlayer from './VfxAnimationPlayer';
import PixelFrame from '@/components/ui/PixelFrame';
import HealthBar from '@/components/ui/HealthBar';
import {d6Allowance} from '@/lib/classMechanics';

type Room={code:string;state:DungeonState;revision:number};
const ROOT='/assets/dungeon/';
export default function Dungeon(){
  const {currentUser,setPage,settings,profile,setAuthModal}=useGameStore(),en=settings.language==='en';
  const [room,setRoom]=useState<Room>(),[code,setCode]=useState(''),[error,setError]=useState(''),[rules,setRules]=useState(false),[shop,setShop]=useState<string>();
  const busy=useRef(false),[sending,setSending]=useState(false),latest=useRef<Room|undefined>(undefined);
  const [position,setPosition]=useState({x:.5,y:.75}),pos=useRef<{x:number;y:number;moving?:boolean}>(position),keys=useRef(new Set<string>()),[moving,setMoving]=useState(false);
  const roomCode=room?.code;
  function accept(next:Room){
    if(latest.current?.code===next.code&&latest.current.revision>next.revision)return;
    latest.current=next;setRoom(next);
  }
  async function act(action:string,args:Record<string,unknown>={}){
    if(busy.current)return;
    busy.current=true;setSending(true);setError('');
    try{
      let body:{room?:Room;left?:boolean;error?:string}={};
      const requestId=crypto.randomUUID();
      for(let attempt=0;attempt<3;attempt++){
        const response=await fetch('/api/dungeon',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:latest.current?.code||code,revision:latest.current?.revision,requestId,action,args})});
        body=await response.json();
        if(body.room)accept(body.room);
        if(response.status===409&&body.room&&attempt<2)continue;
        if(!response.ok)throw Error(body.error);
        break;
      }
      if(body.left){sessionStorage.removeItem('dice-dungeon');latest.current=undefined;setRoom(undefined);setPage('play');}
      if(body.room)sessionStorage.setItem('dice-dungeon',body.room.code);
    }catch(error){setError(error instanceof Error?error.message:'Connection failed');}
    finally{busy.current=false;setSending(false);if(action==='leave'){sessionStorage.removeItem('dice-dungeon');latest.current=undefined;setRoom(undefined);setPage('play');}}
  }
  useEffect(()=>{
    const saved=sessionStorage.getItem('dice-dungeon');
    if(!saved)return;
    fetch('/api/dungeon?code='+encodeURIComponent(saved)).then(async r=>{
      const b=await r.json();if(r.ok)accept(b.room);else sessionStorage.removeItem('dice-dungeon');
    }).catch(()=>setError('Connection failed'));
  },[]);
  useEffect(()=>{
    if(!roomCode)return;
    let active=true,polling=false;
    const timer=setInterval(async()=>{
      if(busy.current||polling)return;polling=true;
      try{const r=await fetch('/api/dungeon?code='+encodeURIComponent(roomCode),{cache:'no-store'});const b=await r.json();if(active&&r.ok)accept(b.room);else if(active&&r.status===404){sessionStorage.removeItem('dice-dungeon');latest.current=undefined;setRoom(undefined);setPage('play');}else if(active&&r.status>=400)setError(b.error);}catch{}finally{polling=false;}
    },800);
    return()=>{active=false;clearInterval(timer);};
  },[roomCode]);
  const s=room?.state,me=s?.players.find(p=>p.id===currentUser?.id),safe=!!s&&['entrance','rest'].includes(s.phase);
  useEffect(()=>{
    if(!safe||!me)return;
    const initial=s?.positions[me.id]||{x:.5,y:.75};pos.current=initial;setPosition(initial);
  },[safe,s?.phase,me?.id,s?.floor]);
  const area=s?dungeonArea(s):0;
  const points=dungeonInteractionPoints(area);
  const peers=useDungeonMovement(roomCode,me?.id,s?.players.map(p=>p.id)||[],area,safe,pos);
  const nearby=safe?Object.entries(points).find(([id,p])=>Math.hypot(position.x-p.x,position.y-p.y)<(id==='portal'?.11:.15))?.[0]:undefined;
  async function interact(){
    if(!safe||!me||busy.current)return;
    keys.current.clear();
    if(nearby==='portal')await act('ready',{position:pos.current});else if(nearby)setShop(nearby);
  }
  useEffect(()=>{
    if(!safe)return;
    const down=(e:KeyboardEvent)=>{
      if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))return;
      if(e.key.toLowerCase()==='e'&&!e.repeat){e.preventDefault();void interact();}
      if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){keys.current.add(e.key);e.preventDefault();}
    };
    const up=(e:KeyboardEvent)=>keys.current.delete(e.key);
    const blur=()=>keys.current.clear();
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
    let frame=0,last=performance.now();
    function tick(now:number){
      const dt=Math.min(.04,(now-last)/1000);last=now;
      const dx=Number(keys.current.has('d')||keys.current.has('ArrowRight'))-Number(keys.current.has('a')||keys.current.has('ArrowLeft'));
      const dy=Number(keys.current.has('s')||keys.current.has('ArrowDown'))-Number(keys.current.has('w')||keys.current.has('ArrowUp'));
      const length=Math.hypot(dx,dy)||1,p=pos.current;
      if(!shop){
        const x=p.x+dx/length*dt*.17,y=p.y+dy/length*dt*.17;
        const next={x:dungeonPositionAllowed(x,p.y,area)?x:p.x,y:dungeonPositionAllowed(p.x,y,area)?y:p.y};
        pos.current={...next,moving:dx!==0||dy!==0};setPosition(next);setMoving(dx!==0||dy!==0);
      }
      frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(frame);blur();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
  },[safe,shop,nearby,me?.id]);
  const [rollNotice,setRollNotice]=useState<DungeonState['lastRoll']>();
  useEffect(()=>{if(!s?.lastRoll||Date.now()-s.lastRoll.at>3500)return;setRollNotice(s.lastRoll);const timer=setTimeout(()=>setRollNotice(undefined),2500);return()=>clearTimeout(timer)},[s?.lastRoll?.at]);
  const [effect,setEffect]=useState<DungeonState['event']>();
  useEffect(()=>{if(!s?.event)return;setEffect(s.event);const timer=setTimeout(()=>setEffect(undefined),2200);return()=>clearTimeout(timer);},[s?.event?.id]);
  const button=(action:string,label:string,disabled=false)=><button className="combat-roll" disabled={sending||disabled} onClick={()=>void act(action)}><img src={'/assets/sprites/ui/frames/btn_'+(action==='end'?'end_turn':'roll_dice')+'.png'} alt={label}/></button>;
  const floorPath=ROOT+'Floors/Floor_'+String(s?.floor||1).padStart(2,'0')+'/';
  const shared=me&&s?{...me,hp:s.teamHp,maxHp:s.teamMaxHp,d12Charge:s.pts}:undefined;
  return <div className="dungeon-screen">
    <header><button onClick={()=>room?void act('leave'):setPage('play')}>{en?'Return to Lobby':'Về Lobby'}</button><h1>DUNGEON {room?'· '+room.code:''}</h1><button className="dungeon-rule-button" onClick={()=>setRules(true)}>{en?'Rules':'Luật chơi'}</button></header>
    {error&&<p role="alert">{error}</p>}
    {!currentUser?<button onClick={()=>setAuthModal('login')}>{en?'Sign in':'Đăng nhập'}</button>:!s?<PixelFrame variant="gold" title="DUNGEON · 1–4"><div className="dungeon-room-actions"><button disabled={sending} onClick={()=>void act('create')}>{en?'Create Dungeon Room':'Tạo phòng Dungeon'}</button><input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="D123456" aria-label="Dungeon room code"/><button disabled={sending||!code} onClick={()=>void act('join')}>{en?'Join':'Vào phòng'}</button></div></PixelFrame>:<>
      <div className="dungeon-team-hud"><div><b>{s.players.map(p=>p.name).join(' · ')}</b><HealthBar current={s.teamHp} max={s.teamMaxHp}/><small>{s.pts} PTS · {s.coins} {en?'Dungeon Coins':'Tiền Dungeon'}</small></div><strong>VS</strong><div><b>{s.enemies.filter(p=>p.hp>0).map(p=>p.name).join(' · ')||'DUNGEON'}</b><HealthBar current={s.enemies.reduce((n,p)=>n+p.hp,0)} max={s.enemies.reduce((n,p)=>n+p.maxHp,0)||1}/><small>{s.enemies.reduce((n,p)=>n+(p.d12Charge||0),0)} PTS</small></div></div>
      <nav className="dungeon-phases">{['attack','defense','charge','skills','enemy_skills','end'].map((phase,i)=><span key={phase} className={s.phase===phase?'active':''}>{i+1} · {(en?['TEAM ATK','TEAM DEF','CHARGE','TEAM SKILLS','ENEMY SKILLS','END']:['CÔNG','THỦ','SẠC','DÙNG CHIÊU','ĐỊCH DÙNG CHIÊU','KẾT THÚC'])[i]}</span>)}</nav>
      <div className="dungeon-stage" style={{backgroundImage:`url("${s.phase==='room'||safe||s.phase==='loading'?s.phase==='rest'?ROOT+'Rest_Areas/rest_'+String(Math.floor((s.floor-1)/2)).padStart(2,'0')+'.webp':ROOT+'Entrance/Dungeon_Entrance.webp':floorPath+'Background.webp'}")`}}>
        <div className="dungeon-floor-label">{en?'FLOOR':'TẦNG'} {s.floor} · {en?'ENCOUNTER':'TRẬN'} {s.encounter}/5 · ROUND {s.round}</div>
        {s.players.map((p,i)=><div key={p.id} className={'dungeon-hero '+(safe?'is-exploring':'')} style={safe?{left:(p.id===me?.id?position.x:peers[p.id]?.x??s.positions[p.id]?.x??(.235+i*.175))*100+'%',top:(p.id===me?.id?position.y:peers[p.id]?.y??s.positions[p.id]?.y??.75)*100+'%'}:{left:(14+i%2*16)+'%',top:(77+Math.floor(i/2)*17)+'%'}}>
          <b>{p.name}</b><WeaponStand weaponId={p.weapon.id} side="left"/><WeaponAura player={p} round={s.round}/><RockCompanion player={p} side="left"/><WeaponSummons player={p} side="left"/><CharacterRenderer character={p.character} size="md" animation={safe&&(p.id===me?.id?moving:peers[p.id]?.moving)?'walk':'idle'}/><small style={{color:'#fff0a3'}}>{en?p.weapon.name:p.weapon.nameVi}</small><WeaponStatus player={p} round={s.round}/>
          {effect?.target===p.id&&<VfxAnimationPlayer activeVfx={{id:effect.id,effect:effect.effect,target:'center',size:150}}/>}
        </div>)}
        {!safe&&<WeaponWeather players={[...s.players,...s.enemies]} round={s.round}/>}
        {safe&&[{id:'hand',x:.18,name:'The Hand',file:'The_Hand.webp'},{id:'roger',x:.5,name:'Roger',file:'Roger_The_Captain.webp'},{id:'avocado',x:.8,name:'Avocado',file:'Avocado.webp'}].map(npc=><div className="dungeon-npc" key={npc.id} style={{left:points[npc.id as 'hand'|'roger'|'avocado'].x*100+'%',top:points[npc.id as 'hand'|'roger'|'avocado'].y*100+'%'}}><span>{npc.name}</span><img src={ROOT+'NPC/'+npc.file} alt={npc.name}/></div>)}
        {!safe&&s.phase!=='room'&&s.enemies.map((enemy,i)=><button className={'dungeon-enemy '+(s.encounter===5?'is-boss':s.encounter===3?'is-mini':'')} disabled={sending||enemy.hp<=0||s.phase!=='attack'} key={enemy.id} onClick={()=>void act('target',{target:enemy.id})} style={{left:(68+i*10)+'%',top:(82-i*5)+'%',opacity:enemy.hp>0?1:.2}}><img src={floorPath+(s.encounter===5?'boss':s.encounter===3?'mini_boss':'mob')+'.webp'} alt={enemy.name}/><small>{enemy.name}{s.target===enemy.id?' ◇':''}</small>{effect?.target===enemy.id&&<VfxAnimationPlayer activeVfx={{id:effect.id,effect:effect.effect,target:'center',size:180}}/>}</button>)}
        {safe&&<div className="dungeon-touch">{[['w',0],['a',270],['s',180],['d',90]].map(([key,angle])=><button key={key} aria-label={String(key)} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);keys.current.add(String(key));}} onPointerUp={()=>keys.current.delete(String(key))} onPointerCancel={()=>keys.current.delete(String(key))}><svg viewBox="0 0 24 24" style={{transform:'rotate('+angle+'deg)'}}><path d="M10 3h4v2h2v2h2v2h2v2h-6v10h-4V11H4V9h2V7h2V5h2Z" fill="currentColor"/></svg></button>)}</div>}
        {safe&&nearby&&<button className="dungeon-interact" onClick={()=>void interact()}>E · {nearby==='portal'?(en?'Ready':'Sẵn sàng'):nearby}</button>}
        {s.phase==='room'&&<div className="dungeon-stage-message"><p>{s.players.length}/4 · {s.players.map(p=>p.name).join(', ')}</p>{s.host===currentUser.id&&<button disabled={sending} onClick={()=>void act('start')}>{en?'Enter Dungeon':'Vào Dungeon'}</button>}</div>}
        {s.phase==='loading'&&<div className="dungeon-loading">{en?'Welcome to Dungeon':'Chào mừng đến Dungeon'}<br/>{en?'Good Luck Traveler!':'Chúc nhà lữ hành may mắn!'}</div>}
        {['cleared','victory','defeat'].includes(s.phase)&&<div className="dungeon-stage-message"><h2>{s.phase==='cleared'?(en?'ENCOUNTER CLEARED':'HOÀN THÀNH TRẬN'):s.phase==='victory'?(en?'VICTORY':'CHIẾN THẮNG'):(en?'DEFEAT':'THẤT BẠI')}</h2>{s.encounter===5&&s.phase!=='defeat'&&<p>+{dungeonReward(s.floor).gems} Gem · +{dungeonReward(s.floor).rubies} Ruby · +{dungeonReward(s.floor).exp} EXP</p>}{s.phase==='cleared'&&<button disabled={sending||s.votes.includes(currentUser.id)} onClick={()=>void act('next')}>{en?'Continue':'Đi tiếp'} {s.votes.length}/{s.players.length}</button>}</div>}
      </div>
      <div className="dungeon-action-banner" aria-live="polite">{rollNotice?<>{s.players.find(p=>p.id===rollNotice.id)?.name} · {rollNotice.die} <strong>{rollNotice.values.join(" + ")}</strong></>:effect?<>{s.players.find(p=>p.id===effect.caster)?.name||s.enemies.find(p=>p.id===effect.caster)?.name} · {effect.name}</>:null}</div>
      <div className="dungeon-bottom">
        <PixelFrame variant="gold"><div className="dungeon-commands"><div><p>{s.votes.includes(currentUser.id)?(en?'Done · waiting':'Đã xong · đang chờ'):s.phase.toUpperCase()}</p><div className="four-commands">{button('roll',en?'Roll dice':'Tung xúc xắc',!['attack','defense','charge'].includes(s.phase)||(s.rolls[currentUser.id]?.length||0)>=(s.phase==='charge'&&me?d6Allowance(me,s.round):1))}{button('end',en?'End turn':'Kết thúc',!['skills','end'].includes(s.phase)||s.votes.includes(currentUser.id))}{shared&&<CombatSkills player={shared} players={[shared,...s.enemies]} freeSlots={s.instinctReuse?.[shared.id]?.round===s.round?[s.instinctReuse[shared.id].slot]:[]} round={s.round} busy={sending} enabled={s.phase==='skills'&&!s.votes.includes(currentUser.id)} onCast={args=>void act('skill',{...args,target:s.target})}/>}</div></div><DiceTiming state={me?.diceTiming?.round===s.round?me.diceTiming:undefined} enabled={['attack','defense'].includes(s.phase)&&!s.rolls[currentUser.id]?.length&&!(s.phase==='attack'&&me?.boxerAttackRound===s.round&&(me.boxerAttackRolls?.length??0)>0)} busy={sending} en={en} onPress={()=>void act('timing')}/><div className="dungeon-dice"><div className="dungeon-dice-pair"><div className="personal-d20"><DiceRoller3D diceType="d20" isRolling={false} targetValue={s.lastD20?.[currentUser.id]??null} label="D20"/></div><div className="personal-d6"><DiceRoller3D diceType="d6" isRolling={false} targetValue={s.phase==='charge'?s.rolls[currentUser.id]?.at(-1)??null:me?.weaponUpdate?.lastChargeValue??null} label="D6"/></div></div>{me&&<BattleWeaponPreview weapon={me.weapon} en={en}/>}</div></div>
        {s.phase==='end'&&<button onClick={()=>setShop('hand')}>{en?'Potions':'Dùng thuốc'}</button>}
        <div className="dungeon-owned-buffs">{s.buffs.filter(b=>b.remaining>0).map(b=><button disabled={sending||b.active} key={b.id} title={DUNGEON_BUFFS.find(x=>x.id===b.id)?.en} onClick={()=>void act('buff',{id:b.id})}>{DUNGEON_BUFFS.find(x=>x.id===b.id)?.[en?'name':'vi']||b.id} {b.active?'✓':''}</button>)}</div></PixelFrame>
        <PixelFrame variant="cyan" title={en?'BATTLE HISTORY':'LỊCH SỬ'}><div className="dungeon-history">{s.log.map((line,i)=><p key={i}>{line}</p>)}</div></PixelFrame>
      </div>
    </>}
    {rules&&<div className="dungeon-modal"><PixelFrame variant="gold" title={en?'DUNGEON RULES':'LUẬT DUNGEON'}><div className="dungeon-rules">{(en?DUNGEON_RULES_EN:DUNGEON_RULES_VI).map(line=><p key={line}>{line}</p>)}</div><button onClick={()=>setRules(false)}>{en?'Close':'Đóng'}</button></PixelFrame></div>}
    {shop&&s&&<div className="dungeon-modal"><PixelFrame variant="gold" title={shop==='hand'?'THE HAND':shop==='roger'?'ROGER THE CAPTAIN':'AVOCADO'}><div className="dungeon-shop">
      {shop==='hand'?['lucky','pts','hp'].map(item=><button key={item} disabled={sending} onClick={()=>void act('shop',{item,position:pos.current})}>{item==='lucky'?'Lucky +10% · 2 encounters · 200':item==='pts'?'+10 PTS · 150':'+20 HP · 150'}</button>):shop==='roger'?WEAPONS_BY_TIER.map(w=><button key={w.id} disabled={sending} onClick={()=>void act('equip',{weapon:w.id,position:pos.current})}><img src={w.image} alt=""/>{en?w.name:w.nameVi}</button>):DUNGEON_BUFFS.map(buff=><button title={en?buff.en:buff.description} key={buff.id} disabled={sending} onClick={()=>void act('shop',{item:buff.id,position:pos.current})}>{en?buff.name:buff.vi} · 500<small>{en?buff.en:buff.description}</small></button>)}
    </div><button onClick={()=>setShop(undefined)}>{en?'Close':'Đóng'}</button></PixelFrame></div>}
  </div>;
}
