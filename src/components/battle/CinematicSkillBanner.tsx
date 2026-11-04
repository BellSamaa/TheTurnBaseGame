'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { playUltimateAuraSound } from '@/lib/soundEffects';

export interface SkillActivationEvent {
  id: string;
  weaponId: string;
  skillNameEn: string;
  skillNameVi?: string;
  slot?: 1 | 2;
  casterName: string;
  auraColor: string; // e.g. '#a855f7' for Hollow Purple
  secondaryColor?: string;
  icon?: string;
}

interface CinematicSkillBannerProps {
  queue: SkillActivationEvent[];
  onFinishOne: (id: string) => void;
}

export default function CinematicSkillBanner({
  queue,
  onFinishOne,
}: CinematicSkillBannerProps) {
  const isEn = useGameStore(s => s.settings.language === 'en');
  const currentEvent = queue.length > 0 ? queue[0] : null;

  useEffect(() => {
    if (currentEvent) {
      if (currentEvent.slot === 2) playUltimateAuraSound();
      const timer = setTimeout(() => {
        onFinishOne(currentEvent.id);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [currentEvent?.id]);

  if (!currentEvent) return null;

  const aura = currentEvent.auraColor || '#facc15';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentEvent.id}
        initial={{ x: '-100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 220 }}
        className="fixed inset-x-0 top-[15%] z-50 pointer-events-none select-none flex flex-col items-center"
      >
        {/* Full-width Aura Flare Ribbon */}
        <div
          className="relative w-[min(92vw,560px)] py-2 sm:py-3 flex flex-col items-center justify-center border-y-4 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden"
          style={{
            background: `linear-gradient(90deg, rgba(0,0,0,0.9) 0%, ${aura}cc 30%, rgba(10,12,20,0.98) 50%, ${aura}cc 70%, rgba(0,0,0,0.9) 100%)`,
            borderColor: aura,
            boxShadow: `0 0 35px ${aura}aa, inset 0 0 20px ${aura}88`,
          }}
        >
          {/* Shimmer sweep effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer pointer-events-none" />

          {/* Subtitle: Caster + Weapon */}
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[9px] sm:text-xs font-pixel text-yellow-200 tracking-widest uppercase mb-1 drop-shadow"
            style={{ textShadow: '1px 1px 2px #000' }}
          >
            ✦ {currentEvent.casterName} · SKILL {currentEvent.slot ?? ''} ✦
          </motion.div>

          {/* English Skill Name in Grand Pixel Typography */}
          <motion.h1
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.08, 1.0] }}
            transition={{ duration: 0.4 }}
            className="text-xs sm:text-lg font-pixel font-bold text-white tracking-widest text-center px-4"
            style={{
              textShadow: `0 0 10px ${aura}, 0 0 20px ${aura}, 2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000`,
            }}
          >
            ⚔️ {(isEn ? currentEvent.skillNameEn : currentEvent.skillNameVi || currentEvent.skillNameEn).toUpperCase()} ⚔️
          </motion.h1>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
