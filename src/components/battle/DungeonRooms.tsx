'use client';
import {useEffect,useState} from 'react';
import type {DungeonState} from '@/lib/dungeon';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelButton from '@/components/ui/PixelButton';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
type Listing={code:string;host:string;count:number};
export default function DungeonRooms({state,code,en,busy,viewer,onAction,onClose}:{state?:DungeonState;code?:string;en:boolean;busy:boolean;viewer?:string;onAction:(action:string,args?:Record<string,unknown>)=>void;onClose:()=>void}){
 const [tab,setTab]=useState<'browse'|'create'>('browse'),[input,setInput]=useState(''),[rooms,setRooms]=useState<Listing[]>([]),[error,setError]=useState(''),[copied,setCopied]=useState(false);
 useEffect(()=>{if(state)return;let active=true;const refresh=async()=>{try{const r=await fetch('/api/dungeon?action=browse',{cache:'no-store'}),b=await r.json();if(!r.ok)throw Error(b.error);if(active){setRooms(b.rooms||[]);setError('')}}catch(e){if(active)setError((e as Error).message)}};void refresh();const timer=setInterval(refresh,5000);return()=>{active=false;clearInterval(timer)}},[!!state]);
 return <div className="dungeon-room-browser"><PixelFrame variant="purple" title={en?'DUNGEON EXPEDITION (1–4 PLAYERS)':'THÁM HIỂM DUNGEON (1–4 NGƯỜI)'} headerRight={<button aria-label={en?'Close':'Đóng'} onClick={onClose}>✕</button>}>
 {!state?<><div className="dungeon-room-tabs"><PixelButton variant={tab==='browse'?'gold':'secondary'} onClick={()=>setTab('browse')}>{en?'LOBBY LIST':'DANH SÁCH PHÒNG'} ({rooms.length})</PixelButton><PixelButton variant={tab==='create'?'gold':'secondary'} onClick={()=>setTab('create')}>+ {en?'CREATE ROOM':'TẠO PHÒNG'}</PixelButton></div>
 {tab==='browse'?<><form className="dungeon-code-entry" onSubmit={e=>{e.preventDefault();onAction('join',{roomCode:input})}}><label>{en?'ROOM CODE:':'MÃ PHÒNG:'}</label><input aria-label="Dungeon room code" placeholder="e.g. D482900" value={input} maxLength={7} onChange={e=>setInput(e.target.value.toUpperCase())}/><PixelSpriteButton sprite="join_room" type="submit" disabled={busy||!input.trim()}/></form><div className="dungeon-room-list">{rooms.length?rooms.map(r=><article key={r.code}><div><strong>{r.code}</strong><b>{r.host}</b><small>{r.count}/4 · DUNGEON</small></div><PixelSpriteButton sprite="join_room" disabled={busy} onClick={()=>onAction('join',{roomCode:r.code})}/></article>):<div className="dungeon-empty-rooms"><span>♜</span><b>{en?'NO PUBLIC DUNGEONS OPEN':'CHƯA CÓ PHÒNG DUNGEON'}</b><p>{en?'Create a room and share its code with your party.':'Tạo phòng và gửi mã cho bạn bè cùng tham gia.'}</p><PixelSpriteButton sprite="create_room" disabled={busy} onClick={()=>setTab('create')}/></div>}</div></>:<section className="dungeon-create-card" aria-labelledby="dungeon-create-title">
   <div className="dungeon-create-hero">
    <div className="dungeon-create-heading">
     <span>{en?'DUNGEON EXPEDITION':'THÁM HIỂM DUNGEON'}</span>
     <h2 id="dungeon-create-title">{en?'CREATE A ROOM':'TẠO PHÒNG'}</h2>
     <p>{en?'Open the portal and share your room code with friends.':'Mở cổng và gửi mã phòng cho bạn bè.'}</p>
    </div>
   </div>
   <dl className="dungeon-create-stats">
    <div><dt>{en?'PARTY SIZE':'ĐỘI HÌNH'}</dt><dd>{en?'1–4 players':'1–4 người'}</dd></div>
    <div><dt>{en?'EXPEDITION':'HÀNH TRÌNH'}</dt><dd>{en?'10 floors':'10 tầng'}</dd></div>
    <div><dt>{en?'SHARED POOL':'TÀI NGUYÊN CHUNG'}</dt><dd>{en?'HP · PTS · Coins':'HP · PTS · Tiền'}</dd></div>
   </dl>
   <div className="dungeon-create-actions">
    <p>{en?'Enter with your equipped character, class and weapon.':'Vào phòng với nhân vật, lớp và vũ khí đang trang bị.'}</p>
    <PixelSpriteButton sprite="create_room" title={en?'Create Dungeon room':'Tạo phòng Dungeon'} disabled={busy} onClick={()=>onAction('create')}/>
   </div>
  </section>}{error&&<p role="alert">{error}</p>}</>:
 <><div className="dungeon-room-code"><span>{en?'ROOM CODE':'MÃ PHÒNG'}</span><strong>{code}</strong><button onClick={()=>{void navigator.clipboard.writeText(code||'').then(()=>setCopied(true))}}>{copied?'✓':en?'COPY CODE':'SAO CHÉP'}</button><small>{en?'Share this code with your friends':'Gửi mã này cho bạn bè'}</small></div><div className="dungeon-party-slots">{Array.from({length:4},(_,i)=>{const p=state.players[i];return <div key={p?.id||i} className={p?'occupied':''}>{p?<><small>{p.id===state.host?'♛ HOST':'TRAVELER'}</small><CharacterRenderer character={p.character} size="md" animation="idle"/><b>{p.name}</b><span>{en?p.weapon.name:p.weapon.nameVi}</span></>:<><strong>+</strong><span>{en?'WAITING FOR PLAYER':'CHỜ NGƯỜI CHƠI'}</span></>}</div>})}</div><footer><PixelSpriteButton sprite="exit" onClick={onClose}/><PixelSpriteButton sprite="start" disabled={busy||state.host!==viewer} onClick={()=>onAction('start')}/></footer></>}
 </PixelFrame></div>;
}
