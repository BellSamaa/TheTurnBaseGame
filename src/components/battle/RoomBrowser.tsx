'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import { MAP_DEFINITIONS } from '@/lib/constants';
import type { GameMode, MatchType, RoomState } from '@/types/game';
import PixelButton from '@/components/ui/PixelButton';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelIcon from '@/components/ui/PixelIcon';
import { playClickSound } from '@/lib/soundEffects';

interface RoomBrowserProps {
  onClose: () => void;
}

export default function RoomBrowser({ onClose }: RoomBrowserProps) {
  const { profile, settings, startNewBattle } = useGameStore();
  const lang = settings.language;
  const isEn = lang === 'en';

  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'lobby'>('browse');
  const [roomCodeInput, setRoomCodeInput] = useState('');

  // Create room options
  const [newRoomMode, setNewRoomMode] = useState<MatchType>('casual');
  const [newRoomGameMode, setNewRoomGameMode] = useState<GameMode>('classic');
  const [newRoomMap, setNewRoomMap] = useState<string>(MAP_DEFINITIONS[0].id);

  // Active Lobby state
  const [currentLobby, setCurrentLobby] = useState<RoomState | null>(null);

  // Real rooms list synced via localStorage + BroadcastChannel
  const [rooms, setRooms] = useState<RoomState[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dm_online_rooms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRooms(parsed);
      }
    } catch {}

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('dice_maniac_rooms_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'ROOM_CREATED' && event.data.room) {
          setRooms((prev) => [event.data.room, ...prev.filter((r) => r.id !== event.data.room.id)]);
        } else if (event.data?.type === 'ROOM_JOINED' && event.data.room) {
          setRooms((prev) => prev.map((r) => (r.id === event.data.room.id ? event.data.room : r)));
          setCurrentLobby((curr) => (curr && curr.id === event.data.room.id ? event.data.room : curr));
        }
      };
    } catch {}

    return () => {
      try {
        bc?.close();
      } catch {}
    };
  }, []);

  const handleCreateRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    playClickSound();
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

    const nextRooms = [room, ...rooms.filter((r) => r.id !== room.id)];
    setRooms(nextRooms);
    try {
      localStorage.setItem('dm_online_rooms', JSON.stringify(nextRooms));
      const bc = new BroadcastChannel('dice_maniac_rooms_channel');
      bc.postMessage({ type: 'ROOM_CREATED', room });
      bc.close();
    } catch {}

    setCurrentLobby(room);
    setActiveTab('lobby');
  };

  const handleJoinRoom = (room: RoomState) => {
    playClickSound();
    const updatedRoom: RoomState = {
      ...room,
      guestId: profile.id,
      guestName: profile.name,
      guestClass: profile.classType,
      guestWeapon: profile.weaponId,
      status: 'ready',
      guestReady: true,
    };
    const nextRooms = rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
    setRooms(nextRooms);
    try {
      localStorage.setItem('dm_online_rooms', JSON.stringify(nextRooms));
      const bc = new BroadcastChannel('dice_maniac_rooms_channel');
      bc.postMessage({ type: 'ROOM_JOINED', room: updatedRoom });
      bc.close();
    } catch {}
    setCurrentLobby(updatedRoom);
    setActiveTab('lobby');
  };

  const handleJoinByCode = () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (!code) return;
    const target = rooms.find((r) => r.id.toUpperCase() === code);
    if (target) {
      handleJoinRoom(target);
    } else {
      // Connect to custom direct room code
      const directRoom: RoomState = {
        id: code,
        hostId: 'host_' + code,
        hostName: isEn ? 'Duel Rival' : 'Đối Thủ',
        guestId: profile.id,
        guestName: profile.name,
        guestClass: profile.classType,
        guestWeapon: profile.weaponId,
        mode: 'casual',
        gameMode: 'classic',
        status: 'ready',
        hostReady: true,
        guestReady: true,
        hostClass: 'assassin',
        hostWeapon: 'dagger',
        mapId: MAP_DEFINITIONS[0].id,
        battleState: null,
      };
      handleJoinRoom(directRoom);
    }
  };

  const handleStartLobbyBattle = () => {
    if (!currentLobby) return;
    playClickSound();
    startNewBattle({
      mode: currentLobby.mode === 'ranked' ? 'ranked' : 'casual',
      mapId: currentLobby.mapId,
      opponentName:
        currentLobby.hostId === profile.id
          ? currentLobby.guestName || (isEn ? 'Guest Warrior' : 'Người Chơi 2')
          : currentLobby.hostName,
      opponentClass: currentLobby.hostId === profile.id ? currentLobby.guestClass || 'assassin' : currentLobby.hostClass,
      opponentWeapon: currentLobby.hostId === profile.id ? currentLobby.guestWeapon || 'dagger' : currentLobby.hostWeapon,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl">
        <PixelFrame
          variant="purple"
          title={isEn ? '🏰 ONLINE LOBBY (REALTIME 1V1)' : '🏰 PHÒNG CHƠI ONLINE (THÁCH ĐẤU 1V1)'}
          headerRight={
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs font-pixel px-2 py-1 bg-slate-800 border border-slate-600 cursor-pointer"
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
                {isEn ? `LOBBY BROWSER (${rooms.length})` : `DANH SÁCH PHÒNG (${rooms.length})`}
              </PixelButton>

              <PixelButton
                variant={activeTab === 'create' ? 'gold' : 'frame'}
                size="sm"
                onClick={() => setActiveTab('create')}
              >
                {isEn ? '+ CREATE ROOM' : '+ TẠO PHÒNG MỚI'}
              </PixelButton>
            </div>
          )}

          {/* 1. Browse Rooms Tab */}
          {activeTab === 'browse' && (
            <div className="flex flex-col gap-4">
              {/* Quick Join via Code */}
              <div className="p-2.5 bg-slate-900 border border-slate-700 flex gap-2 items-center">
                <input
                  type="text"
                  placeholder={isEn ? 'Enter Room Code (e.g. ROOM-7742)...' : 'Nhập mã phòng (ví dụ: ROOM-7742)...'}
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoinByCode();
                  }}
                  className="w-full bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-yellow-300 font-pixel focus:outline-none"
                />
                <PixelSpriteButton
                  sprite="join_room"
                  onClick={handleJoinByCode}
                  className="w-32 sm:w-36 flex-shrink-0"
                />
              </div>

              {/* Rooms List */}
              {rooms.length === 0 ? (
                <div className="p-6 bg-slate-900/60 border border-slate-700 text-center">
                  <span className="text-3xl mb-2 block">🏰</span>
                  <p className="text-[9px] font-pixel text-yellow-300 mb-1">
                    {isEn ? 'NO ACTIVE LOBBIES RIGHT NOW' : 'CHƯA CÓ PHÒNG NÀO ĐANG MỞ'}
                  </p>
                  <p className="text-[8px] font-pixel text-slate-400 mb-3">
                    {isEn
                      ? 'Click "+ CREATE ROOM" below to host your custom duel, or enter an invite code above!'
                      : 'Bấm nút tạo phòng bên dưới để mở phòng đấu của bạn, hoặc nhập mã phòng ở trên!'}
                  </p>
                  <PixelSpriteButton
                    sprite="create_room"
                    onClick={() => setActiveTab('create')}
                    className="w-44 mx-auto"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-3 bg-slate-900/90 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-purple-400 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-pixel text-yellow-300">
                            {room.id}
                          </span>
                          <span className="text-[7.5px] font-pixel px-1.5 py-0.5 bg-purple-900/60 text-purple-300 border border-purple-600">
                            {isEn ? 'Host: ' : 'Chủ: '}{room.hostName}
                          </span>
                          <span className="text-[7.5px] font-pixel px-1.5 py-0.5 bg-slate-800 text-cyan-300">
                            {room.mode.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-[8px] font-pixel text-slate-400 mt-1">
                          {isEn ? 'Arena: ' : 'Chiến trường: '}
                          <span className="text-yellow-400">
                            {isEn
                              ? MAP_DEFINITIONS.find((m) => m.id === room.mapId)?.name
                              : MAP_DEFINITIONS.find((m) => m.id === room.mapId)?.nameVi}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-pixel text-emerald-400 font-bold">
                          {room.guestId ? (isEn ? '2/2 FULL' : '2/2 ĐẦY') : (isEn ? '1/2 WAITING' : '1/2 ĐANG ĐỢI')}
                        </span>

                        <PixelSpriteButton
                          sprite="join_room"
                          disabled={Boolean(room.guestId && room.guestId !== profile.id)}
                          onClick={() => handleJoinRoom(room)}
                          className="w-28 sm:w-32"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. Create Room Tab */}
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
                    className="w-full bg-slate-900 border border-slate-700 p-2 text-xs text-yellow-300 font-pixel"
                  >
                    <option value="casual">{isEn ? 'Casual' : 'Đấu Thường (Casual)'}</option>
                    <option value="ranked">{isEn ? 'Ranked' : 'Đấu Hạng (Ranked)'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8.5px] font-pixel text-yellow-300 font-bold block mb-1">
                    {isEn ? 'BATTLE ARENA:' : 'CHIẾN TRƯỜNG (MAP):'}
                  </label>
                  <select
                    value={newRoomMap}
                    onChange={(e) => setNewRoomMap(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 p-2 text-xs text-cyan-300 font-pixel"
                  >
                    {MAP_DEFINITIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {isEn ? m.name : m.nameVi}
                      </option>
                    ))}
                  </select>
                </div>
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
                  onClick={() => handleCreateRoom()}
                  className="w-36 sm:w-44"
                />
              </div>
            </form>
          )}

          {/* 3. Room Lobby Tab */}
          {activeTab === 'lobby' && currentLobby && (
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-purple-950/40 border border-purple-500/70 flex justify-between items-center">
                <div>
                  <span className="text-xs font-pixel text-yellow-300 font-bold">
                    {isEn ? 'LOBBY: ' : 'PHÒNG: '}{currentLobby.id}
                  </span>
                  <p className="text-[8px] font-pixel text-slate-300 mt-1">
                    {isEn ? 'Share this room code with your friend to connect!' : 'Chia sẻ mã phòng này để bạn bè vào tham chiến!'}
                  </p>
                </div>

                <span className="text-[8px] font-pixel px-2 py-1 bg-yellow-500 text-black font-bold">
                  {currentLobby.mode.toUpperCase()}
                </span>
              </div>

              {/* 2 Player Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Host Slot */}
                <div className="p-3 bg-slate-900 border-2 border-yellow-500">
                  <span className="text-[7.5px] font-pixel text-yellow-400 font-bold">
                    {isEn ? '👑 HOST' : '👑 CHỦ PHÒNG'}
                  </span>
                  <h4 className="text-xs font-pixel font-bold text-white mt-1">{currentLobby.hostName}</h4>
                  <p className="text-[8px] font-pixel text-cyan-300 mt-1">
                    Class: {currentLobby.hostClass.toUpperCase()}
                  </p>
                  <span className="inline-block mt-2 text-[7.5px] font-pixel text-emerald-400 font-bold">
                    {isEn ? '✓ READY' : '✓ ĐÃ SẴN SÀNG'}
                  </span>
                </div>

                {/* Guest Slot */}
                <div className="p-3 bg-slate-900 border-2 border-cyan-500">
                  <span className="text-[7.5px] font-pixel text-cyan-400 font-bold">
                    {isEn ? '⚔️ CHALLENGER' : '⚔️ ĐỐI THỦ'}
                  </span>
                  <h4 className="text-xs font-pixel font-bold text-white mt-1">
                    {currentLobby.guestName || (isEn ? 'Waiting for opponent...' : 'Đang chờ người chơi tham gia...')}
                  </h4>
                  <p className="text-[8px] font-pixel text-cyan-300 mt-1">
                    {currentLobby.guestName
                      ? (isEn ? 'Connected in lobby' : 'Đã vào phòng')
                      : (isEn ? 'Send code to your rival' : 'Hãy gửi mã phòng cho bạn bè')}
                  </p>
                  <span className="inline-block mt-2 text-[7.5px] font-pixel text-yellow-400 font-bold">
                    {currentLobby.guestName
                      ? (isEn ? '✓ CONNECTED' : '✓ ĐÃ KẾT NỐI')
                      : (isEn ? '⏳ WAITING...' : '⏳ ĐANG ĐỢI')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <PixelSpriteButton
                  sprite="back"
                  onClick={() => {
                    setCurrentLobby(null);
                    setActiveTab('browse');
                  }}
                  className="w-28 sm:w-32"
                />

                <PixelSpriteButton
                  sprite="start"
                  onClick={handleStartLobbyBattle}
                  className="w-36 sm:w-44"
                />
              </div>
            </div>
          )}
        </PixelFrame>
      </div>
    </div>
  );
}
