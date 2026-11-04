'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type FrameVariant = 'gold' | 'cyan' | 'purple' | 'red';

interface PixelFrameProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  variant?: FrameVariant;
  headerRight?: React.ReactNode;
}

const VARIANT_COLORS: Record<
  FrameVariant,
  { outer: string; inner: string; glow: string; title: string; corner: string }
> = {
  gold: {
    outer: '#b8860b',
    inner: '#ffd700',
    glow: 'rgba(255,215,0,0.35)',
    title: '#ffd700',
    corner: '#ffe566',
  },
  cyan: {
    outer: '#006994',
    inner: '#00e5ff',
    glow: 'rgba(0,229,255,0.35)',
    title: '#00e5ff',
    corner: '#66f0ff',
  },
  purple: {
    outer: '#5b2c8e',
    inner: '#b44dff',
    glow: 'rgba(180,77,255,0.35)',
    title: '#b44dff',
    corner: '#d18fff',
  },
  red: {
    outer: '#7f1d1d',
    inner: '#ef4444',
    glow: 'rgba(239,68,68,0.35)',
    title: '#f87171',
    corner: '#fca5a5',
  },
};

function CornerDot({
  color,
  position,
}: {
  color: string;
  position: 'tl' | 'tr' | 'bl' | 'br';
}) {
  const posStyles: Record<string, React.CSSProperties> = {
    tl: { top: -2, left: -2 },
    tr: { top: -2, right: -2 },
    bl: { bottom: -2, left: -2 },
    br: { bottom: -2, right: -2 },
  };

  return (
    <motion.span
      className="absolute w-[6px] h-[6px] z-20 pointer-events-none"
      style={{
        ...posStyles[position],
        backgroundColor: color,
        boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
      }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export default function PixelFrame({
  children,
  title,
  className = '',
  variant = 'gold',
  headerRight,
}: PixelFrameProps) {
  const c = VARIANT_COLORS[variant] || VARIANT_COLORS.gold;

  return (
    <div
      className={`pixel-panel pixel-panel-${variant} relative p-3 sm:p-4 rounded-none ${className}`}
      style={{
        background: 'linear-gradient(180deg, rgba(14,16,24,0.94) 0%, rgba(8,10,16,0.96) 100%)',
        boxShadow: `
          inset 0 0 25px rgba(0,0,0,0.8),
          0 0 0 2px ${c.inner},
          0 0 0 4px ${c.outer},
          0 0 0 6px rgba(0,0,0,0.9),
          0 0 20px ${c.glow}
        `,
      }}
    >
      <CornerDot color={c.corner} position="tl" />
      <CornerDot color={c.corner} position="tr" />
      <CornerDot color={c.corner} position="bl" />
      <CornerDot color={c.corner} position="br" />

      {title && (
        <div className="pixel-panel-heading flex items-center justify-between pb-3 mb-3 border-b-2 border-slate-800">
          <h3
            className="text-xs sm:text-sm font-bold uppercase tracking-wider drop-shadow flex items-center gap-2"
            style={{ color: c.title }}
          >
            <span className="w-2 h-2 inline-block bg-current shadow-[0_0_8px_currentColor]" />
            {title}
          </h3>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}

      {children}
    </div>
  );
}
