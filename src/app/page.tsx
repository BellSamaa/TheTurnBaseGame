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
    const key='room-before-refresh';
    const leave=(code:string)=>fetch('/api/rooms/'+code,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'refresh_leave'}),keepalive:true}).catch(()=>{});
    const stale=sessionStorage.getItem(key);if(stale){void leave(stale);sessionStorage.removeItem(key);useGameStore.setState({onlineRoomCode:null,battleState:null,currentPage:'home'});}
    const onHide=()=>{const code=useGameStore.getState().onlineRoomCode;if(code){sessionStorage.setItem(key,code);void leave(code);}};
    window.addEventListener('pagehide',onHide);return()=>window.removeEventListener('pagehide',onHide);
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
