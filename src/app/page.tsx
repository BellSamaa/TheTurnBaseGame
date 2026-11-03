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
import AuthModals from '@/components/auth/AuthModals';

// Dynamically import BattleScreen to prevent any SSR canvas issues
const BattleScreen = dynamic(() => import('@/components/battle/BattleScreen'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-yellow-400 font-pixel text-xs animate-pulse">
      LOADING 3D BATTLE ARENA...
    </div>
  ),
});

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
  const { currentPage, settings } = useGameStore();
  const langClass = settings?.language === 'vi' ? 'lang-vi' : 'lang-en';

  return (
    <main className={`relative min-h-screen w-full bg-black text-slate-100 overflow-x-hidden ${langClass}`}>
      {/* Global Audio Controller (BGM, Battle Music, Mute, Volume) */}
      <AudioManager />

      {/* Global Auth Modals (Login, Sign Up, Profile & Character Inspector) */}
      <AuthModals />

      {/* Screen Router */}
      {currentPage === 'home' && <HomeScreen />}
      {currentPage === 'play' && <PlayMenu />}
      {currentPage === 'character' && <CharacterCustomizer />}
      {currentPage === 'weapons' && <WeaponsGallery />}
      {currentPage === 'friends' && <FriendsList />}
      {currentPage === 'settings' && <SettingsPanel />}
      {currentPage === 'battle' && <BattleScreen />}
      {currentPage === 'preview' && <SpriteContactSheet />}
    </main>
  );
}
