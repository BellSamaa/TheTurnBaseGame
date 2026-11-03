'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import PixelButton from '@/components/ui/PixelButton';
import ParticleEffect from '@/components/ui/ParticleEffect';
import PixelFrame from '@/components/ui/PixelFrame';

export default function HomeScreen() {
  const { setPage, settings } = useGameStore();
  const lang = settings.language;

  const menuItems = [
    {
      id: 'play',
      label: t('play', lang),
      icon: '⚔️',
      variant: 'primary' as const,
      onClick: () => setPage('play'),
    },
    {
      id: 'character',
      label: t('character', lang),
      icon: '🛡️',
      variant: 'gold' as const,
      onClick: () => setPage('character'),
    },
    {
      id: 'weapons',
      label: t('weapons', lang),
      icon: '🗡️',
      variant: 'secondary' as const,
      onClick: () => setPage('weapons'),
    },
    {
      id: 'friends',
      label: t('friends', lang),
      icon: '👥',
      variant: 'frame' as const,
      onClick: () => setPage('friends'),
    },
    {
      id: 'settings',
      label: t('settings', lang),
      icon: '⚙️',
      variant: 'frame' as const,
      onClick: () => setPage('settings'),
    },
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center overflow-hidden">
      {/* Background Cover Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/background.png"
          alt="Dice Maniac Background"
          fill
          priority
          className="object-cover object-center filter brightness-[0.75] contrast-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
      </div>

      {/* Floating Sparkles & Particles */}
      <ParticleEffect density={28} />

      {/* Top Header / Status bar */}
      <div className="relative z-20 w-full px-6 pt-5 flex items-center justify-between">
        <div className="text-[10px] sm:text-xs text-yellow-400 font-pixel drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex items-center gap-2">
          <span className="w-2.5 h-2.5 inline-block bg-yellow-400 animate-pulse" />
          <span>v2.0 • PIXEL RPG EDITION</span>
        </div>
      </div>

      {/* Center: Logo and Menu Buttons */}
      <div className="relative z-20 flex flex-col items-center justify-center my-auto w-full max-w-xl px-4">
        {/* Animated Logo */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, type: 'spring' }}
          className="relative w-[300px] h-[110px] sm:w-[460px] sm:h-[150px] mb-6 animate-float animate-pulse-glow"
        >
          <Image
            src="/assets/images/logo.png"
            alt="DICE MANIAC"
            fill
            priority
            className="object-contain drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]"
          />
        </motion.div>

        {/* Menu Buttons Box with Pixel RPG Frame */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <PixelFrame variant="gold" className="p-4 sm:p-6 backdrop-blur-md bg-black/60">
            <div className="flex flex-col gap-3">
              {menuItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.08 }}
                >
                  <PixelButton
                    variant={item.variant}
                    size="lg"
                    onClick={item.onClick}
                    className="w-full text-xs sm:text-sm py-3"
                    icon={<span>{item.icon}</span>}
                  >
                    {item.label}
                  </PixelButton>
                </motion.div>
              ))}
            </div>
          </PixelFrame>
        </motion.div>
      </div>

      {/* Footer / Credits Section - Exactly as requested */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative z-20 w-full pb-6 px-4 text-center"
      >
        <div className="inline-block px-5 py-2.5 bg-black/80 border-2 border-slate-700/80 shadow-[0_0_15px_rgba(0,0,0,0.9)] backdrop-blur-sm">
          <p className="text-[10px] sm:text-xs text-slate-300 leading-relaxed font-pixel">
            Game tạo bởi{' '}
            <span className="author-bell text-[#ff4444] font-bold">Bell</span>
            {', '}
            <span className="author-snow text-white font-bold">Snow</span>
            {' và '}
            <span className="sparkle-shiratosi">Shiratosi</span>
            {' và 1 số cái khác'}
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
