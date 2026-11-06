'use client';

import WorldLobby from './WorldLobby';
import WeaponsGallery from '@/components/weapons/WeaponsGallery';
import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import PixelButton from '@/components/ui/PixelButton';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelIcon from '@/components/ui/PixelIcon';
import GameModeSelector from './GameModeSelector';
import RoomBrowser from '@/components/battle/RoomBrowser';
import { playClickSound } from '@/lib/soundEffects';

export default function PlayMenu() {
  const { setPage, settings, currentUser, setAuthModal, onlineRoomCode } = useGameStore();
  const lang = settings.language;
  const isEn = lang === 'en';

  const [activeModal, setActiveModal] = useState<
    'none' | 'mode_selector' | 'rooms' | 'weapons'
  > (onlineRoomCode ? 'rooms' : 'none');

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center overflow-hidden p-3 sm:p-5 bg-[#07090e] select-none">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/background.png"
          alt="Play Background"
          fill
          priority
          className="object-cover filter brightness-[0.35] contrast-[1.15] blur-[1px]"
        />
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 w-full max-w-4xl flex items-center justify-between pb-3 border-b-2 border-yellow-500/50">
        <PixelSpriteButton
          sprite="back"
          onClick={() => {
            setPage('home');
          }}
          className="w-28 sm:w-36"
        />

        <h2 className="text-base sm:text-lg text-yellow-400 font-pixel drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]">
          {t('play', lang)}
        </h2>

        <div className="w-28 sm:w-36" />
      </header>

      <WorldLobby blocked={activeModal!=='none'} onDoor={setActiveModal}/>
      {activeModal==='weapons'&&<div className="fixed inset-0 z-50 overflow-auto"><WeaponsGallery onClose={()=>setActiveModal('none')}/></div>}
      {/* Modal: Game Mode Selector */}
      <AnimatePresence>
        {activeModal === 'mode_selector' && (
          <GameModeSelector onClose={() => setActiveModal('none')} />
        )}
      </AnimatePresence>

      {/* Modal: Room Browser */}
      <AnimatePresence>
        {activeModal === 'rooms' && (
          <RoomBrowser onClose={() => setActiveModal('none')} />
        )}
      </AnimatePresence>
    </div>
  );
}
