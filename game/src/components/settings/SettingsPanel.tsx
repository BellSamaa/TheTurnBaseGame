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
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center p-3 sm:p-6 overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/background.png"
          alt="Settings Background"
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
          {t('settings', lang)}
        </h2>

        <div className="w-16" />
      </div>

      {/* Main Settings Body */}
      <div className="relative z-20 w-full max-w-3xl my-auto flex flex-col gap-4 py-4">
        {/* Audio & Sound Settings */}
        <PixelFrame variant="gold" title="🔊 CÀI ĐẶT ÂM THANH & NHẠC NỀN">
          <div className="flex flex-col gap-4 p-2">
            {/* Music Volume */}
            <div>
              <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1.5">
                <span className="text-yellow-300 font-bold flex items-center gap-1.5">
                  <span>🎵</span> {t('musicVolume', lang)}:
                </span>
                <span className="text-cyan-300 font-bold">
                  {settings.musicMuted ? 'TẮT (MUTED)' : `${Math.round(settings.musicVolume * 100)}%`}
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
                  {settings.musicMuted ? 'BẬT' : 'TẮT'}
                </PixelButton>
              </div>
            </div>

            {/* SFX Volume */}
            <div>
              <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1.5">
                <span className="text-yellow-300 font-bold flex items-center gap-1.5">
                  <span>💥</span> {t('sfxVolume', lang)}:
                </span>
                <span className="text-cyan-300 font-bold">
                  {settings.sfxMuted ? 'TẮT (MUTED)' : `${Math.round(settings.sfxVolume * 100)}%`}
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
                  {settings.sfxMuted ? 'BẬT' : 'TẮT'}
                </PixelButton>
              </div>
            </div>
          </div>
        </PixelFrame>

        {/* Language & Profile Settings */}
        <PixelFrame variant="cyan" title="🌐 NGÔN NGỮ & THÔNG TIN NGƯỜI CHƠI">
          <div className="flex flex-col gap-4 p-2">
            {/* Language Switch */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-yellow-300 font-bold">
                {t('language', lang)}:
              </span>
              <div className="flex gap-2">
                <PixelButton
                  variant={settings.language === 'vi' ? 'gold' : 'frame'}
                  size="sm"
                  onClick={() => updateSettings({ language: 'vi' })}
                >
                  🇻🇳 TIẾNG VIỆT
                </PixelButton>
                <PixelButton
                  variant={settings.language === 'en' ? 'gold' : 'frame'}
                  size="sm"
                  onClick={() => updateSettings({ language: 'en' })}
                >
                  🇬🇧 ENGLISH
                </PixelButton>
              </div>
            </div>

            {/* Display Name */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] sm:text-xs text-yellow-300 font-bold whitespace-nowrap">
                TÊN HIỂN THỊ:
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
                  {savedNotify ? 'ĐÃ LƯU' : 'LƯU'}
                </PixelButton>
              </div>
            </div>
          </div>
        </PixelFrame>

        {/* Game Rules & Credits */}
        <PixelFrame variant="purple" title="📖 LUẬT CHƠI & TÁC GIẢ">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2">
            <div>
              <p className="text-[10px] text-slate-300 mb-1">
                Xem lại cơ chế xúc xắc 20 mặt (D20), sạc chiêu D6, và 6 hệ Class.
              </p>
              <p className="text-[9px] text-slate-400">
                Turn-base 1v1 đối kháng công bằng & chiến thuật.
              </p>
            </div>

            <PixelButton
              variant="gold"
              size="sm"
              onClick={() => setShowRules(true)}
              icon={<span>📜</span>}
            >
              XEM LUẬT CHƠI CHI TIẾT
            </PixelButton>
          </div>
        </PixelFrame>
      </div>

      {/* Footer Credits */}
      <div className="relative z-20 text-center pb-4">
        <p className="text-[9px] sm:text-[10px] text-slate-400 font-pixel">
          Game tạo bởi <span className="author-bell">Bell</span>,{' '}
          <span className="author-snow">Snow</span> và{' '}
          <span className="sparkle-shiratosi">Shiratosi</span> và 1 số cái khác
        </p>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl my-auto">
            <PixelFrame
              variant="gold"
              title="📜 LUẬT CHƠI CHI TIẾT: GAME TUNG XÚC XẮC 20 MẶT (D20 & D6)"
              headerRight={
                <button
                  onClick={() => setShowRules(false)}
                  className="text-slate-400 hover:text-white text-xs font-pixel px-2 py-1 bg-slate-800"
                >
                  ✕
                </button>
              }
            >
              <div className="text-[9px] sm:text-[10px] text-slate-300 space-y-3 leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
                <div className="p-2 bg-yellow-950/30 border border-yellow-600/50">
                  <h4 className="text-yellow-400 font-bold mb-1">1. THÔNG TIN CƠ BẢN:</h4>
                  <p>• Thể loại: Turn-base đối kháng 1v1.</p>
                  <p>• Chỉ số cơ bản: Máu (HP) gốc của nhân vật là 100.</p>
                  <p>• Xúc xắc D20 (20 mặt): Phân định Tấn công và Phòng thủ.</p>
                  <p>• Xúc xắc D6 (6 mặt): Dùng để sạc và kích hoạt Kỹ năng (Skill).</p>
                </div>

                <div className="p-2 bg-cyan-950/30 border border-cyan-600/50">
                  <h4 className="text-cyan-400 font-bold mb-1">2. CƠ CHẾ CHIẾN ĐẤU (D20):</h4>
                  <p>• Trong 1 lượt: 1 người Tấn công, người còn lại Phòng thủ.</p>
                  <p>• Cả 2 cùng đổ xúc xắc D20.</p>
                  <p>• <b>Trường hợp 1 (Trượt/Đỡ thành công):</b> Nếu D20 Công ≤ D20 Thủ → Không gây sát thương.</p>
                  <p>• <b>Trường hợp 2 (Đánh trúng):</b> Nếu D20 Công &gt; D20 Thủ → Gây sát thương.</p>
                  <p>• <b>Trừ máu:</b> Sát thương = D20 Công - D20 Thủ (áp dụng thêm bổ trợ của Class).</p>
                </div>

                <div className="p-2 bg-purple-950/30 border border-purple-600/50">
                  <h4 className="text-purple-400 font-bold mb-1">3. CƠ CHẾ KỸ NĂNG & SẠC CHIÊU (D6):</h4>
                  <p>• Mỗi lượt cả 2 bên cùng đổ xúc xắc D6. Điểm các mặt D6 được cộng dồn thành "Điểm sạc".</p>
                  <p>• <b>Skill 1 (Theo mốc sạc):</b> Đạt mốc yêu cầu (15 đến 30 điểm), người chơi được quyền dùng điểm để tung chiêu.</p>
                  <p>• <b>Skill 2 (Kích hoạt đặc biệt):</b> Kích hoạt ngay lập tức nếu đổ ra một con số yêu cầu cụ thể.</p>
                </div>

                <div className="p-2 bg-red-950/30 border border-red-600/50">
                  <h4 className="text-red-400 font-bold mb-1">4. HỆ THỐNG CLASS NGHỀ NGHIỆP:</h4>
                  <p>• <b>Assassin:</b> +50% sát thương gây ra, giảm 1/4 HP tối đa (còn 75 HP).</p>
                  <p>• <b>Tanker:</b> Giảm 30% toàn bộ sát thương nhận vào.</p>
                  <p>• <b>Juggernaut:</b> +50% HP tối đa (lên 150 HP), giảm 1/4 sát thương gây ra.</p>
                  <p>• <b>Mage:</b> Được phép tung xúc xắc skill (D6) thêm 1 lần (2 lần D6/lượt).</p>
                  <p>• <b>Boxer:</b> Tung xúc xắc tấn công D20 2 lần sau đó lấy kết quả to hơn.</p>
                  <p>• <b>Warrior:</b> HP gốc 120, tấn công cân bằng và ổn định.</p>
                </div>
              </div>

              <div className="mt-4 text-center">
                <PixelButton variant="gold" size="sm" onClick={() => setShowRules(false)}>
                  ĐÃ HIỂU LUẬT CHƠI
                </PixelButton>
              </div>
            </PixelFrame>
          </div>
        </div>
      )}
    </div>
  );
}
