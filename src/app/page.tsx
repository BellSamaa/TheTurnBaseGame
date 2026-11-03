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

// Dynamically import BattleScreen to prevent any SSR canvas issues
const BattleScreen = dynamic(() => import('@/components/battle/BattleScreen'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-yellow-400 font-pixel text-xs animate-pulse">
      ĐANG TẢI CHIẾN TRƯỜNG 3D...
    </div>
  ),
});

export default function GameMasterPage() {
  const { currentPage } = useGameStore();

  return (
    <main className="relative min-h-screen w-full bg-black text-slate-100 overflow-x-hidden">
      {/* Global Audio Controller (BGM, Battle Music, Mute, Volume) */}
      <AudioManager />

      {/* Screen Router */}
      {currentPage === 'home' && <HomeScreen />}
      {currentPage === 'play' && <PlayMenu />}
      {currentPage === 'character' && <CharacterCustomizer />}
      {currentPage === 'weapons' && <WeaponsGallery />}
      {currentPage === 'friends' && <FriendsList />}
      {currentPage === 'settings' && <SettingsPanel />}
      {currentPage === 'battle' && <BattleScreen />}
    </main>
  );
}
