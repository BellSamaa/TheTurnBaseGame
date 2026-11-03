'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import {
  CLASS_DEFINITIONS,
  COLOR_PALETTES,
  SPRITE_HELPERS,
} from '@/lib/constants';
import type { ClassType, CharacterCustomization } from '@/types/game';
import PixelButton from '@/components/ui/PixelButton';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelIcon from '@/components/ui/PixelIcon';
import CharacterRenderer from './CharacterRenderer';
import { playClickSound, playSaveSound } from '@/lib/soundEffects';

const DEFAULT_CHARACTER: CharacterCustomization = {
  baseIndex: 0,
  hairIndex: 0,
  hairColor: '#eab308',
  skinColor: '#fcd34d',
  shirtIndex: 0,
  shirtColor: '#3b82f6',
  pantsIndex: 0,
  pantsColor: '#1e293b',
  accessoryIndex: -1, // No accessory by default
  faceIndex: 0,
};

export default function CharacterCustomizer() {
  const { profile, updateProfile, updateCharacter, setPage, settings } = useGameStore();
  const lang = settings.language;
  const isEn = lang === 'en';

  const [activeTab, setActiveTab] = useState<
    'body' | 'hair' | 'face' | 'shirt' | 'pants' | 'accessory' | 'colors' | 'class'
  >('body');

  const [heroName, setHeroName] = useState(profile.name);
  const [selectedClass, setSelectedClass] = useState<ClassType>(profile.classType);
  const [custom, setCustom] = useState<CharacterCustomization>(profile.character);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Dirty state tracking: has the user made changes?
  const isDirty = useMemo(() => {
    return (
      heroName.trim() !== profile.name ||
      selectedClass !== profile.classType ||
      custom.baseIndex !== profile.character.baseIndex ||
      custom.hairIndex !== profile.character.hairIndex ||
      custom.hairColor !== profile.character.hairColor ||
      custom.faceIndex !== profile.character.faceIndex ||
      custom.shirtIndex !== profile.character.shirtIndex ||
      custom.shirtColor !== profile.character.shirtColor ||
      custom.pantsIndex !== profile.character.pantsIndex ||
      custom.pantsColor !== profile.character.pantsColor ||
      custom.accessoryIndex !== profile.character.accessoryIndex ||
      custom.skinColor !== profile.character.skinColor
    );
  }, [heroName, selectedClass, custom, profile]);

  const handleSave = () => {
    updateProfile({
      name: heroName.trim() || (isEn ? 'Dice Hero' : 'Hiệp Sĩ Xúc Xắc'),
      classType: selectedClass,
      character: custom,
    });
    updateCharacter(custom);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2200);
  };

  const handleCancel = () => {
    setHeroName(profile.name);
    setSelectedClass(profile.classType);
    setCustom(profile.character);
  };

  const handleResetToDefault = () => {
    setCustom(DEFAULT_CHARACTER);
  };

  const handleBack = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      setPage('home');
    }
  };

  // 8 Base Character Archetypes
  const baseCharacters = [
    { id: 0, name: isEn ? 'Knight Male' : 'Chiến Binh Nam' },
    { id: 1, name: isEn ? 'Paladin Male' : 'Hiệp Sĩ Nam' },
    { id: 2, name: isEn ? 'Titan Male' : 'Đấu Sĩ Vạm Vỡ' },
    { id: 3, name: isEn ? 'Juggernaut' : 'Khổng Lồ Thiết Giáp' },
    { id: 4, name: isEn ? 'Rogue Female' : 'Sát Thủ Nữ' },
    { id: 5, name: isEn ? 'Ranger Female' : 'Cung Thủ Nữ' },
    { id: 6, name: isEn ? 'Mage Female' : 'Pháp Sư Nữ' },
    { id: 7, name: isEn ? 'Valkyrie' : 'Chiến Binh Nữ' },
  ];

  const tabs = [
    { id: 'body', label: isEn ? 'BODY' : 'THÂN', icon: 'user' as const },
    { id: 'hair', label: isEn ? 'HAIR' : 'TÓC', icon: 'hair' as const },
    { id: 'face', label: isEn ? 'FACE' : 'MẶT', icon: 'face' as const },
    { id: 'shirt', label: isEn ? 'SHIRT' : 'ÁO', icon: 'shirt' as const },
    { id: 'pants', label: isEn ? 'PANTS' : 'QUẦN', icon: 'pants' as const },
    { id: 'accessory', label: isEn ? 'ACC' : 'PHỤ KIỆN', icon: 'ring' as const },
    { id: 'colors', label: isEn ? 'COLORS' : 'MÀU', icon: 'palette' as const },
    { id: 'class', label: isEn ? 'CLASS' : 'NGHỀ', icon: 'sword' as const },
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center p-3 sm:p-5 overflow-x-hidden bg-[#07090e] select-none">
      {/* Background with Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/background.png"
          alt="Customizer Background"
          fill
          priority
          className="object-cover filter brightness-[0.35] contrast-125 blur-[1px]"
        />
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 w-full max-w-5xl flex items-center justify-between pb-3 border-b-2 border-yellow-500/50">
        <PixelSpriteButton
          sprite="back"
          onClick={handleBack}
          className="w-28 sm:w-32"
        />

        <h2 className="text-sm sm:text-base text-yellow-400 font-pixel drop-shadow">
          {t('customizeHero', lang)}
        </h2>

        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-[8px] font-pixel text-yellow-400 animate-pulse hidden sm:inline">
              ● {isEn ? 'UNSAVED CHANGES' : 'CHƯA LƯU'}
            </span>
          )}
          <PixelSpriteButton
            sprite="confirm"
            onClick={handleSave}
            className="w-32 sm:w-36"
            title={saveSuccess ? (isEn ? 'SAVED!' : 'ĐÃ LƯU!') : t('saveHero', lang)}
          />
        </div>
      </header>

      {/* Main Studio Grid */}
      <main className="relative z-20 w-full max-w-5xl my-auto grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 py-3">
        {/* Left Column: Character Stage & Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <PixelFrame
            variant="gold"
            title={isEn ? 'HERO PREVIEW' : 'HÌNH ẢNH NHÂN VẬT'}
            className="p-3 sm:p-4 flex flex-col items-center bg-[#0c101c]/95"
          >
            {/* Stage Pedestal */}
            <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[300px] bg-gradient-to-b from-slate-900 via-[#07090e] to-[#040608] border-2 border-yellow-500/70 shadow-[inset_0_0_30px_rgba(0,0,0,0.95)] flex flex-col items-center justify-center overflow-hidden mb-3 p-3">
              <CharacterRenderer
                character={custom}
                size="lg"
                showAura={true}
                auraColor={custom.hairColor}
                showShadow={true}
              />
              {/* Golden circular pedestal glowing base */}
              <div className="w-36 h-3 bg-yellow-600/60 rounded-[50%] blur-[1px] border border-yellow-400/80 shadow-[0_0_15px_rgba(250,204,21,0.6)] mt-1" />
            </div>

            {/* Name Input */}
            <div className="w-full flex items-center gap-2 mb-2">
              <span className="text-[9.5px] text-yellow-400 font-bold whitespace-nowrap font-pixel">
                {isEn ? 'NAME:' : 'TÊN:'}
              </span>
              <input
                type="text"
                value={heroName}
                maxLength={16}
                onChange={(e) => setHeroName(e.target.value)}
                className="w-full bg-[#07090e] border-2 border-yellow-500/70 px-2.5 py-1.5 text-xs text-yellow-300 font-pixel focus:outline-none focus:border-yellow-400"
                placeholder={isEn ? 'Enter hero name...' : 'Nhập tên hiệp sĩ...'}
              />
            </div>

            {/* Class Badge */}
            <div className="w-full p-2 bg-[#07090e] border border-slate-700 flex items-center justify-between mb-3">
              <span className="text-[8px] text-slate-400 font-pixel">
                {isEn ? 'CLASS ARCHETYPE:' : 'NGHỀ NGHIỆP:'}
              </span>
              <span className="text-[9px] text-yellow-300 font-pixel font-bold uppercase">
                {isEn ? CLASS_DEFINITIONS[selectedClass]?.name : CLASS_DEFINITIONS[selectedClass]?.nameVi}
              </span>
            </div>

            {/* Action Buttons: Cancel & Reset to Default */}
            <div className="w-full grid grid-cols-2 gap-2">
              <button
                disabled={!isDirty}
                onClick={handleCancel}
                className={`py-1.5 px-2 text-[8px] font-pixel border transition ${
                  isDirty
                    ? 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700 cursor-pointer'
                    : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                }`}
              >
                {isEn ? 'REVERT / CANCEL' : 'HỦY THAY ĐỔI'}
              </button>

              <button
                onClick={handleResetToDefault}
                className="py-1.5 px-2 text-[8px] font-pixel border border-slate-600 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              >
                {isEn ? 'RESET DEFAULT' : 'MẶC ĐỊNH'}
              </button>
            </div>
          </PixelFrame>
        </div>

        {/* Right Column: Customization Controls & Sliced Tabs (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 bg-[#0c101c] p-1 border-2 border-yellow-500/60">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  playClickSound();
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`
                  text-[8px] font-pixel py-2 px-1 transition text-center cursor-pointer select-none flex flex-col items-center gap-1
                  ${
                    activeTab === tab.id
                      ? 'bg-yellow-500 text-black font-bold shadow-[0_0_8px_rgba(234,179,8,0.8)]'
                      : 'text-slate-300 hover:bg-slate-800'
                  }
                `}
              >
                <PixelIcon name={tab.icon} size={14} color={activeTab === tab.id ? '#000' : '#facc15'} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Panes */}
          <PixelFrame variant="cyan" className="p-3 sm:p-4 min-h-[370px] bg-[#0c101c]/95">
            {/* 1. Body Archetypes (8 Sliced Bodies) */}
            {activeTab === 'body' && (
              <div>
                <h4 className="text-[10px] text-yellow-300 font-pixel font-bold mb-3">
                  {isEn ? 'BASE BODY ARCHETYPE (8 BODIES):' : 'KHUÔN MẪU THÂN GỐC (8 VÓC DÁNG):'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {baseCharacters.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        playClickSound();
                        setCustom({ ...custom, baseIndex: b.id });
                      }}
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
                  {isEn ? 'HAIRSTYLE (20 PIXEL STYLES):' : 'KIỂU TÓC PIXEL (20 MẪU):'}
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {Array.from({ length: 20 }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        playClickSound();
                        setCustom({ ...custom, hairIndex: idx });
                      }}
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
                  {isEn ? 'EXPRESSION (10 RPG FACES):' : 'BIỂU CẢM MẶT (10 MẪU):'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        playClickSound();
                        setCustom({ ...custom, faceIndex: idx });
                      }}
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
                  {isEn ? 'UPPER BODY SHIRT / ARMOR (20 SPRITES):' : 'ÁO GIÁP / THÂN TRÊN (20 MẪU):'}
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {Array.from({ length: 20 }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        playClickSound();
                        setCustom({ ...custom, shirtIndex: idx });
                      }}
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
                  {isEn ? 'LOWER BODY PANTS (20 SPRITES):' : 'QUẦN / THÂN DƯỚI (20 MẪU):'}
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {Array.from({ length: 20 }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        playClickSound();
                        setCustom({ ...custom, pantsIndex: idx });
                      }}
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

            {/* 6. Accessories (None Option + 20 Sliced Accessories) */}
            {activeTab === 'accessory' && (
              <div>
                <h4 className="text-[10px] text-yellow-300 font-pixel font-bold mb-3 flex items-center justify-between">
                  <span>{isEn ? 'ACCESSORIES (CAPES, GLASSES, BELTS):' : 'PHỤ KIỆN (ÁO CHOÀNG, KÍNH, DÂY LƯNG):'}</span>
                  {custom.accessoryIndex === -1 && (
                    <span className="text-[8px] text-emerald-400 font-pixel">✓ {isEn ? 'NONE EQUIPPED' : 'ĐANG BỎ PHỤ KIỆN'}</span>
                  )}
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {/* Option: NONE / BỎ PHỤ KIỆN */}
                  <button
                    onClick={() => {
                      playClickSound();
                      setCustom({ ...custom, accessoryIndex: -1 });
                    }}
                    className={`
                      p-1.5 border-2 flex flex-col items-center justify-center transition cursor-pointer h-24
                      ${
                        custom.accessoryIndex === -1
                          ? 'border-emerald-400 bg-emerald-950/80 shadow-[0_0_8px_#4ade80]'
                          : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                      }
                    `}
                  >
                    <PixelIcon name="ban" size={24} color={custom.accessoryIndex === -1 ? '#4ade80' : '#94a3b8'} />
                    <span className="text-[7.5px] font-pixel text-center mt-1.5 font-bold">
                      {isEn ? 'NONE' : 'BỎ CHỌN'}
                    </span>
                  </button>

                  {/* 20 Accessories */}
                  {Array.from({ length: 20 }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        playClickSound();
                        setCustom({ ...custom, accessoryIndex: idx });
                      }}
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

            {/* 7. Colors Tab (Hair, Shirt, Pants, Skin) */}
            {activeTab === 'colors' && (
              <div className="flex flex-col gap-4">
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
                        onClick={() => {
                          playClickSound();
                          setCustom({ ...custom, hairColor: color });
                        }}
                        style={{ backgroundColor: color }}
                        className={`
                          w-7 h-7 border-2 cursor-pointer transition transform
                          ${custom.hairColor === color ? 'border-white scale-110 shadow-[0_0_8px_#fff]' : 'border-slate-700 hover:scale-105'}
                        `}
                      />
                    ))}
                  </div>
                </div>

                {/* Clothes Color Picker (Shirt & Pants) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] text-yellow-300 font-pixel font-bold">
                      {t('clothingColor', lang)}:
                    </span>
                    <div className="flex gap-1">
                      <span className="w-4 h-4 border border-white" style={{ backgroundColor: custom.shirtColor }} />
                      <span className="w-4 h-4 border border-white" style={{ backgroundColor: custom.pantsColor }} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTES.clothes.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          playClickSound();
                          setCustom({
                            ...custom,
                            shirtColor: color,
                            pantsColor: color,
                          });
                        }}
                        style={{ backgroundColor: color }}
                        className={`
                          w-7 h-7 border-2 cursor-pointer transition transform
                          ${custom.shirtColor === color ? 'border-white scale-110 shadow-[0_0_8px_#fff]' : 'border-slate-700 hover:scale-105'}
                        `}
                      />
                    ))}
                  </div>
                </div>

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
                        onClick={() => {
                          playClickSound();
                          setCustom({ ...custom, skinColor: color });
                        }}
                        style={{ backgroundColor: color }}
                        className={`
                          w-7 h-7 border-2 cursor-pointer transition transform
                          ${custom.skinColor === color ? 'border-white scale-110 shadow-[0_0_8px_#fff]' : 'border-slate-700 hover:scale-105'}
                        `}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 8. Class Archetype Selection (6 Classes) */}
            {activeTab === 'class' && (
              <div>
                <h4 className="text-[10px] text-yellow-300 font-pixel font-bold mb-2">
                  {isEn ? 'FIGHTING CLASS (6 ARCHETYPES):' : 'NGHỀ NGHIỆP CHIẾN ĐẤU (6 HỆ PHÁI):'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.values(CLASS_DEFINITIONS).map((c) => {
                    const isSelected = selectedClass === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          playClickSound();
                          setSelectedClass(c.id);
                        }}
                        className={`
                          relative p-2 border-2 cursor-pointer select-none transition flex flex-col justify-between
                          ${
                            isSelected
                              ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_12px_rgba(250,204,21,0.5)] scale-[1.02]'
                              : 'border-slate-700 bg-slate-900/70 hover:border-slate-500'
                          }
                        `}
                      >
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

                        <p className="text-[7.5px] text-slate-300 font-sans leading-tight">
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
      </main>

      {/* Unsaved Changes Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm"
            >
              <PixelFrame variant="gold" title={isEn ? 'UNSAVED CHANGES' : 'CHƯA LƯU THAY ĐỔI'}>
                <div className="p-3 text-center">
                  <p className="text-[9px] font-pixel text-slate-300 mb-5 leading-relaxed">
                    {isEn
                      ? 'You have unsaved customizations! Discard them and return to home?'
                      : 'Bạn đang có tùy chỉnh chưa lưu! Bạn có chắc muốn hủy và trở về không?'}
                  </p>

                  <div className="flex gap-2 justify-center">
                    <PixelSpriteButton
                      sprite="cancel"
                      onClick={() => {
                        handleCancel();
                        setShowExitConfirm(false);
                        setPage('home');
                      }}
                      className="w-32 sm:w-36"
                    />

                    <PixelSpriteButton
                      sprite="confirm"
                      onClick={() => {
                        handleSave();
                        setShowExitConfirm(false);
                        setPage('home');
                      }}
                      className="w-32 sm:w-36"
                    />
                  </div>
                </div>
              </PixelFrame>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
