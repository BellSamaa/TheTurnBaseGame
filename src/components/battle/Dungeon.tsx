'use client';
import {BattleMusicToggle} from '@/components/audio/AudioManager';
import {dungeonPathAllowed} from '@/lib/dungeonGeometry';
import {useEffect,useRef,useState} from 'react';
import {flushProfile} from '@/lib/profileSync';
import {useGameStore} from '@/stores/gameStore';
import type {DungeonState} from '@/lib/dungeon';
import {dungeonArea,dungeonPositionAllowed,dungeonInteractionPoints} from '@/lib/dungeon';
import {DUNGEON_BUFFS,DUNGEON_RULES_EN,DUNGEON_RULES_VI,dungeonReward} from '@/lib/dungeonCatalog';
import WeaponsGallery from '@/components/weapons/WeaponsGallery';
import DungeonLoading from './DungeonLoading';
import DungeonClash from './DungeonClash';
import DungeonDiceDuel from './DungeonDiceDuel';
import DungeonOutcome from './DungeonOutcome';
import DungeonRooms from './DungeonRooms';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
import {playClickSound,playDiceRollSound,playBattleEffect,playTurnSound,playSaveSound} from '@/lib/soundEffects';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import {useDungeonMovement} from './useDungeonMovement';
import WeaponStand from './WeaponStand';
import {WeaponAura,WeaponStatus,WeaponWeather,WeaponSummons} from './WeaponWorldEffects';
import {RockCompanion,RockHealthBar} from './RockCompanion';
import CombatSkills from './CombatSkills';
import DiceTiming from './DiceTiming';
import DiceRoller3D from './DiceRoller3D';
import BattleWeaponPreview from './BattleWeaponPreview';
import VfxAnimationPlayer from './VfxAnimationPlayer';
import PixelFrame from '@/components/ui/PixelFrame';
import DungeonHealthBar from './DungeonHealthBar';
import {useCombatHits} from './useCombatHits';
import {useMeleeMotion} from './useMeleeMotion';
import {effectDuration} from '@/lib/skillMotion';
import {d6Allowance} from '@/lib/classMechanics';

