'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import { WEAPON_DEFINITIONS } from '@/lib/constants';
import { getTierConfig } from '@/lib/tierStyles';
import PixelButton from '@/components/ui/PixelButton';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelIcon from '@/components/ui/PixelIcon';
import { playClickSound } from '@/lib/soundEffects';

export default function WeaponsGallery() {
  const { profile, setPlayerWeapon, setPage, settings } = useGameStore();
  const lang = settings.language;
  const isEn = lang === 'en';

  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(profile.weaponId || 'greatsword');
  const [equipSuccess, setEquipSuccess] = useState(false);

  const selectedWeapon = WEAPON_DEFINITIONS[selectedWeaponId] || WEAPON_DEFINITIONS.greatsword;
  const isCurrentlyEquipped = profile.weaponId === selectedWeaponId;
  const currentTier = getTierConfig(selectedWeapon.tier);

  const handleEquip = (id: string) => {
    playClickSound();
    setPlayerWeapon(id);
    setSelectedWeaponId(id);
    setEquipSuccess(true);
    setTimeout(() => setEquipSuccess(false), 2000);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center p-3 sm:p-6 overflow-x-hidden bg-[#07090e] select-none">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/background.png"
          alt="Weapons Background"
          fill
          priority
          className="object-cover filter brightness-[0.3] contrast-125 blur-sm"
        />
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-5xl flex items-center justify-between pb-3 border-b-2 border-yellow-500/40">
        <PixelSpriteButton
          sprite="back"
          onClick={() => {
            setPage('home');
          }}
          className="w-28 sm:w-32"
        />

        <h2 className="text-xs sm:text-base text-yellow-400 font-pixel drop-shadow flex items-center gap-2">
          <PixelIcon name="dagger" size={16} color="#facc15" />
          <span>{isEn ? 'ARMORY VAULT (9 LEGENDARY WEAPONS)' : 'KHO BÁU BẢO KHÍ (9 VŨ KHÍ HUYỀN THOẠI)'}</span>
        </h2>

        <div className="w-28 sm:w-32" />
      </header>

      {/* Main Armory Content */}
      <main className="relative z-20 w-full max-w-5xl my-auto grid grid-cols-1 lg:grid-cols-12 gap-4 py-4">
        {/* Left Column: 9 Weapons Grid (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <PixelFrame variant="cyan" title={isEn ? 'WEAPON COLLECTION' : 'DANH SÁCH BẢO KHÍ'}>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-h-[460px] overflow-y-auto pr-1">
              {Object.values(WEAPON_DEFINITIONS).map((w) => {
                const isSelected = selectedWeaponId === w.id;
                const isEquipped = profile.weaponId === w.id;
                const itemTier = getTierConfig(w.tier);

                return (
                  <motion.div
                    key={w.id}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => {
                      playClickSound();
                      setSelectedWeaponId(w.id);
                    }}
                    style={{
                      borderColor: isSelected ? itemTier.borderColor : undefined,
                      boxShadow: isSelected ? itemTier.boxShadow : undefined,
                    }}
                    className={`
                      relative p-2.5 border-2 cursor-pointer transition select-none flex flex-col items-center justify-between text-center
                      ${
                        isSelected
                          ? 'bg-yellow-950/60 scale-[1.02]'
                          : 'border-slate-700 bg-slate-900/70 hover:border-slate-500'
                      }
                    `}
                  >
                    {isEquipped && (
                      <span className="absolute top-1 right-1 text-[7px] font-pixel font-bold bg-emerald-500 text-black px-1 py-0.5 shadow">
                        {isEn ? 'EQUIPPED' : 'ĐANG DÙNG'}
                      </span>
                    )}

                    {/* Tier badge on card */}
                    <span
                      className={`text-[6px] font-pixel px-1 mb-1 border font-bold uppercase ${itemTier.badgeClass}`}
                    >
                      {isEn ? itemTier.labelEn : itemTier.labelVi}
                    </span>

                    {/* Sliced Weapon Image */}
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 mb-2 flex items-center justify-center">
                      <img
                        src={w.image}
                        alt={w.name}
                        className="w-full h-full object-contain pixelated drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                      />
                    </div>

                    <h4
                      className="text-[9px] font-pixel font-bold leading-tight mb-1 truncate w-full"
                      style={{ color: itemTier.accentColor }}
                    >
                      {isEn ? w.name : w.nameVi}
                    </h4>

                    <span className="text-[7.5px] font-pixel text-slate-400">
                      {isSelected ? (isEn ? 'VIEWING' : 'ĐANG XEM') : (isEn ? 'INSPECT' : 'XEM')}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </PixelFrame>
        </div>

        {/* Right Column: Selected Weapon Detail & Equip (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <PixelFrame
            variant="gold"
            title={isEn ? 'WEAPON SPECIFICATIONS' : 'CHI TIẾT VŨ KHÍ'}
            className="flex flex-col gap-3"
          >
            {/* Weapon Showcase Stage */}
            <div
              className="relative w-full aspect-video bg-[#0c101c] border-2 flex items-center justify-center p-4"
              style={{
                borderColor: currentTier.borderColor,
                boxShadow: currentTier.boxShadow,
              }}
            >
              <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                <img
                  src={selectedWeapon.image}
                  alt={selectedWeapon.name}
                  className="w-full h-full object-contain pixelated drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] animate-float"
                />
              </div>

              {isCurrentlyEquipped && (
                <div className="absolute top-2 right-2 bg-emerald-600/90 text-white font-pixel text-[8px] px-2 py-0.5 border border-emerald-300 shadow">
                  ✓ {isEn ? 'ACTIVE' : 'ĐANG TRANG BỊ'}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <h3
                  className="text-sm font-pixel font-bold"
                  style={{ color: currentTier.accentColor }}
                >
                  {isEn ? selectedWeapon.name : selectedWeapon.nameVi}
                </h3>
                <span
                  className={`text-[7.5px] font-pixel px-2 py-0.5 border font-bold uppercase ${currentTier.badgeClass}`}
                >
                  TIER {isEn ? currentTier.labelEn : currentTier.labelVi}
                </span>
              </div>
              <p className="text-[8.5px] font-pixel text-slate-300 leading-relaxed">
                {isEn ? selectedWeapon.description : selectedWeapon.descriptionVi}
              </p>
            </div>

            {/* Passive Trait */}
            {(selectedWeapon.passiveDesc || selectedWeapon.passiveDescVi) && (
              <div className="p-2 bg-purple-950/40 border border-purple-500/60">
                <span className="text-[7.5px] font-pixel text-purple-300 font-bold block mb-0.5">
                  ⚡ {isEn ? 'PASSIVE TRAIT:' : 'NỘI TẠI:'}
                </span>
                <p className="text-[7.5px] font-pixel text-slate-200">
                  {isEn ? selectedWeapon.passiveDesc : selectedWeapon.passiveDescVi}
                </p>
              </div>
            )}

            {/* Weapon Skills Breakdown */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="p-2 bg-yellow-950/40 border border-yellow-500/40">
                <div className="flex items-center justify-between text-[8px] font-pixel font-bold text-yellow-300 mb-1">
                  <span>🎲 SKILL 1: {isEn ? selectedWeapon.skill1.name : selectedWeapon.skill1.nameVi}</span>
                  <span className="text-yellow-300 bg-yellow-950 px-1 py-0.2 border border-yellow-500/50">
                    {selectedWeapon.skill1.chargeRequired} PTS · CLICK
                  </span>
                </div>
                <p className="text-[7.5px] font-pixel text-slate-300 leading-tight">
                  {isEn ? selectedWeapon.skill1.description : selectedWeapon.skill1.descriptionVi}
                </p>
              </div>

              <div className="p-2 bg-cyan-950/40 border border-cyan-500/40">
                <div className="flex items-center justify-between text-[8px] font-pixel font-bold text-cyan-300 mb-1">
                  <span>✨ SKILL 2: {isEn ? selectedWeapon.skill2.name : selectedWeapon.skill2.nameVi}</span>
                  <span className="text-cyan-300 bg-cyan-950 px-1 py-0.2 border border-cyan-500/50">
                    {selectedWeapon.skill2.chargeRequired
                      ? `${selectedWeapon.skill2.chargeRequired} PTS`
                      : 'D12'}
                  </span>
                </div>
                <p className="text-[7.5px] font-pixel text-slate-300 leading-tight">
                  {isEn ? selectedWeapon.skill2.description : selectedWeapon.skill2.descriptionVi}
                </p>
              </div>
            </div>

            {/* Equip Button */}
            <div className="flex justify-center mt-3">
              <PixelSpriteButton
                sprite={isCurrentlyEquipped ? 'confirm' : 'weapons'}
                disabled={isCurrentlyEquipped}
                onClick={() => handleEquip(selectedWeapon.id)}
                className="w-44 sm:w-52"
                title={
                  equipSuccess
                    ? (isEn ? 'EQUIPPED!' : 'ĐÃ TRANG BỊ!')
                    : isCurrentlyEquipped
                    ? (isEn ? 'CURRENTLY EQUIPPED' : 'ĐANG TRANG BỊ')
                    : (isEn ? 'EQUIP WEAPON' : 'TRANG BỊ VŨ KHÍ NÀY')
                }
              />
            </div>
          </PixelFrame>
        </div>
      </main>
    </div>
  );
}
