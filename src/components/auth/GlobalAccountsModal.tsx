'use client';
import {tx} from '@/lib/uiLocale';

import PlayerAvatar from '@/components/ui/PlayerAvatar';
import {levelProgress,rankProgress} from '@/lib/progression';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import PixelIcon from '@/components/ui/PixelIcon';
import PixelButton from '@/components/ui/PixelButton';
import { CLASS_DEFINITIONS, WEAPON_DEFINITIONS } from '@/lib/constants';
import type { ClassType } from '@/types/game';
import { playClickSound } from '@/lib/soundEffects';

interface SafeUserItem {
  id: string;
  exp?:number;
  equipped_frame?:number;
  presence?: "online" | "offline" | "lobby" | "battle" | "unknown";
  username: string;
  avatarConfig: any;
  selectedClass?: string;
  selectedWeapon?: string;
  tier?: number;
  rankPoints?: number;
  wins?: number;
  losses?: number;
  bio?: string;
  createdAt?: string;
}

interface GlobalAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEn?: boolean;
}

export default function GlobalAccountsModal({
  isOpen,
  onClose,
  isEn = true,
}: GlobalAccountsModalProps) {
  const [users, setUsers] = useState<SafeUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/users', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setError(data.error || 'Failed to load community accounts');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      const timer = setInterval(() => fetchUsers(true), 5000);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      (u.selectedClass && u.selectedClass.toLowerCase().includes(q)) ||
      (u.selectedWeapon && u.selectedWeapon.toLowerCase().includes(q))
    );
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="global-directory relative w-full max-w-3xl max-h-[90dvh] bg-[#0c101c] border-2 border-yellow-500 shadow-[0_0_35px_rgba(250,204,21,0.4)] flex flex-col overflow-hidden text-slate-100"
        >
          {/* Header */}
          <div className="p-3 sm:p-4 bg-black/70 border-b-2 border-yellow-500/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🌐</span>
              <div>
                <h3 className="text-xs sm:text-base font-pixel font-bold text-yellow-400 drop-shadow flex items-center gap-2">
                  <span>{isEn ? 'GLOBAL ADVENTURERS DIRECTORY' : 'DANH BẠ ANH HÙNG TOÀN CẦU'}</span>
                  <span className="text-[9px] px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/50">
                    {users.length} {isEn ? 'ACCOUNTS' : 'TÀI KHOẢN CSDL'}
                  </span>
                </h3>
                <p className="text-[8px] sm:text-[9px] text-slate-400 font-pixel mt-0.5">
                  {isEn
                    ? 'All persistent registered players saved in permanent database'
                    : 'Tất cả tài khoản người chơi đã đăng ký và lưu vĩnh viễn trong CSDL'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="text-sm font-pixel text-slate-400 hover:text-white bg-red-950/60 hover:bg-red-900 border border-red-500/60 w-8 h-8 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Search Bar & Refresh */}
          <div className="p-3 bg-[#07090e] border-b border-slate-800 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={isEn ? 'Search player by username or class...' : 'Tìm kiếm theo tên người dùng hoặc hệ nghề...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/60 border border-slate-700 focus:border-yellow-400 px-3 py-1.5 text-[10px] font-pixel text-yellow-300 placeholder-slate-600 outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => {
                playClickSound();
                fetchUsers();
              }}
              disabled={loading}
              className="px-3 py-1.5 bg-yellow-950 hover:bg-yellow-900 border border-yellow-500/70 text-yellow-300 text-[9px] font-pixel flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>🔄</span>
              <span>{isEn ? 'REFRESH' : 'LÀM MỚI'}</span>
            </button>
          </div>

          {/* User Cards Grid */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-pixel text-yellow-400 animate-pulse">
                  {isEn ? 'FETCHING REGISTERED REALMS...' : 'ĐANG TẢI DỮ LIỆU NGƯỜI CHƠI...'}
                </span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-[10px] font-pixel text-red-400">{error}</p>
                <button
                  onClick={() => fetchUsers()}
                  className="mt-3 text-[9px] font-pixel text-yellow-400 underline"
                >
                  {isEn ? 'Try Again' : 'Thử lại'}
                </button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-pixel text-[10px]">
                {search
                  ? isEn
                    ? 'No adventurers matched your search filter.'
                    : 'Không tìm thấy người chơi nào khớp.'
                  : isEn
                  ? 'No players registered yet. Be the first!'
                  : 'Chưa có tài khoản nào được tạo. Hãy là người đầu tiên!'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredUsers.map((user) => {
                  const classDef = user.selectedClass ? CLASS_DEFINITIONS[user.selectedClass as ClassType] : CLASS_DEFINITIONS.warrior;
                  const weaponDef = user.selectedWeapon ? WEAPON_DEFINITIONS[user.selectedWeapon] : WEAPON_DEFINITIONS.greatsword;
                  const totalGames = (user.wins || 0) + (user.losses || 0);
                  const winRate = totalGames > 0 ? Math.round(((user.wins || 0) / totalGames) * 100) : 0;

                  return (
                    <div
                      key={user.id || user.username}
                      className="p-3 bg-black/60 border border-slate-700 hover:border-yellow-500/80 transition-all flex items-center gap-3 group relative overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                    >
                      {user.avatarConfig&&<PlayerAvatar character={user.avatarConfig} frame={user.equipped_frame||0} size={64}/>}
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[11px] font-pixel font-bold text-yellow-300 group-hover:text-yellow-100 truncate">
                            {user.username}<span className={'ml-2 text-[8px] ' + (user.presence === 'offline' ? 'text-slate-500' : user.presence === 'battle' ? 'text-red-300' : 'text-emerald-300')}>{({online: '● Online', offline: '○ Offline', lobby: isEn ? '● Lobby' : '● Trong phòng', battle: isEn ? '⚔ In battle' : '⚔ Đang đấu', unknown: isEn ? 'Status unavailable' : 'Chưa có trạng thái'})[user.presence || 'unknown']}</span>
                          </span>
                          <span className="text-[8px] font-pixel text-yellow-400 bg-yellow-950/70 border border-yellow-500/40 px-1 py-0.2 whitespace-nowrap">
                            {tx(rankProgress(user.rankPoints).name)} · LV {levelProgress(user.exp).level}
                          </span>
                        </div>

                        {/* Class & Weapon */}
                        <div className="flex items-center gap-2 text-[8px] font-pixel text-slate-400 mb-1">
                          <span className="text-cyan-400 truncate">
                            {classDef ? (isEn ? classDef.name : classDef.nameVi) : 'Warrior'}
                          </span>
                          <span>•</span>
                          <span className="text-purple-400 truncate">
                            {weaponDef ? (isEn ? weaponDef.name : weaponDef.nameVi) : 'Greatsword'}
                          </span>
                        </div>

                        {/* Bio & Stats */}
                        <div className="flex items-center justify-between text-[7.5px] font-pixel text-slate-500">
                          <span>
                            {user.wins || 0}W - {user.losses || 0}L ({winRate}%)
                          </span>
                          {user.createdAt && (
                            <span className="text-slate-600">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {user.bio && (
                          <p className="text-[7.5px] font-pixel text-slate-400 truncate mt-1 italic border-t border-slate-800/80 pt-0.5">
                            "{user.bio}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-2.5 bg-black/80 border-t border-slate-800 flex items-center justify-between text-[8px] font-pixel text-slate-500">
            <span>
              {isEn ? '💡 Accounts are permanent and sync across devices.' : '💡 Tài khoản lưu vĩnh viễn và đồng bộ đa thiết bị.'}
            </span>
            <PixelButton
              variant="secondary"
              size="sm"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="text-[8px] py-1"
            >
              {isEn ? 'CLOSE' : 'ĐÓNG'}
            </PixelButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
