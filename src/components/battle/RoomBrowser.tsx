'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { MAP_DEFINITIONS, CLASS_DEFINITIONS, WEAPON_DEFINITIONS } from '@/lib/constants';
import type { MatchType, BattleState, PlayerState } from '@/types/game';
import type { DbOnlineRoom, RoomParticipant } from '@/lib/serverDb';
import PixelButton from '@/components/ui/PixelButton';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelIcon from '@/components/ui/PixelIcon';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import { playClickSound, playTurnSound } from '@/lib/soundEffects';

interface RoomBrowserProps {
  onClose: () => void;
}

export default function RoomBrowser({ onClose }: RoomBrowserProps) {
  const { profile, settings, currentUser, setOnlineRoomCode, setBattleState, setPage, setAuthModal } = useGameStore();
  const lang = settings.language;
  const isEn = lang === 'en';

  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'lobby'>('browse');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Create room options
  const [newRoomMode, setNewRoomMode] = useState<MatchType>('casual');
  const [newRoomMap, setNewRoomMap] = useState<string>(MAP_DEFINITIONS[0].id);

  // Active Lobby state
  const [currentLobby, setCurrentLobby] = useState<DbOnlineRoom | null>(null);
  const [rooms, setRooms] = useState<DbOnlineRoom[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch public rooms list from server
  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success && Array.isArray(data.rooms)) {
        setRooms(data.rooms);
      }
    } catch {
      // Ignore network hiccup
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  // 2. Poll active lobby every 1 second when inside lobby
  useEffect(() => {
    if (activeTab !== 'lobby' || !currentLobby) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    const pollLobby = async () => {
      try {
        const res = await fetch(`/api/rooms/${currentLobby.code}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.room) {
          const updated: DbOnlineRoom = data.room;
          setCurrentLobby(updated);

          // If match has started, launch battle immediately!
          if (updated.status === 'playing' && updated.battleState) {
            playTurnSound();
            setOnlineRoomCode(updated.code);
            setBattleState(updated.battleState);
            setPage('battle');
            onClose();
          }
        } else if (res.status === 404) {
          // Room closed or deleted
          setErrorMessage(isEn ? 'Host left or room was closed.' : 'Chủ phòng đã rời hoặc phòng đã đóng.');
          setCurrentLobby(null);
          setActiveTab('browse');
        }
      } catch {
        // Retry
      }
    };

    pollIntervalRef.current = setInterval(pollLobby, 1000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activeTab, currentLobby?.code, isEn, onClose, setBattleState, setOnlineRoomCode, setPage]);

  // 3. Create room handler
  const handleCreateRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) {
      setAuthModal('signup');
      return;
    }

    playClickSound();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const hostParticipant: RoomParticipant = {
        id: currentUser.id,
        name: currentUser.username,
        character: currentUser.avatarConfig || profile.character,
        classType: profile.classType,
        weaponId: profile.weaponId,
        isReady: true,
      };

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: hostParticipant,
          mode: newRoomMode,
          mapId: newRoomMap,
        }),
      });

      const data = await res.json();
      if (data.success && data.room) {
        setCurrentLobby(data.room);
        setActiveTab('lobby');
      } else {
        setErrorMessage(data.error || 'Failed to create room');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Join room handler (by clicking list or entering code)
  const handleJoinRoom = async (code: string) => {
    if (!currentUser) {
      setAuthModal('signup');
      return;
    }

    playClickSound();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const guestParticipant: RoomParticipant = {
        id: currentUser.id,
        name: currentUser.username,
        character: currentUser.avatarConfig || profile.character,
        classType: profile.classType,
        weaponId: profile.weaponId,
        isReady: false,
      };

      const res = await fetch(`/api/rooms/${code.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          guest: guestParticipant,
        }),
      });

      const data = await res.json();
      if (data.success && data.room) {
        setCurrentLobby(data.room);
        setActiveTab('lobby');
      } else {
        setErrorMessage(data.error || (isEn ? 'Cannot join room' : 'Không thể vào phòng'));
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Toggle Ready status
  const handleToggleReady = async () => {
    if (!currentLobby || !currentUser) return;
    playClickSound();

    const isHost = currentLobby.host.id === currentUser.id;
    const currentReady = isHost ? currentLobby.host.isReady : currentLobby.guest?.isReady;
    const newReady = !currentReady;

    try {
      await fetch(`/api/rooms/${currentLobby.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ready',
          userId: currentUser.id,
          isReady: newReady,
        }),
      });
    } catch {
      // Retry on poll
    }
  };

  // 6. Host starts battle
  const handleStartBattle = async () => {
    if (!currentLobby || !currentUser) return;
    playClickSound();
    setIsLoading(true);

    try {
      const res = await fetch(`/api/rooms/${currentLobby.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_battle',
          userId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (data.success && data.room && data.room.battleState) {
        setOnlineRoomCode(data.room.code);
        setBattleState(data.room.battleState);
        setPage('battle');
        onClose();
      } else {
        setErrorMessage(data.error || 'Failed to start battle');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Leave room
  const handleLeaveRoom = async () => {
    if (currentLobby && currentUser) {
      try {
        await fetch(`/api/rooms/${currentLobby.code}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'leave',
            userId: currentUser.id,
          }),
        });
      } catch {
        // Ignore
      }
    }
    setCurrentLobby(null);
    setActiveTab('browse');
    fetchRooms();
  };

  const copyRoomCode = () => {
    if (!currentLobby) return;
    navigator.clipboard?.writeText(currentLobby.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isHost = currentLobby && currentUser && currentLobby.host.id === currentUser.id;
  const bothReady = currentLobby && currentLobby.guest && currentLobby.host.isReady && currentLobby.guest.isReady;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full max-w-2xl">
        <PixelFrame
          variant="purple"
          title={isEn ? '🏰 ONLINE MULTIPLAYER 1V1 (REAL PLAYERS)' : '🏰 ĐẤU TRỰC TUYẾN 1V1 VỚI NGƯỜI THẬT'}
          headerRight={
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs font-pixel px-2 py-1 bg-slate-800 border border-slate-600 cursor-pointer"
            >
              ✕
            </button>
          }
        >
          {errorMessage && (
            <div className="mb-3 p-2 bg-red-950/90 border border-red-500 text-red-200 text-[8.5px] font-pixel text-center">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Navigation Tabs */}
          {activeTab !== 'lobby' && (
            <div className="flex gap-2 mb-4">
              <PixelButton
                variant={activeTab === 'browse' ? 'gold' : 'frame'}
                size="sm"
                onClick={() => {
                  playClickSound();
                  setActiveTab('browse');
                }}
              >
                {isEn ? `LOBBY LIST (${rooms.length})` : `DANH SÁCH PHÒNG (${rooms.length})`}
              </PixelButton>

              <PixelButton
                variant={activeTab === 'create' ? 'gold' : 'frame'}
                size="sm"
                onClick={() => {
                  playClickSound();
                  setActiveTab('create');
                }}
              >
                {isEn ? '+ CREATE ROOM' : '+ TẠO PHÒNG MỚI'}
              </PixelButton>
            </div>
          )}

          {/* 1. BROWSE ROOMS TAB */}
          {activeTab === 'browse' && (
            <div className="flex flex-col gap-4">
              {/* Quick Join via 4-Digit Code */}
              <div className="p-3 bg-slate-900/90 border border-yellow-500/60 flex flex-col sm:flex-row gap-2 items-center">
                <div className="flex-1 w-full flex items-center gap-2">
                  <span className="text-[9px] font-pixel text-yellow-300 font-bold whitespace-nowrap">
                    {isEn ? 'ROOM CODE:' : 'MÃ PHÒNG:'}
                  </span>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder={isEn ? 'e.g. 4829' : 'ví dụ: 4829'}
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleJoinRoom(roomCodeInput);
                    }}
                    className="w-full bg-black border border-yellow-500/60 px-3 py-1.5 text-xs text-yellow-300 font-pixel tracking-widest focus:outline-none"
                  />
                </div>
                <PixelSpriteButton
                  sprite="join_room"
                  onClick={() => handleJoinRoom(roomCodeInput)}
                  className="w-32 sm:w-36 flex-shrink-0"
                />
              </div>

              {/* Live Rooms List */}
              {rooms.length === 0 ? (
                <div className="p-6 bg-slate-900/60 border border-slate-700 text-center">
                  <span className="text-3xl mb-2 block">🏰</span>
                  <p className="text-[9px] font-pixel text-yellow-300 mb-1">
                    {isEn ? 'NO PUBLIC ROOMS CURRENTLY OPEN' : 'CHƯA CÓ PHÒNG NÀO ĐANG ĐỢI'}
                  </p>
                  <p className="text-[8px] font-pixel text-slate-400 mb-4">
                    {isEn
                      ? 'Click "+ CREATE ROOM" to host a room and invite your friend via a 4-digit code!'
                      : 'Bấm "+ TẠO PHÒNG MỚI" để lấy mã phòng 4 số gửi cho bạn bè vào chơi cùng!'}
                  </p>
                  <PixelSpriteButton
                    sprite="create_room"
                    onClick={() => setActiveTab('create')}
                    className="w-44 mx-auto"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {rooms.map((room) => (
                    <div
                      key={room.code}
                      className="p-3 bg-slate-900/90 border border-slate-700 hover:border-yellow-400 flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-yellow-400 text-black font-pixel font-bold text-[10px]">
                          #{room.code}
                        </span>
                        <div>
                          <div className="text-[9.5px] font-pixel text-white font-bold flex items-center gap-1.5">
                            <span>👑 {room.host.name}</span>
                            <span className="text-[7.5px] text-slate-400 uppercase">
                              ({room.host.classType})
                            </span>
                          </div>
                          <div className="text-[7.5px] font-pixel text-cyan-300 mt-0.5">
                            Map: {room.mapId.toUpperCase()} • Mode: {room.mode.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <PixelSpriteButton
                        sprite="join_room"
                        onClick={() => handleJoinRoom(room.code)}
                        className="w-28 sm:w-32"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. CREATE ROOM TAB */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[8.5px] font-pixel text-yellow-300 font-bold block mb-1">
                    {isEn ? 'MATCH MODE:' : 'CHẾ ĐỘ THI ĐẤU:'}
                  </label>
                  <select
                    value={newRoomMode}
                    onChange={(e) => setNewRoomMode(e.target.value as MatchType)}
                    className="w-full bg-slate-900 border border-slate-700 p-2 text-xs text-yellow-300 font-pixel focus:outline-none"
                  >
                    <option value="casual">{isEn ? 'Casual Duel' : 'Đấu Thường (Casual)'}</option>
                    <option value="ranked">{isEn ? 'Ranked Match' : 'Đấu Hạng (Ranked)'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8.5px] font-pixel text-yellow-300 font-bold block mb-1">
                    {isEn ? 'BATTLE ARENA (MAP):' : 'CHIẾN TRƯỜNG (BẢN ĐỒ):'}
                  </label>
                  <select
                    value={newRoomMap}
                    onChange={(e) => setNewRoomMap(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 p-2 text-xs text-cyan-300 font-pixel focus:outline-none"
                  >
                    {MAP_DEFINITIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {isEn ? m.name : m.nameVi}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-yellow-950/40 border border-yellow-500/50 text-[8.5px] font-pixel text-yellow-300 leading-relaxed">
                ℹ {isEn
                  ? 'Your custom character, weapon, and class from your account will be used in this room!'
                  : 'Ngoại hình nhân vật, vũ khí và nghề nghiệp đã lưu trong tài khoản của bạn sẽ được sử dụng!'}
              </div>

              <div className="flex justify-end gap-3 mt-2 items-center">
                <PixelSpriteButton
                  sprite="cancel"
                  onClick={() => setActiveTab('browse')}
                  className="w-28 sm:w-32"
                />

                <PixelSpriteButton
                  sprite="create_room"
                  type="submit"
                  disabled={isLoading}
                  className="w-36 sm:w-44"
                />
              </div>
            </form>
          )}

          {/* 3. ROOM LOBBY TAB */}
          {activeTab === 'lobby' && currentLobby && (
            <div className="flex flex-col gap-4">
              {/* Header Banner with 4-Digit Room Code */}
              <div className="p-3 bg-gradient-to-r from-purple-950/80 via-[#120a20] to-purple-950/80 border-2 border-yellow-400 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-pixel text-yellow-300">
                      {isEn ? 'ROOM CODE:' : 'MÃ PHÒNG:'}
                    </span>
                    <span className="px-3 py-1 bg-yellow-400 text-black font-pixel font-bold text-sm sm:text-base tracking-widest shadow">
                      {currentLobby.code}
                    </span>
                    <button
                      onClick={copyRoomCode}
                      className="px-2 py-1 bg-black/80 hover:bg-slate-800 text-yellow-300 border border-yellow-500/50 text-[7.5px] font-pixel cursor-pointer transition"
                    >
                      {copiedCode ? (isEn ? '✓ COPIED!' : '✓ ĐÃ COPY!') : (isEn ? '📋 COPY CODE' : '📋 COPY MÃ')}
                    </button>
                  </div>
                  <p className="text-[7.5px] font-pixel text-slate-300 mt-1">
                    {isEn
                      ? 'Send this 4-digit code to your friend to join this room!'
                      : 'Gửi mã phòng này cho bạn bè nhập vào để cùng tham chiến!'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-pixel px-2 py-1 bg-purple-900 border border-purple-400 text-white font-bold uppercase">
                    {currentLobby.mode}
                  </span>
                  <span className="text-[8px] font-pixel px-2 py-1 bg-black/80 border border-yellow-500/50 text-yellow-300 font-bold uppercase">
                    {currentLobby.mapId}
                  </span>
                </div>
              </div>

              {/* 2 Player Podiums Side-by-Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Host Podium (Left) */}
                <div className="p-3 bg-slate-900/90 border-2 border-yellow-400 flex flex-col items-center text-center shadow">
                  <div className="w-full flex items-center justify-between pb-1 mb-2 border-b border-yellow-500/30">
                    <span className="text-[7.5px] font-pixel text-yellow-400 font-bold">
                      👑 {isEn ? 'HOST' : 'CHỦ PHÒNG'}
                    </span>
                    <span className="text-[7px] font-pixel text-emerald-400 font-bold">
                      {currentLobby.host.isReady ? (isEn ? '✓ READY' : '✓ SẴN SÀNG') : (isEn ? 'NOT READY' : 'CHƯA SẴN SÀNG')}
                    </span>
                  </div>

                  <div className="relative w-20 h-28 my-1 flex items-center justify-center">
                    <CharacterRenderer
                      character={currentLobby.host.character}
                      weapon={WEAPON_DEFINITIONS[currentLobby.host.weaponId]}
                      size="sm"
                    />
                  </div>

                  <h4 className="text-xs font-pixel font-bold text-yellow-300 mt-1">
                    {currentLobby.host.name}
                  </h4>
                  <div className="text-[8px] font-pixel text-slate-300 mt-0.5">
                    Class: <span className="text-cyan-300 uppercase">{currentLobby.host.classType}</span>
                  </div>
                </div>

                {/* Guest Podium (Right) */}
                <div
                  className={`p-3 bg-slate-900/90 border-2 flex flex-col items-center text-center shadow transition-all ${
                    currentLobby.guest ? 'border-cyan-400' : 'border-dashed border-slate-700'
                  }`}
                >
                  <div className="w-full flex items-center justify-between pb-1 mb-2 border-b border-cyan-500/30">
                    <span className="text-[7.5px] font-pixel text-cyan-400 font-bold">
                      ⚔️ {isEn ? 'CHALLENGER' : 'ĐỐI THỦ'}
                    </span>
                    {currentLobby.guest && (
                      <span
                        className={`text-[7px] font-pixel font-bold ${
                          currentLobby.guest.isReady ? 'text-emerald-400' : 'text-yellow-400'
                        }`}
                      >
                        {currentLobby.guest.isReady ? (isEn ? '✓ READY' : '✓ SẴN SÀNG') : (isEn ? 'NOT READY' : 'CHƯA SẴN SÀNG')}
                      </span>
                    )}
                  </div>

                  {currentLobby.guest ? (
                    <>
                      <div className="relative w-20 h-28 my-1 flex items-center justify-center">
                        <CharacterRenderer
                          character={currentLobby.guest.character}
                          weapon={WEAPON_DEFINITIONS[currentLobby.guest.weaponId]}
                          size="sm"
                          facing="left"
                        />
                      </div>

                      <h4 className="text-xs font-pixel font-bold text-cyan-300 mt-1">
                        {currentLobby.guest.name}
                      </h4>
                      <div className="text-[8px] font-pixel text-slate-300 mt-0.5">
                        Class: <span className="text-yellow-300 uppercase">{currentLobby.guest.classType}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-6">
                      <div className="w-10 h-10 border-2 border-dashed border-cyan-500/50 rounded-full animate-spin mb-3 flex items-center justify-center text-xs">
                        🎲
                      </div>
                      <p className="text-[8px] font-pixel text-yellow-300 animate-pulse">
                        {isEn ? `Waiting for friend to enter ${currentLobby.code}...` : `Đang đợi bạn bè nhập mã ${currentLobby.code}...`}
                      </p>
                      <p className="text-[7px] font-pixel text-slate-500 mt-1">
                        {isEn ? 'Auto updates once they connect!' : 'Tự động cập nhật ngay khi bạn bè kết nối!'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lobby Action Controls */}
              <div className="flex flex-wrap justify-between items-center pt-2 border-t border-slate-800 gap-2">
                <PixelSpriteButton
                  sprite="exit"
                  onClick={handleLeaveRoom}
                  className="w-28 sm:w-32"
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleReady}
                    className={`px-3 py-2 text-[9px] font-pixel border-2 transition cursor-pointer select-none ${
                      (isHost ? currentLobby.host.isReady : currentLobby.guest?.isReady)
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_10px_#10b981]'
                        : 'bg-yellow-950 text-yellow-300 border-yellow-500 hover:bg-yellow-900'
                    }`}
                  >
                    {(isHost ? currentLobby.host.isReady : currentLobby.guest?.isReady)
                      ? (isEn ? '✓ READY!' : '✓ ĐÃ SẴN SÀNG!')
                      : (isEn ? 'CLICK TO READY' : 'BẤM ĐỂ SẴN SÀNG')}
                  </button>

                  {isHost && (
                    <button
                      onClick={handleStartBattle}
                      disabled={!bothReady || isLoading}
                      className={`px-4 py-2 text-[9px] font-pixel border-2 transition cursor-pointer select-none font-bold ${
                        bothReady && !isLoading
                          ? 'bg-yellow-400 text-black border-yellow-200 shadow-[0_0_15px_#facc15] hover:scale-105'
                          : 'bg-slate-900 text-slate-500 border-slate-700 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {isLoading
                        ? (isEn ? 'STARTING...' : 'ĐANG VÀO TRẬN...')
                        : (isEn ? '⚔️ START DUEL!' : '⚔️ BẮT ĐẦU ĐẤU!')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </PixelFrame>
      </div>
    </div>
  );
}
