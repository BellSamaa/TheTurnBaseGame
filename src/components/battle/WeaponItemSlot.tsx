'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerState } from '@/types/game';
import { getTierConfig } from '@/lib/tierStyles';
import PixelIcon from '@/components/ui/PixelIcon';
import { playClickSound } from '@/lib/soundEffects';

interface WeaponItemSlotProps {
  player: PlayerState;
  isCurrentTurnAttacker: boolean;
  isEn: boolean;
  align?: 'left' | 'right';
}

export default function WeaponItemSlot({
  player,
  isCurrentTurnAttacker,
  isEn,
  align = 'left',
}: WeaponItemSlotProps) {
  const [showDetail, setShowDetail] = useState(false);
  const weapon = player.weapon;
  const tierConfig = getTierConfig(weapon.tier);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          playClickSound();
          setShowDetail(true);
        }}
        style={{
          borderColor: tierConfig.borderColor,
          boxShadow: tierConfig.boxShadow,
        }}
        className={`
          relative mt-3 cursor-pointer select-none transition-all
          bg-[#07090e]/95 border-2 p-1.5 sm:p-2 rounded-sm
          flex items-center gap-2 max-w-[200px] sm:max-w-[230px]
          ${align === 'right' ? 'flex-row-reverse text-right' : 'text-left'}
        `}
      >
        {/* Ornate Top Gem / Winged Dice Crest */}
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-black border text-[6px] font-pixel font-bold uppercase rounded-xs"
          style={{
            borderColor: tierConfig.borderColor,
            color: tierConfig.accentColor,
          }}
        >
          {isEn ? tierConfig.labelEn : tierConfig.labelVi}
        </div>

        {/* Weapon Sprite Sliced Icon */}
        <div
          className="relative w-10 h-10 sm:w-11 sm:h-11 bg-black/80 border flex-shrink-0 flex items-center justify-center p-1 overflow-hidden"
          style={{ borderColor: tierConfig.borderColor }}
        >
          <img
            src={weapon.image}
            alt={weapon.name}
            className="w-full h-full object-contain pixelated drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
          />
          {/* Subtle shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>

        {/* Weapon Info & Dynamic Combat Badges */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1 justify-between">
            <span
              className="text-[8px] sm:text-[9px] font-pixel font-bold truncate drop-shadow"
              style={{ color: tierConfig.accentColor }}
            >
              {isEn ? weapon.name : weapon.nameVi}
            </span>
          </div>

          {/* Dynamic Mechanics Badges */}
          <div className="mt-1 flex flex-wrap gap-1 items-center">
            {/* Revolver Ammo Counter */}
            {weapon.id === 'revolver' && (
              <div className="flex items-center gap-0.5 bg-black/80 px-1 py-0.5 border border-purple-500/60 rounded-xs">
                <span className="text-[6.5px] font-pixel text-purple-300">AMMO:</span>
                <span className="text-[7.5px] font-pixel font-bold text-yellow-300">
                  {player.bullets ?? 6}/6
                </span>
                <span className="text-[7px]">💥</span>
              </div>
            )}

            {/* The Pet Rock Companion Status */}
            {weapon.id === 'spirit_stone' && (
              <div className="flex items-center gap-1 bg-black/80 px-1 py-0.5 border border-cyan-500/60 rounded-xs">
                <span className="text-[6.5px] font-pixel text-cyan-300">🪨 ROCK:</span>
                <span className="text-[7px] font-pixel text-yellow-300">
                  {player.petRockHp ?? 0} HP
                </span>
                {player.petRockEnraged && (
                  <span className="text-[6px] font-pixel text-red-400 font-bold animate-pulse">ENRAGED!</span>
                )}
              </div>
            )}

            {/* D12 Gauge Counter for weapons with D12 charge */}
            {weapon.skill2.chargeRequired && (
              <div className="flex items-center gap-0.5 bg-black/80 px-1 py-0.5 border border-amber-500/60 rounded-xs">
                <span className="text-[6.5px] font-pixel text-amber-300">PTS:</span>
                <span className="text-[7.5px] font-pixel font-bold text-yellow-300">
                  {player.d12Charge ?? 0}/{weapon.skill2.chargeRequired}
                </span>
                <span className="text-[7px]">⚡</span>
              </div>
            )}

            {/* Active Status Effects Indicators */}
            {player.dodgeNextAttack && (
              <span className="text-[6px] font-pixel bg-green-950 text-green-300 border border-green-500 px-1 py-0.2 animate-pulse">
                DODGE ATK
              </span>
            )}
            {player.dodgeNextSkill && (
              <span className="text-[6px] font-pixel bg-cyan-950 text-cyan-300 border border-cyan-500 px-1 py-0.2 animate-pulse">
                WARD SKILL
              </span>
            )}
            {player.immuneDamageNext && (
              <span className="text-[6px] font-pixel bg-fuchsia-950 text-fuchsia-300 border border-pink-500 px-1 py-0.2 animate-pulse">
                IMMUNITY
              </span>
            )}
            {player.isBleeding && (
              <span className="text-[6px] font-pixel bg-red-950 text-red-400 border border-red-600 px-1 py-0.2 animate-pulse">
                BLEEDING
              </span>
            )}
            {player.flameBladeBuff && (
              <span className="text-[6px] font-pixel bg-amber-950 text-amber-300 border border-amber-500 px-1 py-0.2 animate-pulse">
                +5 FLAME
              </span>
            )}
            {player.isStunned && (
              <span className="text-[6px] font-pixel bg-blue-950 text-blue-300 border border-blue-500 px-1 py-0.2 animate-pulse">
                STUNNED
              </span>
            )}
          </div>
        </div>

        {/* Small inspect hint */}
        <div className="text-[8px] text-slate-500 font-pixel">ℹ️</div>
      </motion.div>

      {/* Modal: Full Weapon Inspection & Skills */}
      <AnimatePresence>
        {showDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                borderColor: tierConfig.borderColor,
                boxShadow: tierConfig.boxShadow,
              }}
              className="relative w-full max-w-lg bg-[#07090e] border-2 p-4 sm:p-6 text-slate-100 flex flex-col gap-4 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 bg-black border-2 flex items-center justify-center p-1.5"
                    style={{ borderColor: tierConfig.borderColor }}
                  >
                    <img
                      src={weapon.image}
                      alt={weapon.name}
                      className="w-full h-full object-contain pixelated"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs sm:text-sm font-pixel font-bold drop-shadow"
                        style={{ color: tierConfig.accentColor }}
                      >
                        {isEn ? weapon.name : weapon.nameVi}
                      </span>
                    </div>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 text-[7px] font-pixel font-bold border ${tierConfig.badgeClass}`}
                    >
                      TIER {isEn ? tierConfig.labelEn : tierConfig.labelVi}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowDetail(false)}
                  className="text-slate-400 hover:text-white font-pixel text-xs p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Weapon Lore */}
              <p className="text-[9px] text-slate-300 font-pixel leading-relaxed">
                {isEn ? weapon.description : weapon.descriptionVi}
              </p>

              {/* Passive Ability (if any) */}
              {(weapon.passiveDesc || weapon.passiveDescVi) && (
                <div className="p-2.5 bg-purple-950/40 border border-purple-500/60 flex flex-col gap-1">
                  <span className="text-[8px] font-pixel text-purple-300 font-bold flex items-center gap-1">
                    <span>⚡</span> {isEn ? 'PASSIVE TRAIT:' : 'NỘI TẠI VŨ KHÍ:'}
                  </span>
                  <p className="text-[8px] text-slate-200 font-pixel">
                    {isEn ? weapon.passiveDesc : weapon.passiveDescVi}
                  </p>
                </div>
              )}

              {/* Skills Container */}
              <div className="flex flex-col gap-2.5">
                {/* Skill 1 (D6) */}
                <div className="p-3 bg-black/60 border border-yellow-500/50 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-pixel font-bold text-yellow-300 flex items-center gap-1.5">
                      <span>🎲</span>
                      <span>SKILL 1: {isEn ? weapon.skill1.name : weapon.skill1.nameVi}</span>
                    </span>
                    <span className="text-[7px] font-pixel bg-yellow-950 text-yellow-200 border border-yellow-400 px-1.5 py-0.5">
                      {weapon.skill1.chargeRequired ?? 10} PTS · CLICK
                    </span>
                  </div>
                  <p className="text-[8px] text-slate-300 font-pixel leading-relaxed">
                    {isEn ? weapon.skill1.description : weapon.skill1.descriptionVi}
                  </p>
                </div>

                {/* Skill 2 (D12) */}
                <div className="p-3 bg-black/60 border border-cyan-500/50 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-pixel font-bold text-cyan-300 flex items-center gap-1.5">
                      <span>✨</span>
                      <span>SKILL 2: {isEn ? weapon.skill2.name : weapon.skill2.nameVi}</span>
                    </span>
                    <span className="text-[7px] font-pixel bg-cyan-950 text-cyan-200 border border-cyan-400 px-1.5 py-0.5">
                      {weapon.skill2.chargeRequired
                        ? `COST: ${weapon.skill2.chargeRequired} PTS`
                        : 'CLICK TO CAST'}
                    </span>
                  </div>
                  <p className="text-[8px] text-slate-300 font-pixel leading-relaxed">
                    {isEn ? weapon.skill2.description : weapon.skill2.descriptionVi}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowDetail(false)}
                className="w-full mt-2 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-pixel font-bold text-xs transition cursor-pointer"
              >
                {isEn ? 'CLOSE' : 'ĐÓNG'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
