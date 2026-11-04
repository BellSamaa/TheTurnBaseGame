'use client';
import {tx} from '@/lib/uiLocale';
import PlayerAvatar from '@/components/ui/PlayerAvatar';
import {levelProgress,rankProgress} from '@/lib/progression';
import type {CharacterCustomization} from '@/types/game';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import PixelButton from '@/components/ui/PixelButton';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
import PixelFrame from '@/components/ui/PixelFrame';

type Person = { avatar_config?:CharacterCustomization;equipped_frame?:number;exp?:number;rank_points?:number; id: string; name: string; userId?: string; role?: string; tag?: string };
type Social = { actorId: string; friends: Person[]; incoming: Person[]; outgoing: Person[]; clanInvites: Person[]; clan: null | { id: string; name: string; tag: string; description: string; ownerId: string; role: string; members: Person[] } };
export default function FriendsList() {
  const { setPage, settings, currentUser, setAuthModal } = useGameStore();
  const en = settings.language === 'en';
  const [data, setData] = useState<Social | null>(null);
  const [error, setError] = useState('');
  const [loginRequired, setLoginRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'friends' | 'clan'>('friends');
  const [name, setName] = useState('');
  const [clanName, setClanName] = useState('');
  const [tag, setTag] = useState('');
  const [invite, setInvite] = useState('');
  const requestVersion = useRef(0);
  const pending = useRef(false);
  const refresh = useCallback(async () => {
    if (pending.current || !currentUser) return;
    const version = ++requestVersion.current;
    try {
      const res = await fetch('/api/social', { cache: 'no-store' });
      const body = await res.json();
      if (version !== requestVersion.current) return;
      const expired = res.status === 401 || (res.ok && body.actorId !== currentUser.id);
      setLoginRequired(expired);
      if (expired) useGameStore.setState({ currentUser: null });
      if (!res.ok) throw new Error(body.error);
      if (body.actorId !== currentUser.id) throw new Error(en ? 'Please sign in again.' : 'Vui lòng đăng nhập lại.');
      setData(body); setError('');
    } catch (e) { if (version === requestVersion.current) setError(e instanceof Error ? e.message : 'Connection failed'); }
  }, [currentUser, en]);
  useEffect(() => {
    setData(null); refresh();
    const timer = setInterval(refresh, 5000);
    return () => { clearInterval(timer); requestVersion.current++; };
  }, [refresh]);
  const act = async (action: string, values: Record<string,string> = {}) => {
    if (pending.current) return;
    pending.current = true; requestVersion.current++; setBusy(true); setError('');
    try {
      const res = await fetch('/api/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...values }) });
      const body = await res.json();
      if (res.status === 401) setLoginRequired(true);
      if (!res.ok) throw new Error(body.error);
      setData(body); setName(''); setInvite('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Connection failed'); }
    finally { pending.current = false; setBusy(false); }
  };
  const button = (label: string, action: string, id: string) => <button disabled={busy} className="px-3 py-2 border border-cyan-600 text-cyan-200 hover:bg-cyan-950 disabled:opacity-40" onClick={() => act(action, { id })}>{label}</button>;
  const input = 'min-w-0 flex-1 bg-slate-950 border border-slate-600 rounded px-3 py-2 text-sm';
  const submit = 'px-4 py-2 bg-yellow-400 text-black font-bold disabled:opacity-40';
  const list = (people: Person[], action: string, label: string, accept?: string) => people.length ? people.map(p => <div key={p.id} className="flex flex-wrap gap-2 justify-between items-center border-b border-slate-800 py-3"><span className="flex items-center gap-2">{p.avatar_config&&<PlayerAvatar character={p.avatar_config} frame={p.equipped_frame||0} size={48}/>}<span>{p.tag ? `[${p.tag}] ` : ''}{p.name}{p.userId&&<small className="block">{tx(rankProgress(p.rank_points).name)} · LV {levelProgress(p.exp).level}</small>}</span></span><div className="flex gap-2">{accept && button(en ? 'Accept' : 'Chấp nhận', accept, p.id)}{button(label, action, p.id)}</div></div>) : <p className="text-slate-500 py-3">{en ? 'Nothing here yet.' : 'Chưa có mục nào.'}</p>;
  return <div className="social-screen min-h-screen bg-[#07090e] text-slate-200 p-4 sm:p-8">
    <div className="max-w-3xl mx-auto space-y-4">
      <header className="flex justify-between items-center"><PixelSpriteButton sprite="back" className="w-28 sm:w-36" title={en ? 'Back' : 'Quay lại'} onClick={() => setPage('home')} /><h1 className="font-pixel text-yellow-300 text-sm">{en ? 'FRIENDS & CLAN' : 'BẠN BÈ & CLAN'}</h1></header>
      {(!currentUser || loginRequired) ? <PixelFrame variant="gold" title={en ? "JOIN YOUR FRIENDS" : "KẾT NỐI BẠN BÈ"}><p>{en ? 'Sign in to connect with friends.' : 'Đăng nhập lại để kết nối bạn bè và clan.'}</p><PixelButton onClick={() => setAuthModal('login')}>{en ? 'Sign in' : 'Đăng nhập'}</PixelButton></PixelFrame> : <>
      <nav className="flex gap-2">{(['friends','clan'] as const).map(t => <button key={t} onClick={() => setTab(t)} className={'px-5 py-2 border ' + (tab===t ? 'border-yellow-400 text-yellow-300' : 'border-slate-700')}>{t==='friends' ? (en ? 'Friends' : 'Bạn bè') : 'Clan'}</button>)}</nav>
      {error && <div role="alert" className="border border-red-700 p-3 text-red-300">{error} <button onClick={refresh} className="underline">{en ? 'Retry' : 'Thử lại'}</button></div>}
      {!data && !error && <p>{en ? 'Loading…' : 'Đang tải…'}</p>}
      {data && tab==='friends' && <>
        <PixelFrame variant="cyan" title={en ? 'ADD FRIEND' : 'KẾT BẠN'}><form className="flex gap-2" onSubmit={e => { e.preventDefault(); act('request_friend', { name }); }}><input required maxLength={100} aria-label="Player name or ID" className={input} placeholder={en ? 'Exact username or ID' : 'Tên tài khoản hoặc ID chính xác'} value={name} onChange={e=>setName(e.target.value)} /><button className={submit} disabled={busy || !name.trim()}>{en ? 'Send' : 'Gửi'}</button></form></PixelFrame>
        <PixelFrame title={en ? 'INCOMING REQUESTS' : 'LỜI MỜI NHẬN'}>{list(data.incoming,'decline_friend',en?'Decline':'Từ chối','accept_friend')}</PixelFrame>
        <PixelFrame title={en ? 'SENT REQUESTS' : 'LỜI MỜI ĐÃ GỬI'}>{list(data.outgoing,'cancel_friend',en?'Cancel':'Hủy')}</PixelFrame>
        <PixelFrame variant="gold" title={(en?'FRIENDS: ':'BẠN BÈ: ')+data.friends.length}>{list(data.friends,'remove_friend',en?'Unfriend':'Xóa bạn')}</PixelFrame>
      </>}
      {data && tab==='clan' && <>
        <PixelFrame title={en ? 'CLAN INVITATIONS' : 'LỜI MỜI CLAN'}>{list(data.clanInvites,'decline_clan',en?'Decline':'Từ chối','accept_clan')}</PixelFrame>
        {data.clan ? <PixelFrame variant="gold" title={`[${data.clan.tag}] ${data.clan.name}`}>
          <p>{data.clan.description}</p>
          {data.clan.members.map(m=><div className="flex justify-between py-2 border-b border-slate-800" key={m.id}><span>{m.name}</span><span className="text-yellow-300">{m.role==='leader' ? (en?'Leader':'Trưởng clan') : m.role==='officer' ? (en?'Officer':'Phó clan') : (en?'Member':'Thành viên')}</span></div>)}
          {['leader','officer'].includes(data.clan.role) && <form className="flex gap-2 my-4" onSubmit={e=>{e.preventDefault();act('invite_clan',{name:invite});}}><input required maxLength={100} className={input} aria-label="Invite player" placeholder={en?'Player username':'Tên người chơi'} value={invite} onChange={e=>setInvite(e.target.value)} /><button className={submit} disabled={busy || !invite.trim()}>{en?'Invite':'Mời'}</button></form>}
          <p className="text-xs text-slate-400 mt-4">{en?'If the leader leaves, leadership transfers to the next member. An empty clan is closed.':'Trưởng clan rời sẽ chuyển quyền cho thành viên còn lại. Clan không còn ai sẽ đóng.'}</p>
          <button disabled={busy} className="mt-3 border border-red-600 px-4 py-2 text-red-300" onClick={()=>{if(window.confirm(en?'Leave this clan?':'Rời clan này?'))act('leave_clan');}}>{en?'Leave clan':'Rời clan'}</button>
        </PixelFrame> : <PixelFrame variant="cyan" title={en?'CREATE CLAN':'TẠO CLAN'}><form className="flex flex-col gap-3" onSubmit={e=>{e.preventDefault();act('create_clan',{name:clanName,tag});}}><input className={input} required minLength={3} maxLength={40} aria-label="Clan name" placeholder={en?'Clan name (3–40 characters)':'Tên clan (3–40 ký tự)'} value={clanName} onChange={e=>setClanName(e.target.value)} /><input className={input} required pattern="[A-Z0-9]{2,6}" maxLength={6} aria-label="Clan tag" placeholder="TAG (2–6: A–Z, 0–9)" value={tag} onChange={e=>setTag(e.target.value.toUpperCase())} /><button disabled={busy} className={submit}>{en?'Create':'Tạo clan'}</button></form></PixelFrame>}
      </>}
      </>}
    </div>
  </div>;
}
