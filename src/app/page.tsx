'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useGameStore } from '@/stores/gameStore';
import AudioManager from '@/components/audio/AudioManager';
import HomeScreen from '@/components/home/HomeScreen';
import PlayMenu from '@/components/home/PlayMenu';
import CharacterCustomizer from '@/components/character/CharacterCustomizer';
import WeaponsGallery from '@/components/weapons/WeaponsGallery';
import FriendsList from '@/components/friends/FriendsList';
import SettingsPanel from '@/components/settings/SettingsPanel';
import PresenceReporter from '@/components/auth/PresenceReporter';
import AuthModals from '@/components/auth/AuthModals';
import PveTower from '@/components/battle/PveTower';
import Dungeon from '@/components/battle/Dungeon';
import LmsBattle from '@/components/battle/LmsBattle';
import BattleScreen from '@/components/battle/BattleScreen';

// Dynamically import SpriteContactSheet for sprite audit and inspection
const SpriteContactSheet = dynamic(() => import('@/components/preview/SpriteContactSheet'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-yellow-400 font-pixel text-xs animate-pulse">
      LOADING SPRITE ATLAS...
    </div>
  ),
});

export default function GameMasterPage() {
  const { currentPage, settings, battleState } = useGameStore();
  const langClass = settings?.language === 'vi' ? 'lang-vi' : 'lang-en';

  React.useEffect(()=>{
    const key='active-online-battle';let active=true;
    const legacy=sessionStorage.getItem('room-before-refresh'),legacyUser=useGameStore.getState().currentUser;if(legacy&&legacyUser&&!sessionStorage.getItem(key))sessionStorage.setItem(key,JSON.stringify({code:legacy,userId:legacyUser.id}));sessionStorage.removeItem('room-before-refresh');
    const restore=async()=>{
      const cached=sessionStorage.getItem(key);if(!cached)return;
      try{
        const st=useGameStore.getState();if(st.currentPage==='battle'||st.currentPage==='pve')return;const saved=JSON.parse(cached),user=st.currentUser;if(!user||saved.userId!==user.id){sessionStorage.removeItem(key);return;}
        if(saved.mode==='pve'){useGameStore.setState({currentPage:'pve'});return;}
        const response=await fetch('/api/rooms/'+encodeURIComponent(saved.code),{cache:'no-store'}),body=await response.json();if(!active)return;
        if(!response.ok){if(response.status===404)sessionStorage.removeItem(key);return;}
        const room=body.room,participants=room?.participants||[room?.host,room?.guest].filter(Boolean);
        if(!room?.battleState||!participants.some((p:{id:string})=>p.id===user.id)||!['playing','finished'].includes(room.status)){sessionStorage.removeItem(key);return;}
        useGameStore.setState({onlineRoomCode:saved.code,battleState:room.battleState,currentPage:'battle'});
      }catch{/* Leave the marker intact so a temporary network error can retry on focus. */}
    };
    void restore();window.addEventListener('focus',restore);
    const remember=()=>{const st=useGameStore.getState();if(st.currentPage==='pve'&&st.currentUser){sessionStorage.setItem(key,JSON.stringify({mode:'pve',userId:st.currentUser.id}));return;}if(st.onlineRoomCode&&st.battleState&&st.currentUser&&st.currentPage==='battle')sessionStorage.setItem(key,JSON.stringify({code:st.onlineRoomCode,userId:st.currentUser.id}));};
    const unsubscribe=useGameStore.subscribe((st,prev)=>{if((prev.onlineRoomCode&&!st.onlineRoomCode)||(prev.currentPage==='pve'&&st.currentPage!=='pve'))sessionStorage.removeItem(key);else remember();});
    const onHide=()=>{const st=useGameStore.getState();if(st.onlineRoomCode&&st.battleState&&st.currentPage==='battle'){remember();return;}if(st.onlineRoomCode)void fetch('/api/rooms/'+st.onlineRoomCode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'refresh_leave'}),keepalive:true}).catch(()=>{});};
    window.addEventListener('pagehide',onHide);return()=>{active=false;unsubscribe();window.removeEventListener('focus',restore);window.removeEventListener('pagehide',onHide);};
  },[]);
  React.useEffect(()=>{document.documentElement.lang=settings.language||'en';},[settings.language]);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __gameStore: typeof useGameStore }).__gameStore = useGameStore;
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      const user = useGameStore.getState().currentUser;
      if (!user) return;
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        const session = await response.json();
        if (cancelled || useGameStore.getState().currentUser !== user) return;
        if (response.status === 401 || (response.ok && session.userId !== user.id)) {
          useGameStore.setState({ currentUser: null, authModal: 'login' });
        }
      } catch { /* Network failure is not proof of logout. */ }
    };
    void verify();
    window.addEventListener('focus', verify);
    return () => { cancelled = true; window.removeEventListener('focus', verify); };
  }, []);

  return (
    <main className={`relative min-h-screen w-full bg-black text-slate-100 overflow-x-hidden ${langClass}`}>
      {/* Global Audio Controller (BGM, Battle Music, Mute, Volume) */}
      <AudioManager />
      <PresenceReporter />

      {/* Global Auth Modals (Login, Sign Up, Profile & Character Inspector) */}
      <AuthModals />

      {/* Screen Router */}
      {currentPage === 'home' && <HomeScreen />}
      {currentPage === 'play' && <PlayMenu />}
      {currentPage === 'dungeon' && <Dungeon />}
      {currentPage === 'pve' && <PveTower />}
      {currentPage === 'character' && <CharacterCustomizer />}
      {currentPage === 'weapons' && <WeaponsGallery />}
      {currentPage === 'friends' && <FriendsList />}
      {currentPage === 'settings' && <SettingsPanel />}
      {currentPage === 'battle' && (battleState?.lms ? <LmsBattle /> : <BattleScreen />)}
      {currentPage === 'preview' && <SpriteContactSheet />}
    </main>
  );
}
