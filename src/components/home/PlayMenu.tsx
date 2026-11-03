'use client';

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
  const { setPage, settings, currentUser, setAuthModal } = useGameStore();
  const lang = settings.language;
  const isEn = lang === 'en';

  const [activeModal, setActiveModal] = useState<
    'none' | 'mode_selector' | 'rooms'
  >('none');

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

      {/* Main Mode Options */}
      <main className="relative z-20 w-full max-w-4xl my-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 py-6">
        {/* 1. Quick Battle / Mode Selector Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="cursor-pointer"
          onClick={() => {
            playClickSound();
            setActiveModal('mode_selector');
          }}
        >
          <PixelFrame
            variant="gold"
            title={isEn ? 'BATTLE COMBAT ARENA' : 'ĐẤU TRƯỜNG TRANH TÀI'}
            className="h-full bg-gradient-to-b from-yellow-950/40 to-[#0c101c]/95 hover:border-yellow-300 transition"
          >
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-14 h-14 rounded bg-yellow-950/80 border-2 border-yellow-500/80 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                <PixelIcon name="sword" size={28} color="#facc15" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold font-pixel text-yellow-300 mb-1.5">
                {isEn ? 'SELECT GAME MODE' : 'CHỌN CHẾ ĐỘ CHƠI'}
              </h3>
              <p className="text-[8px] sm:text-[8.5px] text-slate-300 font-sans leading-relaxed mb-4">
                {isEn
                  ? 'Choose between PvE AI Bot, Rank Last Man Standing, Ranked PvP, or view Party mode.'
                  : 'Lựa chọn đấu với Boss AI PvE, Rank Last Man Standing, Đấu Hạng PvP hoặc chế độ Nhóm.'}
              </p>
              <PixelSpriteButton sprite="start" className="w-44 sm:w-52 mx-auto" />
            </div>
          </PixelFrame>
        </motion.div>

        {/* 2. Custom Lobby / Online Room Browser */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="cursor-pointer"
          onClick={() => {
            playClickSound();
            if (!currentUser) {
              setAuthModal('signup');
              return;
            }
            setActiveModal('rooms');
          }}
        >
          <PixelFrame
            variant={currentUser ? 'cyan' : 'gold'}
            title={isEn ? 'ONLINE ROOMS & LOBBY' : 'PHÒNG CHƠI TRỰC TUYẾN'}
            className="h-full bg-gradient-to-b from-cyan-950/40 to-[#0c101c]/95 hover:border-cyan-300 transition relative"
          >
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-14 h-14 rounded bg-cyan-950/80 border-2 border-cyan-500/80 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <PixelIcon name="users" size={28} color="#38bdf8" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold font-pixel text-cyan-300 mb-1.5">
                {t('createRoom', lang)}
              </h3>
              <p className="text-[8px] sm:text-[8.5px] text-slate-300 font-sans leading-relaxed mb-3">
                {isEn
                  ? 'Create or join custom 1v1 rooms via room codes for direct online battles with real players.'
                  : 'Tạo hoặc tham gia phòng riêng bằng mã phòng để so tài trực tiếp với người chơi khác.'}
              </p>

              {/* Account Gate Notice */}
              {!currentUser ? (
                <div className="w-full bg-yellow-950/80 border border-yellow-500/70 p-2 text-[8px] font-pixel text-yellow-300 mb-3 shadow">
                  🔒 {isEn ? 'REQUIRES ACCOUNT TO PLAY ONLINE (CLICK TO SIGN UP)' : 'CẦN TẠO TÀI KHOẢN ĐỂ CHƠI ONLINE (BẤM ĐỂ ĐĂNG KÝ)'}
                </div>
              ) : (
                <div className="w-full bg-emerald-950/80 border border-emerald-500/70 p-1.5 text-[8px] font-pixel text-emerald-300 mb-3 shadow">
                  ✓ {isEn ? `ONLINE READY: ${currentUser.username}` : `ĐÃ ĐĂNG NHẬP: ${currentUser.username}`}
                </div>
              )}

              <PixelSpriteButton sprite="join_room" className="w-44 sm:w-52 mx-auto" />
            </div>
          </PixelFrame>
        </motion.div>
      </main>

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
