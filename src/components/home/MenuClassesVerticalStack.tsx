'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PVP_BASE_HP, CLASS_DEFINITIONS } from '@/lib/constants';
import PixelIcon from '@/components/ui/PixelIcon';
import { playClickSound } from '@/lib/soundEffects';

interface MenuClassesVerticalStackProps {
  isEn: boolean;
}

export default function MenuClassesVerticalStack({ isEn }: MenuClassesVerticalStackProps) {
  const classes = Object.values(CLASS_DEFINITIONS);
  const [activeIndex, setActiveIndex] = useState(0);

  const prevIndex = (activeIndex - 1 + classes.length) % classes.length;
  const nextIndex = (activeIndex + 1) % classes.length;

  const currentClass = classes[activeIndex];
  const prevClass = classes[prevIndex];
  const nextClass = classes[nextIndex];

  const handleSelect = (index: number) => {
    playClickSound();
    setActiveIndex(index);
  };

  const handlePrev = () => {
    playClickSound();
    setActiveIndex(prevIndex);
  };

  const handleNext = () => {
    playClickSound();
    setActiveIndex(nextIndex);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center select-none py-2">
      {/* Top Navigation Arrow */}
      <button
        onClick={handlePrev}
        className="mb-2 p-2 bg-[#0c101c]/90 hover:bg-yellow-500 text-yellow-300 hover:text-black border-2 border-yellow-500/70 shadow-lg transition-all duration-150 cursor-pointer flex items-center justify-center group"
        title="Previous Class"
      >
        <span className="font-pixel text-xs group-hover:-translate-y-0.5 transition-transform">▲</span>
      </button>

      {/* 3-CARD VERTICAL STACK */}
      <div className="w-full flex flex-col items-center gap-3">
        {/* 1. TOP CARD (Previous - Smaller & Dimmed) */}
        <motion.div
          key={`prev-${prevClass.id}`}
          onClick={() => handleSelect(prevIndex)}
          whileHover={{ scale: 0.92, opacity: 0.7 }}
          className="w-full max-w-lg p-3 bg-[#0a0d16]/80 border border-slate-700/80 rounded-none cursor-pointer scale-90 opacity-45 hover:opacity-75 transition-all shadow-md flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black border border-slate-700 overflow-hidden shrink-0">
              <img
                src={prevClass.image}
                alt={prevClass.name}
                className="w-full h-full object-cover pixelated filter grayscale contrast-125"
              />
            </div>
            <div>
              <div className="text-[9px] font-pixel text-slate-300">
                {isEn ? prevClass.name : prevClass.nameVi}
              </div>
              <div className="text-[7.5px] text-slate-500 font-pixel mt-0.5">
                PvP HP: {Math.round(PVP_BASE_HP * prevClass.hpModifier)} • {isEn ? 'CLICK TO EXPAND' : 'BẤM ĐỂ MỞ'}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-pixel">▲</span>
        </motion.div>

        {/* 2. CENTER CARD (Active - Big, Focused & Full Stats) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`active-${currentClass.id}`}
            initial={{ scale: 0.94, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-xl p-5 bg-gradient-to-b from-[#101728] via-[#0c101c] to-[#07090e] border-2 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.35)] relative overflow-hidden"
          >
            {/* Class Banner Image */}
            <div className="relative w-full h-36 overflow-hidden border border-yellow-500/60 bg-black mb-4 group">
              <img
                src={currentClass.image}
                alt={currentClass.name}
                className="w-full h-full object-cover pixelated filter brightness-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />

              {/* Class Name Badge */}
              <div className="absolute bottom-2 left-3 flex items-center gap-2">
                <span className="px-2.5 py-1 bg-yellow-400 text-black font-pixel font-bold text-xs uppercase border border-yellow-200 shadow-[0_0_10px_#facc15]">
                  {isEn ? currentClass.name : currentClass.nameVi}
                </span>
                <span className="px-2 py-0.5 bg-black/80 text-yellow-300 font-pixel text-[8px] border border-yellow-500/60">
                  CLASS {activeIndex + 1} / {classes.length}
                </span>
              </div>
            </div>

            {/* Key Stat Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-red-950/90 border border-red-500 text-red-300 px-2.5 py-1 text-[8.5px] font-pixel flex items-center gap-1 shadow">
                <PixelIcon name="heart" size={11} color="#f87171" />
                <span>PvP HP: {Math.round(PVP_BASE_HP * currentClass.hpModifier)}</span>
              </span>

              {currentClass.damageModifier !== 1 && (
                <span className="bg-amber-950/90 border border-amber-500 text-amber-300 px-2.5 py-1 text-[8.5px] font-pixel flex items-center gap-1 shadow">
                  <PixelIcon name="sword" size={11} color="#fbbf24" />
                  <span>DMG: {currentClass.damageModifier * 100}%</span>
                </span>
              )}

              {currentClass.damageReduction < 1 && (
                <span className="bg-blue-950/90 border border-blue-500 text-blue-300 px-2.5 py-1 text-[8.5px] font-pixel flex items-center gap-1 shadow">
                  <PixelIcon name="shield" size={11} color="#60a5fa" />
                  <span>ARMOR: -30% DMG</span>
                </span>
              )}

              {currentClass.extraD6Rolls > 0 && (
                <span className="bg-purple-950/90 border border-purple-500 text-purple-300 px-2.5 py-1 text-[8.5px] font-pixel flex items-center gap-1 shadow">
                  <PixelIcon name="lightning" size={11} color="#c084fc" />
                  <span>55%: +1 D6</span>
                </span>
              )}

              {currentClass.extraD20Rolls > 0 && (
                <span className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-2.5 py-1 text-[8.5px] font-pixel flex items-center gap-1 shadow">
                  <PixelIcon name="dice20" size={11} color="#34d399" />
                  <span>ADVANTAGE: 2x D20 (BEST)</span>
                </span>
              )}
            </div>

            {/* Lore & Strategy Description */}
            <p className="text-[10px] text-slate-200 font-pixel leading-relaxed bg-black/40 p-3 border border-slate-800">
              {isEn ? currentClass.description : currentClass.descriptionVi}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* 3. BOTTOM CARD (Next - Smaller & Dimmed) */}
        <motion.div
          key={`next-${nextClass.id}`}
          onClick={() => handleSelect(nextIndex)}
          whileHover={{ scale: 0.92, opacity: 0.7 }}
          className="w-full max-w-lg p-3 bg-[#0a0d16]/80 border border-slate-700/80 rounded-none cursor-pointer scale-90 opacity-45 hover:opacity-75 transition-all shadow-md flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black border border-slate-700 overflow-hidden shrink-0">
              <img
                src={nextClass.image}
                alt={nextClass.name}
                className="w-full h-full object-cover pixelated filter grayscale contrast-125"
              />
            </div>
            <div>
              <div className="text-[9px] font-pixel text-slate-300">
                {isEn ? nextClass.name : nextClass.nameVi}
              </div>
              <div className="text-[7.5px] text-slate-500 font-pixel mt-0.5">
                PvP HP: {Math.round(PVP_BASE_HP * nextClass.hpModifier)} • {isEn ? 'CLICK TO EXPAND' : 'BẤM ĐỂ MỞ'}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-pixel">▼</span>
        </motion.div>
      </div>

      {/* Bottom Navigation Arrow & Dots */}
      <div className="flex flex-col items-center gap-2 mt-2">
        <button
          onClick={handleNext}
          className="p-2 bg-[#0c101c]/90 hover:bg-yellow-500 text-yellow-300 hover:text-black border-2 border-yellow-500/70 shadow-lg transition-all duration-150 cursor-pointer flex items-center justify-center group"
          title="Next Class"
        >
          <span className="font-pixel text-xs group-hover:translate-y-0.5 transition-transform">▼</span>
        </button>

        {/* Pagination Dots */}
        <div className="flex items-center gap-1.5 mt-1">
          {classes.map((cls, idx) => (
            <button
              key={cls.id}
              onClick={() => handleSelect(idx)}
              className={`h-2 transition-all cursor-pointer ${
                idx === activeIndex
                  ? 'w-6 bg-yellow-400 shadow-[0_0_8px_#facc15]'
                  : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              title={cls.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
