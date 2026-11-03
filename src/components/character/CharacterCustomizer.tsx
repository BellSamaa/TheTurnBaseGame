'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import {
  CLASS_DEFINITIONS,
  COLOR_PALETTES,
  SPRITE_HELPERS,
} from '@/lib/constants';
import type { ClassType, CharacterCustomization } from '@/types/game';
import PixelButton from '@/components/ui/PixelButton';
import PixelFrame from '@/components/ui/PixelFrame';

export default function CharacterCustomizer() {
  const { profile, updateProfile, updateCharacter, setPage, settings, currentUser, updateUserBio } = useGameStore();
  const lang = settings.language;
  const isEn = lang === 'en';

  const [activeTab, setActiveTab] = useState<
    'body' | 'hair' | 'face' | 'shirt' | 'pants' | 'accessory' | 'colors' | 'class'
  >('body');

  const [heroName, setHeroName] = useState(profile.name);
  const [selectedClass, setSelectedClass] = useState<ClassType>(profile.classType);
  const [custom, setCustom] = useState<CharacterCustomization>(profile.character);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    updateProfile({
      name: heroName.trim() || (isEn ? 'Dice Hero' : 'Hiệp Sĩ Xúc Xắc'),
      classType: selectedClass,
      character: custom,
    });
    updateCharacter(custom);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // 8 Base Character Archetypes
  const baseCharacters = [
    { id: 0, name: isEn ? 'Flame Knight' : 'Hiệp Sĩ Lửa' },
    { id: 1, name: isEn ? 'Frost Paladin' : 'Hiệp Sĩ Băng' },
    { id: 2, name: isEn ? 'Shadow Rogue' : 'Sát Thủ Bóng Đêm' },
    { id: 3, name: isEn ? 'Holy Cleric' : 'Pháp Sư Ánh Sáng' },
    { id: 4, name: isEn ? 'Forest Ranger' : 'Xạ Thủ Rừng Xanh' },
    { id: 5, name: isEn ? 'Iron Brawler' : 'Võ Thần Quyền Năng' },
    { id: 6, name: isEn ? 'Golden Champion' : 'Đấu Sĩ Hoàng Kim' },
    { id: 7, name: isEn ? 'Archmage' : 'Phù Thủy Cổ Đại' },
  ];

  const tabs = [
    { id: 'body', label: isEn ? 'BODY' : 'THÂN', icon: '👤' },
    { id: 'hair', label: isEn ? 'HAIR' : 'TÓC', icon: '💇' },
    { id: 'face', label: isEn ? 'FACE' : 'MẶT', icon: '🙂' },
    { id: 'shirt', label: isEn ? 'SHIRT' : 'ÁO', icon: '👕' },
    { id: 'pants', label: isEn ? 'PANTS' : 'QUẦN', icon: '👖' },
    { id: 'accessory', label: isEn ? 'ACC' : 'PHỤ KIỆN', icon: '💍' },
    { id: 'colors', label: isEn ? 'COLORS' : 'MÀU', icon: '🎨' },
    { id: 'class', label: isEn ? 'CLASS' : 'NGHỀ', icon: '⚔️' },
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center p-3 sm:p-6 overflow-x-hidden bg-[#07070b]">
      {/* Background with Dark Blur */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/background.png"
          alt="Customizer Background"
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

        <h2 className="text-sm sm:text-base text-yellow-400 font-pixel drop-shadow">
          {t('customizeHero', lang)}
        </h2>

        <PixelButton
          variant="success"
          size="sm"
          onClick={handleSave}
          icon={<span>💾</span>}
        >
          {saveSuccess ? (isEn ? 'SAVED!' : 'ĐÃ LƯU!') : t('saveHero', lang)}
        </PixelButton>
      </div>

      {/* Main Studio Layout */}
      <div className="relative z-20 w-full max-w-5xl my-auto grid grid-cols-1 lg:grid-cols-12 gap-5 py-4">
        {/* Left Column: Character Stage & Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <PixelFrame
            variant="gold"
            title={isEn ? 'HERO PREVIEW' : 'HÌNH ẢNH NHÂN VẬT'}
            className="p-4 flex flex-col items-center bg-black/80"
          >
            {/* Stage Pedestal */}
            <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[310px] bg-gradient-to-b from-slate-900 via-black to-[#0a0a14] border-2 border-yellow-500/70 shadow-[inset_0_0_25px_rgba(0,0,0,0.95)] flex items-center justify-center overflow-hidden mb-3">
              {/* Radial Glow */}
              <div
                className="absolute w-40 h-40 rounded-full blur-2xl opacity-40 animate-pulse pointer-events-none"
                style={{ backgroundColor: custom.hairColor }}
              />

              {/* Character Layering Stage (Strict Order: Body -> Pants -> Shirt -> Face -> Hair -> Accessory) */}
              <div className="relative w-44 h-56 flex items-center justify-center">
                {/* 1. Body Base (Sliced PNG) */}
                <img
                  src={SPRITE_HELPERS.body(custom.baseIndex)}
                  alt="Hero Body"
                  className="absolute inset-0 w-full h-full object-contain pixelated z-10 transition-all drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                />

                {/* Body Tint overlay */}
                <div
                  className="absolute inset-0 z-11 pointer-events-none mix-blend-color opacity-30"
                  style={{ backgroundColor: custom.skinColor }}
                />

                {/* 2. Pants (Sliced PNG) */}
                <img
                  src={SPRITE_HELPERS.pants(custom.pantsIndex)}
                  alt="Hero Pants"
                  className="absolute inset-0 w-full h-full object-contain pixelated z-20 pointer-events-none transition-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                />

                {/* 3. Shirt (Sliced PNG) */}
                <img
                  src={SPRITE_HELPERS.shirt(custom.shirtIndex)}
                  alt="Hero Shirt"
                  className="absolute inset-0 w-full h-full object-contain pixelated z-30 pointer-events-none transition-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                />

                {/* 4. Face (Sliced PNG) */}
                <img
                  src={SPRITE_HELPERS.face(custom.faceIndex)}
                  alt="Hero Face"
                  className="absolute inset-0 w-full h-full object-contain pixelated z-40 pointer-events-none transition-all"
                />

                {/* 5. Hair (Sliced PNG) */}
                <img
                  src={SPRITE_HELPERS.hair(custom.hairIndex)}
                  alt="Hero Hair"
                  className="absolute inset-0 w-full h-full object-contain pixelated z-50 pointer-events-none transition-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                />

                {/* 6. Accessory (Sliced PNG) */}
                <img
                  src={SPRITE_HELPERS.accessory(custom.accessoryIndex)}
                  alt="Hero Accessory"
                  className="absolute inset-0 w-full h-full object-contain pixelated z-60 pointer-events-none transition-all"
                />
              </div>

              {/* Pedestal Base */}
              <div className="absolute bottom-2 w-36 h-4 bg-yellow-600/60 rounded-[50%] blur-[1.5px] border border-yellow-400/80 shadow-[0_0_12px_rgba(250,204,21,0.6)]" />
            </div>

            {/* Name Input */}
            <div className="w-full flex items-center gap-2 mb-2">
              <span className="text-[10px] text-yellow-400 font-bold whitespace-nowrap font-pixel">
                {isEn ? 'NAME:' : 'TÊN:'}
              </span>
              <input
                type="text"
                value={heroName}
                maxLength={16}
                onChange={(e) => setHeroName(e.target.value)}
                className="w-full bg-slate-900 border-2 border-yellow-500/70 px-2.5 py-1.5 text-xs text-yellow-300 font-pixel focus:outline-none focus:border-yellow-400"
                placeholder={isEn ? 'Enter hero name...' : 'Nhập tên hiệp sĩ...'}
              />
            </div>

            {/* Current Class Badge */}
            <div className="w-full p-2 bg-slate-950/90 border border-slate-700 flex items-center justify-between">
              <span className="text-[8px] text-slate-400 font-pixel">
                {isEn ? 'CLASS ARCHETYPE:' : 'NGHỀ NGHIỆP:'}
              </span>
              <span className="text-[9px] text-yellow-300 font-pixel font-bold uppercase">
                {isEn ? CLASS_DEFINITIONS[selectedClass]?.name : CLASS_DEFINITIONS[selectedClass]?.nameVi}
              </span>
            </div>
          </PixelFrame>
        </div>

        {/* Right Column: Customization Controls & Tabs (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 bg-black/70 p-1 border-2 border-yellow-500/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  text-[8px] font-pixel py-2 px-1 transition text-center cursor-pointer select-none flex flex-col items-center gap-0.5
                  ${
                    activeTab === tab.id
                      ? 'bg-yellow-500 text-black font-bold shadow-[0_0_8px_rgba(234,179,8,0.8)]'
                      : 'text-slate-300 hover:bg-slate-800'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Panes */}
          <PixelFrame variant="cyan" className="p-3 sm:p-4 min-h-[360px] bg-black/80">
            {/* 1. Body Archetypes (8 Sliced Sprites) */}
            {activeTab === 'body' && (
              <div>
                <h4 className="text-[10px] text-yellow-300 font-pixel font-bold mb-3">
                  {isEn ? 'SELECT BASE BODY ARCHETYPE (8 PIXEL BODIES):' : 'CHỌN KHUÔN MẪU THÂN GỐC (8 THÂN PIXEL):'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {baseCharacters.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setCustom({ ...custom, baseIndex: b.id })}
                      className={`
                        p-2 border-2 cursor-pointer transition flex flex-col items-center justify-between h-36
                        ${
                          custom.baseIndex === b.id
                            ? 'border-yellow-400 bg-yellow-950/60 scale-105 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                        }
                      `}
                    >
                      <div className="relative w-full h-20 flex items-center justify-center overflow-hidden">
                        <img
                          src={SPRITE_HELPERS.body(b.id)}
                          alt={b.name}
                          className="w-full h-full object-contain pixelated"
                        />
                      </div>
                      <span className="text-[8px] text-yellow-300 font-pixel font-bold text-center mt-1">
                        {b.name}
                      </span>
                      <span className="text-[7px] text-slate-400 font-pixel">#{b.id + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Hair Selection (20 Sliced Hair Sprites) */}
            {activeTab === 'hair' && (
              <div>
                <h4 className="text-[10px] text-yellow-300 font-pixel font-bold mb-3">
                  {isEn ? 'SELECT HAIRSTYLE (20 PIXEL STYLES):' : 'CHỌN KIỂU TÓC PIXEL (20 MẪU TÓC):'}
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[290px] overflow-y-auto pr-1">
                  {Array.from({ length: 20 }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCustom({ ...custom, hairIndex: idx })}
                      className={`
                        p-1.5 border-2 flex flex-col items-center justify-between transition cursor-pointer h-24
                        ${
                          custom.hairIndex === idx
                            ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                            : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                        }
                      `}
                    >
                      <div className="relative w-full h-14 flex items-center justify-center overflow-hidden">
                        <img
                          src={SPRITE_HELPERS.hair(idx)}
                          alt={`Hair ${idx + 1}`}
                          className="w-full h-full object-contain pixelated"
                        />
                      </div>
                      <span className="text-[7.5px] font-pixel text-slate-300">#{idx + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Face Expressions (10 Sliced Faces) */}
            {activeTab === 'face' && (
              <div>
                <h4 className="text-[10px] text-yellow-300 font-pixel font-bold mb-3">
                  {isEn ? 'SELECT EXPRESSION (10 RPG FACES):' : 'CHỌN BIỂU CẢM MẶT (10 MẪU MẶT RPG):'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCustom({ ...custom, faceIndex: idx })}
                      className={`
                        p-2 border-2 flex flex-col items-center justify-between transition cursor-pointer h-28
                        ${
                          custom.faceIndex === idx
                            ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                            : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                        }
                      `}
                    >
                      <div className="relative w-full h-16 flex items-center justify-center overflow-hidden">
                        <img
                          src={SPRITE_HELPERS.face(idx)}
                          alt={`Face ${idx + 1}`}
                          className="w-full h-full object-contain pixelated"
                        />
                      </div>
                      <span className="text-[8px] font-pixel text-slate-300">Face #{idx + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Shirts (20 Sliced Shirts) */}
            {activeTab === 'shirt' && (
              <div>
                <h4 className="text-[10px] text-yellow-300 font-pixel font-bold mb-3">
                  {isEn ? 'SELECT UPPER BODY SHIRT / ARMOR (20 SPRITES):' : 'CHỌN ÁO GIÁP / THÂN TRÊN (20 MẪU ÁO):'}
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[290px] overflow-y-auto pr-1">
                  {Array.from({ length: 20 }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCustom({ ...custom, shirtIndex: idx })}
                      className={`
                        p-1.5 border-2 flex flex-col items-center justify-between transition cursor-pointer h-24
                        ${
                          custom.shirtIndex === idx
                            ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                            : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                        }
                      `}
                    >
                      <div className="relative w-full h-14 flex items-center justify-center overflow-hidden">
                        <img
                          src={SPRITE_HELPERS.shirt(idx)}
                          alt={`Shirt ${idx + 1}`}
                          className="w-full h-full object-contain pixelated"
                        />
                      </div>
                      <span className="text-[7.5px] font-pixel text-slate-300">#{idx + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Pants (20 Sliced Pants) */}
            {activeTab === 'pants' && (
              <div>
                <h4 className="text-[10px] text-yellow-300 font-pixel font-bold mb-3">
                  {isEn ? 'SELECT LOWER BODY PANTS (20 SPRITES):' : 'CHỌN QUẦN / THÂN DƯỚI (20 MẪU QUẦN):'}
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[290px] overflow-y-auto pr-1">
                  {Array.from({ length: 20 }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCustom({ ...custom, pantsIndex: idx })}
                      className={`
                        p-1.5 border-2 flex flex-col items-center justify-between transition cursor-pointer h-24
                        ${
                          custom.pantsIndex === idx
                            ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                            : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                        }
                      `}
                    >
                      <div className="relative w-full h-14 flex items-center justify-center overflow-hidden">
                        <img
                          src={SPRITE_HELPERS.pants(idx)}
                          alt={`Pants ${idx + 1}`}
                          className="w-full h-full object-contain pixelated"
                        />
                      </div>
                      <span className="text-[7.5px] font-pixel text-slate-300">#{idx + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Accessories (20 Sliced Accessories) */}
            {activeTab === 'accessory' && (
              <div>
                <h4 className="text-[10px] text-yellow-300 font-pixel font-bold mb-3">
                  {isEn ? 'SELECT ACCESSORY (20 SPRITES):' : 'CHỌN PHỤ KIỆN TRANG BỊ (20 MẪU PHỤ KIỆN):'}
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[290px] overflow-y-auto pr-1">
                  {Array.from({ length: 20 }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCustom({ ...custom, accessoryIndex: idx })}
                      className={`
                        p-1.5 border-2 flex flex-col items-center justify-between transition cursor-pointer h-24
                        ${
                          custom.accessoryIndex === idx
                            ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                            : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                        }
                      `}
                    >
                      <div className="relative w-full h-14 flex items-center justify-center overflow-hidden">
                        <img
                          src={SPRITE_HELPERS.accessory(idx)}
                          alt={`Accessory ${idx + 1}`}
                          className="w-full h-full object-contain pixelated"
                        />
                      </div>
                      <span className="text-[7.5px] font-pixel text-slate-300">#{idx + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Colors Tab (Skin, Hair, Clothes) */}
            {activeTab === 'colors' && (
              <div className="flex flex-col gap-4">
                {/* Skin Color Picker */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] text-yellow-300 font-pixel font-bold">
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
                    <span className="text-[9px] text-yellow-300 font-pixel font-bold">
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
                    <span className="text-[9px] text-yellow-300 font-pixel font-bold">
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

            {/* 8. Class Archetype Selection (6 Sliced Class Banners) */}
            {activeTab === 'class' && (
              <div>
                <h4 className="text-[10px] text-yellow-300 font-pixel font-bold mb-2">
                  {isEn ? 'CHOOSE FIGHTING CLASS (6 CLASSES):' : 'CHỌN NGHỀ NGHIỆP CHIẾN ĐẤU (6 LỚP CLASS):'}
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
                        {/* Class Sliced Banner */}
                        <div className="relative w-full h-12 mb-1 bg-black overflow-hidden border border-slate-700">
                          <img
                            src={c.image}
                            alt={c.name}
                            className="w-full h-full object-cover pixelated"
                          />
                        </div>

                        <span className="text-[8.5px] font-bold font-pixel text-yellow-300 text-center mb-1">
                          {isEn ? c.name : c.nameVi} ({c.baseHp} HP)
                        </span>

                        <p className="text-[7px] font-pixel text-slate-300 leading-tight">
                          {isEn ? c.description : c.descriptionVi}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </PixelFrame>
        </div>
      </div>
    </div>
  );
}
