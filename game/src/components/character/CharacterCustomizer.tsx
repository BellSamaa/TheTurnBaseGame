'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import {
  CLASS_DEFINITIONS,
  COLOR_PALETTES,
} from '@/lib/constants';
import type { ClassType, CharacterCustomization } from '@/types/game';
import PixelButton from '@/components/ui/PixelButton';
import PixelFrame from '@/components/ui/PixelFrame';

export default function CharacterCustomizer() {
  const { profile, updateProfile, updateCharacter, setPage, settings } = useGameStore();
  const lang = settings.language;

  const [activeTab, setActiveTab] = useState<
    'base' | 'hair' | 'colors' | 'clothes' | 'class' | 'face'
  >('base');

  const [heroName, setHeroName] = useState(profile.name);
  const [selectedClass, setSelectedClass] = useState<ClassType>(profile.classType);
  const [custom, setCustom] = useState<CharacterCustomization>(profile.character);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    updateProfile({
      name: heroName.trim() || 'Hero',
      classType: selectedClass,
      character: custom,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Pre-configured character base presets
  const baseCharacters = [
    { id: 0, name: 'Chiến Binh Lửa', icon: '⚔️' },
    { id: 1, name: 'Hiệp Sĩ Băng', icon: '🛡️' },
    { id: 2, name: 'Sát Thủ Bóng Đêm', icon: '🗡️' },
    { id: 3, name: 'Phù Thủy Ánh Sáng', icon: '✨' },
    { id: 4, name: 'Cung Thủ Rừng Xanh', icon: '🏹' },
    { id: 5, name: 'Võ Thần Quyền Năng', icon: '🥊' },
    { id: 6, name: 'Đấu Sĩ Hoàng Kim', icon: '👑' },
    { id: 7, name: 'Pháp Sư Cổ Đại', icon: '🔮' },
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center p-3 sm:p-6 overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/background.png"
          alt="Customizer Background"
          fill
          priority
          className="object-cover filter brightness-[0.3] contrast-125 blur-sm"
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
          {t('customizeHero', lang)}
        </h2>

        <PixelButton
          variant="success"
          size="sm"
          onClick={handleSave}
          icon={<span>💾</span>}
        >
          {saveSuccess ? 'ĐÃ LƯU!' : t('saveHero', lang)}
        </PixelButton>
      </div>

      {/* Main Studio Layout */}
      <div className="relative z-20 w-full max-w-5xl my-auto grid grid-cols-1 lg:grid-cols-12 gap-4 py-4">
        {/* Left Column: Character Stage & Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <PixelFrame variant="gold" title="HÌNH ẢNH NHÂN VẬT" className="p-4 flex flex-col items-center">
            {/* Stage Pedestal */}
            <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] bg-gradient-to-b from-slate-900/90 to-black border-2 border-yellow-500/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden mb-3">
              {/* Background Glow */}
              <div
                className="absolute w-44 h-44 rounded-full blur-2xl opacity-40 animate-pulse pointer-events-none"
                style={{ backgroundColor: custom.hairColor }}
              />

              {/* Character Layering */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* 1. Base Body Sprite */}
                <div
                  className="absolute inset-0 transition-all duration-300"
                  style={{
                    filter: `drop-shadow(0 4px 6px rgba(0,0,0,0.8))`,
                  }}
                >
                  <Image
                    src="/assets/images/characters/char-8transparent.png"
                    alt="Character Base"
                    fill
                    className="object-contain"
                    style={{
                      transform: `scale(1.3) translateX(-${(custom.baseIndex % 4) * 25}%) translateY(-${Math.floor(custom.baseIndex / 4) * 50}%)`,
                      transformOrigin: 'top left',
                    }}
                  />
                </div>

                {/* 2. Color tint layer for skin */}
                <div
                  className="absolute inset-0 mix-blend-color opacity-30 pointer-events-none"
                  style={{ backgroundColor: custom.skinColor }}
                />

                {/* 3. Hair layer with tint */}
                <div
                  className="absolute inset-0 pointer-events-none transition-all duration-300"
                  style={{
                    filter: `drop-shadow(0 0 10px ${custom.hairColor}80)`,
                  }}
                >
                  <div
                    className="w-full h-full opacity-40 mix-blend-overlay"
                    style={{ backgroundColor: custom.hairColor }}
                  />
                </div>
              </div>

              {/* Pedestal Base */}
              <div className="absolute bottom-2 w-36 h-4 bg-yellow-600/60 rounded-[50%] blur-[2px] border border-yellow-400/80 shadow-[0_0_12px_rgba(250,204,21,0.6)]" />
            </div>

            {/* Name Input */}
            <div className="w-full flex items-center gap-2 mb-2">
              <span className="text-[10px] text-yellow-400 font-bold whitespace-nowrap">
                TÊN:
              </span>
              <input
                type="text"
                value={heroName}
                maxLength={16}
                onChange={(e) => setHeroName(e.target.value)}
                className="w-full bg-slate-900 border-2 border-yellow-500/70 px-2.5 py-1.5 text-xs text-yellow-300 font-pixel focus:outline-none focus:border-yellow-400"
                placeholder="Nhập tên hiệp sĩ..."
              />
            </div>

            {/* Current Class Badge */}
            <div className="w-full p-2 bg-slate-950/80 border border-slate-700 flex items-center justify-between">
              <span className="text-[9px] text-slate-400">NGHỀ NGHIỆP:</span>
              <span className="text-[10px] text-yellow-300 font-bold uppercase">
                {CLASS_DEFINITIONS[selectedClass]?.nameVi}
              </span>
            </div>
          </PixelFrame>
        </div>

        {/* Right Column: Customization Controls & Tabs (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-black/60 p-1 border-2 border-yellow-500/50">
            {[
              { id: 'base', label: 'TƯỚNG' },
              { id: 'colors', label: 'MÀU SẮC' },
              { id: 'class', label: 'CLASS' },
              { id: 'hair', label: 'TÓC' },
              { id: 'clothes', label: 'TRANG PHỤC' },
              { id: 'face', label: 'BIỂU CẢM' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  text-[9px] font-pixel py-2 px-1 transition text-center cursor-pointer select-none
                  ${
                    activeTab === tab.id
                      ? 'bg-yellow-500 text-black font-bold shadow-[0_0_8px_rgba(234,179,8,0.8)]'
                      : 'text-slate-300 hover:bg-slate-800'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panes */}
          <PixelFrame variant="cyan" className="p-3 sm:p-4 min-h-[340px]">
            {/* 1. Base Character Selection */}
            {activeTab === 'base' && (
              <div>
                <h4 className="text-[11px] text-yellow-300 font-bold mb-3">
                  CHỌN KHUÔN MẪU NHÂN VẬT GỐC (8 NHÂN VẬT PIXEL):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {baseCharacters.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setCustom({ ...custom, baseIndex: b.id })}
                      className={`
                        p-2 border-2 cursor-pointer transition text-center flex flex-col items-center justify-center
                        ${
                          custom.baseIndex === b.id
                            ? 'border-yellow-400 bg-yellow-950/50 scale-105 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                        }
                      `}
                    >
                      <span className="text-2xl mb-1">{b.icon}</span>
                      <span className="text-[9px] text-yellow-300 font-bold">{b.name}</span>
                      <span className="text-[8px] text-slate-400">Mẫu #{b.id + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Color Palette Tab (Skin, Hair, Outfit) */}
            {activeTab === 'colors' && (
              <div className="flex flex-col gap-4">
                {/* Skin Color Picker */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-yellow-300 font-bold">
                      {t('skinColor', lang)}:
                    </span>
                    <span
                      className="w-4 h-4 border border-white"
                      style={{ backgroundColor: custom.skinColor }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTES.skin.map((color) => (
                      <button
                        key={color}
                        onClick={() => setCustom({ ...custom, skinColor: color })}
                        style={{ backgroundColor: color }}
                        className={`
                          w-7 h-7 border-2 cursor-pointer transition transform
                          ${custom.skinColor === color ? 'border-white scale-110 shadow-[0_0_8px_#fff]' : 'border-slate-700 hover:scale-105'}
                        `}
                      />
                    ))}
                  </div>
                </div>

                {/* Hair Color Picker */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-yellow-300 font-bold">
                      {t('hairColor', lang)}:
                    </span>
                    <span
                      className="w-4 h-4 border border-white"
                      style={{ backgroundColor: custom.hairColor }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTES.hair.map((color) => (
                      <button
                        key={color}
                        onClick={() => setCustom({ ...custom, hairColor: color })}
                        style={{ backgroundColor: color }}
                        className={`
                          w-7 h-7 border-2 cursor-pointer transition transform
                          ${custom.hairColor === color ? 'border-white scale-110 shadow-[0_0_8px_#fff]' : 'border-slate-700 hover:scale-105'}
                        `}
                      />
                    ))}
                  </div>
                </div>

                {/* Clothes Color Picker */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-yellow-300 font-bold">
                      {t('clothingColor', lang)}:
                    </span>
                    <span
                      className="w-4 h-4 border border-white"
                      style={{ backgroundColor: custom.shirtColor }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTES.clothes.map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setCustom({
                            ...custom,
                            shirtColor: color,
                            pantsColor: color,
                          })
                        }
                        style={{ backgroundColor: color }}
                        className={`
                          w-7 h-7 border-2 cursor-pointer transition transform
                          ${custom.shirtColor === color ? 'border-white scale-110 shadow-[0_0_8px_#fff]' : 'border-slate-700 hover:scale-105'}
                        `}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Class Selection (Uses the 6 official 16-bit badges) */}
            {activeTab === 'class' && (
              <div>
                <h4 className="text-[11px] text-yellow-300 font-bold mb-2">
                  CHỌN NGHỀ NGHIỆP CHIẾN ĐẤU (6 LỚP CLASS):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.values(CLASS_DEFINITIONS).map((c) => {
                    const isSelected = selectedClass === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedClass(c.id)}
                        className={`
                          relative p-2 border-2 cursor-pointer select-none transition flex flex-col justify-between
                          ${
                            isSelected
                              ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_12px_rgba(250,204,21,0.5)] scale-[1.02]'
                              : 'border-slate-700 bg-slate-900/70 hover:border-slate-500'
                          }
                        `}
                      >
                        {/* Class 16-bit Button Image from Picture/ClassUI */}
                        <div className="relative w-full h-12 mb-1">
                          <Image
                            src={c.image}
                            alt={c.name}
                            fill
                            className="object-contain"
                          />
                        </div>

                        <span className="text-[9px] font-bold text-yellow-300 text-center mb-1">
                          {c.nameVi} ({c.baseHp} HP)
                        </span>

                        <p className="text-[7.5px] text-slate-300 leading-tight">
                          {c.descriptionVi}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Hair Styles Tab */}
            {activeTab === 'hair' && (
              <div>
                <h4 className="text-[11px] text-yellow-300 font-bold mb-3">
                  CHỌN KIỂU TÓC PIXEL (BỘ TÓC ĐA DẠNG):
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setCustom({ ...custom, hairIndex: idx })}
                      className={`
                        p-2.5 border-2 text-center font-pixel text-[9px] transition cursor-pointer
                        ${
                          custom.hairIndex === idx
                            ? 'border-yellow-400 bg-yellow-950/60 text-yellow-300'
                            : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                        }
                      `}
                    >
                      Kiểu Tóc #{idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Clothes Tab */}
            {activeTab === 'clothes' && (
              <div>
                <h4 className="text-[11px] text-yellow-300 font-bold mb-3">
                  CHỌN BỘ TRANG PHỤC (20 ÁO RPG & QUẦN):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[260px] overflow-y-auto pr-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map(
                    (idx) => (
                      <button
                        key={idx}
                        onClick={() => setCustom({ ...custom, shirtIndex: idx })}
                        className={`
                          p-2 border-2 text-center font-pixel text-[8.5px] transition cursor-pointer
                          ${
                            custom.shirtIndex === idx
                              ? 'border-yellow-400 bg-yellow-950/60 text-yellow-300'
                              : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                          }
                        `}
                      >
                        Áo Giáp #{idx + 1}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* 6. Expressions / Face Tab */}
            {activeTab === 'face' && (
              <div>
                <h4 className="text-[11px] text-yellow-300 font-bold mb-3">
                  BIỂU CẢM KHUÔN MẶT (10 BIỂU CẢM PIXEL RPG):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    'Tự Tin',
                    'Chiến Đấu',
                    'Nụ Cười',
                    'Lạnh Lùng',
                    'Cuồng Nộ',
                    'Tập Trung',
                    'Cười Khẩy',
                    'Bất Ngờ',
                    'Ngầu Lòi',
                    'Thần Thái',
                  ].map((faceName, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCustom({ ...custom, faceIndex: idx })}
                      className={`
                        p-2.5 border-2 text-center font-pixel text-[8.5px] transition cursor-pointer
                        ${
                          custom.faceIndex === idx
                            ? 'border-yellow-400 bg-yellow-950/60 text-yellow-300'
                            : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                        }
                      `}
                    >
                      {faceName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </PixelFrame>
        </div>
      </div>
    </div>
  );
}
