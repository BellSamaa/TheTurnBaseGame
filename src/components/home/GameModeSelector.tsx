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
  spriteImage: string;
}

export default function GameModeSelector({ matchType, onClose }: GameModeSelectorProps) {
  const { settings, startNewBattle } = useGameStore();
  const lang = settings.language;
  const isEn = lang === 'en';

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
      descriptionEn: 'Challenge a tactical AI bot. Perfect to master your weapon skills and dice rolls.',
      spriteImage: '/assets/sprites/ui/modes/mode_pve.png',
    },
    {
      id: 'last_man_standing',
      nameVi: 'SINH TỒN (LAST MAN STANDING)',
      nameEn: 'LAST MAN STANDING',
      icon: '👑',
      badgeText: 'HARDCORE',
      descriptionVi: 'Đấu đến giọt máu cuối cùng. Mỗi hiệp tăng sát thương xúc xắc gấp bội!',
      descriptionEn: 'Fight to the death. Dice damage multipliers increase every round!',
      spriteImage: '/assets/sprites/ui/modes/mode_special.png',
    },
    {
      id: 'classic',
      nameVi: 'SONG ĐẤU 1V1 (PASS & PLAY / 2 NGƯỜI)',
      nameEn: 'CLASSIC 1V1 (LOCAL 2P)',
      icon: '⚔️',
      badgeText: 'PVP',
      descriptionVi: 'Chơi cùng bạn bè trên cùng một máy (Pass & Play) hoặc thử thách đối thủ.',
      descriptionEn: 'Pass & play on the same device or local competitive 1v1 duel.',
      spriteImage: '/assets/sprites/ui/modes/mode_casual.png',
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

  const selectedMapInfo = MAP_DEFINITIONS.find((m) => m.id === selectedMap) || MAP_DEFINITIONS[0];

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
          title={
            matchType === 'ranked'
              ? (isEn ? '🏆 RANKED MATCHMAKING' : '🏆 ĐẤU HẠNG (RANKED)')
              : (isEn ? '🎲 CASUAL MATCHMAKING' : '🎲 ĐẤU THƯỜNG (CASUAL)')
          }
          headerRight={
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs font-pixel px-2 py-1 bg-slate-800"
            >
              ✕
            </button>
          }
        >
          {/* Mode Selection Cards (Uses Sliced Mode Sprites) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5 mt-2">
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
                  {/* Sliced Mode Thumbnail Header */}
                  <div className="relative w-full h-24 mb-2.5 overflow-hidden bg-black border border-slate-700 flex items-center justify-center">
                    <img
                      src={mode.spriteImage}
                      alt={mode.nameEn}
                      className="w-full h-full object-cover pixelated"
                    />
                    <span
                      className={`absolute top-1.5 right-1.5 text-[7.5px] font-pixel font-bold px-1.5 py-0.5 ${
                        isSelected ? 'bg-yellow-500 text-black' : 'bg-black/80 text-yellow-400 border border-yellow-500/40'
                      }`}
                    >
                      {mode.badgeText}
                    </span>
                  </div>

                  <h4 className="text-[10px] font-bold font-pixel text-yellow-300 mb-1.5 leading-tight">
                    {isEn ? mode.nameEn : mode.nameVi}
                  </h4>

                  <p className="text-[8px] text-slate-300 font-pixel leading-normal mb-3">
                    {isEn ? mode.descriptionEn : mode.descriptionVi}
                  </p>

                  <div className="mt-auto pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[7.5px] font-pixel text-slate-400">
                      {isSelected ? (isEn ? '✓ SELECTED' : '✓ ĐANG CHỌN') : (isEn ? 'SELECT' : 'CHỌN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map / Arena Selector */}
          <div className="mb-5 p-3 bg-slate-950/90 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] text-yellow-400 font-pixel font-bold">
                {isEn
                  ? `🗺️ SELECT BATTLE ARENA (${MAP_DEFINITIONS.length} REALMS):`
                  : `🗺️ CHỌN CHIẾN TRƯỜNG (${MAP_DEFINITIONS.length} ĐẤU TRƯỜNG):`}
              </span>
              <span className="text-[8px] text-cyan-300 font-pixel">
                {isEn ? selectedMapInfo.name : selectedMapInfo.nameVi}
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
                  title={isEn ? map.name : map.nameVi}
                >
                  <Image
                    src={map.image}
                    alt={map.name}
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
