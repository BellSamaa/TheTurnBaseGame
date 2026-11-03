'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import { WEAPON_DEFINITIONS } from '@/lib/constants';
import PixelButton from '@/components/ui/PixelButton';
import PixelFrame from '@/components/ui/PixelFrame';

export default function WeaponsGallery() {
  const { profile, setPlayerWeapon, setPage, settings } = useGameStore();
  const lang = settings.language;
  const isEn = lang === 'en';

  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(profile.weaponId || 'greatsword');
  const [equipSuccess, setEquipSuccess] = useState(false);

  const selectedWeapon = WEAPON_DEFINITIONS[selectedWeaponId] || WEAPON_DEFINITIONS.greatsword;
  const isCurrentlyEquipped = profile.weaponId === selectedWeaponId;

  const handleEquip = (id: string) => {
    setPlayerWeapon(id);
    setSelectedWeaponId(id);
    setEquipSuccess(true);
    setTimeout(() => setEquipSuccess(false), 2000);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center p-3 sm:p-6 overflow-x-hidden bg-[#07070b]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/background.png"
          alt="Weapons Background"
          fill
          priority
          className="object-cover filter brightness-[0.25] contrast-125 blur-sm"
        />
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      </div>

      {/* Top Header */}
      <div className="relative z-20 w-full max-w-5xl flex items-center justify-between pb-3 border-b-2 border-yellow-500/40">
        <PixelButton
          variant="secondary"
          size="sm"
          onClick={() => setPage('home')}
          icon={<span>⬅</span>}
        >
          {t('back', lang)}
        </PixelButton>

        <h2 className="text-xs sm:text-base text-yellow-400 font-pixel drop-shadow">
          {isEn ? 'ARMORY VAULT (9 LEGENDARY WEAPONS)' : 'KHO BÁU BẢO KHÍ (9 VŨ KHÍ HUYỀN THOẠI)'}
        </h2>

        <div className="w-16" />
      </div>

      {/* Main Armory Content */}
      <div className="relative z-20 w-full max-w-5xl my-auto grid grid-cols-1 lg:grid-cols-12 gap-4 py-4">
        {/* Left Column: 9 Weapons Grid (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <PixelFrame variant="cyan" title={isEn ? 'WEAPON COLLECTION' : 'DANH SÁCH BẢO KHÍ'}>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-h-[460px] overflow-y-auto pr-1">
              {Object.values(WEAPON_DEFINITIONS).map((w) => {
                const isSelected = selectedWeaponId === w.id;
                const isEquipped = profile.weaponId === w.id;

                return (
                  <motion.div
                    key={w.id}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setSelectedWeaponId(w.id)}
                    className={`
                      relative p-2.5 border-2 cursor-pointer transition select-none flex flex-col items-center justify-between text-center
                      ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_12px_rgba(250,204,21,0.5)] scale-[1.02]'
                          : 'border-slate-700 bg-slate-900/70 hover:border-slate-500'
                      }
                    `}
                  >
                    {isEquipped && (
                      <span className="absolute top-1 right-1 text-[7px] font-pixel font-bold bg-emerald-500 text-black px-1 py-0.5 shadow">
                        {isEn ? 'EQUIPPED' : 'ĐANG DÙNG'}
                      </span>
                    )}

                    {/* Sliced Weapon Image */}
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 mb-2 flex items-center justify-center">
                      <img
                        src={w.image}
                        alt={w.name}
                        className="w-full h-full object-contain pixelated drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                      />
                    </div>

                    <h4 className="text-[9px] font-bold font-pixel text-yellow-300 leading-tight mb-1">
                      {isEn ? w.name : w.nameVi}
                    </h4>

                    <span className="text-[7.5px] font-pixel text-cyan-300">
                      {isEn ? `Charge: ${w.skill1.chargeRequired} pts` : `Sạc: ${w.skill1.chargeRequired} đ`}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </PixelFrame>
        </div>

        {/* Right Column: Selected Weapon Detail View (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <PixelFrame variant="gold" title={isEn ? 'WEAPON DOSSIER' : 'CHI TIẾT VŨ KHÍ'}>
            <div className="flex flex-col items-center text-center p-2">
              {/* Large Image Showcase with Glow */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-3 flex items-center justify-center bg-slate-950 border-2 border-yellow-500/50 shadow-[inset_0_0_15px_rgba(0,0,0,0.9)] p-3">
                <img
                  src={selectedWeapon.image}
                  alt={selectedWeapon.name}
                  className="w-full h-full object-contain pixelated animate-float drop-shadow-[0_0_12px_rgba(255,215,0,0.6)]"
                />
              </div>

              <h3 className="text-xs sm:text-sm font-bold font-pixel text-yellow-300 mb-1">
                {isEn ? selectedWeapon.name : selectedWeapon.nameVi}
              </h3>
              <p className="text-[8px] text-slate-400 font-pixel mb-3 italic">
                {isEn ? selectedWeapon.nameVi : selectedWeapon.name}
              </p>

              <p className="text-[8.5px] text-slate-300 font-pixel mb-4 leading-relaxed bg-slate-900/80 p-2.5 border border-slate-700 w-full text-left">
                {isEn ? selectedWeapon.description : selectedWeapon.descriptionVi}
              </p>

              {/* Skills Display */}
              <div className="w-full flex flex-col gap-2.5 mb-4 text-left">
                {/* Skill 1 (Charge) */}
                <div className="p-2.5 bg-yellow-950/40 border border-yellow-600/70">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-yellow-300 font-pixel font-bold flex items-center gap-1">
                      <span>⚡</span> {isEn ? selectedWeapon.skill1.name : selectedWeapon.skill1.nameVi}
                    </span>
                    <span className="text-[7.5px] px-1.5 py-0.5 bg-yellow-500 text-black font-pixel font-bold">
                      {isEn
                        ? `REQ ${selectedWeapon.skill1.chargeRequired} PTS`
                        : `CẦN ${selectedWeapon.skill1.chargeRequired} ĐIỂM SẠC`}
                    </span>
                  </div>
                  <p className="text-[8px] text-slate-300 font-pixel">
                    {isEn ? selectedWeapon.skill1.description : selectedWeapon.skill1.descriptionVi}
                  </p>
                </div>

                {/* Skill 2 (Special Trigger) */}
                <div className="p-2.5 bg-cyan-950/40 border border-cyan-600/70">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-cyan-300 font-pixel font-bold flex items-center gap-1">
                      <span>🎲</span> {isEn ? selectedWeapon.skill2.name : selectedWeapon.skill2.nameVi}
                    </span>
                    <span className="text-[7.5px] px-1.5 py-0.5 bg-cyan-500 text-black font-pixel font-bold">
                      {isEn
                        ? `TRIGGER ON DIE FACE ${selectedWeapon.skill2.triggerNumber}`
                        : `KHI ĐỔ RA MẶT ${selectedWeapon.skill2.triggerNumber}`}
                    </span>
                  </div>
                  <p className="text-[8px] text-slate-300 font-pixel">
                    {isEn ? selectedWeapon.skill2.description : selectedWeapon.skill2.descriptionVi}
                  </p>
                </div>
              </div>

              {/* Equip Button */}
              <PixelButton
                variant={isCurrentlyEquipped ? 'success' : 'gold'}
                size="md"
                onClick={() => handleEquip(selectedWeapon.id)}
                disabled={isCurrentlyEquipped}
                className="w-full py-2.5 font-pixel text-xs"
                icon={<span>⚔️</span>}
              >
                {equipSuccess
                  ? (isEn ? 'EQUIPPED SUCCESSFULLY!' : 'ĐÃ TRANG BỊ THÀNH CÔNG!')
                  : isCurrentlyEquipped
                  ? (isEn ? '✓ CURRENTLY EQUIPPED' : '✓ ĐANG TRANG BỊ')
                  : (isEn ? 'EQUIP THIS WEAPON' : 'TRANG BỊ VŨ KHÍ NÀY')}
              </PixelButton>
            </div>
          </PixelFrame>
        </div>
      </div>
    </div>
  );
}
