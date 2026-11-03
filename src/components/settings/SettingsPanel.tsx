'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import PixelButton from '@/components/ui/PixelButton';
import PixelFrame from '@/components/ui/PixelFrame';

export default function SettingsPanel() {
  const { settings, updateSettings, profile, updateProfile, setPage } = useGameStore();
  const lang = settings.language;
  const isEn = lang === 'en';

  const [playerName, setPlayerName] = useState(profile.name);
  const [showRules, setShowRules] = useState(false);
  const [savedNotify, setSavedNotify] = useState(false);

  const handleSaveProfile = () => {
    if (playerName.trim()) {
      updateProfile({ name: playerName.trim() });
      setSavedNotify(true);
      setTimeout(() => setSavedNotify(false), 2000);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center p-3 sm:p-6 overflow-x-hidden bg-[#07070b]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/background.png"
          alt="Settings Background"
          fill
          priority
          className="object-cover filter brightness-[0.25] contrast-125 blur-sm"
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

        <h2 className="text-sm sm:text-base text-yellow-400 font-pixel drop-shadow">
          {t('settings', lang)}
        </h2>

        <div className="w-16" />
      </div>

      {/* Main Settings Body */}
      <div className="relative z-20 w-full max-w-3xl my-auto flex flex-col gap-4 py-4">
        {/* Audio & Sound Settings */}
        <PixelFrame variant="gold" title={isEn ? '🔊 AUDIO & MUSIC VOLUME' : '🔊 CÀI ĐẶT ÂM THANH & NHẠC NỀN'}>
          <div className="flex flex-col gap-4 p-2">
            {/* Music Volume */}
            <div>
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-pixel mb-1.5">
                <span className="text-yellow-300 font-bold flex items-center gap-1.5">
                  <span>🎵</span> {t('musicVolume', lang)}:
                </span>
                <span className="text-cyan-300 font-bold">
                  {settings.musicMuted ? (isEn ? 'MUTED' : 'TẮT (MUTED)') : `${Math.round(settings.musicVolume * 100)}%`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicMuted ? 0 : settings.musicVolume}
                  onChange={(e) =>
                    updateSettings({
                      musicVolume: parseFloat(e.target.value),
                      musicMuted: false,
                    })
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />
                <PixelButton
                  variant={settings.musicMuted ? 'danger' : 'gold'}
                  size="sm"
                  onClick={() => updateSettings({ musicMuted: !settings.musicMuted })}
                >
                  {settings.musicMuted ? (isEn ? 'UNMUTE' : 'BẬT') : (isEn ? 'MUTE' : 'TẮT')}
                </PixelButton>
              </div>
            </div>

            {/* SFX Volume */}
            <div>
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-pixel mb-1.5">
                <span className="text-yellow-300 font-bold flex items-center gap-1.5">
                  <span>💥</span> {t('sfxVolume', lang)}:
                </span>
                <span className="text-cyan-300 font-bold">
                  {settings.sfxMuted ? (isEn ? 'MUTED' : 'TẮT (MUTED)') : `${Math.round(settings.sfxVolume * 100)}%`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.sfxMuted ? 0 : settings.sfxVolume}
                  onChange={(e) =>
                    updateSettings({
                      sfxVolume: parseFloat(e.target.value),
                      sfxMuted: false,
                    })
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <PixelButton
                  variant={settings.sfxMuted ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={() => updateSettings({ sfxMuted: !settings.sfxMuted })}
                >
                  {settings.sfxMuted ? (isEn ? 'UNMUTE' : 'BẬT') : (isEn ? 'MUTE' : 'TẮT')}
                </PixelButton>
              </div>
            </div>
          </div>
        </PixelFrame>

        {/* Language & Profile Settings */}
        <PixelFrame variant="cyan" title={isEn ? '🌐 LANGUAGE & PLAYER INFO' : '🌐 NGÔN NGỮ & THÔNG TIN NGƯỜI CHƠI'}>
          <div className="flex flex-col gap-4 p-2">
            {/* Language Switch */}
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] text-yellow-300 font-pixel font-bold">
                {t('language', lang)}:
              </span>
              <div className="flex gap-2">
                <PixelButton
                  variant={settings.language === 'en' ? 'gold' : 'frame'}
                  size="sm"
                  onClick={() => updateSettings({ language: 'en' })}
                >
                  🇬🇧 ENGLISH (DEFAULT)
                </PixelButton>
                <PixelButton
                  variant={settings.language === 'vi' ? 'gold' : 'frame'}
                  size="sm"
                  onClick={() => updateSettings({ language: 'vi' })}
                >
                  🇻🇳 TIẾNG VIỆT
                </PixelButton>
              </div>
            </div>

            {/* Display Name */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[9px] sm:text-[10px] text-yellow-300 font-pixel font-bold whitespace-nowrap">
                {isEn ? 'DISPLAY NAME:' : 'TÊN HIỂN THỊ:'}
              </span>
              <div className="flex items-center gap-2 w-full max-w-xs">
                <input
                  type="text"
                  value={playerName}
                  maxLength={16}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-slate-900 border-2 border-cyan-500/70 px-2.5 py-1 text-xs text-cyan-300 font-pixel focus:outline-none"
                />
                <PixelButton variant="gold" size="sm" onClick={handleSaveProfile}>
                  {savedNotify ? (isEn ? 'SAVED' : 'ĐÃ LƯU') : (isEn ? 'SAVE' : 'LƯU')}
                </PixelButton>
              </div>
            </div>
          </div>
        </PixelFrame>

        {/* Game Rules & Credits */}
        <PixelFrame variant="purple" title={isEn ? '📖 GAME RULES & CODEX' : '📖 LUẬT CHƠI & TÁC GIẢ'}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2">
            <div>
              <p className="text-[9px] text-slate-300 font-pixel mb-1">
                {isEn
                  ? 'Review the 20-sided D20 combat system, D6 skill charges, and the 6 classes.'
                  : 'Xem lại cơ chế xúc xắc 20 mặt (D20), sạc chiêu D6, và 6 hệ Class.'}
              </p>
              <p className="text-[8px] text-slate-400 font-pixel">
                {isEn ? 'Tactical 1v1 turn-based RPG experience.' : 'Turn-base 1v1 đối kháng công bằng & chiến thuật.'}
              </p>
            </div>

            <PixelButton
              variant="gold"
              size="sm"
              onClick={() => setShowRules(true)}
              icon={<span>📜</span>}
            >
              {isEn ? 'OPEN RULEBOOK' : 'XEM LUẬT CHƠI CHI TIẾT'}
            </PixelButton>
          </div>
        </PixelFrame>
      </div>

      {/* Footer Credits - All 3 Auras! */}
      <div className="relative z-20 text-center pb-4">
        <div className="inline-block px-4 py-2 bg-black/80 border border-slate-700">
          <p className="text-[9px] sm:text-[10px] text-slate-300 font-pixel">
            {isEn ? 'Game created by ' : 'Game tạo bởi '}
            <span className="aura-bell font-bold px-1 py-0.5 inline-block">Bell</span>
            {', '}
            <span className="aura-snow font-bold px-1 py-0.5 inline-block">Snow</span>
            {isEn ? ' and ' : ' và '}
            <span className="aura-shiratosi font-bold px-1 py-0.5 inline-block">Shiratosi</span>
            {isEn ? ' and other contributors.' : ' và 1 số cái khác.'}
          </p>
        </div>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl my-auto">
            <PixelFrame
              variant="gold"
              title={isEn ? '📜 OFFICIAL COMBAT RULEBOOK: D20 & D6 SYSTEMS' : '📜 LUẬT CHƠI CHI TIẾT: GAME TUNG XÚC XẮC 20 MẶT (D20 & D6)'}
              headerRight={
                <button
                  onClick={() => setShowRules(false)}
                  className="text-slate-400 hover:text-white text-xs font-pixel px-2 py-1 bg-slate-800"
                >
                  ✕
                </button>
              }
            >
              <div className="text-[8.5px] sm:text-[9.5px] text-slate-300 font-pixel space-y-3 leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
                <div className="p-2 bg-yellow-950/30 border border-yellow-600/50">
                  <h4 className="text-yellow-400 font-bold mb-1">
                    {isEn ? '1. BASIC PARAMETERS:' : '1. THÔNG TIN CƠ BẢN:'}
                  </h4>
                  <p>• {isEn ? 'Genre: 1v1 Turn-Based RPG Combat' : 'Thể loại: Turn-base đối kháng 1v1.'}</p>
                  <p>• {isEn ? 'Base HP: 100 Health Points' : 'Chỉ số cơ bản: Máu (HP) gốc của nhân vật là 100.'}</p>
                  <p>• {isEn ? 'D20 Die (20 faces): Attack & Defense combat resolution' : 'Xúc xắc D20 (20 mặt): Phân định Tấn công và Phòng thủ.'}</p>
                  <p>• {isEn ? 'D6 Die (6 faces): Weapon Skill Charge accumulation' : 'Xúc xắc D6 (6 mặt): Dùng để sạc và kích hoạt Kỹ năng (Skill).'}</p>
                </div>

                <div className="p-2 bg-cyan-950/30 border border-cyan-600/50">
                  <h4 className="text-cyan-400 font-bold mb-1">
                    {isEn ? '2. D20 COMBAT RESOLUTION:' : '2. CƠ CHẾ CHIẾN ĐẤU (D20):'}
                  </h4>
                  <p>• {isEn ? 'Each turn: 1 Attacker, 1 Defender. Roles switch each turn.' : 'Trong 1 lượt: 1 người Tấn công, người còn lại Phòng thủ.'}</p>
                  <p>• {isEn ? 'Both players roll their D20.' : 'Cả 2 cùng đổ xúc xắc D20.'}</p>
                  <p>• <b>{isEn ? 'Blocked / Miss:' : 'Trường hợp 1 (Trượt/Đỡ thành công):'}</b> {isEn ? 'If Atk <= Def, no damage is dealt.' : 'Nếu D20 Công ≤ D20 Thủ → Không gây sát thương.'}</p>
                  <p>• <b>{isEn ? 'Direct Hit:' : 'Trường hợp 2 (Đánh trúng):'}</b> {isEn ? 'If Atk > Def, damage dealt = Atk - Def.' : 'Nếu D20 Công > D20 Thủ → Gây sát thương.'}</p>
                </div>

                <div className="p-2 bg-purple-950/30 border border-purple-600/50">
                  <h4 className="text-purple-400 font-bold mb-1">
                    {isEn ? '3. D6 SKILL SYSTEM:' : '3. CƠ CHẾ KỸ NĂNG & SẠC CHIÊU (D6):'}
                  </h4>
                  <p>• {isEn ? 'Each turn both players roll D6 to accumulate Charge Points.' : 'Mỗi lượt cả 2 bên cùng đổ xúc xắc D6. Điểm các mặt D6 được cộng dồn thành "Điểm sạc".'}</p>
                  <p>• <b>Skill 1 ({isEn ? 'Charge Threshold' : 'Theo mốc sạc'}):</b> {isEn ? 'Reach 15-30 charge points to cast powerful weapon skills.' : 'Đạt mốc yêu cầu (15 đến 30 điểm), người chơi được quyền dùng điểm để tung chiêu.'}</p>
                  <p>• <b>Skill 2 ({isEn ? 'Instant Face Trigger' : 'Kích hoạt đặc biệt'}):</b> {isEn ? 'Triggers immediately if your D6 roll matches the required face number!' : 'Kích hoạt ngay lập tức nếu đổ ra một con số yêu cầu cụ thể.'}</p>
                </div>

                <div className="p-2 bg-red-950/30 border border-red-600/50">
                  <h4 className="text-red-400 font-bold mb-1">
                    {isEn ? '4. THE 6 CHARACTER CLASSES:' : '4. HỆ THỐNG CLASS NGHỀ NGHIỆP:'}
                  </h4>
                  <p>• <b>Assassin:</b> +50% DMG, -25% Max HP (75 HP).</p>
                  <p>• <b>Tanker:</b> Reduces incoming damage by 30%.</p>
                  <p>• <b>Juggernaut:</b> +50% Max HP (150 HP), -25% DMG.</p>
                  <p>• <b>Mage:</b> Rolls skill D6 an extra time each turn (2 D6 rolls).</p>
                  <p>• <b>Boxer:</b> Rolls attack D20 twice and takes the higher roll.</p>
                  <p>• <b>Warrior:</b> 120 Base HP, balanced attack and defense.</p>
                </div>
              </div>

              <div className="mt-4 text-center">
                <PixelButton variant="gold" size="sm" onClick={() => setShowRules(false)}>
                  {isEn ? 'UNDERSTOOD' : 'ĐÃ HIỂU LUẬT CHƠI'}
                </PixelButton>
              </div>
            </PixelFrame>
          </div>
        </div>
      )}
    </div>
  );
}
