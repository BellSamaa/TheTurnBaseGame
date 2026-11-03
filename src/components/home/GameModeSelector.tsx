'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import type { GameMode, MatchType } from '@/types/game';
import { MAP_DEFINITIONS } from '@/lib/constants';
import PixelButton from '@/components/ui/PixelButton';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelIcon from '@/components/ui/PixelIcon';
import { playClickSound } from '@/lib/soundEffects';

interface GameModeSelectorProps {
  matchType?: MatchType;
  onClose: () => void;
}

interface ModeCard {
  id: string;
  nameVi: string;
  nameEn: string;
  badgeText: string;
  playersText: string;
  descriptionVi: string;
  descriptionEn: string;
  spriteImage: string;
  isAvailable: boolean;
  lockReasonVi?: string;
  lockReasonEn?: string;
}

export default function GameModeSelector({ matchType = 'casual', onClose }: GameModeSelectorProps) {
  const { settings, startNewBattle } = useGameStore();
  const lang = settings.language;
  const isEn = lang === 'en';

  const [selectedModeId, setSelectedModeId] = useState<string>('pve');
  const [selectedMap, setSelectedMap] = useState<string>(MAP_DEFINITIONS[0].id);

  // The 4 Specific Modes explicitly requested:
  // 1. Rank Last Man Standing
  // 2. Rank PvP
  // 3. PvE
  // 4. Party (4 Players)
  const modes: ModeCard[] = [
    {
      id: 'pve',
      nameVi: 'CHIẾN ĐẤU VỚI MÁY (PVE AI)',
      nameEn: 'PVE BATTLE (VS AI)',
      badgeText: 'PVE',
      playersText: '1 VS AI',
      descriptionVi: 'Đấu trí 1v1 với Boss AI thông minh. Rèn luyện xúc xắc, căn thời gian chiêu thức và leo cấp vũ khí.',
      descriptionEn: 'Tactical 1v1 duel against a strategic AI opponent. Perfect to practice combos and skills.',
      spriteImage: '/assets/sprites/ui/modes/mode_pve.png',
      isAvailable: true,
    },
    {
      id: 'last_man_standing',
      nameVi: 'RANK LAST MAN STANDING',
      nameEn: 'RANK LAST MAN STANDING',
      badgeText: 'RANKED',
      playersText: 'SOLO SURVIVAL',
      descriptionVi: 'Đấu sinh tồn sinh tử. Mỗi hiệp tăng dần sát thương xúc xắc. Người trụ vững cuối cùng giành chiến thắng!',
      descriptionEn: 'High-stakes survival combat. Dice damage multipliers increase each round until one remains.',
      spriteImage: '/assets/sprites/ui/modes/mode_special.png',
      isAvailable: true,
    },
    {
      id: 'rank_pvp',
      nameVi: 'RANK PVP (ĐẤU HẠNG TRỰC TUYẾN)',
      nameEn: 'RANK PVP (ONLINE RANKED)',
      badgeText: 'LADDER',
      playersText: '1 VS 1',
      descriptionVi: 'Tranh đoạt điểm xếp hạng danh vọng bậc cao! Leo từ Đồng, Bạc lên Đại Cao Thủ.',
      descriptionEn: 'Competitive ranked matchmaking ladder. Climb tiers from Bronze to Grandmaster.',
      spriteImage: '/assets/sprites/ui/modes/mode_ranked.png',
      isAvailable: true,
    },
    {
      id: 'party',
      nameVi: 'PARTY (ĐẤU NHÓM 4 NGƯỜI)',
      nameEn: 'PARTY (4-PLAYER GROUP)',
      badgeText: 'LOCKED',
      playersText: '4 PLAYERS',
      descriptionVi: 'Chế độ loạn đấu 4 người chơi cùng lúc trên 1 chiến trường hỗn loạn.',
      descriptionEn: 'Chaotic 4-player battle royale where 4 contenders roll together.',
      spriteImage: '/assets/sprites/ui/modes/mode_casual.png',
      isAvailable: false,
      lockReasonVi: 'Chưa khả dụng - Chế độ Party 4 người đang hoàn thiện',
      lockReasonEn: 'Coming Soon - 4-Player Party Mode in active development',
    },
  ];

  const handleSelectMode = (mode: ModeCard) => {
    playClickSound();
    if (!mode.isAvailable) return;
    setSelectedModeId(mode.id);
  };

  const handleStartGame = () => {
    playClickSound();
    const modeObj = modes.find((m) => m.id === selectedModeId);
    if (!modeObj || !modeObj.isAvailable) return;

    startNewBattle({
      mode: selectedModeId === 'rank_pvp' ? 'ranked' : selectedModeId === 'last_man_standing' ? 'pve' : 'pve',
      mapId: selectedMap,
      opponentName:
        selectedModeId === 'rank_pvp'
          ? 'Shadow Duelist (Rank)'
          : selectedModeId === 'last_man_standing'
          ? 'Colosseum Overlord'
          : 'Tactical Overlord (AI)',
    });
    onClose();
  };

  const selectedMapInfo = MAP_DEFINITIONS.find((m) => m.id === selectedMap) || MAP_DEFINITIONS[0];
  const activeMode = modes.find((m) => m.id === selectedModeId) || modes[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 15 }}
        className="w-full max-w-4xl my-auto"
      >
        <PixelFrame
          variant="gold"
          title={isEn ? 'SELECT GAME MODE & REALM' : 'CHỌN CHẾ ĐỘ & CHIẾN TRƯỜNG'}
          headerRight={
            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="text-slate-400 hover:text-white text-xs font-pixel px-2 py-1 bg-slate-900 border border-slate-700 cursor-pointer"
            >
              ✕
            </button>
          }
        >
          {/* 4 Dedicated Sliced Mode Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4 mt-2">
            {modes.map((mode) => {
              const isSelected = selectedModeId === mode.id;
              const isLocked = !mode.isAvailable;

              return (
                <div
                  key={mode.id}
                  onClick={() => handleSelectMode(mode)}
                  className={`
                    relative p-2.5 transition-all select-none border-2 flex flex-col justify-between
                    ${
                      isLocked
                        ? 'border-slate-800 bg-[#07090e]/70 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'border-yellow-400 bg-yellow-950/50 shadow-[0_0_15px_rgba(250,204,21,0.4)] scale-[1.02] cursor-pointer'
                        : 'border-slate-700 bg-[#0c101c]/80 hover:border-slate-500 cursor-pointer'
                    }
                  `}
                >
                  {/* Sliced Mode Thumbnail Header */}
                  <div className="relative w-full h-20 mb-2 overflow-hidden bg-black border border-slate-700 flex items-center justify-center">
                    <img
                      src={mode.spriteImage}
                      alt={mode.nameEn}
                      className={`w-full h-full object-cover pixelated ${isLocked ? 'filter grayscale' : ''}`}
                    />

                    {/* Mode Tag */}
                    <span
                      className={`absolute top-1 right-1 text-[7px] font-pixel font-bold px-1.5 py-0.5 ${
                        isLocked
                          ? 'bg-slate-800 text-slate-400 border border-slate-600'
                          : isSelected
                          ? 'bg-yellow-500 text-black'
                          : 'bg-black/80 text-yellow-400 border border-yellow-500/40'
                      }`}
                    >
                      {mode.badgeText}
                    </span>

                    {/* Player count pill */}
                    <span className="absolute bottom-1 left-1 text-[6.5px] font-pixel bg-black/85 text-slate-300 px-1 py-0.5 border border-slate-700">
                      {mode.playersText}
                    </span>

                    {/* Lock Overlay if unimplemented */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                        <PixelIcon name="lock" size={16} color="#ef4444" />
                        <span className="text-[7px] font-pixel text-red-400 font-bold">
                          {isEn ? 'COMING SOON' : 'CHƯA KHẢ DỤNG'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Mode Title */}
                  <h4
                    className={`text-[9px] font-bold font-pixel mb-1 leading-tight ${
                      isLocked ? 'text-slate-500' : isSelected ? 'text-yellow-300' : 'text-slate-200'
                    }`}
                  >
                    {isEn ? mode.nameEn : mode.nameVi}
                  </h4>

                  {/* Mode Description */}
                  <p className="text-[7.5px] text-slate-400 font-sans leading-tight mb-2 flex-1">
                    {isLocked
                      ? isEn
                        ? mode.lockReasonEn
                        : mode.lockReasonVi
                      : isEn
                      ? mode.descriptionEn
                      : mode.descriptionVi}
                  </p>

                  {/* Footer status */}
                  <div className="mt-auto pt-1.5 border-t border-slate-800 flex items-center justify-between text-[7.5px] font-pixel">
                    {isLocked ? (
                      <span className="text-red-400 font-bold">
                        {isEn ? 'LOCKED' : 'KHÓA'}
                      </span>
                    ) : isSelected ? (
                      <span className="text-yellow-400 font-bold flex items-center gap-1">
                        <PixelIcon name="check" size={9} color="#facc15" />
                        <span>{isEn ? 'SELECTED' : 'ĐANG CHỌN'}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 hover:text-white">
                        {isEn ? 'SELECT' : 'CHỌN'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map Arena Selector */}
          <div className="mb-4 p-2.5 bg-[#07090e] border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8.5px] text-yellow-400 font-pixel font-bold flex items-center gap-1">
                <PixelIcon name="map" size={12} color="#facc15" />
                <span>
                  {isEn
                    ? `SELECT BATTLE REALM (${MAP_DEFINITIONS.length} ARENAS):`
                    : `CHỌN CHIẾN TRƯỜNG (${MAP_DEFINITIONS.length} ĐẤU TRƯỜNG):`}
                </span>
              </span>
              <span className="text-[8px] text-cyan-300 font-pixel font-bold">
                {isEn ? selectedMapInfo.name : selectedMapInfo.nameVi}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
              {MAP_DEFINITIONS.map((map) => (
                <button
                  key={map.id}
                  onClick={() => {
                    playClickSound();
                    setSelectedMap(map.id);
                  }}
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
                  <Image src={map.image} alt={map.name} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-[8px] font-pixel text-slate-400">
              {isEn ? 'MODE: ' : 'CHẾ ĐỘ: '}
              <span className="text-yellow-300 font-bold">{isEn ? activeMode.nameEn : activeMode.nameVi}</span>
            </span>

            <div className="flex items-center gap-2">
              <PixelSpriteButton sprite="back" onClick={onClose} className="w-28 sm:w-32" />

              <PixelSpriteButton
                sprite="start"
                onClick={handleStartGame}
                disabled={!activeMode.isAvailable}
                className="w-36 sm:w-44"
              />
            </div>
          </div>
        </PixelFrame>
      </motion.div>
    </div>
  );
}
