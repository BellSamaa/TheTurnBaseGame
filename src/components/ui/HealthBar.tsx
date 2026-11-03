/* ──────────────────────────────────────────────
   HealthBar – Enhanced Pixel HP bar with Chip-Loss Ghost Lag
   ────────────────────────────────────────────── */
'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
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
    // If damage was taken (HP decreased)
    if (safeCurrent < prevCurrentRef.current) {
      const timer = setTimeout(() => {
        setGhostPct(currentPct);
      }, 450); // 450ms lag before ghost bar catches down
      prevCurrentRef.current = safeCurrent;
      return () => clearTimeout(timer);
    } else {
      // Healed or unchanged
      setGhostPct(currentPct);
      prevCurrentRef.current = safeCurrent;
    }
  }, [safeCurrent, currentPct]);

  // Health color palette
  const hpColor = useMemo(() => {
    if (currentPct > 0.5) return '#22c55e'; // Green
    if (currentPct > 0.25) return '#eab308'; // Amber
    return '#ef4444'; // Red
  }, [currentPct]);

  const frameBorder =
    variant === 'gold'
      ? 'border-[#eab308]'
      : variant === 'red'
      ? 'border-[#ef4444]'
      : 'border-[#06b6d4]';

  return (
    <div className={`relative w-full ${className}`}>
      {/* Optional player label and big HP numbers */}
      <div className="flex items-center justify-between mb-1 text-[9px] font-pixel">
        {playerName && (
          <span className="text-yellow-400 font-bold truncate max-w-[140px] drop-shadow">
            {playerName}
          </span>
        )}
        <div className="ml-auto flex items-baseline gap-1">
          <span className="text-xs sm:text-sm font-bold tracking-tight" style={{ color: hpColor }}>
            {safeCurrent}
          </span>
          <span className="text-[8px] text-slate-400 font-pixel">/ {max} HP</span>
        </div>
      </div>

      {/* Bar container with authentic 2px pixel frame */}
      <div
        className={`relative h-5 w-full bg-[#0a0d14] border-2 ${frameBorder} shadow-[inset_0_0_10px_rgba(0,0,0,0.9)] overflow-hidden`}
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Track Grid Lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 z-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #000 0, #000 1px, transparent 1px, transparent 10%)',
          }}
        />

        {/* 1. Chip-loss ghost bar (Lingers when damaged to show lost amount) */}
        <motion.div
          className="absolute top-0 bottom-0 left-0 bg-red-400/80 z-10"
          initial={false}
          animate={{ width: `${ghostPct * 100}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />

        {/* 2. Real Current HP Bar (Drops instantly) */}
        <motion.div
          className="absolute top-0 bottom-0 left-0 z-15"
          style={{
            backgroundColor: hpColor,
            boxShadow: `0 0 10px ${hpColor}88, inset 0 1px 0 rgba(255,255,255,0.4)`,
          }}
          initial={false}
          animate={{ width: `${currentPct * 100}%` }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />

        {/* Glass highlight scanline */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/15 pointer-events-none z-20" />
      </div>
    </div>
  );
}
