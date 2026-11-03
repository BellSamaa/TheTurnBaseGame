'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import PixelButton from '@/components/ui/PixelButton';
import PixelFrame from '@/components/ui/PixelFrame';
import GameModeSelector from './GameModeSelector';
import RoomBrowser from '@/components/battle/RoomBrowser';

export default function PlayMenu() {
  const { setPage, settings, startNewBattle } = useGameStore();
  const lang = settings.language;
  const isEn = lang === 'en';

  const [activeModal, setActiveModal] = useState<
    'none' | 'rewards' | 'quests' | 'ranked_modes' | 'casual_modes' | 'rooms'
  >('none');

  const [rewardClaimed, setRewardClaimed] = useState(false);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center overflow-hidden p-4 sm:p-6 bg-[#07070b]">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/background.png"
          alt="Play Background"
          fill
          priority
          className="object-cover filter brightness-[0.3] contrast-[1.1] blur-[2px]"
        />
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-20 w-full max-w-4xl flex items-center justify-between pb-4 border-b-2 border-yellow-500/40">
        <PixelButton
          variant="secondary"
          size="sm"
          onClick={() => setPage('home')}
          icon={<span>⬅</span>}
        >
          {t('back', lang)}
        </PixelButton>

        <h2 className="text-base sm:text-lg text-yellow-400 font-pixel drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]">
          {t('play', lang)}
        </h2>

        <div className="w-16" />
      </div>

      {/* Main Play Grid Options */}
      <div className="relative z-20 w-full max-w-3xl my-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-6">
        {/* Ranked Battle Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => setActiveModal('ranked_modes')}
        >
          <PixelFrame
            variant="gold"
            title="🏆 "
            className="h-full bg-gradient-to-b from-yellow-950/40 to-black/80 hover:border-yellow-300 transition"
          >
            <div className="flex flex-col items-center text-center p-2">
              <span className="text-3xl mb-2">⚔️</span>
              <h3 className="text-xs sm:text-sm font-bold font-pixel text-yellow-300 mb-1">
                {t('ranked', lang)}
              </h3>
              <p className="text-[8.5px] sm:text-[9.5px] text-slate-300 font-pixel leading-relaxed mb-4">
                {isEn
                  ? 'Compete for tier ranking and glory! Climb from Bronze to Grandmaster.'
                  : 'Tranh đoạt điểm xếp hạng danh vọng! Ghép đấu với các cao thủ và nhận danh hiệu.'}
              </p>
              <PixelButton variant="gold" size="sm" className="w-full font-pixel text-[9px]">
                {isEn ? 'ENTER RANKED' : 'VÀO ĐẤU HẠNG'}
              </PixelButton>
            </div>
          </PixelFrame>
        </motion.div>

        {/* Casual Battle Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => setActiveModal('casual_modes')}
        >
          <PixelFrame
            variant="cyan"
            title="🎮 "
            className="h-full bg-gradient-to-b from-cyan-950/40 to-black/80 hover:border-cyan-300 transition"
          >
            <div className="flex flex-col items-center text-center p-2">
              <span className="text-3xl mb-2">🎲</span>
              <h3 className="text-xs sm:text-sm font-bold font-pixel text-cyan-300 mb-1">
                {t('casual', lang)}
              </h3>
              <p className="text-[8.5px] sm:text-[9.5px] text-slate-300 font-pixel leading-relaxed mb-4">
                {isEn
                  ? 'Casual practice, Last Man Standing, or challenge tactical AI without rank penalties.'
                  : 'Đấu luyện tập, Last Man Standing, hoặc so tài cùng trí tuệ nhân tạo PvE không sợ rớt hạng.'}
              </p>
              <PixelButton variant="secondary" size="sm" className="w-full font-pixel text-[9px]">
                {isEn ? 'ENTER CASUAL' : 'VÀO ĐẤU THƯỜNG'}
              </PixelButton>
            </div>
          </PixelFrame>
        </motion.div>

        {/* Create / Join Room Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => setActiveModal('rooms')}
        >
          <PixelFrame
            variant="purple"
            title="🏰 "
            className="h-full bg-gradient-to-b from-purple-950/40 to-black/80 hover:border-purple-300 transition"
          >
            <div className="flex flex-col items-center text-center p-2">
              <span className="text-3xl mb-2">🚪</span>
              <h3 className="text-xs sm:text-sm font-bold font-pixel text-purple-300 mb-1">
                {t('createRoom', lang)}
              </h3>
              <p className="text-[8.5px] sm:text-[9.5px] text-slate-300 font-pixel leading-relaxed mb-4">
                {isEn
                  ? 'Create a custom lobby or enter room code to challenge friends online via Supabase!'
                  : 'Tạo phòng riêng hoặc nhập mã phòng để thi đấu trực tiếp qua mạng với bạn bè!'}
              </p>
              <PixelButton variant="frame" size="sm" className="w-full border-purple-500 text-purple-200 font-pixel text-[9px]">
                {isEn ? 'ONLINE LOBBY' : 'PHÒNG CHƠI ONLINE'}
              </PixelButton>
            </div>
          </PixelFrame>
        </motion.div>

        {/* Rewards & Quests Card */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="cursor-pointer"
            onClick={() => setActiveModal('rewards')}
          >
            <PixelFrame
              variant="gold"
              className="h-full flex flex-col items-center justify-center text-center p-2"
            >
              <span className="text-2xl mb-1">🎁</span>
              <h4 className="text-[9.5px] sm:text-xs text-yellow-300 font-bold font-pixel mb-1">
                {t('rewards', lang)}
              </h4>
              <span className="text-[7.5px] font-pixel text-emerald-400 animate-pulse">
                {isEn ? 'READY TO CLAIM' : 'SẴN SÀNG NHẬN'}
              </span>
            </PixelFrame>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="cursor-pointer"
            onClick={() => setActiveModal('quests')}
          >
            <PixelFrame
              variant="cyan"
              className="h-full flex flex-col items-center justify-center text-center p-2"
            >
              <span className="text-2xl mb-1">📜</span>
              <h4 className="text-[9.5px] sm:text-xs text-cyan-300 font-bold font-pixel mb-1">
                {t('quests', lang)}
              </h4>
              <span className="text-[7.5px] font-pixel text-yellow-400">
                {isEn ? '3/5 COMPLETED' : '3/5 HOÀN THÀNH'}
              </span>
            </PixelFrame>
          </motion.div>
        </div>
      </div>

      {/* Footer quick battle button */}
      <div className="relative z-20 w-full max-w-md pb-4">
        <PixelButton
          variant="danger"
          size="lg"
          onClick={() => startNewBattle({ mode: 'pve' })}
          className="w-full py-3.5 text-xs font-pixel shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          icon={<span>⚡</span>}
        >
          {isEn ? 'INSTANT BOT BATTLE (PVE)' : 'CHƠI NHANH VS MÁY (PVE)'}
        </PixelButton>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'ranked_modes' && (
          <GameModeSelector
            matchType="ranked"
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'casual_modes' && (
          <GameModeSelector
            matchType="casual"
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'rooms' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <RoomBrowser onClose={() => setActiveModal('none')} />
            </div>
          </div>
        )}

        {activeModal === 'rewards' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
            >
              <PixelFrame variant="gold" title={isEn ? '🎁 DAILY BOUNTY' : '🎁 PHẦN THƯỞNG HẰNG NGÀY'}>
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-16 h-16 relative mb-3 animate-float flex items-center justify-center">
                    <span className="text-5xl">🪙</span>
                  </div>
                  <h4 className="text-xs font-bold font-pixel text-yellow-300 mb-2">
                    {isEn ? 'Legendary Dice Coin Pouch' : 'Túi Vàng Xúc Xắc Huyền Thoại'}
                  </h4>
                  <p className="text-[9px] text-slate-300 font-pixel mb-6">
                    {isEn
                      ? '+500 Gold & 1 Golden D20 Reroll Ticket free every day!'
                      : '+500 Vàng & 1 Vé Tung Xúc Xắc Hoàng Kim miễn phí mỗi ngày!'}
                  </p>
                  {rewardClaimed ? (
                    <div className="text-emerald-400 text-[10px] font-pixel font-bold py-2">
                      {isEn ? '✅ CLAIMED TODAY!' : '✅ ĐÃ NHẬN THƯỞNG HÔM NAY!'}
                    </div>
                  ) : (
                    <PixelButton
                      variant="gold"
                      size="md"
                      onClick={() => setRewardClaimed(true)}
                    >
                      {isEn ? 'CLAIM REWARD' : 'NHẬN THƯỞNG NGAY'}
                    </PixelButton>
                  )}
                  <div className="mt-5">
                    <PixelButton
                      variant="frame"
                      size="sm"
                      onClick={() => setActiveModal('none')}
                    >
                      {t('close', lang)}
                    </PixelButton>
                  </div>
                </div>
              </PixelFrame>
            </motion.div>
          </div>
        )}

        {activeModal === 'quests' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg"
            >
              <PixelFrame variant="cyan" title={isEn ? '📜 QUEST ARCHIVES' : '📜 NHIỆM VỤ THỬ THÁCH'}>
                <div className="flex flex-col gap-3 py-2 text-left">
                  <div className="p-3 bg-slate-900/90 border border-slate-700 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-yellow-300 font-pixel font-bold mb-1">
                        {isEn ? 'Win 3 Battles' : 'Thắng 3 trận đấu'}
                      </p>
                      <p className="text-[8px] text-slate-400 font-pixel">
                        {isEn ? 'Progress: 2/3 matches' : 'Tiến độ: 2/3 trận'}
                      </p>
                    </div>
                    <span className="text-[9px] text-cyan-300 font-pixel font-bold">+100 EXP</span>
                  </div>

                  <div className="p-3 bg-slate-900/90 border border-slate-700 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-yellow-300 font-pixel font-bold mb-1">
                        {isEn ? 'Roll a Natural 20 (Critical)' : 'Tung ra mặt 20 (D20 Critical)'}
                      </p>
                      <p className="text-[8px] text-slate-400 font-pixel">
                        {isEn ? 'Progress: 1/1 (Done)' : 'Tiến độ: 1/1 (Hoàn thành)'}
                      </p>
                    </div>
                    <PixelButton variant="gold" size="sm">
                      {isEn ? 'CLAIM' : 'NHẬN'}
                    </PixelButton>
                  </div>

                  <div className="p-3 bg-slate-900/90 border border-slate-700 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-yellow-300 font-pixel font-bold mb-1">
                        {isEn ? 'Trigger Weapon Skill twice' : 'Kích hoạt Kỹ năng Vũ khí 2 lần'}
                      </p>
                      <p className="text-[8px] text-slate-400 font-pixel">
                        {isEn ? 'Progress: 2/2 (Done)' : 'Tiến độ: 2/2 (Hoàn thành)'}
                      </p>
                    </div>
                    <PixelButton variant="gold" size="sm">
                      {isEn ? 'CLAIM' : 'NHẬN'}
                    </PixelButton>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <PixelButton
                    variant="frame"
                    size="sm"
                    onClick={() => setActiveModal('none')}
                  >
                    {t('close', lang)}
                  </PixelButton>
                </div>
              </PixelFrame>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
