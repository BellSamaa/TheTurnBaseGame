/* ──────────────────────────────────────────────
   HealthBar – Animated HP bar with pixel style
   ────────────────────────────────────────────── */
'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HealthBarProps {
  current: number;
  max: number;
  playerName: string;
  showDamage?: number | null; // flash a damage number
  className?: string;
}

function hpColor(pct: number): string {
  if (pct > 0.5) return '#44ff88';
  if (pct > 0.25) return '#ffdd44';
  return '#ff4444';
}

function hpGlow(pct: number): string {
  if (pct > 0.5) return 'rgba(68,255,136,0.5)';
  if (pct > 0.25) return 'rgba(255,221,68,0.5)';
  return 'rgba(255,68,68,0.5)';
}

export default function HealthBar({
  current,
  max,
  playerName,
  showDamage = null,
  className = '',
}: HealthBarProps) {
  const pct = useMemo(() => Math.max(0, Math.min(1, current / max)), [current, max]);
  const color = hpColor(pct);
  const glow = hpGlow(pct);

  return (
    <div
      className={`relative w-full max-w-[280px] ${className}`}
      style={{ fontFamily: 'var(--font-pixel), monospace' }}
    >
      {/* Player name */}
      <div
        className="mb-1 text-[8px] tracking-wider uppercase"
        style={{ color: '#ffd700', textShadow: '0 0 4px rgba(255,215,0,0.4)' }}
      >
        {playerName}
      </div>

      {/* Bar container */}
      <div className="relative h-5">
        {/* Background track */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(0,0,0,0.7)',
            boxShadow: `
              inset 0 0 0 2px #8b6914,
              inset 0 0 0 4px #5c4400,
              0 0 0 1px rgba(0,0,0,0.8)
            `,
            imageRendering: 'pixelated',
          }}
        />

        {/* Filled bar */}
        <motion.div
          className="absolute top-[2px] left-[2px] bottom-[2px]"
          style={{
            background: `linear-gradient(180deg, ${color} 0%, ${color}99 50%, ${color}66 100%)`,
            boxShadow: `0 0 8px ${glow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
            imageRendering: 'pixelated',
          }}
          initial={false}
          animate={{ width: `calc(${pct * 100}% - 4px)` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />

        {/* Pixel grid overlay on bar */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(0deg, transparent 50%, rgba(0,0,0,0.4) 50%)',
            backgroundSize: '100% 2px',
          }}
        />

        {/* Frame overlay image */}
        <div
          className="absolute inset-[-4px] pointer-events-none"
          style={{
            backgroundImage: 'url(/assets/images/frames/frame-hp-bar-gold.png)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
          }}
        />

        {/* HP text */}
        <div
          className="absolute inset-0 flex items-center justify-center text-[7px] tracking-wider"
          style={{
            color: '#fff',
            textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
          }}
        >
          {current}/{max}
        </div>
      </div>

      {/* Damage flash */}
      <AnimatePresence>
        {showDamage !== null && showDamage !== undefined && (
          <motion.div
            key={`dmg-${Date.now()}`}
            className="absolute -top-3 right-0 text-[10px] font-bold"
            style={{
              color: '#ff4444',
              textShadow: '0 0 6px rgba(255,0,0,0.8)',
              fontFamily: 'var(--font-pixel), monospace',
            }}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -20 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            -{showDamage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
