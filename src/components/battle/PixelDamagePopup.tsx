'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface DamageEvent {
  id: string;
  target: 'p1' | 'p2';
  text: string;
  type: 'damage' | 'crit' | 'block' | 'skill' | 'heal';
  subtext?: string;
}

interface PixelDamagePopupProps {
  event: DamageEvent | null;
}

export default function PixelDamagePopup({ event }: PixelDamagePopupProps) {
  if (!event) return null;

  const isCrit = event.type === 'crit';
  const isBlock = event.type === 'block';
  const isHeal = event.type === 'heal';
  const isSkill = event.type === 'skill';

  const bgStyle = isCrit
    ? 'bg-yellow-400 text-black border-2 border-yellow-200 shadow-[0_0_20px_#facc15]'
    : isBlock
    ? 'bg-cyan-900 text-cyan-200 border-2 border-cyan-400 shadow-[0_0_15px_#38bdf8]'
    : isHeal
    ? 'bg-emerald-800 text-emerald-100 border-2 border-emerald-400 shadow-[0_0_15px_#34d399]'
    : isSkill
    ? 'bg-purple-900 text-yellow-300 border-2 border-purple-400 shadow-[0_0_18px_#c084fc]'
    : 'bg-red-950 text-yellow-300 border-2 border-red-500 shadow-[0_0_18px_#ef4444]';

  const icon = isCrit ? '⚡' : isBlock ? '🛡️' : isHeal ? '💚' : isSkill ? '✨' : '💥';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, y: 15 }}
      animate={{
        opacity: [0, 1, 1, 0.9],
        scale: [0.3, 1.35, 1.1, 1.0],
        y: [15, -45, -55, -65],
      }}
      exit={{ opacity: 0, y: -80, scale: 0.8 }}
      transition={{ duration: 1.4, times: [0, 0.2, 0.7, 1] }}
      className="absolute -top-16 z-50 pointer-events-none flex flex-col items-center select-none"
      style={{ imageRendering: 'pixelated' }}
    >
      <div
        className={`px-3 py-1 font-pixel font-bold flex items-center gap-1.5 whitespace-nowrap ${bgStyle}`}
        style={{
          boxShadow: '3px 3px 0px #000, -2px -2px 0px rgba(255,255,255,0.2)',
          textShadow: '2px 2px 0px #000',
        }}
      >
        <span className="text-sm">{icon}</span>
        <span className="text-sm sm:text-base tracking-widest">{event.text}</span>
      </div>

      {event.subtext && (
        <span
          className="mt-0.5 text-[8px] font-pixel text-yellow-300 bg-black/90 px-1.5 py-0.5 border border-yellow-500/80"
          style={{ textShadow: '1px 1px 0px #000' }}
        >
          {event.subtext}
        </span>
      )}
    </motion.div>
  );
}
