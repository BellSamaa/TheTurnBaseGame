'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface HealthBarProps {
  current: number;
  max: number;
  playerName?: string;
  variant?: 'gold' | 'red' | 'cyan';
  className?: string;
  showText?: boolean;
}

export default function HealthBar({
  current,
  max,
  playerName = '',
  className = '',
  showText = true,
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
      }, 400);
      prevCurrentRef.current = safeCurrent;
      return () => clearTimeout(timer);
    } else {
      setGhostPct(currentPct);
      prevCurrentRef.current = safeCurrent;
    }
  }, [safeCurrent, currentPct]);

  // Color gradient based on remaining HP percentage
  const hpGradient = useMemo(() => {
    if (currentPct > 0.5) return 'from-emerald-500 via-green-500 to-emerald-600';
    if (currentPct > 0.25) return 'from-amber-400 via-yellow-500 to-amber-600';
    return 'from-rose-600 via-red-600 to-rose-700';
  }, [currentPct]);

  return (
    <div className={`relative flex flex-col items-center w-full max-w-[280px] sm:max-w-[320px] mx-auto select-none ${className}`}>
      {/* Player Header (Optional) */}
      {playerName && (
        <div className="flex items-center justify-between w-full px-2 mb-0.5 text-[8.5px] font-pixel">
          <span className="text-yellow-300 font-bold drop-shadow truncate max-w-[150px]">
            {playerName}
          </span>
          <span className="text-slate-300 font-pixel">
            {safeCurrent} / {max} HP
          </span>
        </div>
      )}

      {/* Authentic Ornate Ruby-Gold Frame Container (Aspect Ratio ~ 2112/463 = 4.56/1) */}
      <div className="relative w-full aspect-[2112/463] flex items-center justify-center filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
        {/* Underlay: Dark Channel Interior inside slot (13.5% to 86.5% X, 32% to 73% Y) */}
        <div
          className="absolute z-0 bg-[#080a14] rounded-xs overflow-hidden"
          style={{
            left: '13.5%',
            width: '73%',
            top: '32%',
            height: '41%',
          }}
        >
          {/* Subtle Scanline Overlay */}
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

          {/* 2. Real Current HP Bar */}
          <motion.div
            className={`absolute top-0 bottom-0 left-0 bg-gradient-to-r ${hpGradient} z-10 shadow-[0_0_8px_rgba(34,197,94,0.5)]`}
            initial={false}
            animate={{ width: `${currentPct * 100}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />

          {/* 3. Center Numeric HP Text inside bar */}
          {showText && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <span
                className="text-[8px] sm:text-[9px] font-pixel font-bold text-white tracking-wider"
                style={{
                  textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 4px #000',
                }}
              >
                {safeCurrent}/{max}
              </span>
            </div>
          )}
        </div>

        {/* Overlay: Authentic Pixel Gold-Ruby Frame Sprite */}
        <img
          src="/assets/sprites/ui/frames/frame_hp_gold_ruby_tight.png"
          alt="Khung thanh máu pixel vàng ngọc"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-30"
        />
      </div>
    </div>
  );
}
