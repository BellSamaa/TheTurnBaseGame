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
                  🇻🇳 VIETNAMESE
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
                  <p>• {isEn ? 'Base HP: 200 (Rank / PvP); 100 in PvE; 150 in LMS' : 'Chỉ số cơ bản: Máu gốc 200 (Rank / PvP); PvE 100; LMS 150.'}</p>
                  <p>• {isEn ? 'D20 Die (20 faces): Attack & Defense combat resolution' : 'Xúc xắc D20 (20 mặt): Phân định Tấn công và Phòng thủ.'}</p>
                  <p>• {isEn ? 'D6 Die (6 faces): Weapon Skill Charge accumulation' : 'Xúc xắc D6 (6 mặt): Dùng để sạc và kích hoạt Kỹ năng (Skill).'}</p>
                </div>

                <div className="p-2 bg-cyan-950/30 border border-cyan-600/50">
                  <h4 className="text-cyan-400 font-bold mb-1">
                    {isEn ? '2. D20 COMBAT RESOLUTION:' : '2. CƠ CHẾ CHIẾN ĐẤU (D20):'}
                  </h4>
                  <p>• {isEn ? 'Each turn: 1 Attacker, 1 Defender. Roles switch each turn.' : 'Trong 1 lượt: 1 người Tấn công, người còn lại Phòng thủ.'}</p>
                  <p>• {isEn ? 'D20 ATK → D20 DEF → D6 ATK → D6 DEF → SKILL USING.' : 'D20 Công → D20 Thủ → D6 Công → D6 Thủ → Dùng kỹ năng.'}</p>
                  <p>• {isEn ? 'A normal hit deals ATK − DEF when ATK is higher, before class and weapon effects.' : 'Đòn thường gây sát thương bằng Công − Thủ khi Công cao hơn, sau đó tính hiệu ứng class và vũ khí.'}</p>
                  <p>• <b>Clashing</b> · {isEn ? 'Equal D20 rolls from 1–19 deal ⅔ of the roll. Both sides have 5s to wager 0–3 PTS. Base odds are 65% ATK and 35% DEF. Each PTS shifts the odds 10 percentage points toward that side.' : 'Hai bên tung bằng nhau từ 1–19 thì va chạm gây ⅔ số đã tung. Hai bên có 5 giây cược 0–3 PTS. Tỷ lệ gốc Công 65%, Thủ 35%. Mỗi PTS dịch tỷ lệ 10 điểm phần trăm về phía bên cược.'}</p>
                  <p>• <b>Super Strong</b> · {isEn ? '+10 PTS for ATK ahead by over 15 or DEF ahead by at least 15.' : '+10 PTS nếu Công hơn Thủ trên 15 hoặc Thủ hơn Công ít nhất 15.'}</p>
                  <p>• <b>{isEn?'Critical Hit':'Chí mạng'}</b> · {isEn ? 'D20 ATK 20 can bypass the defense roll for 20 damage. Base chance 50%, Mythic 60%, Secret 75%.' : 'D20 Công 20 có thể xuyên điểm Thủ để gây 20 sát thương. Tỷ lệ gốc 50%, Mythic 60%, Secret 75%.'}</p>
                  <p>• <b>Too Lucky / Too Unlucky</b> · {isEn ? 'After 3 consecutive wins or losses on attack dice, a 50% chance adds a die and keeps the lower or higher result. The penalty lasts one attack, and the boost lasts until ATK beats DEF.' : 'Sau 3 lượt Công liên tiếp thắng hoặc thua điểm Thủ, có 50% cơ hội tung thêm một viên và lấy số thấp hơn hoặc cao hơn tương ứng. Hiệu ứng giảm kéo dài một lượt Công, hiệu ứng tăng giữ đến khi Công vượt Thủ.'}</p>
                </div>

                <div className="p-2 bg-purple-950/30 border border-purple-600/50">
                  <h4 className="text-purple-400 font-bold mb-1">
                    {isEn ? '3. D6 SKILL SYSTEM:' : '3. CƠ CHẾ KỸ NĂNG & SẠC CHIÊU (D6):'}
                  </h4>
                  <p>• {isEn ? 'Each turn both players roll D6 to accumulate Charge Points.' : 'Mỗi lượt cả 2 bên cùng đổ xúc xắc D6. Điểm các mặt D6 được cộng dồn thành "Điểm sạc".'}</p>
                  <p>• <b>Skill 1 ({isEn ? 'Charge Threshold' : 'Theo mốc sạc'}):</b> {isEn ? 'Meet the displayed PTS cost and weapon conditions, then click to cast.' : 'Đủ PTS và điều kiện hiển thị của vũ khí, rồi bấm dùng kỹ năng.'}</p>
                  <p>• <b>Skill 2 ({isEn ? 'Shared PTS' : 'Dùng chung PTS'}):</b> {isEn ? 'Click to cast after both D6 rolls. Both skills spend the same PTS pool; each can be used once per round.' : 'Bấm dùng sau khi hai bên tung D6. Hai kỹ năng trừ chung PTS; mỗi kỹ năng dùng một lần mỗi vòng.'}</p>
                </div>

                <div className="p-2 bg-red-950/30 border border-red-600/50">
                  <h4 className="text-red-400 font-bold mb-1">
                    {isEn ? '4. THE 6 CHARACTER CLASSES:' : '4. HỆ THỐNG CLASS NGHỀ NGHIỆP:'}
                  </h4>
                  <p>• <b>Assassin:</b> +50% DMG, -25% Max HP (PvP/Rank 150 HP; PvE 75; LMS 113).</p>
                  <p>• <b>Tanker:</b> Reduces incoming damage by 30%.</p>
                  <p>• <b>Juggernaut:</b> +50% Max HP (PvP/Rank 300 HP; PvE 150; LMS 225), -25% DMG.</p>
                  <p>• <b>Mage:</b> {isEn?'55% chance for one additional D6 each turn.':'55% cơ hội tung thêm một D6 mỗi lượt.'}</p>
                  <p>• <b>Boxer:</b> Rolls attack D20 twice and takes the higher roll.</p>
                  <p>• <b>Warrior:</b> {isEn?'PvP/Rank 200 base HP; PvE 100; LMS 150. Below 30% HP: +3 damage, +1 more per further 5% HP lost.':'PvP/Rank 200 HP gốc; PvE 100; LMS 150. Dưới 30% HP: +3 sát thương, thêm +1 mỗi 5% HP mất tiếp.'}</p>
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
