/* ──────────────────────────────────────────────
   HealthBar – Ornate Gold & Ruby Pixel Health Bar
   Using authentic frame: Khung thanh máu pixel vàng ngọc.png (Aspect 3:1)
   Exact Inner Opening: left 14%, width 72%, top 35.5%, height 28%
   ────────────────────────────────────────────── */
'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface HealthBarProps {
  current: number;
  max: number;
  playerName?: string;
  variant?: 'gold' | 'red' | 'cyan';
  className?: string;
}

export default function HealthBar({
  current,
  max,
  playerName = '',
  variant = 'gold',
  className = '',
}: HealthBarProps) {
  const safeCurrent = Math.max(0, Math.min(max, current));
  const currentPct = useMemo(() => Math.max(0, Math.min(1, safeCurrent / max)), [safeCurrent, max]);

  // Chip-loss ghost bar: tracks the previous HP and delays dropping
  const [ghostPct, setGhostPct] = useState(currentPct);
  const prevCurrentRef = useRef(safeCurrent);

  useEffect(() => {
    if (safeCurrent < prevCurrentRef.current) {
      const timer = setTimeout(() => {
        setGhostPct(currentPct);
      }, 450);
      prevCurrentRef.current = safeCurrent;
      return () => clearTimeout(timer);
    } else {
      setGhostPct(currentPct);
      prevCurrentRef.current = safeCurrent;
    }
  }, [safeCurrent, currentPct]);

  // Health color palette
  const hpColor = useMemo(() => {
    if (currentPct > 0.5) return 'from-emerald-500 to-green-600';
    if (currentPct > 0.25) return 'from-amber-400 to-yellow-600';
    return 'from-rose-500 to-red-700';
  }, [currentPct]);

  return (
    <div className={`relative flex flex-col items-center w-full max-w-[280px] sm:max-w-[320px] mx-auto ${className}`}>
      {/* Player Header Label (if supplied) */}
      {playerName && (
        <div className="flex items-center justify-between w-full px-2 mb-0.5 text-[8.5px] font-pixel">
          <span className="text-yellow-300 font-bold drop-shadow truncate max-w-[150px]">
            {playerName}
          </span>
          <span className="text-slate-300">
            {safeCurrent} / {max} HP
          </span>
        </div>
      )}

      {/* Ornate Gold & Ruby HP Frame (Aspect 3:1 Container) */}
      <div className="relative w-full aspect-[3/1] max-h-12 flex items-center justify-center select-none">
        {/* Authentic Pixel Frame Foreground Image */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <Image
            src="/assets/sprites/ui/frames/frame_hp_gold_ruby.png"
            alt="Gold Ruby HP Frame"
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>

        {/* Inner Health Bar Slot (Pixel-matched opening: left 14%, width 72%, top 35.5%, height 28%) */}
        <div
          className="absolute z-10 bg-[#08070d] overflow-hidden shadow-[inset_0_0_6px_rgba(0,0,0,0.95)] flex items-center"
          style={{
            left: '14%',
            width: '72%',
            top: '35.5%',
            height: '28%',
          }}
        >
          {/* Subtle grid lines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25 z-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, #000 0, #000 1px, transparent 1px, transparent 10%)',
            }}
          />

          {/* 1. Ghost Lag Bar */}
          <motion.div
            className="absolute top-0 bottom-0 left-0 bg-red-400/80 z-10"
            initial={false}
            animate={{ width: `${ghostPct * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />

          {/* 2. Real Current HP Bar with Gradient */}
          <motion.div
            className={`absolute top-0 bottom-0 left-0 bg-gradient-to-r ${hpColor} z-10 shadow-[0_0_8px_rgba(34,197,94,0.5)]`}
            initial={false}
            animate={{ width: `${currentPct * 100}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />

          {/* 3. Centered HP Text Overlay */}
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <span
              className="text-[7.5px] sm:text-[8.5px] font-pixel font-bold text-white drop-shadow tracking-wider whitespace-nowrap"
              style={{
                textShadow: '1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000',
              }}
            >
              {safeCurrent} / {max} HP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
