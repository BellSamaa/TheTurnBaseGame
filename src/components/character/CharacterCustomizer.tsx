'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import { CLASS_DEFINITIONS, WEAPON_DEFINITIONS } from '@/lib/constants';
import type { ClassType, CharacterCustomization } from '@/types/game';
import PixelButton from '@/components/ui/PixelButton';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelIcon from '@/components/ui/PixelIcon';
import CharacterRenderer from './CharacterRenderer';
import { playClickSound, playSaveSound } from '@/lib/soundEffects';
import {
  BODIES_V3,
  HAIR_V3,
  FACES_V3,
  SHIRTS_V3,
  PANTS_V3,
  ACCESSORIES_V3,
} from '@/lib/characterKitV3';

export default function CharacterCustomizer() {
  const { profile, settings, updateProfile, updateCharacter, setPage } = useGameStore();
  const [previewMotion, setPreviewMotion] = useState<'idle' | 'walk' | 'run'>('idle');
  const lang = settings.language;
  const isEn = lang === 'en';

  const [activeTab, setActiveTab] = useState<
    'body' | 'hair' | 'face' | 'shirt' | 'pants' | 'accessory' | 'class'
  >('body');

  const [heroName, setHeroName] = useState(profile.name);
  const [selectedClass, setSelectedClass] = useState<ClassType>(profile.classType);
  const [custom, setCustom] = useState<CharacterCustomization>(profile.character);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check if there are unsaved changes
  const isDirty = useMemo(() => {
    return (
      heroName.trim() !== profile.name ||
      selectedClass !== profile.classType ||
      custom.baseIndex !== profile.character.baseIndex ||
      custom.hairIndex !== profile.character.hairIndex ||
      custom.faceIndex !== profile.character.faceIndex ||
      custom.shirtIndex !== profile.character.shirtIndex ||
      custom.pantsIndex !== profile.character.pantsIndex ||
      custom.accessoryIndex !== profile.character.accessoryIndex
    );
  }, [heroName, selectedClass, custom, profile]);

  const handleSave = () => {
    playSaveSound();
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
    playClickSound();
    setHeroName(profile.name);
    setSelectedClass(profile.classType);
    setCustom(profile.character);
  };

  const handleRandomize = () => {
    playClickSound();
    setCustom({
      ...custom,
      baseIndex: Math.floor(Math.random() * 8),
      hairIndex: Math.floor(Math.random() * 20),
      shirtIndex: Math.floor(Math.random() * 20),
      pantsIndex: Math.floor(Math.random() * 20),
      accessoryIndex: Math.random() > 0.25 ? Math.floor(Math.random() * 20) : -1,
      faceIndex: Math.floor(Math.random() * 10),
    });
  };

  const handleBack = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      setPage('home');
    }
  };

  const currentWeapon = WEAPON_DEFINITIONS[profile.weaponId] || WEAPON_DEFINITIONS.greatsword;

  const tabs = [
    { id: 'body', label: isEn ? 'BODY' : 'THÂN', icon: 'user' as const },
    { id: 'hair', label: isEn ? 'HAIR' : 'TÓC', icon: 'sparkles' as const },
    { id: 'face', label: isEn ? 'FACE' : 'MẶT', icon: 'eye' as const },
    { id: 'shirt', label: isEn ? 'SHIRT' : 'ÁO', icon: 'shield' as const },
    { id: 'pants', label: isEn ? 'PANTS' : 'QUẦN', icon: 'scroll' as const },
    { id: 'accessory', label: isEn ? 'ACC' : 'PHỤ KIỆN', icon: 'sparkles' as const },
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
          {t('customizeHero', lang)} (KIT V3)
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
            title={isEn ? 'HERO PREVIEW (64x96)' : 'HÌNH ẢNH NHÂN VẬT (64x96)'}
            className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#0c101c]/95 to-black/90"
          >
            {/* Live Character Stage */}
            <div className="relative w-full aspect-square max-w-[280px] bg-repeating-conic from-[#131b2b] to-[#0d131f] border-2 border-yellow-500/70 flex items-center justify-center p-3 shadow-inner">
              <CharacterRenderer
                character={custom}
                weapon={currentWeapon}
                size="xl"
                animation={previewMotion}
                facing="right"
                showAura={true}
                auraColor="#facc15"
                showShadow={true}
              />
            </div>

            <div className="flex gap-2 mt-3" aria-label={isEn ? 'Animation preview' : 'Xem thử chuyển động'}>
              {(['idle', 'walk', 'run'] as const).map(mode => <button key={mode} type="button" aria-pressed={previewMotion === mode} onClick={() => setPreviewMotion(mode)} className={'px-3 py-2 border text-xs ' + (previewMotion === mode ? 'border-yellow-300 bg-yellow-950 text-yellow-200' : 'border-slate-600 text-slate-300')}>
                {isEn ? mode.toUpperCase() : ({idle:'Đứng',walk:'Đi',run:'Chạy'})[mode]}
              </button>)}
            </div>
            {/* Hero Name Input */}
            <div className="w-full mt-3">
              <label className="block text-[8px] font-pixel text-yellow-300 font-bold mb-1">
                {isEn ? 'HERO NAME:' : 'TÊN ANH HÙNG:'}
              </label>
              <input
                type="text"
                value={heroName}
                maxLength={16}
                onChange={(e) => setHeroName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-yellow-300 font-pixel focus:outline-none focus:border-yellow-400"
              />
            </div>

            {/* Quick Actions: Randomize & Reset */}
            <div className="flex gap-2 w-full mt-3">
              <PixelButton
                variant="secondary"
                size="sm"
                onClick={handleRandomize}
                className="flex-1 text-[8px] font-pixel py-1.5"
                icon={<PixelIcon name="sparkles" size={11} color="#001a22" />}
              >
                {isEn ? 'RANDOMIZE' : 'NGẪU NHIÊN'}
              </PixelButton>

              <PixelButton
                variant="frame"
                size="sm"
                onClick={handleCancel}
                className="flex-1 text-[8px] font-pixel py-1.5"
              >
                {isEn ? 'RESET' : 'HOÀN NGUYÊN'}
              </PixelButton>
            </div>
          </PixelFrame>
        </div>

        {/* Right Column: Customizer Selector Tabs & Palettes (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <PixelFrame variant="cyan" className="p-3 sm:p-4 bg-[#0c101c]/95">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-1.5 pb-3 border-b border-slate-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    playClickSound();
                    setActiveTab(tab.id as typeof activeTab);
                  }}
                  className={`
                    px-2.5 py-1.5 text-[8px] font-pixel font-bold flex items-center gap-1 transition cursor-pointer border
                    ${
                      activeTab === tab.id
                        ? 'bg-yellow-400 text-black border-yellow-200 shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                    }
                  `}
                >
                  <PixelIcon
                    name={tab.icon}
                    size={11}
                    color={activeTab === tab.id ? '#000' : '#94a3b8'}
                  />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            <div className="pt-3 min-h-[340px]">
              {/* 1. BODY SELECTION */}
              {activeTab === 'body' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-pixel font-bold text-yellow-300">
                      {isEn ? 'SELECT BODY (8 SKIN TONES):' : 'CHỌN THÂN (8 TÔNG DA):'}
                    </span>
                    <span className="text-[8px] font-pixel text-cyan-300">
                      {isEn ? BODIES_V3[custom.baseIndex % 8].nameEn : BODIES_V3[custom.baseIndex % 8].nameVi}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BODIES_V3.map((b, idx) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          playClickSound();
                          setCustom({ ...custom, baseIndex: idx });
                        }}
                        className={`p-2 border-2 text-left font-pixel transition cursor-pointer ${
                          custom.baseIndex === idx
                            ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_8px_#facc15]'
                            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                        }`}
                      >
                        <span className="text-[7.5px] font-bold block text-yellow-400">
                          {b.gender.toUpperCase()} #{b.build}
                        </span>
                        <span className="text-[7px] text-slate-300 block leading-tight mt-0.5">
                          {isEn ? b.nameEn : b.nameVi}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. HAIR SELECTION */}
              {activeTab === 'hair' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-pixel font-bold text-yellow-300">
                      {isEn ? 'SELECT HAIR STYLE (20 STYLES):' : 'CHỌN KIỂU TÓC (20 KIỂU):'}
                    </span>
                    <span className="text-[8px] font-pixel text-cyan-300">
                      {isEn ? HAIR_V3[custom.hairIndex % 20].nameEn : HAIR_V3[custom.hairIndex % 20].nameVi}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {HAIR_V3.map((h, idx) => (
                      <button
                        key={h.id}
                        onClick={() => {
                          playClickSound();
                          setCustom({ ...custom, hairIndex: idx });
                        }}
                        className={`p-2 border text-left font-pixel transition cursor-pointer ${
                          custom.hairIndex === idx
                            ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_8px_#facc15]'
                            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                        }`}
                      >
                        <span className="text-[7.5px] text-yellow-400 font-bold block">
                          #{idx + 1}
                        </span>
                        <span className="text-[7px] text-slate-300 block truncate">
                          {isEn ? h.nameEn : h.nameVi}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. FACE SELECTION */}
              {activeTab === 'face' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-pixel font-bold text-yellow-300">
                      {isEn ? 'FACIAL EXPRESSION (10 EXPRESSIONS):' : 'BIỂU CẢM KHUÔN MẶT (10 MẪU):'}
                    </span>
                    <span className="text-[8px] font-pixel text-cyan-300">
                      {isEn ? FACES_V3[custom.faceIndex % 10].nameEn : FACES_V3[custom.faceIndex % 10].nameVi}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {FACES_V3.map((f, idx) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          playClickSound();
                          setCustom({ ...custom, faceIndex: idx });
                        }}
                        className={`p-2.5 border text-center font-pixel transition cursor-pointer ${
                          custom.faceIndex === idx
                            ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_8px_#facc15]'
                            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                        }`}
                      >
                        <span className="text-xs block font-bold text-yellow-400">#{idx + 1}</span>
                        <span className="text-[7.5px] text-slate-300 block truncate mt-1">
                          {isEn ? f.nameEn : f.nameVi}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. SHIRT SELECTION */}
              {activeTab === 'shirt' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-pixel font-bold text-yellow-300">
                      {isEn ? 'SHIRT STYLE (20 STYLES):' : 'KIỂU ÁO (20 KIỂU):'}
                    </span>
                    <span className="text-[8px] font-pixel text-cyan-300">
                      {isEn ? SHIRTS_V3[custom.shirtIndex % 20].nameEn : SHIRTS_V3[custom.shirtIndex % 20].nameVi}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {SHIRTS_V3.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          playClickSound();
                          setCustom({ ...custom, shirtIndex: idx });
                        }}
                        className={`p-2 border text-left font-pixel transition cursor-pointer ${
                          custom.shirtIndex === idx
                            ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_8px_#facc15]'
                            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                        }`}
                      >
                        <span className="text-[7.5px] text-yellow-400 font-bold block">
                          #{idx + 1}
                        </span>
                        <span className="text-[7px] text-slate-300 block truncate">
                          {isEn ? s.nameEn : s.nameVi}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. PANTS SELECTION */}
              {activeTab === 'pants' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-pixel font-bold text-yellow-300">
                      {isEn ? 'PANTS STYLE (20 STYLES):' : 'KIỂU QUẦN (20 KIỂU):'}
                    </span>
                    <span className="text-[8px] font-pixel text-cyan-300">
                      {isEn ? PANTS_V3[custom.pantsIndex % 20].nameEn : PANTS_V3[custom.pantsIndex % 20].nameVi}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {PANTS_V3.map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          playClickSound();
                          setCustom({ ...custom, pantsIndex: idx });
                        }}
                        className={`p-2 border text-left font-pixel transition cursor-pointer ${
                          custom.pantsIndex === idx
                            ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_8px_#facc15]'
                            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                        }`}
                      >
                        <span className="text-[7.5px] text-yellow-400 font-bold block">
                          #{idx + 1}
                        </span>
                        <span className="text-[7px] text-slate-300 block truncate">
                          {isEn ? p.nameEn : p.nameVi}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. ACCESSORY SELECTION */}
              {activeTab === 'accessory' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-pixel font-bold text-yellow-300">
                      {isEn ? 'ACCESSORY (NONE + 20 ACCESSORIES):' : 'PHỤ KIỆN (KHÔNG + 20 MÓN):'}
                    </span>
                    <span className="text-[8px] font-pixel text-cyan-300">
                      {custom.accessoryIndex < 0
                        ? isEn
                          ? 'NONE'
                          : 'KHÔNG DÙNG'
                        : isEn
                        ? ACCESSORIES_V3[custom.accessoryIndex % 20]?.nameEn
                        : ACCESSORIES_V3[custom.accessoryIndex % 20]?.nameVi}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-[260px] overflow-y-auto pr-1">
                    {/* None option */}
                    <button
                      onClick={() => {
                        playClickSound();
                        setCustom({ ...custom, accessoryIndex: -1 });
                      }}
                      className={`p-2 border text-left font-pixel transition cursor-pointer ${
                        custom.accessoryIndex < 0
                          ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_8px_#facc15]'
                          : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-[7.5px] text-red-400 font-bold block">
                        ✕ NONE
                      </span>
                      <span className="text-[7px] text-slate-400 block truncate">
                        {isEn ? 'No Accessory' : 'Không Phụ Kiện'}
                      </span>
                    </button>

                    {ACCESSORIES_V3.map((a, idx) => (
                      <button
                        key={a.id}
                        onClick={() => {
                          playClickSound();
                          setCustom({ ...custom, accessoryIndex: idx });
                        }}
                        className={`p-2 border text-left font-pixel transition cursor-pointer ${
                          custom.accessoryIndex === idx
                            ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_8px_#facc15]'
                            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                        }`}
                      >
                        <span className="text-[7.5px] text-yellow-400 font-bold block">
                          #{idx + 1}
                        </span>
                        <span className="text-[7px] text-slate-300 block truncate">
                          {isEn ? a.nameEn : a.nameVi}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. CLASS SELECTION */}
              {activeTab === 'class' && (
                <div className="space-y-3">
                  <span className="text-[8.5px] font-pixel font-bold text-yellow-300 block">
                    {isEn ? 'SELECT COMBAT CLASS (6 CLASSES):' : 'CHỌN LỚP NGHỀ CHIẾN ĐẤU (6 HỆ):'}
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.values(CLASS_DEFINITIONS).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          playClickSound();
                          setSelectedClass(c.id);
                        }}
                        className={`p-2 border-2 text-left font-pixel transition cursor-pointer ${
                          selectedClass === c.id
                            ? 'border-yellow-400 bg-yellow-950/60 shadow-[0_0_8px_#facc15]'
                            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                        }`}
                      >
                        <span className="text-[8px] font-bold text-yellow-400 block">
                          {isEn ? c.name : c.nameVi}
                        </span>
                        <span className="text-[7px] text-slate-300 block leading-tight mt-0.5 line-clamp-2">
                          {isEn ? c.description : c.descriptionVi}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PixelFrame>
        </div>
      </main>

      {/* Unsaved Changes Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
            >
              <PixelFrame variant="gold" title={isEn ? 'UNSAVED CHANGES' : 'TÙY BIẾN CHƯA LƯU'}>
                <div className="p-4 text-center">
                  <p className="text-xs font-pixel text-yellow-300 mb-4 leading-relaxed">
                    {isEn
                      ? 'You have unsaved character changes! Are you sure you want to discard them?'
                      : 'Bạn đang có tùy chỉnh nhân vật chưa lưu! Bạn có chắc muốn hủy và trở về không?'}
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
