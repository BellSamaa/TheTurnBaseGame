'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import {
  CLASS_DEFINITIONS,
  WEAPON_DEFINITIONS,
  MAP_DEFINITIONS,
} from '@/lib/constants';
import PixelButton from '@/components/ui/PixelButton';
import ParticleEffect from '@/components/ui/ParticleEffect';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelIcon from '@/components/ui/PixelIcon';
import { AudioToolbarControls } from '@/components/audio/AudioManager';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import { playClickSound } from '@/lib/soundEffects';

export default function HomeScreen() {
  const {
    setPage,
    settings,
    updateSettings,
    currentUser,
    setAuthModal,
    logoutUser,
  } = useGameStore();

  const lang = settings.language;
  const isEn = lang === 'en';

  const menuItems = [
    {
      id: 'play',
      label: t('play', lang),
      iconName: 'sword' as const,
      variant: 'primary' as const,
      onClick: () => {
        playClickSound();
        setPage('play');
      },
    },
    {
      id: 'character',
      label: t('character', lang),
      iconName: 'user' as const,
      variant: 'gold' as const,
      onClick: () => {
        playClickSound();
        setPage('character');
      },
    },
    {
      id: 'weapons',
      label: t('weapons', lang),
      iconName: 'dagger' as const,
      variant: 'secondary' as const,
      onClick: () => {
        playClickSound();
        setPage('weapons');
      },
    },
    {
      id: 'friends',
      label: t('friends', lang),
      iconName: 'users' as const,
      variant: 'frame' as const,
      onClick: () => {
        playClickSound();
        setPage('friends');
      },
    },
    {
      id: 'settings',
      label: t('settings', lang),
      iconName: 'gear' as const,
      variant: 'frame' as const,
      onClick: () => {
        playClickSound();
        setPage('settings');
      },
    },
  ];

  const scrollToSection = (id: string) => {
    playClickSound();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#07090e] text-slate-100 overflow-x-hidden select-none">
      {/* ============================================================ */}
      {/* 1. HERO SECTION (Above the fold) */}
      {/* ============================================================ */}
      <section className="relative min-h-screen w-full flex flex-col justify-between items-center overflow-hidden">
        {/* Background Cover Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/images/background.png"
            alt="Dice Maniac Background"
            fill
            priority
            className="object-cover object-center filter brightness-[0.7] contrast-[1.15]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-black/35 to-black/60 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.65)_100%)] pointer-events-none" />
        </div>

        {/* Floating Sparkles & Particles */}
        <ParticleEffect density={24} />

        {/* Top Header / Unified Navigation Toolbar */}
        <header className="relative z-30 w-full px-4 sm:px-8 py-3 flex items-center justify-between gap-3 bg-[#0c101c]/90 border-b border-yellow-500/40 backdrop-blur-sm">
          {/* Brand & Version Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-[10px] sm:text-xs text-yellow-400 font-pixel font-bold drop-shadow flex items-center gap-2 bg-black/80 px-3 py-1.5 border border-yellow-500/50">
              <span className="w-2 h-2 inline-block bg-yellow-400 animate-pulse" />
              <span>DICE MANIAC</span>
            </div>

            {/* Sliced Sprite Atlas Inspector Button */}
            <button
              onClick={() => {
                playClickSound();
                setPage('preview');
              }}
              className="text-[9px] text-cyan-300 font-pixel bg-slate-900/80 hover:bg-cyan-950 px-2.5 py-1.5 border border-cyan-500/50 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Inspect 159 sliced sprites"
            >
              <PixelIcon name="eye" size={12} color="#06b6d4" />
              <span className="hidden sm:inline">ATLAS (159)</span>
            </button>
          </div>

          {/* Right Toolbar: Audio + Lang + Auth Profile */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <AudioToolbarControls />

            {/* Language Switcher */}
            <div className="flex border border-slate-700 bg-black/80 p-0.5">
              <button
                onClick={() => {
                  playClickSound();
                  updateSettings({ language: 'en' });
                }}
                className={`text-[8.5px] font-pixel px-2 py-1 transition-all cursor-pointer ${
                  isEn ? 'bg-yellow-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  updateSettings({ language: 'vi' });
                }}
                className={`text-[8.5px] font-pixel px-2 py-1 transition-all cursor-pointer ${
                  !isEn ? 'bg-yellow-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                VI
              </button>
            </div>

            {/* Real User Auth Profile Badge */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playClickSound();
                    setAuthModal('profile');
                  }}
                  className="flex items-center gap-2 bg-yellow-950/80 hover:bg-yellow-900/90 border border-yellow-500/70 px-2.5 py-1 transition-all group cursor-pointer"
                >
                  <div className="relative w-6 h-8 border border-yellow-400 bg-black overflow-hidden flex items-center justify-center">
                    <CharacterRenderer character={currentUser.avatarConfig} size="xs" showShadow={false} />
                  </div>
                  <div className="text-left">
                    <div className="text-[9px] text-yellow-300 font-pixel leading-tight group-hover:text-yellow-100">
                      {currentUser.username}
                    </div>
                    <div className="text-[7px] text-slate-400 font-pixel">TIER {currentUser.tier || 1}</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    playClickSound();
                    logoutUser();
                  }}
                  title="Logout"
                  className="text-[9px] text-red-400 font-pixel bg-red-950/60 hover:bg-red-900 border border-red-500/40 px-2 py-1.5 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    playClickSound();
                    setAuthModal('login');
                  }}
                  className="text-[9px] text-slate-200 font-pixel bg-slate-900/90 hover:bg-slate-800 border border-slate-600 px-3 py-1.5 transition-all cursor-pointer"
                >
                  {isEn ? 'LOGIN' : 'ĐĂNG NHẬP'}
                </button>
                <button
                  onClick={() => {
                    playClickSound();
                    setAuthModal('signup');
                  }}
                  className="text-[9px] text-black font-pixel bg-yellow-400 hover:bg-yellow-300 border border-yellow-200 px-3 py-1.5 font-bold transition-all cursor-pointer"
                >
                  {isEn ? 'SIGN UP' : 'ĐĂNG KÝ'}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Center: Logo and Menu Buttons */}
        <div className="relative z-20 flex flex-col items-center justify-center my-auto w-full max-w-xl px-4 pt-6">
          {/* Animated Logo */}
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, type: 'spring' }}
            className="relative w-[300px] h-[110px] sm:w-[460px] sm:h-[150px] mb-4 animate-float"
          >
            <Image
              src="/assets/images/logo.png"
              alt="DICE MANIAC"
              fill
              priority
              className="object-contain drop-shadow-[0_0_25px_rgba(255,215,0,0.65)]"
            />
          </motion.div>

          <p className="text-[10px] sm:text-xs text-yellow-300 font-pixel tracking-widest text-center mb-6 uppercase drop-shadow">
            {isEn ? '1v1 Turn-Based RPG Dice Combat' : 'Game Đối Kháng Xúc Xắc Theo Lượt 1v1'}
          </p>

          {/* Menu Buttons Box with Pixel RPG Frame */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <PixelFrame variant="gold" className="p-4 sm:p-5 backdrop-blur-md bg-[#0c101c]/90 border-2 border-yellow-500/80">
              <div className="flex flex-col gap-2.5">
                {menuItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + idx * 0.07 }}
                  >
                    <PixelButton
                      variant={item.variant}
                      size="lg"
                      onClick={item.onClick}
                      className="w-full text-xs sm:text-sm py-3 font-pixel"
                      icon={<PixelIcon name={item.iconName} size={16} />}
                    >
                      {item.label}
                    </PixelButton>
                  </motion.div>
                ))}
              </div>
            </PixelFrame>
          </motion.div>

          {/* Quick Jump Links */}
          <div className="flex items-center gap-4 mt-6 text-[9px] font-pixel text-slate-400">
            <button
              onClick={() => scrollToSection('rules-section')}
              className="hover:text-yellow-400 underline transition-colors cursor-pointer"
            >
              {isEn ? 'How to Play' : 'Cách Chơi'}
            </button>
            <span>•</span>
            <button
              onClick={() => scrollToSection('classes-section')}
              className="hover:text-yellow-400 underline transition-colors cursor-pointer"
            >
              {isEn ? 'Classes' : 'Hệ Nghề'}
            </button>
            <span>•</span>
            <button
              onClick={() => scrollToSection('weapons-section')}
              className="hover:text-yellow-400 underline transition-colors cursor-pointer"
            >
              {isEn ? 'Weapons' : 'Vũ Khí'}
            </button>
            <span>•</span>
            <button
              onClick={() => scrollToSection('arenas-section')}
              className="hover:text-yellow-400 underline transition-colors cursor-pointer"
            >
              {isEn ? 'Arenas' : 'Đấu Trường'}
            </button>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <div className="relative z-20 pb-4 text-center">
          <button
            onClick={() => scrollToSection('rules-section')}
            className="text-[9px] font-pixel text-yellow-400/80 hover:text-yellow-300 transition-colors flex flex-col items-center gap-1 animate-bounce cursor-pointer"
          >
            <span>{isEn ? 'SCROLL DOWN TO EXPLORE THE REALM' : 'CUỘN XUỐNG ĐỂ XEM HƯỚNG DẪN & HỆ THỐNG'}</span>
            <span>▼</span>
          </button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. HOW TO PLAY / RULES SECTION */}
      {/* ============================================================ */}
      <section
        id="rules-section"
        className="relative z-10 w-full max-w-5xl mx-auto px-4 py-16 flex flex-col gap-8"
      >
        <div className="text-center">
          <h2 className="text-base sm:text-2xl text-yellow-400 font-pixel drop-shadow mb-2 flex items-center justify-center gap-2">
            <PixelIcon name="sword" size={20} color="#facc15" />
            <span>{isEn ? 'COMBAT MECHANICS & RULES' : 'LUẬT CHƠI & CƠ CHẾ CHIẾN ĐẤU'}</span>
            <PixelIcon name="sword" size={20} color="#facc15" />
          </h2>
          <p className="text-xs text-slate-400 font-pixel">
            {isEn
              ? 'Master the 20-sided D20 weapon combat and D6 skill charge systems'
              : 'Nắm vững quy tắc đối kháng xúc xắc 20 mặt (D20) và tích sạc kỹ năng 6 mặt (D6)'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Core Stats & D20 Combat */}
          <div className="bg-[#0c101c]/90 border-2 border-yellow-500/50 p-5 flex flex-col gap-3 shadow-lg hover:border-yellow-400 transition-all">
            <div className="w-10 h-10 bg-yellow-500/20 border border-yellow-400 flex items-center justify-center">
              <PixelIcon name="dice20" size={22} color="#facc15" />
            </div>
            <h3 className="text-xs font-pixel text-yellow-300 uppercase">
              {isEn ? '1. D20 Combat Rolls' : '1. Đối Kháng D20'}
            </h3>
            <div className="text-[10px] text-slate-300 font-pixel leading-relaxed">
              {isEn ? (
                <>
                  Each turn, one player is the <strong>Attacker</strong> and the other is the <strong>Defender</strong>.
                  Both roll a 20-sided die (D20).
                  <br /><br />
                  • If <strong>Atk &gt; Def</strong>: Damage dealt = <strong>Atk - Def</strong>.
                  <br />
                  • If <strong>Atk &le; Def</strong>: Blocked / Missed! 0 damage dealt.
                </>
              ) : (
                <>
                  Mỗi lượt có một bên <strong>Tấn Công</strong> và một bên <strong>Phòng Thủ</strong>.
                  Cả hai cùng tung xúc xắc D20.
                  <br /><br />
                  • Nếu <strong>Công &gt; Thủ</strong>: Sát thương = <strong>Công - Thủ</strong>.
                  <br />
                  • Nếu <strong>Công &le; Thủ</strong>: Phòng thủ thành công, 0 sát thương.
                </>
              )}
            </div>
          </div>

          {/* Card 2: D6 Skill Charging */}
          <div className="bg-[#0c101c]/90 border-2 border-cyan-500/50 p-5 flex flex-col gap-3 shadow-lg hover:border-cyan-400 transition-all">
            <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
              <PixelIcon name="lightning" size={22} color="#38bdf8" />
            </div>
            <h3 className="text-xs font-pixel text-cyan-300 uppercase">
              {isEn ? '2. D6 Skill System' : '2. Kỹ Năng Tích Sạc D6'}
            </h3>
            <div className="text-[10px] text-slate-300 font-pixel leading-relaxed">
              {isEn ? (
                <>
                  Every turn, players roll a 6-sided die (D6) to accumulate <strong>Charge Points</strong>.
                  <br /><br />
                  • <strong>Skill 1 (Charge Threshold)</strong>: Unlocked when reaching 15–30 accumulated points. Consume to unleash!
                  <br />
                  • <strong>Skill 2 (Instant Trigger)</strong>: Activates immediately if you roll the weapon’s special required face number!
                </>
              ) : (
                <>
                  Mỗi lượt cả hai bên tung D6 để tích luỹ <strong>Điểm Sạc Kỹ Năng</strong>.
                  <br /><br />
                  • <strong>Kỹ năng 1</strong>: Tích luỹ đạt mốc 15–30 điểm để kích hoạt đòn đánh đặc biệt uy lực.
                  <br />
                  • <strong>Kỹ năng 2</strong>: Kích hoạt ngay lập tức nếu đổ ra con số xúc xắc cụ thể yêu cầu!
                </>
              )}
            </div>
          </div>

          {/* Card 3: Base HP & Turn Flow */}
          <div className="bg-[#0c101c]/90 border-2 border-red-500/50 p-5 flex flex-col gap-3 shadow-lg hover:border-red-400 transition-all">
            <div className="w-10 h-10 bg-red-500/20 border border-red-400 flex items-center justify-center">
              <PixelIcon name="heart" size={22} color="#ef4444" />
            </div>
            <h3 className="text-xs font-pixel text-red-300 uppercase">
              {isEn ? '3. Health & Victory' : '3. Máu & Chiến Thắng'}
            </h3>
            <div className="text-[10px] text-slate-300 font-pixel leading-relaxed">
              {isEn ? (
                <>
                  Base HP is <strong>100</strong> (modified by your selected class from 75 to 150).
                  <br /><br />
                  Turn roles alternate each round. The first combatant to reduce their opponent to 0 HP wins the duel and claims glory on the leaderboard!
                </>
              ) : (
                <>
                  Máu (HP) gốc của nhân vật là <strong>100</strong> (thay đổi theo Nghề từ 75 đến 150).
                  <br /><br />
                  Vai trò Công - Thủ hoán đổi sau mỗi hiệp. Người chơi đầu tiên triệt hạ HP đối thủ về 0 sẽ giành chiến thắng vinh quang!
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. THE 6 FIGHTING CLASSES */}
      {/* ============================================================ */}
      <section
        id="classes-section"
        className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 flex flex-col gap-8"
      >
        <div className="text-center">
          <h2 className="text-base sm:text-2xl text-yellow-400 font-pixel drop-shadow mb-2 flex items-center justify-center gap-2">
            <PixelIcon name="shield" size={20} color="#facc15" />
            <span>{isEn ? '6 CHARACTER CLASSES' : '6 HỆ NGHỀ CHIẾN ĐẤU'}</span>
            <PixelIcon name="shield" size={20} color="#facc15" />
          </h2>
          <p className="text-xs text-slate-400 font-pixel">
            {isEn
              ? 'Choose your tactical archetype with distinct bonuses and playstyles'
              : 'Chọn nghề nghiệp phù hợp với phong cách chiến thuật của bạn'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.values(CLASS_DEFINITIONS).map((cls) => (
            <div
              key={cls.id}
              className="bg-[#0c101c]/90 border border-yellow-500/40 hover:border-yellow-400 p-4 flex flex-col gap-3 transition-all group shadow-md"
            >
              {/* Sliced Class Banner */}
              <div className="relative w-full h-24 overflow-hidden border border-slate-700 bg-black">
                <img
                  src={cls.image}
                  alt={cls.name}
                  className="w-full h-full object-cover pixelated group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-1 left-2 bg-black/80 px-2 py-0.5 text-[9px] font-pixel text-yellow-400 border border-yellow-500/40">
                  {isEn ? cls.name : cls.nameVi}
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex flex-wrap gap-1.5 text-[8px] font-pixel">
                <span className="bg-red-950/80 border border-red-500/50 text-red-300 px-2 py-0.5">
                  HP: {cls.baseHp}
                </span>
                {cls.damageModifier !== 1 && (
                  <span className="bg-amber-950/80 border border-amber-500/50 text-amber-300 px-2 py-0.5">
                    DMG: {cls.damageModifier * 100}%
                  </span>
                )}
                {cls.damageReduction < 1 && (
                  <span className="bg-blue-950/80 border border-blue-500/50 text-blue-300 px-2 py-0.5">
                    ARMOR: -30%
                  </span>
                )}
                {cls.extraD6Rolls > 0 && (
                  <span className="bg-purple-950/80 border border-purple-500/50 text-purple-300 px-2 py-0.5">
                    +1 D6 ROLL
                  </span>
                )}
                {cls.extraD20Rolls > 0 && (
                  <span className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-2 py-0.5">
                    2x D20 (BEST)
                  </span>
                )}
              </div>

              <p className="text-[9px] text-slate-300 font-pixel leading-relaxed">
                {isEn ? cls.description : cls.descriptionVi}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. WEAPONS SECTION */}
      {/* ============================================================ */}
      <section
        id="weapons-section"
        className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 flex flex-col gap-8"
      >
        <div className="text-center">
          <h2 className="text-base sm:text-2xl text-yellow-400 font-pixel drop-shadow mb-2 flex items-center justify-center gap-2">
            <PixelIcon name="dagger" size={20} color="#facc15" />
            <span>{isEn ? '9 LEGENDARY WEAPONS' : '9 BẢO KHÍ HUYỀN THOẠI'}</span>
            <PixelIcon name="dagger" size={20} color="#facc15" />
          </h2>
          <p className="text-xs text-slate-400 font-pixel">
            {isEn
              ? 'Each weapon bestows two unique skills: a charge threshold active and an instant face trigger'
              : 'Mỗi vũ khí mang 2 kỹ năng: 1 kỹ năng chủ động tích sạc và 1 kỹ năng kích hoạt tức thì'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.values(WEAPON_DEFINITIONS).map((w) => (
            <div
              key={w.id}
              className="bg-[#0c101c]/90 border border-cyan-500/40 hover:border-cyan-400 p-4 flex flex-col gap-3 transition-all shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 bg-black border border-cyan-500/60 flex items-center justify-center p-1 shrink-0">
                  <img
                    src={w.image}
                    alt={w.name}
                    className="w-full h-full object-contain pixelated"
                  />
                </div>
                <div>
                  <h4 className="text-[10px] font-pixel text-yellow-300 font-bold">
                    {isEn ? w.name : w.nameVi}
                  </h4>
                  <p className="text-[8px] text-slate-400 font-pixel mt-0.5 line-clamp-2">
                    {isEn ? w.description : w.descriptionVi}
                  </p>
                </div>
              </div>

              {/* Skills summary */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[8px] font-pixel">
                <div className="bg-yellow-950/40 border border-yellow-500/30 p-1.5 flex items-center justify-between">
                  <span className="text-yellow-300 truncate">
                    ⚡ {isEn ? w.skill1.name : w.skill1.nameVi}
                  </span>
                  <span className="text-cyan-300 whitespace-nowrap">
                    {w.skill1.chargeRequired} PTS
                  </span>
                </div>
                <div className="bg-cyan-950/40 border border-cyan-500/30 p-1.5 flex items-center justify-between">
                  <span className="text-cyan-300 truncate">
                    ✨ {isEn ? w.skill2.name : w.skill2.nameVi}
                  </span>
                  <span className="text-yellow-300 whitespace-nowrap">
                    DIE {w.skill2.triggerNumber}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. ARENAS SECTION */}
      {/* ============================================================ */}
      <section
        id="arenas-section"
        className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 flex flex-col gap-8"
      >
        <div className="text-center">
          <h2 className="text-base sm:text-2xl text-yellow-400 font-pixel drop-shadow mb-2 flex items-center justify-center gap-2">
            <PixelIcon name="map" size={20} color="#facc15" />
            <span>{isEn ? '9 BATTLE REALMS' : '9 CHIẾN TRƯỜNG ĐẤU TRƯỜNG'}</span>
            <PixelIcon name="map" size={20} color="#facc15" />
          </h2>
          <p className="text-xs text-slate-400 font-pixel">
            {isEn
              ? 'Fight across diverse pixel fantasy realms with distinct atmospheric themes'
              : 'Tranh tài qua 9 vùng đất huyền thoại với bối cảnh hùng tráng'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MAP_DEFINITIONS.map((map) => (
            <div
              key={map.id}
              className="relative group overflow-hidden border border-slate-700 hover:border-yellow-400 transition-all bg-black"
            >
              <div className="relative w-full h-32">
                <Image
                  src={map.image}
                  alt={map.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              </div>
              <div className="p-3">
                <div className="text-[10px] text-yellow-300 font-pixel">
                  {isEn ? map.name : map.nameVi}
                </div>
                <div className="text-[8px] text-slate-400 font-pixel uppercase mt-1">
                  THEME: {map.ambient}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. EPIC FOOTER & CREDITS (ALL 3 AURA ANIMATIONS!) */}
      {/* ============================================================ */}
      <footer className="relative z-20 w-full border-t-2 border-yellow-500/40 bg-[#07090e] py-12 px-4 text-center mt-12">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          {/* Logo badge in footer */}
          <div className="relative w-48 h-16">
            <Image
              src="/assets/images/logo.png"
              alt="Dice Maniac"
              fill
              className="object-contain"
            />
          </div>

          {/* Credits box with Bell, Snow, and Shiratosi - ALL 3 WITH AURAS! */}
          <div className="px-6 py-4 bg-[#0c101c] border-2 border-yellow-500/60 shadow-[0_0_25px_rgba(250,204,21,0.2)]">
            <p className="text-xs sm:text-sm text-slate-200 leading-loose font-pixel">
              {isEn ? 'Game created by ' : 'Game tạo bởi '}
              {/* Bell with Crimson Fire Aura */}
              <span className="aura-bell font-bold px-1.5 py-0.5 inline-block">
                Bell
              </span>
              {', '}
              {/* Snow with Ice Blizzard Aura */}
              <span className="aura-snow font-bold px-1.5 py-0.5 inline-block">
                Snow
              </span>
              {isEn ? ' and ' : ' và '}
              {/* Shiratosi with Solar Gold Aura */}
              <span className="aura-shiratosi font-bold px-1.5 py-0.5 inline-block">
                Shiratosi
              </span>
              {isEn ? ' and other contributors.' : ' và 1 số cái khác.'}
            </p>
          </div>

          {/* Tech stack & copyright */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[9px] text-slate-500 font-pixel">
            <span>Next.js 16</span>
            <span>•</span>
            <span>Pixel RPG Engine</span>
            <span>•</span>
            <span>Supabase Realtime</span>
            <span>•</span>
            <span>Tailwind CSS</span>
          </div>

          <p className="text-[8px] text-slate-600 font-pixel">
            DICE MANIAC © 2026. ALL RIGHTS RESERVED.
          </p>

          {/* Back to top button */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-[9px] font-pixel text-yellow-400 border border-yellow-500/40 bg-yellow-950/40 px-3 py-1 hover:bg-yellow-900/60 transition-all cursor-pointer"
          >
            ▲ {isEn ? 'BACK TO TOP' : 'LÊN ĐẦU TRANG'}
          </button>
        </div>
      </footer>
    </div>
  );
}