type Room={code:string;state:DungeonState;revision:number};
const ROOT='/assets/dungeon/';
export default function Dungeon(){
  const {currentUser,setPage,settings,profile,setAuthModal}=useGameStore(),en=settings.language==='en';
  const [room,setRoom]=useState<Room>(),[code,setCode]=useState(''),[error,setError]=useState(''),[rules,setRules]=useState(false),[shop,setShop]=useState<string>();
  const busy=useRef(false),[sending,setSending]=useState(false),latest=useRef<Room|undefined>(undefined);
  const [position,setPosition]=useState({x:.5,y:.75}),pos=useRef<{x:number;y:number;moving?:boolean}>(position),keys=useRef(new Set<string>()),[moving,setMoving]=useState(false);
  const roomCode=room?.code;const stageRef=useRef<HTMLDivElement>(null);
  function accept(next:Room){
    if(latest.current?.code===next.code&&latest.current.revision>next.revision)return;
    latest.current=next;setRoom(next);
  }
  async function act(action:string,args:Record<string,unknown>={}){
    if(busy.current||effectTimer.current&&!['leave','move'].includes(action))return;
    busy.current=true;setSending(true);setError('');
    if(action==='roll')playDiceRollSound();
    try{
      if(action==='create'||action==='join')await flushProfile();
      let body:{room?:Room;left?:boolean;error?:string}={};
      const requestId=crypto.randomUUID();
      for(let attempt=0;attempt<3;attempt++){
        const response=await fetch('/api/dungeon',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:typeof args.roomCode==='string'?args.roomCode:latest.current?.code||code,revision:latest.current?.revision,requestId,action,args})});
        body=await response.json();
        if(body.room)accept(body.room);
        if(response.status===409&&body.room&&attempt<2)continue;
        if(!response.ok)throw Error(body.error);
        break;
      }
      if(body.left){sessionStorage.removeItem('dice-dungeon');latest.current=undefined;setRoom(undefined);setPage('play');}
      if(body.room)sessionStorage.setItem('dice-dungeon',body.room.code);
      if(['shop','equip'].includes(action))playSaveSound();
      return true;
    }catch(error){setError(error instanceof Error?error.message:'Connection failed');return false;}
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
    const saved=s?.positions[me.id],area=s?dungeonArea(s):0;const initial=saved&&dungeonPositionAllowed(saved.x,saved.y,area)?saved:{x:area?.30+Math.max(0,s?.players.findIndex(p=>p.id===me.id)??0)*.14:.5,y:area?.62:.75};pos.current=initial;setPosition(initial);
  },[safe,s?.phase,me?.id,s?.floor]);
  const area=s?dungeonArea(s):0;
  const points=dungeonInteractionPoints(area);
  const readyCount=s?.players.filter(p=>s.votes.includes(p.id)).length??0;
  const peers=useDungeonMovement(roomCode,me?.id,s?.players.map(p=>p.id)||[],area,safe,pos);
  const nearby=safe?Object.entries(points).find(([id,p])=>Math.hypot(position.x-p.x,position.y-p.y)<(id==='portal'?.11:.15))?.[0]:undefined;
  async function interact(){
    if(!safe||!me||busy.current)return;
    keys.current.clear();
    if(nearby)playClickSound();
    if(nearby==='portal')await act('ready',{position:pos.current});else if(nearby)setShop(nearby);
  }
  const interactRef=useRef(interact);interactRef.current=interact;
  useEffect(()=>{
    if(!safe||shop||rules){keys.current.clear();pos.current.moving=false;setMoving(false);return;}
    const down=(e:KeyboardEvent)=>{
      if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))return;
      if(e.key.toLowerCase()==='e'&&!e.repeat){e.preventDefault();void interactRef.current();}
      if(['w','a','s','d','W','A','S','D','Shift','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){keys.current.add(e.key.length===1?e.key.toLowerCase():e.key);e.preventDefault();}
    };
    const up=(e:KeyboardEvent)=>keys.current.delete(e.key.length===1?e.key.toLowerCase():e.key);
    const blur=()=>keys.current.clear();
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
    let frame=0,last=performance.now();
    function tick(now:number){
      const dt=Math.min(.04,(now-last)/1000);last=now;
      const dx=Number(keys.current.has('d')||keys.current.has('ArrowRight'))-Number(keys.current.has('a')||keys.current.has('ArrowLeft'));
      const dy=Number(keys.current.has('s')||keys.current.has('ArrowDown'))-Number(keys.current.has('w')||keys.current.has('ArrowUp'));
      const length=Math.hypot(dx,dy)||1,p=pos.current;
      if(!shop&&(dx||dy||pos.current.moving)){
        const speed=keys.current.has('Shift')?.27:.17;
        const x=p.x+dx/length*dt*speed,y=p.y+dy/length*dt*speed;
        const nextX=dungeonPathAllowed(p,{x,y:p.y},area)?x:p.x;
        const next={x:nextX,y:dungeonPathAllowed({x:nextX,y:p.y},{x:nextX,y},area)?y:p.y};
        pos.current={...next,moving:dx!==0||dy!==0};setPosition(next);setMoving(dx!==0||dy!==0);
      }
      frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(frame);blur();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
  },[safe,shop,rules,area,me?.id]);
  useEffect(()=>{if(s?.botDice?.stage==='rolling')playDiceRollSound()},[s?.botDice?.readyAt]);
  const [rollNotice,setRollNotice]=useState<DungeonState['lastRoll']>();
  useEffect(()=>{if(!s?.lastRoll||Date.now()-s.lastRoll.at>3500)return;setRollNotice(s.lastRoll);const timer=setTimeout(()=>setRollNotice(undefined),s.lastRoll.id==='dungeon_enemies'?4000:2500);return()=>clearTimeout(timer)},[s?.lastRoll?.at]);
  const [effect,setEffect]=useState<DungeonState['event']>();
  const effectQueue=useRef<NonNullable<DungeonState['event']>[]>([]),seenEffects=useRef(new Set<string>()),effectTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>{const incoming=s?.events?.length?s.events:s?.event?[s.event]:[];for(const event of incoming)if(Date.now()-(event.at??Date.now())<6000&&!seenEffects.current.has(event.id)){seenEffects.current.add(event.id);effectQueue.current.push(event);}const next=()=>{const event=effectQueue.current.shift();if(!event){effectTimer.current=undefined;setEffect(undefined);return;}setEffect(event);playBattleEffect(event.effect,true);effectTimer.current=setTimeout(next,effectDuration(event.effect,event.approach));};if(!effectTimer.current)next();},[s?.event?.id]);
  useEffect(()=>()=>{clearTimeout(effectTimer.current);effectQueue.current=[];},[]);
  const {impactReady,flipX}=useMeleeMotion(effect,stageRef);
  const button=(action:string,label:string,disabled=false)=><button className="combat-roll" disabled={sending||!!effect||disabled} onClick={()=>void act(action)}><img src={'/assets/sprites/ui/frames/btn_'+(action==='end'?'end_turn':'roll_dice')+'.png'} alt={label}/></button>;
  const floorPath=ROOT+'Floors/Floor_'+String(s?.floor||1).padStart(2,'0')+'/';
  const shared=me&&s?{...me,hp:s.teamHp,maxHp:s.teamMaxHp,d12Charge:s.pts}:undefined;
  useCombatHits(s?.hitEvents);
  const combat=!!s&&!safe&&!['room','loading'].includes(s.phase);
  useEffect(()=>{window.dispatchEvent(new CustomEvent('dice-dungeon-scene',{detail:combat}));if(combat)playTurnSound();return()=>{window.dispatchEvent(new CustomEvent('dice-dungeon-scene',{detail:false}))}},[combat]);
  return <div className={'dungeon-screen '+(safe?'dungeon-exploring':!s||s.phase==='room'?'dungeon-browsing':'dungeon-fighting')} onClickCapture={e=>{const button=(e.target as HTMLElement).closest('button:not(:disabled)');if(button&&!button.classList.contains('border-0')&&!button.closest('.dungeon-armory,.dungeon-room-tabs,.dice-timing'))playClickSound()}}>
    <header><button onClick={()=>room?void act('leave'):setPage('play')}>{en?'Return to Lobby':'Về Lobby'}</button><h1>DUNGEON {room?'· '+room.code:''}</h1><div className="dungeon-header-actions"><BattleMusicToggle/><button className="dungeon-rule-button" onClick={()=>setRules(true)}>{en?'Rules':'Luật chơi'}</button></div></header>
    {error&&<p role="alert">{error}</p>}
    {!currentUser?<button onClick={()=>setAuthModal('login')}>{en?'Sign in':'Đăng nhập'}</button>:!s||s.phase==='room'?<DungeonRooms state={s} code={roomCode} en={en} viewer={currentUser.id} busy={sending} onAction={(action,args)=>void act(action,args)} onClose={()=>room?void act('leave'):setPage('play')}/>:<>
      {combat&&s.clash&&<DungeonClash state={s} viewer={currentUser.id} en={en} busy={sending} onWager={stake=>void act('clash_wager',{stake})}/>}
      {combat&&<><div className="dungeon-team-hud"><div><b>{s.players.map(p=>p.name).join(' · ')}</b><div className="dungeon-health-with-armor"><DungeonHealthBar judgement={s.players.find(p=>p.weaponUpdate?.judgement)?.weaponUpdate?.judgement} current={s.teamHp} max={s.teamMaxHp} armor={s.players.reduce((n,p)=>n+(p.weaponUpdate?.armor||0),0)}/><small className="dungeon-armor">+{s.players.reduce((n,p)=>n+(p.weaponUpdate?.armor||0),0)} {en?'ARMOR':'GIÁP'}</small></div><small>{s.pts} PTS · {s.coins} {en?'Dungeon Coins':'Tiền Dungeon'}</small></div><strong>VS</strong><div><b>{s.enemies.filter(p=>p.hp>0).map(p=>p.name).join(' · ')||'DUNGEON'}</b><DungeonHealthBar judgement={s.enemies.find(p=>p.weaponUpdate?.judgement)?.weaponUpdate?.judgement} current={s.enemies.reduce((n,p)=>n+p.hp,0)} max={s.enemies.reduce((n,p)=>n+p.maxHp,0)||1} armor={s.enemies.reduce((n,p)=>n+(p.weaponUpdate?.armor||0),0)}/><small className="dungeon-armor">+{s.enemies.reduce((n,p)=>n+(p.weaponUpdate?.armor||0),0)} {en?'ARMOR':'GIÁP'}</small><small>{s.enemies.reduce((n,p)=>n+(p.d12Charge||0),0)} PTS</small></div></div>
      <nav className="dungeon-phases">{['attack','defense','charge','skills','enemy_skills','end'].map((phase,i)=><span key={phase} className={s.phase===phase?'active':''}>{i+1} · {(en?['TEAM ATK','TEAM DEF','CHARGE','TEAM SKILLS','ENEMY SKILLS','END']:['CÔNG','THỦ','SẠC','DÙNG CHIÊU','ĐỊCH DÙNG CHIÊU','KẾT THÚC'])[i]}</span>)}</nav></>}
      {safe&&<div className="dungeon-exploration-hud"><b>{s.phase==='rest'?(en?'REST AREA':'SẢNH NGHỈ'):(en?'DUNGEON ENTRANCE':'SẢNH DUNGEON')}</b><span>◈ {s.coins} {en?'COINS':'TIỀN'}</span><span>♥ {s.teamHp}/{s.teamMaxHp}</span><span>✦ {s.pts} PTS</span><small>{readyCount}/{s.players.length} {en?'READY':'SẴN SÀNG'}</small></div>}
      <div ref={stageRef} className="dungeon-stage" data-party-size={s.players.length} style={{backgroundImage:`url("${safe||s.phase==='loading'?s.phase==='rest'?ROOT+'Rest_Areas/rest_'+String(Math.floor((s.floor-1)/2)).padStart(2,'0')+'.webp':ROOT+'Entrance/Dungeon_Entrance.webp':floorPath+'Background.webp'}")`}}>
        {combat&&<><DungeonOutcome state={s} en={en}/>{!s.clash&&<DungeonDiceDuel state={s} en={en}/>}</>}
        <div className="dungeon-floor-label" hidden={!combat}>{en?'FLOOR':'TẦNG'} {s.floor} · {en?'ENCOUNTER':'TRẬN'} {s.encounter}/5 · ROUND {s.round}</div>
        {s.players.map((p,i)=><div key={p.id} data-fighter-id={p.id} data-row={Math.floor(i/2)} className={'dungeon-hero '+(safe?'is-exploring':'')} style={safe?{left:(p.id===me?.id?position.x:peers[p.id]?.x??s.positions[p.id]?.x??(.235+i*.175))*100+'%',top:(p.id===me?.id?position.y:peers[p.id]?.y??s.positions[p.id]?.y??.75)*100+'%'}:{left:(s.players.length<=2?18+i*20:14+i%2*22)+'%',top:(s.players.length<=2?78:68+Math.floor(i/2)*20)+'%'}}>
          <b>{p.name}</b>{!safe&&<WeaponStand weaponId={p.weapon.id} side="left"/>}{!safe&&<><WeaponAura player={p} round={s.round}/>{p.immuneDamageNext&&<div className="combat-immunity dungeon-immunity" title="Immune"/>}<RockCompanion player={p} side="left"/><WeaponSummons player={p} side="left"/></>}<CharacterRenderer character={p.character} size="md" animation={safe&&(p.id===me?.id?moving:peers[p.id]?.moving)?p.id===me?.id&&keys.current.has('Shift')?'run':'walk':'idle'}/><small hidden={safe} style={{color:'#fff0a3'}}>{en?p.weapon.name:p.weapon.nameVi}</small>{!safe&&<div className="dungeon-foot-status"><RockHealthBar compact player={p} round={s.round} maxHp={s.buffs.some(b=>b.id==='summoner'&&b.active)?30:25}/><WeaponStatus player={p} round={s.round}/>{p.weapon.passiveDesc&&<small title={en?p.weapon.passiveDesc:p.weapon.passiveDescVi}>{en?p.weapon.passiveDesc:p.weapon.passiveDescVi}</small>}</div>}
          {impactReady&&effect?.target===p.id&&<div className="dungeon-hit-vfx"><VfxAnimationPlayer activeVfx={{id:effect.id,effect:effect.effect,target:'center',flipX,size:150}}/></div>}
        </div>)}
        {!safe&&<WeaponWeather players={[...s.players,...s.enemies]} round={s.round}/>}
        {safe&&[{id:'hand',x:.18,name:'The Hand',file:'The_Hand.webp'},{id:'roger',x:.5,name:'Roger',file:'Roger_The_Captain.webp'},{id:'avocado',x:.8,name:'Avocado',file:'Avocado.webp'}].map(npc=><div className="dungeon-npc" data-npc-id={npc.id} data-facing={npc.id==='avocado'?'left':'right'} key={npc.id} style={{left:points[npc.id as 'hand'|'roger'|'avocado'].x*100+'%',top:points[npc.id as 'hand'|'roger'|'avocado'].y*100+'%'}}><span>{npc.name}</span><img src={ROOT+'NPC/'+npc.file} alt={npc.name}/></div>)}
        {!safe&&s.enemies.map((enemy,i)=><button className={'dungeon-enemy '+(s.encounter===5?'is-boss':s.encounter===3?'is-mini':'')} disabled={sending||!!s.botDice||enemy.hp<=0||s.phase!=='attack'} key={enemy.id} data-fighter-id={enemy.id} onClick={()=>void act('target',{target:enemy.id})} style={{left:(68+i*10)+'%',top:(82-i*5)+'%',opacity:enemy.hp>0?1:.2}}><img src={floorPath+(s.encounter===5?'boss':s.encounter===3?'mini_boss':'mob')+'.webp'} alt={enemy.name}/><small>{enemy.name}{s.target===enemy.id?' ◇':''}</small><WeaponAura player={enemy} round={s.round}/>{enemy.immuneDamageNext&&<div className="combat-immunity dungeon-immunity" title="Immune"/>}<RockCompanion player={enemy} side="right"/><WeaponSummons player={enemy} side="right"/><div className="dungeon-foot-status"><RockHealthBar compact player={enemy} round={s.round} maxHp={s.floor===5?(s.encounter===3?75:50):25}/><WeaponStatus player={enemy} round={s.round}/></div>{impactReady&&effect?.target===enemy.id&&<div className="dungeon-hit-vfx"><VfxAnimationPlayer activeVfx={{id:effect.id,effect:effect.effect,target:'center',flipX,size:180}}/></div>}</button>)}
        {safe&&s.buffs.some(b=>b.remaining>0)&&<aside className="dungeon-rest-loadout"><b>{en?'PARTY BLESSINGS':'BUFF CỦA ĐỘI'}</b>{s.buffs.filter(b=>b.remaining>0).map(b=><button key={b.id} disabled={sending||b.active||b.id==='underdog'} title={DUNGEON_BUFFS.find(x=>x.id===b.id)?.[en?'en':'description']} onClick={()=>void act('buff',{id:b.id})}>{DUNGEON_BUFFS.find(x=>x.id===b.id)?.[en?'name':'vi']||b.id} <span>{b.active?'✓':b.id==='underdog'?(en?'BOSS ONLY':'CẦN BOSS'):(en?'ACTIVATE':'KÍCH HOẠT')}</span></button>)}</aside>}
        {safe&&<div className="dungeon-touch">{[['w',0],['a',270],['s',180],['d',90]].map(([key,angle])=><button key={key} aria-label={String(key)} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);keys.current.add(String(key));}} onPointerUp={()=>keys.current.delete(String(key))} onPointerCancel={()=>keys.current.delete(String(key))}><svg viewBox="0 0 24 24" style={{transform:'rotate('+angle+'deg)'}}><path d="M10 3h4v2h2v2h2v2h2v2h-6v10h-4V11H4V9h2V7h2V5h2Z" fill="currentColor"/></svg></button>)}</div>}
        {safe&&<div className="dungeon-walk-help">WASD · Shift {en?"RUN":"CHẠY"} · E {en?"INTERACT":"TƯƠNG TÁC"}</div>}
        {safe&&<div className={'dungeon-portal-ready '+(s.votes.includes(currentUser.id)?'is-ready':'')} style={{left:'clamp(64px, '+points.portal.x*100+'%, calc(100% - 64px))',top:(points.portal.y-.07)*100+'%'}} role="status" aria-live="polite"><small>{en?'READY':'SẴN SÀNG'}</small><strong key={readyCount+':'+s.players.length}>{readyCount}/{s.players.length}</strong>{s.votes.includes(currentUser.id)&&<span>✓</span>}</div>}
        {safe&&nearby&&<button className="dungeon-interact" style={{left:"calc("+position.x*100+"% + 26px)",top:(position.y-.12)*100+"%"}} onClick={()=>void interact()}>E</button>}
        {s.phase==='loading'&&<DungeonLoading startedAt={s.startedAt} en={en}/>}
        {!effect&&['cleared','victory','defeat'].includes(s.phase)&&<div className="dungeon-stage-message"><h2>{s.phase==='cleared'?(en?'ENCOUNTER CLEARED':'HOÀN THÀNH TRẬN'):s.phase==='victory'?(en?'VICTORY':'CHIẾN THẮNG'):(en?'DEFEAT':'THẤT BẠI')}</h2>{s.encounter===5&&s.phase!=='defeat'&&<p>+{dungeonReward(s.floor).gems} Gem · +{dungeonReward(s.floor).rubies} Ruby · +{dungeonReward(s.floor).exp} EXP</p>}{s.phase==='cleared'&&<button disabled={sending||s.votes.includes(currentUser.id)} onClick={()=>void act('next')}>{en?'Continue':'Đi tiếp'} {s.votes.length}/{s.players.length}</button>}</div>}
      </div>
      {combat&&<><div className="dungeon-action-banner" aria-live="polite">{s.botDice?.stage==='rolling'?<span>{en?'ENEMY IS ROLLING':'ĐỐI THỦ ĐANG TUNG'} · {s.botDice.role==='charge'?'D6':'D20'}…</span>:s.botDice?.stage==='result'?<>{en?'ENEMY':'ĐỐI THỦ'} · {s.botDice.role==='charge'?'D6':s.botDice.role==='attack'?(en?'D20 ATK':'D20 CÔNG'):(en?'D20 DEF':'D20 THỦ')} <strong>{s.botDice.values.join(' + ')}</strong></>:rollNotice?<>{rollNotice.id==='dungeon_enemies'?(en?'ENEMY':'ĐỐI THỦ'):s.players.find(p=>p.id===rollNotice.id)?.name} · {rollNotice.die} <strong>{rollNotice.values.join(" + ")}</strong></>:effect?<>{s.players.find(p=>p.id===effect.caster)?.name||s.enemies.find(p=>p.id===effect.caster)?.name} · {effect.name}</>:null}</div>
      <div className="dungeon-bottom">
        <PixelFrame variant="gold"><div className="dungeon-commands"><div><p>{s.botDice?(en?'Watch the enemy dice result':'Xem kết quả xúc xắc đối thủ'):s.votes.includes(currentUser.id)?(en?'Done · waiting':'Đã xong · đang chờ'):s.phase.toUpperCase()}</p><div className="four-commands">{button('roll',en?'Roll dice':'Tung xúc xắc',!['attack','defense','charge'].includes(s.phase)||(s.rolls[currentUser.id]?.length||0)>=(s.phase==='charge'&&me?d6Allowance(me,s.round):1))}{button('end',en?'End turn':'Kết thúc',!['skills','end'].includes(s.phase)||s.votes.includes(currentUser.id))}{shared&&<CombatSkills player={shared} players={[shared,...s.enemies]} freeSlots={s.instinctReuse?.[shared.id]?.round===s.round?[s.instinctReuse[shared.id].slot]:[]} round={s.round} busy={sending||!!effect} enabled={s.phase==='skills'&&!s.votes.includes(currentUser.id)} onCast={args=>void act('skill',{...args,target:s.target})}/>}</div></div><DiceTiming dungeon key={s.round+":"+s.phase} state={me?.diceTiming?.round===s.round&&me.diceTiming.role===s.phase?me.diceTiming:undefined} enabled={!effect&&!s.botDice&&['attack','defense'].includes(s.phase)&&!s.rolls[currentUser.id]?.length&&!(s.phase==='attack'&&me?.boxerAttackRound===s.round&&(me.boxerAttackRolls?.length??0)>0)} busy={sending} en={en} onPress={elapsedMs=>void act('timing',{elapsedMs})}/><div className="dungeon-dice"><div className="dungeon-dice-pair"><div className="personal-d20"><DiceRoller3D diceType="d20" isRolling={false} targetValue={s.lastD20?.[currentUser.id]??null} label="D20"/></div><div className="personal-d6"><DiceRoller3D diceType="d6" isRolling={false} targetValue={s.phase==='charge'?s.rolls[currentUser.id]?.at(-1)??null:me?.weaponUpdate?.lastChargeValue??null} label="D6"/></div></div>{me&&<BattleWeaponPreview weapon={me.weapon} en={en}/>}</div></div>
        {s.phase==='end'&&<button onClick={()=>setShop('hand')}>{en?'Potions':'Dùng thuốc'}</button>}
        <div className="dungeon-owned-buffs">{s.buffs.filter(b=>b.remaining>0).map(b=><button disabled={sending||b.active} key={b.id} title={DUNGEON_BUFFS.find(x=>x.id===b.id)?.en} onClick={()=>void act('buff',{id:b.id})}>{DUNGEON_BUFFS.find(x=>x.id===b.id)?.[en?'name':'vi']||b.id} {b.active?'✓':''}</button>)}</div></PixelFrame>
        <PixelFrame variant="cyan" title={en?'BATTLE HISTORY':'LỊCH SỬ'}><div className="dungeon-history">{s.log.map((line,i)=><p key={i}>{line}</p>)}</div></PixelFrame>
      </div></>}
    </>}
    {rules&&<div className="dungeon-modal"><PixelFrame variant="gold" title={en?'DUNGEON RULES':'LUẬT DUNGEON'}><div className="dungeon-rules">{(en?DUNGEON_RULES_EN:DUNGEON_RULES_VI).map(line=><p key={line}>{line}</p>)}</div><button onClick={()=>setRules(false)}>{en?'Close':'Đóng'}</button></PixelFrame></div>}
    {shop==='roger'&&s&&me&&<div className="dungeon-armory"><WeaponsGallery equippedWeaponId={me.weapon.id} busy={sending} onClose={()=>setShop(undefined)} onEquip={id=>act('equip',{weapon:id,position:pos.current})}/></div>}
    {shop&&shop!=='roger'&&s&&<div className={'dungeon-modal dungeon-vendor vendor-'+shop}><PixelFrame variant={shop==='hand'?'cyan':'purple'} title={shop==='hand'?'THE HAND · APOTHECARY':'AVOCADO · ARCANE BLESSINGS'}><header className="dungeon-vendor-intro"><img src={ROOT+'NPC/'+(shop==='hand'?'The_Hand.webp':'Avocado.webp')} alt=""/><div><h2>{en?(shop==='hand'?'A remedy for every journey':'Power, at a price'):(shop==='hand'?'Hành trang cho chuyến đi':'Sức mạnh từ tinh tú')}</h2><p>{en?'Shared party funds':'Quỹ chung của cả đội'} · <strong>◈ {s.coins}</strong></p></div><button onClick={()=>setShop(undefined)} aria-label="Close">✕</button></header><div className="dungeon-shop">
      {shop==='hand'?[{id:'lucky',icon:'✦',name:en?'Fortune Elixir':'Thuốc May Mắn',description:en?'+10% chance of D20 = 20 for 2 encounters.':'Tăng 10% ra mặt 20 trong 2 trận.',cost:200},{id:'pts',icon:'◆',name:en?'Essence of Focus':'Tinh Chất Tập Trung',description:en?'+10 shared skill PTS.':'Cộng 10 PTS chung cho đội.',cost:150},{id:'hp',icon:'♥',name:en?'Vitality Potion':'Thuốc Sinh Lực',description:en?'Restore 20 shared HP.':'Hồi 20 HP chung cho đội.',cost:150}].map(item=><button key={item.id} disabled={sending||s.coins<item.cost||(item.id==='hp'&&s.teamHp>=s.teamMaxHp)} onClick={()=>void act('shop',{item:item.id,position:pos.current})}><span className={'vendor-item-icon potion-'+item.id}>{item.icon}</span><b>{item.name}</b><small>{item.description}</small><strong>◈ {item.cost}</strong><em>{en?'PURCHASE':'MUA'}</em></button>):DUNGEON_BUFFS.map((buff,i)=><button title={en?buff.en:buff.description} key={buff.id} disabled={sending||s.coins<500||s.buffs.some(b=>b.id===buff.id&&b.remaining>0)} onClick={()=>void act('shop',{item:buff.id,position:pos.current})}><span className="vendor-item-icon">{['✧','♜','♛','☾','⚔','♥','◈','✦','◆','☀'][i]}</span><b>{en?buff.name:buff.vi}</b><small>{en?buff.en:buff.description}</small><strong>◈ 500</strong><em>{s.buffs.some(b=>b.id===buff.id&&b.remaining>0)?(en?'OWNED':'ĐÃ CÓ'):(en?'PURCHASE':'MUA')}</em></button>)}
    </div>{error&&<p role="alert">{error}</p>}<PixelSpriteButton sprite="back" onClick={()=>setShop(undefined)}/></PixelFrame></div>}
  </div>;
}
