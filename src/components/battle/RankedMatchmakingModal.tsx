'use client';
import {tx} from '@/lib/uiLocale';

import {rankProgress} from '@/lib/progression';
import {useProgress} from '@/components/progression/AccountPanel';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelButton from '@/components/ui/PixelButton';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import { playClickSound, playTurnSound } from '@/lib/soundEffects';
import { CLASS_DEFINITIONS, WEAPON_DEFINITIONS } from '@/lib/constants';

interface RankedMatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RankedMatchmakingModal({ isOpen, onClose }: RankedMatchmakingModalProps) {
  const {
    currentUser,
    profile,
    settings,
    setOnlineRoomCode,
    setBattleState,
    setPage,
  } = useGameStore();

  const accountProgress=useProgress();
  const isEn = settings.language === 'en';
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [status, setStatus] = useState<'searching' | 'matched' | 'error'>('searching');
  const [matchedRoomCode, setMatchedRoomCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const heroClass = CLASS_DEFINITIONS[currentUser?.selectedClass || profile.classType] || CLASS_DEFINITIONS.warrior;
  const heroWeapon = WEAPON_DEFINITIONS[currentUser?.selectedWeapon || profile.weaponId] || WEAPON_DEFINITIONS.greatsword;
  const rankPts = currentUser?.rankPoints ?? profile.rank ?? 1000;
  const tierNum = currentUser?.tier ?? profile.tier ?? 1;

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    setStatus('searching');
    setElapsedSeconds(0);
    setErrorMsg(null);
    setMatchedRoomCode(null);

    // 1. Join matchmaking queue
    const joinQueue = async () => {
      try {
        const res = await fetch('/api/matchmaking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join',
            user: {
              id: currentUser.id,
              username: currentUser.username,
              rankPoints: rankPts,
              tier: tierNum,
              classType: currentUser.selectedClass || profile.classType,
              weaponId: currentUser.selectedWeapon || profile.weaponId,
              avatarConfig: currentUser.avatarConfig || profile.character,
            },
          }),
        });

        const data = await res.json();
        if (data.success && data.matched && data.roomCode) {
          handleMatchFound(data.roomCode, data.room?.battleState);
        }
      } catch (err) {
        console.error('Failed to join matchmaking:', err);
      }
    };

    joinQueue();

    // 2. Poll elapsed timer
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // 3. Poll queue status every 1.2s
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/matchmaking?userId=${encodeURIComponent(currentUser.id)}`);
        const data = await res.json();
        if (data.success && data.matched && data.roomCode) {
          handleMatchFound(data.roomCode);
        } else if (data.expired) {
          // Re-join if ticket expired
          joinQueue();
        }
      } catch {
        // Retry
      }
    }, 1200);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [isOpen, currentUser]);

  const handleMatchFound = async (code: string, preloadedBattle?: any) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);

    setStatus('matched');
    setMatchedRoomCode(code);
    playTurnSound();

    // Wait 1.2s for dramatic effect then enter battle
    setTimeout(async () => {
      try {
        let battle = preloadedBattle;
        if (!battle) {
          const roomRes = await fetch(`/api/rooms/${code}`);
          const roomData = await roomRes.json();
          battle = roomData.room?.battleState;
        }

        if (battle) {
          setOnlineRoomCode(code);
          setBattleState(battle);
          setPage('battle');
          onClose();
        } else {
          // Fallback poll
          setOnlineRoomCode(code);
          setPage('battle');
          onClose();
        }
      } catch (e) {
        setOnlineRoomCode(code);
        setPage('battle');
        onClose();
      }
    }, 1200);
  };

  const handleCancel = async () => {
    playClickSound();
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);

    if (currentUser) {
      fetch('/api/matchmaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', userId: currentUser.id }),
      }).catch(() => {});
    }

    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md my-auto"
      >
        <PixelFrame
          variant="gold"
          title={isEn ? 'RANKED MATCHMAKING' : 'TÌM TRẬN ĐẤU HẠNG'}
          headerRight={
            status === 'searching' && (
              <button
                onClick={handleCancel}
                className="text-slate-400 hover:text-white text-xs font-pixel px-2 py-0.5 bg-slate-900 border border-slate-700 cursor-pointer"
              >
                ✕
              </button>
            )
          }
        >
          <div className="flex flex-col items-center p-5 text-center">
            {/* Spinning D20 / Status Icon */}
            <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
              {status === 'searching' ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border-4 border-dashed border-yellow-500/70"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                    className="w-16 h-16 rounded-lg bg-yellow-950/80 border-2 border-yellow-400 flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.5)]"
                  >
                    <span className="font-pixel text-2xl font-bold text-yellow-300">D20</span>
                  </motion.div>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.5, rotate: -45 }}
                  animate={{ scale: 1.2, rotate: 0 }}
                  className="w-20 h-20 rounded-full bg-emerald-950/90 border-3 border-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.8)]"
                >
                  <span className="text-3xl">⚔️</span>
                </motion.div>
              )}
            </div>

            {/* Status Heading */}
            {status === 'searching' ? (
              <>
                <h3 className="text-sm sm:text-base font-pixel text-yellow-300 drop-shadow mb-1 animate-pulse">
                  {isEn ? 'SEARCHING FOR OPPONENT...' : 'ĐANG TÌM ĐỐI THỦ XẾP HẠNG...'}
                </h3>
                <p className="text-[9px] font-pixel text-slate-400 mb-2">
                  {isEn ? 'Looking for real player in ladder queue' : 'Ghép đôi thật với người chơi trong hàng chờ'}
                </p>
                <div className="text-lg font-pixel font-bold text-yellow-400 bg-black/60 border border-yellow-500/40 px-3 py-1 rounded mb-4">
                  ⏱ {formatTime(elapsedSeconds)}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base sm:text-lg font-pixel text-emerald-400 drop-shadow mb-1 animate-bounce">
                  {isEn ? 'MATCH FOUND! ENTERING ARENA...' : 'ĐÃ TÌM THẤY ĐỐI THỦ! VÀO TRẬN...'}
                </h3>
                <p className="text-[10px] font-pixel text-slate-300 mb-4">
                  {isEn ? `Room Code: #${matchedRoomCode}` : `Mã phòng: #${matchedRoomCode}`}
                </p>
              </>
            )}

            {/* Local Player Info Badge */}
            <div className="w-full bg-[#0a0d18] border border-yellow-500/30 rounded p-2.5 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded border border-yellow-500/50 bg-black/70 overflow-hidden flex items-center justify-center">
                  <div className="scale-65 -translate-y-1">
                    <CharacterRenderer character={currentUser?.avatarConfig || profile.character} size="sm" />
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-pixel text-white font-bold">{currentUser?.username}</div>
                  <div className="text-[8px] font-pixel text-yellow-400">
                    {heroClass.nameVi} · {heroWeapon.nameVi}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[7.5px] font-pixel text-yellow-500">{tx(rankProgress(accountProgress.rankPoints).name)} · {'★'.repeat(rankProgress(accountProgress.rankPoints).stars)}</div>
                <div className="text-[9px] font-pixel font-bold text-yellow-300">{rankPts} RP</div>
              </div>
            </div>

            {/* Cancel Button */}
            {status === 'searching' && (
              <PixelButton variant="danger" size="md" onClick={handleCancel} className="w-44 font-pixel">
                {isEn ? 'CANCEL SEARCH' : 'HỦY TÌM TRẬN'}
              </PixelButton>
            )}
          </div>
        </PixelFrame>
      </motion.div>
    </div>
  );
}
