'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'gold' | 'frame';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface PixelButtonProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  frameBg?: string; // Optional custom sprite button background
  type?: 'button' | 'submit' | 'reset';
}

const VARIANT_STYLES: Record<
  ButtonVariant,
  { bg: string; border: string; glow: string; text: string; shadow: string }
> = {
  primary: {
    bg: 'linear-gradient(180deg, #ffd700 0%, #b8860b 100%)',
    border: '#8b6914',
    glow: 'rgba(255,215,0,0.6)',
    text: '#1a0a00',
    shadow: '#5c4400',
  },
  gold: {
    bg: 'linear-gradient(180deg, #ffe066 0%, #cc9a06 100%)',
    border: '#d69e2e',
    glow: 'rgba(255,224,102,0.8)',
    text: '#2d1802',
    shadow: '#8c6b03',
  },
  secondary: {
    bg: 'linear-gradient(180deg, #00e5ff 0%, #006994 100%)',
    border: '#004d6e',
    glow: 'rgba(0,229,255,0.6)',
    text: '#001a22',
    shadow: '#003344',
  },
  danger: {
    bg: 'linear-gradient(180deg, #ff4444 0%, #991111 100%)',
    border: '#660a0a',
    glow: 'rgba(255,68,68,0.6)',
    text: '#fff',
    shadow: '#440000',
  },
  success: {
    bg: 'linear-gradient(180deg, #44ff88 0%, #118833 100%)',
    border: '#0a6622',
    glow: 'rgba(68,255,136,0.6)',
    text: '#002200',
    shadow: '#004400',
  },
  frame: {
    bg: 'linear-gradient(180deg, #2b3a4a 0%, #17202a 100%)',
    border: '#4a6572',
    glow: 'rgba(74, 101, 114, 0.6)',
    text: '#f7fafc',
    shadow: '#0d1318',
  },
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[9px]',
  md: 'px-5 py-2.5 text-[11px]',
  lg: 'px-7 py-3.5 text-xs',
  xl: 'px-9 py-4 text-sm',
};

export default function PixelButton({
  children,
  icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  onClick,
  frameBg,
  type = 'button',
}: PixelButtonProps) {
  const { settings } = useGameStore();

  const handleClick = useCallback(() => {
    if (disabled) return;
    if (!settings.sfxMuted && typeof window !== 'undefined') {
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(settings.sfxVolume * 0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } catch {
        // audio fail silent
      }
    }
    onClick?.();
  }, [onClick, settings.sfxVolume, settings.sfxMuted, disabled]);

  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      whileHover={disabled ? undefined : { scale: 1.04 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      style={{
        background: frameBg ? `url(${frameBg}) center/cover no-repeat` : v.bg,
        border: `3px solid ${v.border}`,
        boxShadow: `inset 2px 2px 0px rgba(255,255,255,0.35), inset -2px -2px 0px ${v.shadow}, 0 0 10px ${v.glow}`,
        color: v.text,
      }}
      className={`
        relative cursor-pointer select-none
        font-pixel uppercase tracking-wide inline-flex items-center justify-center gap-2
        transition-all duration-150
        ${SIZE_CLASSES[size]}
        ${disabled ? 'opacity-40 cursor-not-allowed filter grayscale' : 'hover:brightness-110 active:brightness-95'}
        ${className}
      `}
    >
      {icon && <span className="inline-flex items-center text-sm">{icon}</span>}
      <span className="drop-shadow-sm font-pixel">{children}</span>
    </motion.button>
  );
}
