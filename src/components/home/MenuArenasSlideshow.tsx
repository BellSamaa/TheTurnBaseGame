'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MAP_DEFINITIONS } from '@/lib/constants';
import PixelIcon from '@/components/ui/PixelIcon';
import { playClickSound } from '@/lib/soundEffects';

interface MenuArenasSlideshowProps {
  isEn: boolean;
}

export default function MenuArenasSlideshow({ isEn }: MenuArenasSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const maps = MAP_DEFINITIONS;
  const currentMap = maps[currentIndex] || maps[0];

  const handleNext = () => {
    playClickSound();
    setCurrentIndex((prev) => (prev + 1) % maps.length);
  };

  const handlePrev = () => {
    playClickSound();
    setCurrentIndex((prev) => (prev - 1 + maps.length) % maps.length);
  };

  const handleSelectMap = (idx: number) => {
    playClickSound();
    setCurrentIndex(idx);
  };

  // Optional auto-slide every 5 seconds if not paused
  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % maps.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlay, maps.length]);

  return (
    <div className="w-full flex flex-col gap-4 bg-[#0c101c]/95 border-2 border-yellow-500/80 p-4 sm:p-6 shadow-[0_0_25px_rgba(0,0,0,0.9)]">
      {/* 1. MAIN WIDESCREEN CINEMATIC SLIDE */}
      <div className="relative w-full aspect-[16/9] max-h-[460px] overflow-hidden border-2 border-yellow-500/60 bg-black shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMap.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <Image
              src={currentMap.image}
              alt={currentMap.name}
              fill
              priority
              className="object-cover object-center filter brightness-90 contrast-115"
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
          </motion.div>
        </AnimatePresence>

        {/* Top-Right Badge: Map Index & Auto-Play Switch */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`px-2 py-1 text-[7.5px] font-pixel border transition cursor-pointer ${
              isAutoPlay
                ? 'bg-yellow-400 text-black border-yellow-200 font-bold shadow-[0_0_8px_#facc15]'
                : 'bg-black/80 text-slate-300 border-slate-700'
            }`}
            title="Toggle Auto Slide"
          >
            {isAutoPlay ? (isEn ? '▶ AUTO-PLAY ON' : '▶ TỰ ĐỘNG CHẠY') : (isEn ? '⏸ PAUSED' : '⏸ ĐÃ TẠM DỪNG')}
          </button>

          <span className="px-2 py-1 bg-black/90 text-yellow-300 font-pixel text-[8px] font-bold border border-yellow-500/60 shadow">
            {currentIndex + 1} / {maps.length}
          </span>
        </div>

        {/* Navigation Arrows: Left & Right Overlay */}
        <button
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 bg-black/80 hover:bg-yellow-500 text-yellow-300 hover:text-black border-2 border-yellow-500/80 flex items-center justify-center font-pixel text-base transition shadow-lg cursor-pointer"
          title="Previous Arena"
        >
          ◀
        </button>

        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 bg-black/80 hover:bg-yellow-500 text-yellow-300 hover:text-black border-2 border-yellow-500/80 flex items-center justify-center font-pixel text-base transition shadow-lg cursor-pointer"
          title="Next Arena"
        >
          ▶
        </button>

        {/* Bottom Banner Info Overlay */}
        <div className="absolute bottom-0 inset-x-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[7.5px] font-pixel font-bold bg-yellow-500 text-black px-2 py-0.5 border border-yellow-200 shadow">
              {isEn ? 'BATTLE REALM' : 'CHIẾN TRƯỜNG'}
            </span>
            <span className="text-[7.5px] font-pixel text-cyan-300 bg-cyan-950/80 px-2 py-0.5 border border-cyan-500/60 uppercase">
              THEME: {currentMap.ambient}
            </span>
          </div>

          <h3 className="text-base sm:text-2xl font-pixel font-bold text-yellow-300 drop-shadow-[0_2px_8px_#000]">
            {isEn ? currentMap.name : currentMap.nameVi}
          </h3>

          <p className="text-[8.5px] sm:text-xs font-sans text-slate-200 drop-shadow mt-1 max-w-2xl leading-relaxed">
            {isEn
              ? `Step foot onto the mythical ${currentMap.name}. A turn-based battleground of destiny where every D20 clash and tactical ability shifts the momentum.`
              : `Bước vào ${currentMap.nameVi} kỳ vĩ. Nơi mỗi cú gieo xúc xắc D20 và tuyệt chiêu chiến thuật xoay chuyển cục diện trận đối đầu.`}
          </p>
        </div>
      </div>

      {/* 2. THUMBNAIL STRIP & PAGINATION DOTS */}
      <div className="flex flex-col gap-2 pt-1">
        {/* Horizontal Thumbnail Strip */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 sm:gap-2">
          {maps.map((map, idx) => {
            const isSelected = currentIndex === idx;

            return (
              <button
                key={map.id}
                onClick={() => handleSelectMap(idx)}
                className={`
                  relative aspect-video border overflow-hidden transition cursor-pointer select-none
                  ${
                    isSelected
                      ? 'border-yellow-400 ring-2 ring-yellow-400 scale-105 z-10 shadow-[0_0_12px_#facc15]'
                      : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-500'
                  }
                `}
                title={isEn ? map.name : map.nameVi}
              >
                <Image src={map.image} alt={map.name} fill className="object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/85 text-[6.5px] font-pixel text-yellow-300 text-center truncate py-0.5">
                  #{idx + 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* 9 Pagination Dot Indicators */}
        <div className="flex items-center justify-center gap-2 mt-1">
          {maps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectMap(idx)}
              className={`transition-all rounded-full cursor-pointer ${
                currentIndex === idx
                  ? 'w-6 h-2 bg-yellow-400 shadow-[0_0_8px_#facc15]'
                  : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
              }`}
              title={`Go to realm ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
