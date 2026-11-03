'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import { SPRITE_HELPERS, CLASS_DEFINITIONS } from '@/lib/constants';
import PixelButton from '@/components/ui/PixelButton';
import PixelFrame from '@/components/ui/PixelFrame';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import GlobalAccountsModal from './GlobalAccountsModal';

export default function AuthModals() {
  const {
    authModal,
    setAuthModal,
    currentUser,
    profile,
    updateProfile,
    loginUser,
    signupUser,
    logoutUser,
    updateUserBio,
    settings,
    setPage,
  } = useGameStore();

  const lang = settings.language;
  const isEn = lang === 'en';

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Profile Edit States
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editName, setEditName] = useState(profile.name);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (authModal === 'none') return null;

  if (authModal === 'global') {
    return (
      <GlobalAccountsModal
        isOpen={true}
        onClose={() => setAuthModal('none')}
        isEn={isEn}
      />
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      setErrorMsg(isEn ? 'Please enter your username.' : 'Vui lòng nhập tên người dùng.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    const res = await loginUser(loginUsername.trim(), loginPass);
    setIsLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || (isEn ? 'User not found.' : 'Không tìm thấy tài khoản.'));
    } else {
      setErrorMsg('');
      setLoginUsername('');
      setLoginPass('');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupUsername.trim()) {
      setErrorMsg(isEn ? 'Please enter a username.' : 'Vui lòng nhập tên.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    const res = await signupUser(
      signupUsername.trim(),
      signupEmail.trim() || `${signupUsername.trim().toLowerCase()}@dicemaniac.rpg`,
      signupPass
    );
    setIsLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || (isEn ? 'Username already taken.' : 'Tên tài khoản đã tồn tại.'));
    } else {
      setErrorMsg('');
      setSignupUsername('');
      setSignupEmail('');
      setSignupPass('');
    }
  };

  const handleSaveProfile = () => {
    if (editName.trim()) {
      updateProfile({ name: editName.trim() });
    }
    updateUserBio(editBio);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const c = profile.character;
  const winRate =
    profile.wins + profile.losses > 0
      ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100)
      : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <AnimatePresence>
        {/* ============================================================ */}
        {/* LOGIN MODAL                                                   */}
        {/* ============================================================ */}
        {authModal === 'login' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md my-auto"
          >
            <PixelFrame
              variant="gold"
              title={isEn ? '⚔️ WARRIOR LOGIN' : '⚔️ ĐĂNG NHẬP HIỆP SĨ'}
              headerRight={
                <button
                  onClick={() => setAuthModal('none')}
                  className="text-slate-400 hover:text-white text-xs font-pixel px-2 py-1 bg-slate-800"
                >
                  ✕
                </button>
              }
            >
              <form onSubmit={handleLogin} className="flex flex-col gap-3 py-2">
                {errorMsg && (
                  <div className="p-2 bg-red-950/80 border border-red-500 text-red-300 text-[9px] text-center">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="text-[9px] text-yellow-300 font-bold block mb-1">
                    {isEn ? 'USERNAME OR CALLSIGN:' : 'TÊN NGƯỜI DÙNG HOẶC ID:'}
                  </label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="e.g. DiceHero"
                    className="w-full bg-slate-900 border-2 border-yellow-500/70 p-2 text-xs text-yellow-300 font-pixel focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-yellow-300 font-bold block mb-1">
                    {isEn ? 'PASSWORD / PASSKEY:' : 'MẬT KHẨU:'}
                  </label>
                  <input
                    type="password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border-2 border-yellow-500/70 p-2 text-xs text-yellow-300 font-pixel focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <PixelButton
                    type="submit"
                    variant="gold"
                    size="md"
                    className="w-full py-2.5 cursor-pointer"
                    disabled={isLoading}
                    onClick={() => {
                      if (loginUsername.trim()) {
                        handleLogin({ preventDefault: () => {} } as React.FormEvent);
                      }
                    }}
                  >
                    {isLoading
                      ? (isEn ? 'CONNECTING...' : 'ĐANG ĐĂNG NHẬP...')
                      : (isEn ? 'ENTER THE ARENA' : 'ĐĂNG NHẬP NGAY')}
                  </PixelButton>

                  <div className="text-center text-[9px] text-slate-400 mt-2">
                    {isEn ? "Don't have an account? " : 'Chưa có tài khoản? '}
                    <button
                      type="button"
                      onClick={() => setAuthModal('signup')}
                      className="text-cyan-400 hover:underline font-bold"
                    >
                      {isEn ? 'Sign Up' : 'Đăng ký ngay'}
                    </button>
                  </div>
                </div>
              </form>
            </PixelFrame>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* SIGN UP MODAL                                                */}
        {/* ============================================================ */}
        {authModal === 'signup' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md my-auto"
          >
            <PixelFrame
              variant="cyan"
              title={isEn ? '🛡️ CREATE NEW HERO' : '🛡️ ĐĂNG KÝ TÀI KHOẢN MỚI'}
              headerRight={
                <button
                  onClick={() => setAuthModal('none')}
                  className="text-slate-400 hover:text-white text-xs font-pixel px-2 py-1 bg-slate-800"
                >
                  ✕
                </button>
              }
            >
              <form onSubmit={handleSignup} className="flex flex-col gap-3 py-2">
                {errorMsg && (
                  <div className="p-2 bg-red-950/80 border border-red-500 text-red-300 text-[9px] text-center">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="text-[9px] text-cyan-300 font-bold block mb-1">
                    {isEn ? 'CHOOSE HERO NAME:' : 'TÊN NHÂN VẬT:'}
                  </label>
                  <input
                    type="text"
                    value={signupUsername}
                    maxLength={16}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    placeholder="e.g. DragonKnight"
                    className="w-full bg-slate-900 border-2 border-cyan-500/70 p-2 text-xs text-cyan-300 font-pixel focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-cyan-300 font-bold block mb-1">
                    {isEn ? 'EMAIL ADDRESS:' : 'EMAIL:'}
                  </label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="knight@dicemaniac.rpg"
                    className="w-full bg-slate-900 border-2 border-cyan-500/70 p-2 text-xs text-cyan-300 font-pixel focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-cyan-300 font-bold block mb-1">
                    {isEn ? 'PASSWORD:' : 'MẬT KHẨU:'}
                  </label>
                  <input
                    type="password"
                    value={signupPass}
                    onChange={(e) => setSignupPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border-2 border-cyan-500/70 p-2 text-xs text-cyan-300 font-pixel focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <PixelButton
                    type="submit"
                    variant="secondary"
                    size="md"
                    className="w-full py-2.5 cursor-pointer"
                    disabled={isLoading}
                    onClick={() => {
                      if (signupUsername.trim()) {
                        handleSignup({ preventDefault: () => {} } as React.FormEvent);
                      }
                    }}
                  >
                    {isLoading
                      ? (isEn ? 'CREATING HERO...' : 'ĐANG KHỞI TẠO...')
                      : (isEn ? 'CREATE ACCOUNT' : 'TẠO TÀI KHOẢN')}
                  </PixelButton>

                  <div className="text-center text-[9px] text-slate-400 mt-2">
                    {isEn ? 'Already have an account? ' : 'Đã có tài khoản? '}
                    <button
                      type="button"
                      onClick={() => setAuthModal('login')}
                      className="text-yellow-400 hover:underline font-bold"
                    >
                      {isEn ? 'Log In' : 'Đăng nhập'}
                    </button>
                  </div>
                </div>
              </form>
            </PixelFrame>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* PROFILE MODAL                                                */}
        {/* ============================================================ */}
        {authModal === 'profile' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-2xl my-auto"
          >
            <PixelFrame
              variant="purple"
              title={isEn ? '👑 WARRIOR PROFILE & DATABASE' : '👑 HỒ SƠ CHIẾN BINH'}
              headerRight={
                <button
                  onClick={() => setAuthModal('none')}
                  className="text-slate-400 hover:text-white text-xs font-pixel px-2 py-1 bg-slate-800"
                >
                  ✕
                </button>
              }
            >
              <div className="flex flex-col md:flex-row gap-4 py-2">
                {/* Left: Character Paper Doll Preview & Tier */}
                <div className="flex flex-col items-center md:w-1/3 p-3 bg-black/80 border-2 border-purple-500/60">
                  {/* Unified Sliced Sprites Character Renderer */}
                  <div className="relative w-32 h-48 bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden mb-2 shadow-[inset_0_0_15px_rgba(0,0,0,0.9)] p-2">
                    <CharacterRenderer character={profile.character} size="sm" />
                  </div>

                  {/* Tier Frame Badge */}
                  <div className="relative w-36 h-10 mb-2">
                    <Image
                      src={SPRITE_HELPERS.tier(profile.tier)}
                      alt="Tier Badge"
                      fill
                      className="object-contain"
                    />
                  </div>

                  <span className="text-[10px] text-yellow-300 font-bold">
                    {profile.name}
                  </span>
                  <span className="text-[8px] text-cyan-300 mt-0.5">
                    {CLASS_DEFINITIONS[profile.classType]?.nameVi}
                  </span>

                  <div className="mt-3 w-full">
                    <PixelButton
                      variant="gold"
                      size="sm"
                      onClick={() => {
                        setAuthModal('none');
                        setPage('character');
                      }}
                      className="w-full text-[8px]"
                    >
                      {isEn ? 'CUSTOMIZE GEAR' : 'TÙY BIẾN NGOẠI HÌNH'}
                    </PixelButton>
                  </div>
                </div>

                {/* Right: Stats, Bio & Account Management */}
                <div className="flex-1 flex flex-col gap-3">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 bg-slate-900 border border-slate-700 text-center">
                      <span className="text-[8px] text-slate-400 block">{isEn ? 'RANK' : 'ĐIỂM HẠNG'}</span>
                      <span className="text-xs font-bold text-yellow-400">{profile.rank}</span>
                    </div>
                    <div className="p-2 bg-slate-900 border border-slate-700 text-center">
                      <span className="text-[8px] text-slate-400 block">{isEn ? 'WINS' : 'THẮNG'}</span>
                      <span className="text-xs font-bold text-emerald-400">{profile.wins}</span>
                    </div>
                    <div className="p-2 bg-slate-900 border border-slate-700 text-center">
                      <span className="text-[8px] text-slate-400 block">{isEn ? 'WIN RATE' : 'TỈ LỆ THẮNG'}</span>
                      <span className="text-xs font-bold text-cyan-400">{winRate}%</span>
                    </div>
                    <div className="p-2 bg-slate-900 border border-slate-700 text-center">
                      <span className="text-[8px] text-slate-400 block">{isEn ? 'TOP D20' : 'D20 CAO NHẤT'}</span>
                      <span className="text-xs font-bold text-purple-400">{profile.highestD20}</span>
                    </div>
                  </div>

                  {/* Name Edit */}
                  <div>
                    <label className="text-[9px] text-yellow-300 font-bold block mb-1">
                      {isEn ? 'DISPLAY CALLSIGN:' : 'TÊN HIỂN THỊ:'}
                    </label>
                    <input
                      type="text"
                      value={editName}
                      maxLength={16}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 p-2 text-xs text-yellow-300 font-pixel focus:outline-none"
                    />
                  </div>

                  {/* Bio Edit */}
                  <div>
                    <label className="text-[9px] text-yellow-300 font-bold block mb-1">
                      {isEn ? 'WARRIOR BIO / LORE:' : 'TIỂU SỬ CHIẾN BINH:'}
                    </label>
                    <textarea
                      rows={3}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Share your battle glory..."
                      className="w-full bg-slate-900 border border-slate-700 p-2 text-xs text-slate-200 font-pixel focus:outline-none resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <PixelButton
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        logoutUser();
                        setAuthModal('none');
                      }}
                    >
                      {isEn ? 'LOG OUT' : 'ĐĂNG XUẤT'}
                    </PixelButton>

                    <PixelButton variant="success" size="sm" onClick={handleSaveProfile}>
                      {savedSuccess ? (isEn ? 'SAVED!' : 'ĐÃ LƯU!') : isEn ? 'SAVE PROFILE' : 'LƯU HỒ SƠ'}
                    </PixelButton>
                  </div>
                </div>
              </div>
            </PixelFrame>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
