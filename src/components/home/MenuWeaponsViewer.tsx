'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WEAPON_DEFINITIONS } from '@/lib/constants';
import { useGameStore } from '@/stores/gameStore';
import { getTierConfig } from '@/lib/tierStyles';
import PixelButton from '@/components/ui/PixelButton';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
import PixelIcon from '@/components/ui/PixelIcon';
import { playClickSound, playSaveSound } from '@/lib/soundEffects';

interface MenuWeaponsViewerProps {
  isEn: boolean;
}

export default function MenuWeaponsViewer({ isEn }: MenuWeaponsViewerProps) {
  const { profile, updateProfile } = useGameStore();
  const [selectedId, setSelectedId] = useState<string>(profile.weaponId || 'greatsword');
  const [equipSuccess, setEquipSuccess] = useState(false);

  const weapons = Object.values(WEAPON_DEFINITIONS);
  const selectedWeapon = WEAPON_DEFINITIONS[selectedId] || weapons[0];
  const isEquipped = profile.weaponId === selectedWeapon.id;
  const currentTier = getTierConfig(selectedWeapon.tier);

  const handleEquip = (id: string) => {
    playSaveSound();
    updateProfile({ weaponId: id });
    setEquipSuccess(true);
    setTimeout(() => setEquipSuccess(false), 2000);
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 bg-[#0c101c]/95 border-2 border-yellow-500/80 p-4 sm:p-6 shadow-[0_0_25px_rgba(0,0,0,0.9)]">
      {/* 1. LEFT COLUMN: Compact Weapon Selector Sidebar (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700">
          <span className="text-[9px] font-pixel font-bold text-yellow-300 flex items-center gap-1.5">
            <PixelIcon name="dagger" size={13} color="#facc15" />
            <span>{isEn ? 'ARMORY (9 WEAPONS)' : 'KHO BẢO KHÍ (9 VŨ KHÍ)'}</span>
          </span>
          <span className="text-[8px] font-pixel text-slate-400">
            {isEn ? 'CLICK TO INSPECT' : 'BẤM ĐỂ XEM'}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[460px] overflow-y-auto pr-1">
          {weapons.map((w) => {
            const isSelected = selectedId === w.id;
            const isCurrent = profile.weaponId === w.id;
            const itemTier = getTierConfig(w.tier);

            return (
              <motion.button
                key={w.id}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  playClickSound();
                  setSelectedId(w.id);
                }}
                className={`
                  relative p-2 border text-left flex items-center gap-2.5 transition cursor-pointer select-none
                  ${
                    isSelected
                      ? 'border-yellow-400 bg-yellow-950/70 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                      : 'border-slate-800 bg-[#07090e]/80 hover:border-slate-600'
                  }
                `}
              >
                {/* Small Weapon Icon */}
                <div
                  className="relative w-9 h-9 bg-black border p-0.5 flex-shrink-0 flex items-center justify-center"
                  style={{ borderColor: itemTier.borderColor }}
                >
                  <img
                    src={w.image}
                    alt={w.name}
                    className="w-full h-full object-contain pixelated drop-shadow"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-[8.5px] font-pixel font-bold truncate"
                      style={{ color: itemTier.accentColor }}
                    >
                      {isEn ? w.name : w.nameVi}
                    </span>
                    {isCurrent && (
                      <span className="text-[6.5px] font-pixel bg-emerald-500 text-black px-1 py-0.2 font-bold flex-shrink-0">
                        {isEn ? 'EQUIPPED' : 'ĐANG DÙNG'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="text-[7px] text-slate-400 font-sans block truncate max-w-[150px]">
                      {isEn ? w.description : w.descriptionVi}
                    </span>
                    <span className={`text-[6px] font-pixel px-1 border ${itemTier.badgeClass}`}>
                      {isEn ? itemTier.labelEn : itemTier.labelVi}
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 2. CENTER & RIGHT STAGE: Large Weapon Showcase & Deep Skill Mechanics (8 cols) */}
      <div
        className="lg:col-span-8 flex flex-col justify-between gap-4 bg-[#07090e]/90 border-2 p-4 sm:p-5 transition-all"
        style={{
          borderColor: currentTier.borderColor,
          boxShadow: currentTier.boxShadow,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedWeapon.id}
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4"
          >
            {/* Top Showcase: Big Floating Weapon Sprite */}
            <div
              className="relative w-full aspect-[21/9] sm:aspect-[24/9] bg-gradient-to-b from-[#131b2b] via-[#0c101c] to-black border-2 flex items-center justify-center overflow-hidden shadow-inner"
              style={{ borderColor: currentTier.borderColor }}
            >
              {/* Background ambient radial glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${currentTier.glowColor} 0%, transparent 70%)`,
                }}
              />

              {/* Large Centered Weapon */}
              <motion.div
                animate={{
                  y: [-4, 4, -4],
                  rotate: [0, 2, -2, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3.5,
                  ease: 'easeInOut',
                }}
                className="relative w-28 h-28 sm:w-36 sm:h-36 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]"
              >
                <img
                  src={selectedWeapon.image}
                  alt={selectedWeapon.name}
                  className="w-full h-full object-contain pixelated"
                />
              </motion.div>

              {/* Equipped status ribbon */}
              {isEquipped && (
                <div className="absolute top-2 right-2 bg-emerald-600/90 text-white font-pixel text-[8px] px-2 py-0.5 border border-emerald-300 shadow">
                  ✓ {isEn ? 'ACTIVE WEAPON' : 'VŨ KHÍ ĐANG TRANG BỊ'}
                </div>
              )}
            </div>

            {/* Title, Tier & Lore */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <h3
                  className="text-sm sm:text-base font-pixel font-bold drop-shadow flex items-center gap-1.5"
                  style={{ color: currentTier.accentColor }}
                >
                  <PixelIcon name="dagger" size={16} color={currentTier.accentColor} />
                  <span>{isEn ? selectedWeapon.name : selectedWeapon.nameVi}</span>
                </h3>
                <span
                  className={`text-[8px] font-pixel px-2.5 py-0.5 border font-bold uppercase shadow ${currentTier.badgeClass}`}
                >
                  TIER {isEn ? currentTier.labelEn : currentTier.labelVi}
                </span>
              </div>
              <p className="text-[8.5px] sm:text-[9.5px] font-pixel text-slate-300 leading-relaxed">
                {isEn ? selectedWeapon.description : selectedWeapon.descriptionVi}
              </p>
            </div>

            {/* Weapon Passive (if any) */}
            {(selectedWeapon.passiveDesc || selectedWeapon.passiveDescVi) && (
              <div className="p-2.5 bg-purple-950/40 border border-purple-500/60 flex flex-col gap-1">
                <span className="text-[8px] font-pixel text-purple-300 font-bold flex items-center gap-1">
                  <span>⚡</span> {isEn ? 'PASSIVE TRAIT:' : 'NỘI TẠI VŨ KHÍ:'}
                </span>
                <p className="text-[8px] text-slate-200 font-pixel">
                  {isEn ? selectedWeapon.passiveDesc : selectedWeapon.passiveDescVi}
                </p>
              </div>
            )}

            {/* 2 Detailed Skill Mechanics Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              {/* Skill 1: D6 Ability */}
              <div className="p-3 bg-yellow-950/40 border-2 border-yellow-500/60 shadow">
                <div className="flex items-center justify-between text-[8.5px] font-pixel font-bold text-yellow-300 mb-1.5">
                  <span className="flex items-center gap-1">
                    <PixelIcon name="dice6" size={12} color="#facc15" />
                    <span>SKILL 1: {isEn ? selectedWeapon.skill1.name : selectedWeapon.skill1.nameVi}</span>
                  </span>
                  <span className="text-yellow-300 bg-yellow-950 px-1.5 py-0.5 border border-yellow-500/50">
                    D6 ROLL
                  </span>
                </div>
                <p className="text-[8px] font-pixel text-slate-200 leading-relaxed">
                  {isEn ? selectedWeapon.skill1.description : selectedWeapon.skill1.descriptionVi}
                </p>
              </div>

              {/* Skill 2: D12 Ability */}
              <div className="p-3 bg-cyan-950/40 border-2 border-cyan-500/60 shadow">
                <div className="flex items-center justify-between text-[8.5px] font-pixel font-bold text-cyan-300 mb-1.5">
                  <span className="flex items-center gap-1">
                    <PixelIcon name="sparkles" size={12} color="#38bdf8" />
                    <span>SKILL 2: {isEn ? selectedWeapon.skill2.name : selectedWeapon.skill2.nameVi}</span>
                  </span>
                  <span className="text-cyan-300 bg-cyan-950 px-1.5 py-0.5 border border-cyan-500/50">
                    {selectedWeapon.skill2.chargeRequired
                      ? `${selectedWeapon.skill2.chargeRequired} PTS D12`
                      : 'D12 ROLL'}
                  </span>
                </div>
                <p className="text-[8px] font-pixel text-slate-200 leading-relaxed">
                  {isEn ? selectedWeapon.skill2.description : selectedWeapon.skill2.descriptionVi}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Equip Button Bar */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <PixelSpriteButton
            sprite={isEquipped ? 'confirm' : 'weapons'}
            disabled={isEquipped}
            onClick={() => handleEquip(selectedWeapon.id)}
            className="w-40 sm:w-48"
            title={
              equipSuccess
                ? (isEn ? 'EQUIPPED!' : 'ĐÃ TRANG BỊ!')
                : isEquipped
                ? (isEn ? 'CURRENTLY EQUIPPED' : 'ĐANG TRANG BỊ')
                : (isEn ? 'EQUIP WEAPON' : 'TRANG BỊ VŨ KHÍ NÀY')
            }
          />
        </div>
      </div>
    </div>
  );
}
