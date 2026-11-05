'use client';

import AccountPanel from '@/components/progression/AccountPanel';
import {flushProfile} from '@/lib/profileSync';
import React, { useState, useEffect } from 'react';
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

  useEffect(()=>{if(authModal!=='profile')return;setEditName(currentUser?.username||profile.name);setEditBio(currentUser?.bio||'');setSavedSuccess(false);setErrorMsg('');},[authModal,currentUser?.id]);

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

  const handleSaveProfile = async () => {
    setIsLoading(true);setSavedSuccess(false);setErrorMsg('');
    try{
      await flushProfile();
      const r=await fetch('/api/auth/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:editName.trim(),bio:editBio})});const b=await r.json();if(!r.ok||!b.success)throw Error(b.error||'Profile save failed');
      useGameStore.setState(st=>({currentUser:b.user,profile:{...st.profile,name:b.user.username},accounts:st.accounts.map(a=>a.id===b.user.id?b.user:a)}));setSavedSuccess(true);
    }catch(e){setErrorMsg((e as Error).message);}finally{setIsLoading(false);}
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
                    maxLength={32}
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
              <AccountPanel />
              <div className="flex flex-col md:flex-row gap-4 py-2">
                {/* Right: Stats, Bio & Account Management */}
                <div className="flex-1 flex flex-col gap-3">
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
                      maxLength={1000}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Share your battle glory..."
                      className="w-full bg-slate-900 border border-slate-700 p-2 text-xs text-slate-200 font-pixel focus:outline-none resize-none"
                    />
                  </div>

                  {errorMsg&&<p role="alert" className="text-xs text-red-300">{errorMsg}</p>}
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

                    <PixelButton variant="success" size="sm" disabled={isLoading} onClick={handleSaveProfile}>
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
