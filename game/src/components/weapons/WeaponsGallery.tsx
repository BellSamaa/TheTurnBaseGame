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
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center p-3 sm:p-6 overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/background.png"
          alt="Weapons Background"
          fill
          priority
          className="object-cover filter brightness-[0.35] contrast-125 blur-sm"
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

        <h2 className="text-sm sm:text-lg text-yellow-400 font-pixel drop-shadow">
          KHO BÁU BẢO KHÍ (9 VŨ KHÍ HUYỀN THOẠI)
        </h2>

        <div className="w-16" />
      </div>

      {/* Main Armory Content */}
      <div className="relative z-20 w-full max-w-5xl my-auto grid grid-cols-1 lg:grid-cols-12 gap-4 py-4">
        {/* Left Column: 9 Weapons Grid (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <PixelFrame variant="cyan" title="DANH SÁCH BẢO KHÍ">
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
                          ? 'border-yellow-400 bg-yellow-950/50 shadow-[0_0_12px_rgba(250,204,21,0.5)] scale-[1.02]'
                          : 'border-slate-700 bg-slate-900/70 hover:border-slate-500'
                      }
                    `}
                  >
                    {isEquipped && (
                      <span className="absolute top-1 right-1 text-[7px] font-bold bg-emerald-500 text-black px-1 py-0.2 shadow">
                        ĐANG DÙNG
                      </span>
                    )}

                    {/* Weapon Image */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
                      <Image
                        src={w.image}
                        alt={w.name}
                        fill
                        className="object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                      />
                    </div>

                    <h4 className="text-[9.5px] font-bold text-yellow-300 leading-tight mb-1">
                      {w.nameVi}
                    </h4>

                    <span className="text-[8px] text-cyan-300">
                      Sạc: {w.skill1.chargeRequired} đ
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </PixelFrame>
        </div>

        {/* Right Column: Selected Weapon Detail View (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <PixelFrame variant="gold" title="CHI TIẾT VŨ KHÍ">
            <div className="flex flex-col items-center text-center p-2">
              {/* Large Image Showcase with Glow */}
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 mb-3 flex items-center justify-center bg-slate-950 border-2 border-yellow-500/50 shadow-[inset_0_0_15px_rgba(0,0,0,0.9)]">
                <Image
                  src={selectedWeapon.image}
                  alt={selectedWeapon.name}
                  fill
                  className="object-contain p-3 animate-float filter drop-shadow-[0_0_12px_rgba(255,215,0,0.5)]"
                />
              </div>

              <h3 className="text-sm sm:text-base font-bold text-yellow-300 mb-1">
                {selectedWeapon.nameVi}
              </h3>
              <p className="text-[8.5px] text-slate-400 mb-3 italic">
                {selectedWeapon.name}
              </p>

              <p className="text-[9px] text-slate-300 mb-4 leading-relaxed bg-slate-900/80 p-2.5 border border-slate-700 w-full text-left">
                {selectedWeapon.descriptionVi}
              </p>

              {/* Skills Display */}
              <div className="w-full flex flex-col gap-2.5 mb-4 text-left">
                {/* Skill 1 (Charge) */}
                <div className="p-2.5 bg-yellow-950/40 border border-yellow-600/70">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-yellow-300 font-bold flex items-center gap-1">
                      <span>⚡</span> {selectedWeapon.skill1.nameVi}
                    </span>
                    <span className="text-[8px] px-1.5 py-0.5 bg-yellow-500 text-black font-bold">
                      CẦN {selectedWeapon.skill1.chargeRequired} ĐIỂM SẠC
                    </span>
                  </div>
                  <p className="text-[8.5px] text-slate-300">
                    {selectedWeapon.skill1.descriptionVi}
                  </p>
                </div>

                {/* Skill 2 (Special Trigger) */}
                <div className="p-2.5 bg-cyan-950/40 border border-cyan-600/70">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-cyan-300 font-bold flex items-center gap-1">
                      <span>🎲</span> {selectedWeapon.skill2.nameVi}
                    </span>
                    <span className="text-[8px] px-1.5 py-0.5 bg-cyan-500 text-black font-bold">
                      KHI ĐỔ RA MẶT {selectedWeapon.skill2.triggerNumber}
                    </span>
                  </div>
                  <p className="text-[8.5px] text-slate-300">
                    {selectedWeapon.skill2.descriptionVi}
                  </p>
                </div>
              </div>

              {/* Equip Button */}
              <PixelButton
                variant={isCurrentlyEquipped ? 'success' : 'gold'}
                size="md"
                onClick={() => handleEquip(selectedWeapon.id)}
                disabled={isCurrentlyEquipped}
                className="w-full py-2.5"
                icon={<span>⚔️</span>}
              >
                {equipSuccess
                  ? 'ĐÃ TRANG BỊ THÀNH CÔNG!'
                  : isCurrentlyEquipped
                  ? '✓ ĐANG TRANG BỊ'
                  : 'TRANG BỊ VŨ KHÍ NÀY'}
              </PixelButton>
            </div>
          </PixelFrame>
        </div>
      </div>
    </div>
  );
}
