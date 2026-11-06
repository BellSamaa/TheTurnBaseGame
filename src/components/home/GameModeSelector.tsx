'use client';
import {tx} from '@/lib/uiLocale';

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
import RoomBrowser from '@/components/battle/RoomBrowser';
import RankedMatchmakingModal from '@/components/battle/RankLobby';
import LastManStandingRulesModal from '@/components/battle/LastManStandingRulesModal';

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
  const { settings, startNewBattle, currentUser, setAuthModal } = useGameStore();
  const lang = settings.language;
  const isEn = lang === 'en';

  const [selectedModeId, setSelectedModeId] = useState<string>('pve');
  const [selectedMap, setSelectedMap] = useState<string>(MAP_DEFINITIONS[0].id);
  const [showLmsRules, setShowLmsRules] = useState(false);
  const [showRankedMatchmaking, setShowRankedMatchmaking] = useState(false);
  const [showOnlineRooms, setShowOnlineRooms] = useState(false);
  const [roomBrowserInitialGameMode, setRoomBrowserInitialGameMode] = useState<'classic' | 'last_man_standing'>('classic');
  const [roomBrowserInitialTab, setRoomBrowserInitialTab] = useState<'browse' | 'create'>('browse');

  // The 4 Specific Modes explicitly requested:
  // 1. Rank Last Man Standing
  // 2. Rank PvP
  // 3. PvE
  // 4. Party (4 Players)
  const modes: ModeCard[] = [
    {
      id: 'dungeon', nameEn: 'DUNGEON', nameVi: 'HẦM NGỤC',
      badgeText: 'CO-OP', playersText: '1–4 PLAYERS',
      descriptionEn: 'Ten floors, shared HP and PTS, rest areas and bosses.',
      descriptionVi: 'Mười tầng, HP và PTS chung, sảnh nghỉ và Boss.',
      spriteImage: '/assets/sprites/ui/modes/mode_dungeon.png', isAvailable: true,
    },
    {
      id: 'pve',
      nameVi: 'CHIẾN ĐẤU VỚI MÁY (PVE AI)',
      nameEn: 'PVE BATTLE (VS AI)',
      badgeText: 'PVE',
      playersText: '1 VS AI',
      descriptionVi: 'Leo chuỗi bot mạnh dần từ vũ khí thường đến Secret. Nhận Gem, EXP và Ruby ở tầng cao.',
      descriptionEn: 'Climb an endless series of stronger bots. Earn Gems, EXP and rare Rubies.',
      spriteImage: '/assets/sprites/ui/modes/mode_pve.png',
      isAvailable: true,
    },
    {
      id: 'last_man_standing',
      nameVi: 'RANK LAST MAN STANDING',
      nameEn: 'RANK LAST MAN STANDING',
      badgeText: 'RANKED',
      playersText: 'SOLO SURVIVAL',
      descriptionVi: 'Phòng sinh tồn riêng 3–4 người. Buff bí mật, can thiệp xúc xắc và vòng bo.',
      descriptionEn: 'Private 3–4 player rooms with hidden buffs, dice clashes and sudden death.',
      spriteImage: '/assets/sprites/ui/modes/mode_ranked.png',
      isAvailable: true,
    },
    {
      id: 'rank_pvp',
      nameVi: 'RANK PVP (ĐẤU HẠNG TRỰC TUYẾN)',
      nameEn: 'RANK PVP (ONLINE RANKED)',
      badgeText: 'LADDER',
      playersText: '1 VS 1',
      descriptionVi: 'Đấu hạng 1v1 với người thật. Tích điểm, tăng sao, nhận quà và khung avatar.',
      descriptionEn: 'Real 1v1 ranked matches. Earn stars, rewards and avatar frames.',
      spriteImage: '/assets/sprites/ui/modes/mode_casual.png',
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
      spriteImage: '/assets/sprites/ui/modes/mode_special.png',
      isAvailable: false,
      lockReasonVi: 'Chưa khả dụng - Chế độ Party 4 người đang hoàn thiện',
      lockReasonEn: 'Coming Soon - 4-Player Party Mode in active development',
    },
    {
      id: 'custom_match', nameEn: 'CUSTOM MATCH', nameVi: 'TRẬN TÙY CHỈNH',
      badgeText: 'COMING SOON', playersText: 'CUSTOM',
      descriptionEn: 'Set up your own battle rules.', descriptionVi: 'Tạo trận đấu theo luật tùy chọn.',
      spriteImage: '/assets/sprites/ui/modes/mode_custom.png', isAvailable: false,
      lockReasonEn: 'Coming Soon', lockReasonVi: 'Sắp ra mắt',
    },
    {
      id: 'infinity_pts', nameEn: 'INFINITY PTS', nameVi: 'PTS VÔ HẠN',
      badgeText: 'COMING SOON', playersText: '∞ PTS',
      descriptionEn: 'A future mode built around unlimited skill points.', descriptionVi: 'Chế độ tương lai với điểm kỹ năng vô hạn.',
      spriteImage: '/assets/sprites/ui/modes/mode_infinity.png', isAvailable: false,
      lockReasonEn: 'Coming Soon', lockReasonVi: 'Sắp ra mắt',
    },
    {
      id: 'story', nameEn: 'STORY', nameVi: 'CỐT TRUYỆN',
      badgeText: 'COMING SOON', playersText: 'ADVENTURE',
      descriptionEn: 'Begin a new adventure in Dice Maniac.', descriptionVi: 'Khám phá hành trình trong thế giới Dice Maniac.',
      spriteImage: '/assets/sprites/ui/modes/mode_story.png', isAvailable: false,
      lockReasonEn: 'Coming Soon', lockReasonVi: 'Sắp ra mắt',
    },
  ];

  const handleSelectMode = (mode: ModeCard) => {
    playClickSound();
    if (!mode.isAvailable) return;
    if (mode.id !== 'pve' && !currentUser) {
      setAuthModal('signup');
      return;
    }
    setSelectedModeId(mode.id);
  };

  const handleStartGame = () => {
    playClickSound();
    const modeObj = modes.find((m) => m.id === selectedModeId);
    if (!modeObj || !modeObj.isAvailable) return;

    if (selectedModeId !== 'pve' && !currentUser) {
      setAuthModal('signup');
      return;
    }
    if(selectedModeId==='dungeon'){
      useGameStore.getState().setPage('dungeon');
      onClose();
      return;
    }

    // Rank PvP: Real 1v1 matchmaking queue (No bots!)
    if (selectedModeId === 'rank_pvp') {
      setShowRankedMatchmaking(true);
      return;
    }

    // Last Man Standing: Open LMS room flow
    if (selectedModeId === 'last_man_standing') {
      setRoomBrowserInitialGameMode('last_man_standing');
      setRoomBrowserInitialTab('browse');
      setShowOnlineRooms(true);
      return;
    }

    // PvE: Server-owned endless progression
    useGameStore.getState().setPage('pve');
    onClose();
  };

  if (showOnlineRooms) {
    return (
      <RoomBrowser
        onClose={() => setShowOnlineRooms(false)}
        initialGameMode={roomBrowserInitialGameMode}
        initialTab={roomBrowserInitialTab}
      />
    );
  }

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-4 mt-2">
            {modes.filter(mode=>mode.id!=='party').map((mode) => {
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

          <p className="mode-guidance">{selectedModeId==='pve'?tx("Leo chuỗi đối thủ, nhận Gem và EXP; tầng cao có Ruby."):selectedModeId==='rank_pvp'?tx("Mở bảng Rank để xem sao, quà hạng và bắt đầu tìm trận."):selectedModeId==='last_man_standing'?tx("Tạo hoặc vào phòng sinh tồn 3–4 người. Tất cả sẵn sàng rồi chủ phòng bắt đầu."):tx("Chế độ đang phát triển.")}</p>
          {selectedModeId==='last_man_standing'&&<button className="text-cyan-300 underline mb-3" onClick={()=>setShowLmsRules(true)}>{tx("Xem luật LMS")}</button>}
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

      {/* Real Ranked Matchmaking Modal */}
      <RankedMatchmakingModal
        isOpen={showRankedMatchmaking}
        onClose={() => setShowRankedMatchmaking(false)}
      />

      {/* Last Man Standing Rules Modal */}
      <LastManStandingRulesModal
        isOpen={showLmsRules}
        onClose={() => setShowLmsRules(false)}
        isEn={isEn}
        onCreateRoom={() => {
          setShowLmsRules(false);
          setRoomBrowserInitialGameMode('last_man_standing');
          setRoomBrowserInitialTab('create');
          setShowOnlineRooms(true);
        }}
      />
    </div>
  );
}
