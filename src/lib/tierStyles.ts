import type { WeaponTier } from '@/types/game';

export interface TierConfig {
  tier: WeaponTier;
  labelEn: string;
  labelVi: string;
  borderColor: string;
  glowColor: string;
  bgGradient: string;
  textColor: string;
  accentColor: string;
  gemColor: string;
  badgeClass: string;
  boxShadow: string;
}

export const TIER_CONFIGS: Record<WeaponTier, TierConfig> = {
  common: {
    tier: 'common',
    labelEn: 'COMMON',
    labelVi: 'PHỔ THÔNG',
    borderColor: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.45)',
    bgGradient: 'from-emerald-950/80 via-black to-[#07090e]',
    textColor: 'text-emerald-400',
    accentColor: '#4ade80',
    gemColor: '#22c55e',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/80',
    boxShadow: '0 0 12px rgba(34, 197, 94, 0.45)',
  },
  rare: {
    tier: 'rare',
    labelEn: 'RARE',
    labelVi: 'QUÝ HIẾM',
    borderColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.5)',
    bgGradient: 'from-cyan-950/80 via-black to-[#07090e]',
    textColor: 'text-cyan-400',
    accentColor: '#38bdf8',
    gemColor: '#06b6d4',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/80',
    boxShadow: '0 0 14px rgba(6, 182, 212, 0.5)',
  },
  epic: {
    tier: 'epic',
    labelEn: 'EPIC',
    labelVi: 'SỬ THI',
    borderColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.55)',
    bgGradient: 'from-purple-950/80 via-black to-[#07090e]',
    textColor: 'text-purple-400',
    accentColor: '#c084fc',
    gemColor: '#a855f7',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-500/80',
    boxShadow: '0 0 16px rgba(168, 85, 247, 0.55)',
  },
  legendary: {
    tier: 'legendary',
    labelEn: 'LEGENDARY',
    labelVi: 'HUYỀN THOẠI',
    borderColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.65)',
    bgGradient: 'from-amber-950/80 via-black to-[#07090e]',
    textColor: 'text-amber-400',
    accentColor: '#fbbf24',
    gemColor: '#f59e0b',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/80',
    boxShadow: '0 0 20px rgba(245, 158, 11, 0.65)',
  },
  mythic: {
    tier: 'mythic',
    labelEn: 'MYTHIC',
    labelVi: 'THẦN THOẠI',
    borderColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.75)',
    bgGradient: 'from-red-950/80 via-black to-[#07090e]',
    textColor: 'text-red-400',
    accentColor: '#f87171',
    gemColor: '#ef4444',
    badgeClass: 'bg-red-950/80 text-red-300 border-red-500/80',
    boxShadow: '0 0 22px rgba(239, 68, 68, 0.75)',
  },
  secret: {
    tier:'secret',labelEn:'SECRET',labelVi:'BÍ MẬT',borderColor:'#ffffff',glowColor:'rgba(255,255,255,.8)',
    bgGradient:'from-black via-zinc-950 to-black',textColor:'text-white',accentColor:'#ffffff',gemColor:'#ffffff',
    badgeClass:'secret-galaxy bg-black text-white border-white',boxShadow:'0 0 22px rgba(255,255,255,.6)',

  },
};

export function getTierConfig(tier: WeaponTier = 'common'): TierConfig {
  return TIER_CONFIGS[tier] || TIER_CONFIGS.common;
}
