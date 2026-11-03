'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import type { GameMode, MatchType } from '@/types/game';
import { MAP_DEFINITIONS } from '@/lib/constants';
import PixelButton from '@/components/ui/PixelButton';
import PixelFrame from '@/components/ui/PixelFrame';

interface GameModeSelectorProps {
  matchType: MatchType;
  onClose: () => void;
}

interface ModeCard {
  id: GameMode;
  nameVi: string;
  nameEn: string;
  icon: string;
  badgeText: string;
  descriptionVi: string;
  descriptionEn: string;
  imageIcon: string;
}

export default function GameModeSelector({ matchType, onClose }: GameModeSelectorProps) {
  const { settings, startNewBattle } = useGameStore();
  const lang = settings.language;

  const [selectedMode, setSelectedMode] = useState<GameMode>('pve');
  const [selectedMap, setSelectedMap] = useState<string>(MAP_DEFINITIONS[0].id);

  const modes: ModeCard[] = [
    {
      id: 'pve',
      nameVi: 'CHIẾN ĐẤU VỚI MÁY (PVE AI)',
      nameEn: 'PVE BATTLE (VS AI)',
      icon: '🤖',
      badgeText: 'HOT',
      descriptionVi: 'Đấu trí 1v1 với Boss AI thông minh. Rèn luyện xúc xắc và thử nghiệm các vũ khí mới!',
      descriptionEn: 'Challenge a tactical AI bot. Perfect to master your weapon skills.',
      imageIcon: '/assets/images/frames/frame-effect-box.png',
    },
    {
      id: 'last_man_standing',
      nameVi: 'SINH TỒN (LAST MAN STANDING)',
      nameEn: 'LAST MAN STANDING',
      icon: '👑',
      badgeText: 'HARDCORE',
      descriptionVi: 'Đấu đến giọt máu cuối cùng. Mỗi hiệp tăng sát thương xúc xắc gấp bội!',
      descriptionEn: 'Fight to the death. Dice damage multipliers increase every round!',
      imageIcon: '/assets/images/frames/frame-d20-tray.png',
    },
    {
      id: 'classic',
      nameVi: 'SONG ĐẤU 1V1 (PASS & PLAY / 2 NGƯỜI)',
      nameEn: 'CLASSIC 1V1 (LOCAL 2P)',
      icon: '⚔️',
      badgeText: 'PVP',
      descriptionVi: 'Chơi cùng bạn bè trên cùng một máy (Pass & Play) hoặc thử thách đối thủ.',
      descriptionEn: 'Pass & play on the same screen or local competitive mode.',
      imageIcon: '/assets/images/frames/frame-hp-bar-gold.png',
    },
  ];

  const handleStartGame = () => {
    startNewBattle({
      mode: selectedMode === 'classic' ? 'local' : (matchType === 'ranked' ? 'ranked' : 'pve'),
      mapId: selectedMap,
      opponentName: selectedMode === 'classic' ? 'Player 2' : 'Shadow Overlord (AI)',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-4xl my-auto"
      >
        <PixelFrame
          variant={matchType === 'ranked' ? 'gold' : 'cyan'}
          title={`${matchType === 'ranked' ? '🏆 ĐẤU HẠNG (RANKED)' : '🎲 ĐẤU THƯỜNG (CASUAL)'}`}
          headerRight={
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs font-pixel px-2 py-1 bg-slate-800"
            >
              ✕
            </button>
          }
        >
          {/* Decorative Mode Frame Banner */}
          <div className="relative w-full h-24 sm:h-32 mb-4 border-2 border-yellow-500/50 overflow-hidden bg-slate-950">
            <Image
              src="/assets/images/frames/frame-mode-select.png"
              alt="Mode Select Frame"
              fill
              className="object-cover object-center filter brightness-90 contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
              <span className="text-xs sm:text-base text-yellow-300 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wider text-center px-4">
                {t('selectMode', lang)}
              </span>
            </div>
          </div>

          {/* Mode Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            {modes.map((mode) => {
              const isSelected = selectedMode === mode.id;
              return (
                <div
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`
                    relative p-3.5 cursor-pointer select-none transition-all duration-200
                    border-2 flex flex-col justify-between
                    ${
                      isSelected
                        ? 'border-yellow-400 bg-yellow-950/40 shadow-[0_0_15px_rgba(250,204,21,0.4)] scale-[1.02]'
                        : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{mode.icon}</span>
                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.5 ${
                        isSelected ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {mode.badgeText}
                    </span>
                  </div>

                  <h4 className="text-[11px] font-bold text-yellow-300 mb-2 leading-tight">
                    {lang === 'vi' ? mode.nameVi : mode.nameEn}
                  </h4>

                  <p className="text-[9px] text-slate-300 leading-normal mb-3">
                    {lang === 'vi' ? mode.descriptionVi : mode.descriptionEn}
                  </p>

                  <div className="mt-auto pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[8px] text-slate-400">
                      {isSelected ? '✓ ĐANG CHỌN' : 'CHỌN'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map / Arena Selector */}
          <div className="mb-5 p-3 bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-yellow-400 font-bold">
                🗺️ CHỌN CHIẾN TRƯỜNG ({MAP_DEFINITIONS.length} ĐẤU TRƯỜNG):
              </span>
              <span className="text-[9px] text-cyan-300">
                {MAP_DEFINITIONS.find((m) => m.id === selectedMap)?.nameVi}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
              {MAP_DEFINITIONS.map((map) => (
                <button
                  key={map.id}
                  onClick={() => setSelectedMap(map.id)}
                  className={`
                    relative aspect-video border overflow-hidden transition cursor-pointer
                    ${
                      selectedMap === map.id
                        ? 'border-yellow-400 ring-2 ring-yellow-400 scale-105 z-10'
                        : 'border-slate-700 opacity-60 hover:opacity-100'
                    }
                  `}
                  title={map.nameVi}
                >
                  <Image
                    src={map.image}
                    alt={map.nameVi}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <PixelButton variant="frame" size="sm" onClick={onClose}>
              {t('back', lang)}
            </PixelButton>

            <PixelButton
              variant="gold"
              size="md"
              onClick={handleStartGame}
              icon={<span>⚔️</span>}
            >
              {t('startFight', lang)}
            </PixelButton>
          </div>
        </PixelFrame>
      </motion.div>
    </div>
  );
}
