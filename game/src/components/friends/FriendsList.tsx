'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import PixelButton from '@/components/ui/PixelButton';
import PixelFrame from '@/components/ui/PixelFrame';

interface Friend {
  id: string;
  name: string;
  status: 'online' | 'in_battle' | 'offline';
  rank: number;
  classType: string;
  wins: number;
}

export default function FriendsList() {
  const { setPage, settings, startNewBattle } = useGameStore();
  const lang = settings.language;

  const [searchQuery, setSearchQuery] = useState('');
  const [invitedId, setInvitedId] = useState<string | null>(null);

  const [friends, setFriends] = useState<Friend[]>([
    {
      id: 'f1',
      name: 'Bell_Master',
      status: 'online',
      rank: 2450,
      classType: 'Sát Thủ (Assassin)',
      wins: 142,
    },
    {
      id: 'f2',
      name: 'Snow_White',
      status: 'online',
      rank: 2180,
      classType: 'Pháp Sư (Mage)',
      wins: 118,
    },
    {
      id: 'f3',
      name: 'Shiratosi_Gold',
      status: 'in_battle',
      rank: 2990,
      classType: 'Võ Sĩ (Boxer)',
      wins: 210,
    },
    {
      id: 'f4',
      name: 'DragonSlayer',
      status: 'offline',
      rank: 1650,
      classType: 'Chiến Binh (Warrior)',
      wins: 65,
    },
    {
      id: 'f5',
      name: 'TitanShield',
      status: 'offline',
      rank: 1820,
      classType: 'Đỡ Đòn (Tanker)',
      wins: 84,
    },
  ]);

  const handleInvite = (friend: Friend) => {
    setInvitedId(friend.id);
    setTimeout(() => {
      setInvitedId(null);
      // Launch 1v1 local match with friend's name
      startNewBattle({
        mode: 'local',
        opponentName: friend.name,
      });
    }, 1200);
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const newFriend: Friend = {
      id: 'f_' + Date.now(),
      name: searchQuery.trim(),
      status: 'online',
      rank: 1000,
      classType: 'Chiến Binh (Warrior)',
      wins: 0,
    };

    setFriends([newFriend, ...friends]);
    setSearchQuery('');
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center p-3 sm:p-6 overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/background.png"
          alt="Friends Background"
          fill
          priority
          className="object-cover filter brightness-[0.35] contrast-125 blur-sm"
        />
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      </div>

      {/* Top Header */}
      <div className="relative z-20 w-full max-w-4xl flex items-center justify-between pb-3 border-b-2 border-yellow-500/40">
        <PixelButton
          variant="secondary"
          size="sm"
          onClick={() => setPage('home')}
          icon={<span>⬅</span>}
        >
          {t('back', lang)}
        </PixelButton>

        <h2 className="text-sm sm:text-lg text-yellow-400 font-pixel drop-shadow">
          DANH SÁCH BẠN BÈ ({friends.length})
        </h2>

        <div className="w-16" />
      </div>

      {/* Main Container */}
      <div className="relative z-20 w-full max-w-3xl my-auto flex flex-col gap-4 py-4">
        {/* Add Friend Search Box */}
        <PixelFrame variant="cyan" title="🔍 THÊM BẠN BÈ MỚI">
          <form onSubmit={handleAddFriend} className="flex gap-2 p-1">
            <input
              type="text"
              placeholder="Nhập tên người chơi hoặc ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border-2 border-cyan-500/70 px-3 py-1.5 text-xs text-cyan-300 font-pixel focus:outline-none"
            />
            <PixelButton variant="gold" size="sm" onClick={() => {}}>
              KẾT BẠN
            </PixelButton>
          </form>
        </PixelFrame>

        {/* Friends List Card */}
        <PixelFrame variant="gold" title="DANH SÁCH CHIẾN HỮU ONLINE">
          <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="p-3 bg-slate-900/80 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-500 transition"
              >
                <div className="flex items-center gap-3">
                  {/* Status Indicator */}
                  <span
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      friend.status === 'online'
                        ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                        : friend.status === 'in_battle'
                        ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                        : 'bg-slate-600'
                    }`}
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-yellow-300">
                        {friend.name}
                      </span>
                      <span className="text-[8px] px-1.5 py-0.2 bg-slate-800 text-cyan-300 border border-slate-700">
                        {friend.classType}
                      </span>
                    </div>

                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Điểm hạng: <span className="text-yellow-400 font-bold">{friend.rank}</span> • Thắng: {friend.wins} trận
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-[8px] text-slate-400">
                    {friend.status === 'online'
                      ? 'Đang rảnh'
                      : friend.status === 'in_battle'
                      ? 'Đang trong trận'
                      : 'Ngoại tuyến'}
                  </span>

                  <PixelButton
                    variant={invitedId === friend.id ? 'success' : 'gold'}
                    size="sm"
                    disabled={friend.status === 'offline' || invitedId === friend.id}
                    onClick={() => handleInvite(friend)}
                  >
                    {invitedId === friend.id ? 'ĐÃ KẾT NỐI!' : 'THÁCH ĐẤU'}
                  </PixelButton>
                </div>
              </div>
            ))}
          </div>
        </PixelFrame>
      </div>

      {/* Footer */}
      <div className="relative z-20 text-center pb-4">
        <p className="text-[9px] text-slate-400 font-pixel">
          Hỗ trợ chơi mạng Realtime qua Supabase & P2P Turn-based
        </p>
      </div>
    </div>
  );
}
