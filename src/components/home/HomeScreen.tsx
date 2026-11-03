'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
import ParticleEffect from '@/components/ui/ParticleEffect';
import PixelIcon from '@/components/ui/PixelIcon';
import { AudioToolbarControls } from '@/components/audio/AudioManager';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import MenuWeaponsViewer from '@/components/home/MenuWeaponsViewer';
import MenuArenasSlideshow from '@/components/home/MenuArenasSlideshow';
import MenuRulesGrimoire from '@/components/home/MenuRulesGrimoire';
import MenuClassesVerticalStack from '@/components/home/MenuClassesVerticalStack';
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

        {/* Top Header / Transparent Navigation Toolbar */}
        <header className="relative z-30 w-full px-4 sm:px-8 py-3 flex items-center justify-end gap-3">
          {/* Right Toolbar: Audio + Lang + Auth Profile */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {/* Audio Controls with enchant glow */}
            <div className="flex items-center gap-1.5 animate-enchant-glow">
              <AudioToolbarControls />
            </div>

            {/* Language Switcher with enchant glow */}
            <div className="flex border-2 border-yellow-400/70 bg-black/60 p-0.5 shadow-[0_0_12px_rgba(250,204,21,0.3)] animate-enchant-glow">
              <button
                onClick={() => {
                  playClickSound();
                  updateSettings({ language: 'en' });
                }}
                className={`text-[10px] sm:text-xs font-pixel px-3 py-1.5 transition-all cursor-pointer ${
                  isEn ? 'bg-yellow-500 text-black font-bold shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  updateSettings({ language: 'vi' });
                }}
                className={`text-[10px] sm:text-xs font-pixel px-3 py-1.5 transition-all cursor-pointer ${
                  !isEn ? 'bg-yellow-500 text-black font-bold shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                VI
              </button>
            </div>

            {/* Real User Auth Profile Badge */}
            {currentUser ? (
              <div className="flex items-center gap-2 animate-enchant-glow">
                <button
                  onClick={() => {
                    playClickSound();
                    setAuthModal('profile');
                  }}
                  className="flex items-center gap-2 bg-yellow-950/80 hover:bg-yellow-900/90 border-2 border-yellow-400/70 px-3 py-1.5 transition-all group cursor-pointer shadow-[0_0_12px_rgba(250,204,21,0.3)]"
                >
                  <div className="relative w-6 h-8 border border-yellow-400 bg-black overflow-hidden flex items-center justify-center">
                    <CharacterRenderer character={currentUser.avatarConfig} size="xs" showShadow={false} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] sm:text-xs text-yellow-300 font-pixel leading-tight group-hover:text-yellow-100">
                      {currentUser.username}
                    </div>
                    <div className="text-[8px] text-slate-400 font-pixel">TIER {currentUser.tier || 1}</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    playClickSound();
                    logoutUser();
                  }}
                  title="Logout"
                  className="text-[10px] sm:text-xs text-red-400 font-pixel bg-red-950/60 hover:bg-red-900 border-2 border-red-500/50 px-2.5 py-1.5 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 animate-enchant-glow">
                <button
                  onClick={() => {
                    playClickSound();
                    setAuthModal('login');
                  }}
                  className="text-[10px] sm:text-xs text-slate-100 font-pixel bg-slate-800/80 hover:bg-slate-700 border-2 border-slate-500/70 px-4 py-2 transition-all cursor-pointer shadow-[0_0_10px_rgba(148,163,184,0.2)]"
                >
                  {isEn ? 'LOGIN' : 'ĐĂNG NHẬP'}
                </button>
                <button
                  onClick={() => {
                    playClickSound();
                    setAuthModal('signup');
                  }}
                  className="text-[10px] sm:text-xs text-black font-pixel bg-yellow-400 hover:bg-yellow-300 border-2 border-yellow-200 px-4 py-2 font-bold transition-all cursor-pointer shadow-[0_0_14px_rgba(250,204,21,0.5)]"
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

          <p className="text-xs sm:text-sm text-yellow-300 font-pixel tracking-widest text-center mb-6 uppercase drop-shadow">
            {isEn ? '1v1 Turn-Based RPG Dice Combat' : 'Game Đối Kháng Xúc Xắc Theo Lượt 1v1'}
          </p>

          {/* Menu Buttons - 3 Row Layout */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-lg"
          >
            <div className="flex flex-col gap-2 items-center">
              {/* Row 1: START (centered, full width) */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center"
              >
                <PixelSpriteButton
                  sprite="start"
                  onClick={() => setPage('play')}
                  className="w-[280px] sm:w-[320px]"
                />
              </motion.div>

              {/* Row 2: CHARACTER + WEAPONS (side by side) */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.37 }}
                className="flex gap-2 justify-center w-full"
              >
                <PixelSpriteButton
                  sprite="character"
                  onClick={() => setPage('character')}
                  className="w-[138px] sm:w-[155px]"
                />
                <PixelSpriteButton
                  sprite="weapons"
                  onClick={() => setPage('weapons')}
                  className="w-[138px] sm:w-[155px]"
                />
              </motion.div>

              {/* Row 3: FRIENDS + SETTINGS (side by side) */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.44 }}
                className="flex gap-2 justify-center w-full"
              >
                <PixelSpriteButton
                  sprite="friends"
                  onClick={() => setPage('friends')}
                  className="w-[138px] sm:w-[155px]"
                />
                <PixelSpriteButton
                  sprite="settings"
                  onClick={() => setPage('settings')}
                  className="w-[138px] sm:w-[155px]"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Section Bottom Footer: Quick Jump Links + Scroll Down Indicator (Strictly single container, zero overlap) */}
        <div className="relative z-20 w-full pb-6 pt-2 px-4 flex flex-col items-center gap-2.5">
          {/* Quick Jump Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9px] sm:text-[10px] font-pixel text-slate-400">
            <button
              onClick={() => scrollToSection('rules-section')}
              className="hover:text-yellow-400 underline transition-colors cursor-pointer"
            >
              {isEn ? 'How to Play' : 'Cách Chơi'}
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => scrollToSection('classes-section')}
              className="hover:text-yellow-400 underline transition-colors cursor-pointer"
            >
              {isEn ? 'Classes' : 'Hệ Nghề'}
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => scrollToSection('weapons-section')}
              className="hover:text-yellow-400 underline transition-colors cursor-pointer"
            >
              {isEn ? 'Weapons' : 'Vũ Khí'}
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => scrollToSection('arenas-section')}
              className="hover:text-yellow-400 underline transition-colors cursor-pointer"
            >
              {isEn ? 'Arenas' : 'Đấu Trường'}
            </button>
          </div>

          {/* Scroll Down Indicator */}
          <button
            onClick={() => scrollToSection('rules-section')}
            className="text-[9px] sm:text-[10px] font-pixel text-yellow-400/80 hover:text-yellow-300 transition-colors flex flex-col items-center gap-1 animate-bounce cursor-pointer"
          >
            <span>{isEn ? 'SCROLL DOWN TO EXPLORE THE REALM' : 'CUỘN XUỐNG ĐỂ KHÁM PHÁ'}</span>
            <span>▼</span>
          </button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. HOW TO PLAY / RULES SECTION (Ancient Fantasy Grimoire) */}
      {/* ============================================================ */}
      <section
        id="rules-section"
        className="relative z-10 w-full max-w-5xl mx-auto px-4 py-16 flex flex-col gap-6"
      >
        <div className="text-center">
          <h2 className="text-base sm:text-2xl text-yellow-400 font-pixel drop-shadow mb-2 flex items-center justify-center gap-2">
            <PixelIcon name="sword" size={20} color="#facc15" />
            <span>{isEn ? 'COMBAT MECHANICS & RULES' : 'LUẬT CHƠI & CƠ CHẾ CHIẾN ĐẤU'}</span>
            <PixelIcon name="sword" size={20} color="#facc15" />
          </h2>
          <p className="text-xs text-slate-400 font-pixel">
            {isEn
              ? 'Read the ancient grimoire of sacred D20 combat, D6 energy charges, and the blood oath'
              : 'Nghiên cứu cổ thư ghi chép quy luật xúc xắc D20, tích nạp năng lượng D6 và sinh tử đấu'}
          </p>
        </div>

        <MenuRulesGrimoire isEn={isEn} />
      </section>

      {/* ============================================================ */}
      {/* 3. THE 6 FIGHTING CLASSES (Interactive Vertical Stack) */}
      {/* ============================================================ */}
      <section
        id="classes-section"
        className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 flex flex-col gap-6"
      >
        <div className="text-center">
          <h2 className="text-base sm:text-2xl text-yellow-400 font-pixel drop-shadow mb-2 flex items-center justify-center gap-2">
            <PixelIcon name="shield" size={20} color="#facc15" />
            <span>{isEn ? '6 CHARACTER CLASSES' : '6 HỆ NGHỀ CHIẾN ĐẤU'}</span>
            <PixelIcon name="shield" size={20} color="#facc15" />
          </h2>
          <p className="text-xs text-slate-400 font-pixel">
            {isEn
              ? 'Click any class card to center it and reveal its full stats, masteries and lore'
              : 'Bấm vào bất kỳ nghề nào để đưa ra giữa và xem trọn vẹn chỉ số, sở trường chiến đấu'}
          </p>
        </div>

        <MenuClassesVerticalStack isEn={isEn} />
      </section>

      {/* ============================================================ */}
      {/* 4. WEAPONS SECTION (Interactive Center Showcase & Sidebar) */}
      {/* ============================================================ */}
      <section
        id="weapons-section"
        className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 flex flex-col gap-6"
      >
        <div className="text-center">
          <h2 className="text-base sm:text-2xl text-yellow-400 font-pixel drop-shadow mb-2 flex items-center justify-center gap-2">
            <PixelIcon name="dagger" size={20} color="#facc15" />
            <span>{isEn ? '9 LEGENDARY WEAPONS' : '9 BẢO KHÍ HUYỀN THOẠI'}</span>
            <PixelIcon name="dagger" size={20} color="#facc15" />
          </h2>
          <p className="text-xs text-slate-400 font-pixel">
            {isEn
              ? 'Click any weapon to inspect its full skill mechanics and equip it for battle'
              : 'Bấm vào bất kỳ vũ khí nào để xem chi tiết chiêu thức và trang bị ngay'}
          </p>
        </div>

        <MenuWeaponsViewer isEn={isEn} />
      </section>

      {/* ============================================================ */}
      {/* 5. ARENAS SECTION (Cinematic Widescreen Slideshow) */}
      {/* ============================================================ */}
      <section
        id="arenas-section"
        className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 flex flex-col gap-6"
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

        <MenuArenasSlideshow isEn={isEn} />
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
