'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import { MAP_DEFINITIONS } from '@/lib/constants';
import type { GameMode, MatchType, RoomState } from '@/types/game';
import PixelButton from '@/components/ui/PixelButton';
import PixelFrame from '@/components/ui/PixelFrame';

interface RoomBrowserProps {
  onClose: () => void;
}

export default function RoomBrowser({ onClose }: RoomBrowserProps) {
  const { profile, settings, startNewBattle } = useGameStore();
  const lang = settings.language;

  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'lobby'>('browse');
  const [roomCodeInput, setRoomCodeInput] = useState('');

  // Create room options
  const [newRoomMode, setNewRoomMode] = useState<MatchType>('casual');
  const [newRoomGameMode, setNewRoomGameMode] = useState<GameMode>('classic');
  const [newRoomMap, setNewRoomMap] = useState<string>(MAP_DEFINITIONS[0].id);

  // Active Lobby state
  const [currentLobby, setCurrentLobby] = useState<RoomState | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Mock initial rooms list
  const [rooms, setRooms] = useState<RoomState[]>([
    {
      id: 'ROOM-7742',
      hostId: 'host_1',
      hostName: 'DragonSlayer99',
      guestId: null,
      guestName: null,
      mode: 'casual',
      gameMode: 'classic',
      status: 'waiting',
      hostReady: true,
      guestReady: false,
      hostClass: 'warrior',
      hostWeapon: 'greatsword',
      mapId: 'castle',
      battleState: null,
    },
    {
      id: 'ROOM-4319',
      hostId: 'host_2',
      hostName: 'ShadowQueen',
      guestId: null,
      guestName: null,
      mode: 'ranked',
      gameMode: 'last_man_standing',
      status: 'waiting',
      hostReady: true,
      guestReady: false,
      hostClass: 'assassin',
      hostWeapon: 'dagger',
      mapId: 'cyberpunk',
      battleState: null,
    },
  ]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedId = 'ROOM-' + Math.floor(1000 + Math.random() * 9000);

    const room: RoomState = {
      id: generatedId,
      hostId: profile.id,
      hostName: profile.name,
      guestId: null,
      guestName: null,
      mode: newRoomMode,
      gameMode: newRoomGameMode,
      status: 'waiting',
      hostReady: true,
      guestReady: false,
      hostClass: profile.classType,
      hostWeapon: profile.weaponId,
      mapId: newRoomMap,
      battleState: null,
    };

    setRooms([room, ...rooms]);
    setCurrentLobby(room);
    setActiveTab('lobby');
  };

  const handleJoinRoom = (room: RoomState) => {
    const updatedRoom: RoomState = {
      ...room,
      guestId: profile.id,
      guestName: profile.name,
      guestClass: profile.classType,
      guestWeapon: profile.weaponId,
      status: 'ready',
    };
    setCurrentLobby(updatedRoom);
    setActiveTab('lobby');
  };

  const handleStartLobbyBattle = () => {
    if (!currentLobby) return;
    startNewBattle({
      mode: currentLobby.mode === 'ranked' ? 'ranked' : 'casual',
      mapId: currentLobby.mapId,
      opponentName:
        currentLobby.hostId === profile.id
          ? currentLobby.guestName || 'Người Chơi 2'
          : currentLobby.hostName,
    });
    onClose();
  };

  return (
    <div className="w-full">
      <PixelFrame
        variant="purple"
        title="🏰 PHÒNG CHƠI ONLINE (SUPABASE REALTIME)"
        headerRight={
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-pixel px-2 py-1 bg-slate-800"
          >
            ✕
          </button>
        }
      >
        {/* Navigation Tabs */}
        {activeTab !== 'lobby' && (
          <div className="flex gap-2 mb-4">
            <PixelButton
              variant={activeTab === 'browse' ? 'gold' : 'frame'}
              size="sm"
              onClick={() => setActiveTab('browse')}
            >
              DANH SÁCH PHÒNG ({rooms.length})
            </PixelButton>

            <PixelButton
              variant={activeTab === 'create' ? 'gold' : 'frame'}
              size="sm"
              onClick={() => setActiveTab('create')}
            >
              + TẠO PHÒNG MỚI
            </PixelButton>
          </div>
        )}

        {/* 1. Browse Rooms Tab */}
        {activeTab === 'browse' && (
          <div className="flex flex-col gap-4">
            {/* Quick Join via Code */}
            <div className="p-2.5 bg-slate-900 border border-slate-700 flex gap-2">
              <input
                type="text"
                placeholder="Nhập mã phòng (ví dụ: ROOM-7742)..."
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-yellow-300 font-pixel focus:outline-none"
              />
              <PixelButton
                variant="gold"
                size="sm"
                onClick={() => {
                  const target = rooms.find((r) => r.id === roomCodeInput.trim());
                  if (target) handleJoinRoom(target);
                }}
              >
                VÀO PHÒNG
              </PixelButton>
            </div>

            {/* Rooms List */}
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="p-3 bg-slate-900/90 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-purple-400 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-yellow-300">
                        {room.id}
                      </span>
                      <span className="text-[8px] px-1.5 py-0.2 bg-purple-900/60 text-purple-300 border border-purple-600">
                        Chủ phòng: {room.hostName}
                      </span>
                      <span className="text-[8px] px-1.5 py-0.2 bg-slate-800 text-cyan-300">
                        {room.mode.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-[9px] text-slate-400 mt-1">
                      Chiến trường:{' '}
                      <span className="text-yellow-400">
                        {MAP_DEFINITIONS.find((m) => m.id === room.mapId)?.nameVi}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-emerald-400 font-bold">
                      {room.guestId ? '2/2 ĐẦY' : '1/2 ĐANG ĐỢI'}
                    </span>

                    <PixelButton
                      variant="secondary"
                      size="sm"
                      disabled={Boolean(room.guestId)}
                      onClick={() => handleJoinRoom(room)}
                    >
                      {room.guestId ? 'ĐÃ ĐẦY' : 'THAM GIA'}
                    </PixelButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Create Room Tab */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] text-yellow-300 font-bold block mb-1">
                  CHẾ ĐỘ THI ĐẤU:
                </label>
                <select
                  value={newRoomMode}
                  onChange={(e) => setNewRoomMode(e.target.value as MatchType)}
                  className="w-full bg-slate-900 border border-slate-700 p-2 text-xs text-yellow-300 font-pixel"
                >
                  <option value="casual">Đấu Thường (Casual)</option>
                  <option value="ranked">Đấu Hạng (Ranked)</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-yellow-300 font-bold block mb-1">
                  CHIẾN TRƯỜNG (MAP):
                </label>
                <select
                  value={newRoomMap}
                  onChange={(e) => setNewRoomMap(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 p-2 text-xs text-cyan-300 font-pixel"
                >
                  {MAP_DEFINITIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nameVi}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <PixelButton variant="frame" size="sm" onClick={() => setActiveTab('browse')}>
                HỦY BỎ
              </PixelButton>

              <PixelButton variant="gold" size="md">
                TẠO VÀ VÀO PHÒNG
              </PixelButton>
            </div>
          </form>
        )}

        {/* 3. Room Lobby Tab */}
        {activeTab === 'lobby' && currentLobby && (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-purple-950/40 border border-purple-500/70 flex justify-between items-center">
              <div>
                <span className="text-xs text-yellow-300 font-bold">
                  PHÒNG: {currentLobby.id}
                </span>
                <p className="text-[9px] text-slate-300 mt-0.5">
                  Chia sẻ mã phòng này để bạn bè vào tham chiến!
                </p>
              </div>

              <span className="text-[9px] px-2 py-1 bg-yellow-500 text-black font-bold">
                {currentLobby.mode.toUpperCase()}
              </span>
            </div>

            {/* 2 Player Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Host Slot */}
              <div className="p-3 bg-slate-900 border-2 border-yellow-500">
                <span className="text-[8px] text-yellow-400 font-bold">👑 CHỦ PHÒNG</span>
                <h4 className="text-xs font-bold text-white mt-1">{currentLobby.hostName}</h4>
                <p className="text-[9px] text-cyan-300 mt-0.5">
                  Class: {currentLobby.hostClass.toUpperCase()}
                </p>
                <span className="inline-block mt-2 text-[8px] text-emerald-400 font-bold">
                  ✓ ĐÃ SẴN SÀNG
                </span>
              </div>

              {/* Guest Slot */}
              <div className="p-3 bg-slate-900 border-2 border-cyan-500">
                <span className="text-[8px] text-cyan-400 font-bold">⚔️ ĐỐI THỦ</span>
                <h4 className="text-xs font-bold text-white mt-1">
                  {currentLobby.guestName || 'Đang chờ người chơi tham gia...'}
                </h4>
                <p className="text-[9px] text-cyan-300 mt-0.5">
                  {currentLobby.guestName ? 'Đã vào phòng' : 'Hãy gửi mã phòng cho bạn bè'}
                </p>
                <span className="inline-block mt-2 text-[8px] text-yellow-400 font-bold">
                  {currentLobby.guestName ? '✓ ĐÃ KẾT NỐI' : '⏳ ĐANG ĐỢI'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <PixelButton
                variant="frame"
                size="sm"
                onClick={() => {
                  setCurrentLobby(null);
                  setActiveTab('browse');
                }}
              >
                RỜI PHÒNG
              </PixelButton>

              <PixelButton
                variant="gold"
                size="md"
                onClick={handleStartLobbyBattle}
                icon={<span>⚔️</span>}
              >
                BẮT ĐẦU TRẬN ĐẤU NGAY
              </PixelButton>
            </div>
          </div>
        )}
      </PixelFrame>
    </div>
  );
}
