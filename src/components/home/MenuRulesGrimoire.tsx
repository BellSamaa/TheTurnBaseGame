'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PixelIcon from '@/components/ui/PixelIcon';
import { playClickSound } from '@/lib/soundEffects';

interface MenuRulesGrimoireProps {
  isEn: boolean;
}

export default function MenuRulesGrimoire({ isEn }: MenuRulesGrimoireProps) {
  const [activeChapter, setActiveChapter] = useState<'basics' | 'advanced'>('basics');

  const handleTabChange = (tab: 'basics' | 'advanced') => {
    playClickSound();
    setActiveChapter(tab);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto my-4 select-none">
      {/* Outer Leather Grimoire Cover Frame with Ornate Gold Corners */}
      <div className="relative bg-[#1a1008] border-4 border-[#784d1e] shadow-[0_15px_35px_rgba(0,0,0,0.95)] p-2 sm:p-4 rounded-sm">
        {/* Ornate Brass Corner Ornaments */}
        <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-yellow-500 pointer-events-none" />
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-yellow-500 pointer-events-none" />
        <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-yellow-500 pointer-events-none" />
        <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-yellow-500 pointer-events-none" />

        {/* Top Bookmark Ribbon Tabs */}
        <div className="flex items-center justify-between px-2 sm:px-4 pb-2 border-b-2 border-[#543314]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-pixel text-yellow-400 flex items-center gap-1.5">
              <span>📖</span>
              <span className="uppercase font-bold tracking-wider">
                {isEn ? 'GRIMOIRE OF COMBAT & FATE' : 'CỔ THƯ QUY LUẬT XÚC XẮC'}
              </span>
            </span>
          </div>

          {/* Chapter Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleTabChange('basics')}
              className={`px-3 py-1 text-[8px] sm:text-[9px] font-pixel border-2 transition cursor-pointer ${
                activeChapter === 'basics'
                  ? 'bg-yellow-500 text-black border-yellow-200 font-bold shadow-[0_0_8px_#facc15]'
                  : 'bg-[#2b180d] text-slate-300 border-[#6b4221] hover:text-white'
              }`}
            >
              {isEn ? 'CHAPTER I & II: DICE LAWS' : 'CHƯƠNG I & II: LUẬT ĐẤU'}
            </button>
            <button
              onClick={() => handleTabChange('advanced')}
              className={`px-3 py-1 text-[8px] sm:text-[9px] font-pixel border-2 transition cursor-pointer ${
                activeChapter === 'advanced'
                  ? 'bg-yellow-500 text-black border-yellow-200 font-bold shadow-[0_0_8px_#facc15]'
                  : 'bg-[#2b180d] text-slate-300 border-[#6b4221] hover:text-white'
              }`}
            >
              {isEn ? 'CHAPTER III: BLOOD & WEAPONS' : 'CHƯƠNG III: HUYẾT LỆNH'}
            </button>
          </div>
        </div>

        {/* Grimoire Inner Parchment Book Layout (Two Open Pages) */}
        <div className="relative mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-[#16100a] border-2 border-[#5a381b] p-4 sm:p-6 shadow-inner">
          {/* Center Spine Divider with Crimson Silk Ribbon */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 bg-[#3a200e] shadow-[0_0_8px_rgba(0,0,0,0.8)] z-20">
            {/* Dangling Silk Ribbon */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-24 bg-red-700 shadow-md border-x border-red-900 pointer-events-none">
              <div className="absolute bottom-0 left-0 right-0 h-3 bg-yellow-500 clip-triangle" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeChapter === 'basics' ? (
              <React.Fragment key="basics">
                {/* LEFT PAGE: CHAPTER I - D20 LAW */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-3 pr-0 md:pr-4"
                >
                  <div className="flex items-center gap-2 border-b border-yellow-500/30 pb-2">
                    <span className="text-sm font-pixel text-yellow-400">§ I</span>
                    <h4 className="text-[10px] sm:text-xs font-pixel font-bold text-yellow-300 uppercase tracking-wide">
                      {isEn ? 'The Law of the D20' : 'Quy Luật Xúc Xắc D20'}
                    </h4>
                  </div>

                  <p className="text-[9px] sm:text-[9.5px] font-pixel text-amber-100/90 leading-relaxed">
                    {isEn ? (
                      <>
                        In every confrontation, destiny decides two roles: the <strong>Attacker</strong> and the <strong>Defender</strong>. Both combatants cast the sacred twenty-sided die (D20).
                      </>
                    ) : (
                      <>
                        Trong mỗi hiệp đấu, số phận phân định hai vai trò: bên <strong>Tấn Công</strong> và bên <strong>Phòng Thủ</strong>. Cả hai cùng tung viên xúc xắc 20 mặt (D20).
                      </>
                    )}
                  </p>

                  {/* Ancient Formula Parchment Tablet */}
                  <div className="bg-[#24170e] border-2 border-yellow-500/60 p-3 shadow-md flex flex-col items-center justify-center text-center gap-1.5 my-1">
                    <span className="text-[8px] font-pixel text-yellow-400 uppercase tracking-widest">
                      {isEn ? 'THE SACRED COMBAT EQUATION' : 'CÔNG THỨC SÁT THƯƠNG HUYỀN THUẬT'}
                    </span>
                    <span className="text-xs sm:text-sm font-pixel font-bold text-red-400 drop-shadow">
                      {isEn ? 'DAMAGE = ATK ROLL − DEF ROLL' : 'SÁT THƯƠNG = ĐIỂM CÔNG − ĐIỂM THỦ'}
                    </span>
                    <span className="text-[7.5px] font-pixel text-slate-400 mt-0.5">
                      {isEn ? 'If Atk ≤ Def: 0 Damage (Blocked/Missed!)' : 'Nếu Điểm Công ≤ Điểm Thủ: Đòn đánh bị chặn, 0 sát thương!'}
                    </span>
                  </div>

                  <div className="text-[8.5px] font-pixel text-amber-200/80 space-y-1 bg-black/40 p-2.5 border border-[#6b4221]">
                    <div className="flex items-start gap-1.5">
                      <span className="text-yellow-400">✦</span>
                      <span>{isEn ? 'Natural 20 (Max Face): Critical Strike!' : 'Đổ ra mặt 20: Đòn chí mạng uy lực tối đa!'}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-cyan-400">✦</span>
                      <span>{isEn ? 'Roles swap smoothly after every round ends.' : 'Vai trò Công - Thủ hoán đổi công bằng sau mỗi hiệp.'}</span>
                    </div>
                  </div>
                </motion.div>

                {/* RIGHT PAGE: CHAPTER II - D6 ARCANA */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-3 pl-0 md:pl-4"
                >
                  <div className="flex items-center gap-2 border-b border-cyan-500/30 pb-2">
                    <span className="text-sm font-pixel text-cyan-400">§ II</span>
                    <h4 className="text-[10px] sm:text-xs font-pixel font-bold text-cyan-300 uppercase tracking-wide">
                      {isEn ? 'Arcane D6 Charges & Skills' : 'Bí Thuật Sạc Năng Lượng D6'}
                    </h4>
                  </div>

                  <p className="text-[9px] sm:text-[9.5px] font-pixel text-amber-100/90 leading-relaxed">
                    {isEn ? (
                      <>
                        Alongside the battle roll, a six-sided die (D6) is cast each turn to gather <strong>Charge Points</strong>, feeding your equipped weapon's twin secret arts.
                      </>
                    ) : (
                      <>
                        Song song với D20, viên xúc xắc 6 mặt (D6) được tung mỗi hiệp nhằm tích lũy <strong>Điểm Sạc Kỹ Năng</strong> để thi triển 2 tuyệt kỹ bảo khí.
                      </>
                    )}
                  </p>

                  {/* Twin Skill Cards */}
                  <div className="space-y-2 my-1">
                    <div className="bg-[#24170e] border border-yellow-500/50 p-2.5 flex items-start gap-2 shadow">
                      <PixelIcon name="lightning" size={14} color="#facc15" />
                      <div>
                        <div className="text-[8.5px] font-pixel font-bold text-yellow-300">
                          {isEn ? 'SKILL 1: CHARGE THRESHOLD' : 'KỸ NĂNG 1: TÍCH SẠC ĐẠT MỐC'}
                        </div>
                        <div className="text-[7.5px] font-pixel text-slate-300 mt-0.5">
                          {isEn
                            ? 'Accumulate 15–30 points to cast devastating strikes, armor breaks or healing.'
                            : 'Tích đủ từ 15–30 điểm để kích hoạt đòn chém mãnh liệt, xuyên giáp hoặc hồi máu.'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#24170e] border border-cyan-500/50 p-2.5 flex items-start gap-2 shadow">
                      <PixelIcon name="sparkles" size={14} color="#38bdf8" />
                      <div>
                        <div className="text-[8.5px] font-pixel font-bold text-cyan-300">
                          {isEn ? 'SKILL 2: INSTANT FACE TRIGGER' : 'KỸ NĂNG 2: KÍCH HOẠT TỨC THÌ'}
                        </div>
                        <div className="text-[7.5px] font-pixel text-slate-300 mt-0.5">
                          {isEn
                            ? 'Triggers immediately whenever you roll your weapon’s designated lucky die face!'
                            : 'Tự động kích hoạt ngay khi xúc xắc D6 đổ trúng con số may mắn tương ứng của vũ khí!'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[8px] text-amber-200">{isEn?'Warrior: below 30% HP, +3 attack damage; +1 more per further 5% HP lost. Boxer: attack dice only.':'Warrior: dưới 30% HP, +3 sát thương; thêm +1 mỗi 5% HP mất tiếp. Boxer chỉ thêm xúc xắc Công.'}</p>{/* Wax Seal Stamp */}
                  <div className="mt-auto flex items-center justify-end gap-2 pt-2 border-t border-[#4a2e16]">
                    <div className="text-[7px] font-pixel text-amber-500/80 uppercase">
                      {isEn ? 'OFFICIAL DICE GUILD CODEX' : 'CON DẤU QUY CHUẨN HIỆP HỘI'}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-red-900 border-2 border-yellow-500 flex items-center justify-center text-[10px] shadow">
                      ⚜
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            ) : (
              <React.Fragment key="advanced">
                {/* LEFT PAGE: CHAPTER III - BLOOD & VICTORY */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-3 pr-0 md:pr-4"
                >
                  <div className="flex items-center gap-2 border-b border-red-500/30 pb-2">
                    <span className="text-sm font-pixel text-red-400">§ III</span>
                    <h4 className="text-[10px] sm:text-xs font-pixel font-bold text-red-300 uppercase tracking-wide">
                      {isEn ? 'Blood Oath & Victory Rules' : 'Huyết Mệnh & Quy Tắc Sinh Tử'}
                    </h4>
                  </div>

                  <p className="text-[9px] sm:text-[9.5px] font-pixel text-amber-100/90 leading-relaxed">
                    {isEn ? (
                      <>
                        Every duelist enters the arena with <strong>100 Base HP (150 in LMS)</strong> (modified by your tactical class archetype 75–150 HP in duels, 113–225 HP in LMS).
                      </>
                    ) : (
                      <>
                        Mọi đấu sĩ bước vào đấu trường với <strong>100 HP gốc (150 trong LMS)</strong> (được gia giảm tùy theo hệ nghề chiến đấu 75–150 HP khi đấu đôi, 113–225 HP trong LMS).
                      </>
                    )}
                  </p>

                  <div className="bg-[#24170e] border border-red-500/50 p-3 shadow-md flex items-center gap-3 my-1">
                    <div className="w-10 h-10 bg-red-950/80 border border-red-400 flex items-center justify-center shrink-0">
                      <PixelIcon name="heart" size={20} color="#ef4444" />
                    </div>
                    <div>
                      <div className="text-[9px] font-pixel font-bold text-red-300">
                        {isEn ? 'ABSOLUTE VICTORY' : 'CHIẾN THẮNG TUYỆT ĐỐI'}
                      </div>
                      <div className="text-[8px] font-pixel text-slate-300 mt-1">
                        {isEn
                          ? 'The first champion to reduce their rival’s HP to 0 claims triumph and rating points.'
                          : 'Đấu sĩ đầu tiên triệt hạ toàn bộ thanh máu đối thủ về 0 sẽ giành chiến thắng vinh quang.'}
                      </div>
                    </div>
                  </div>

                  <div className="text-[8.5px] font-pixel text-amber-200/80 space-y-1 bg-black/40 p-2.5 border border-[#6b4221]">
                    <div className="flex items-start gap-1.5">
                      <span className="text-yellow-400">✦</span>
                      <span>{isEn ? 'Tanker: Reduces all incoming damage by 30%.' : 'Đỡ Đòn: Giảm trừ vĩnh viễn 30% sát thương phải chịu.'}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-red-400">✦</span>
                      <span>{isEn ? 'Assassin: Deals +50% lethality but has 75 HP.' : 'Sát Thủ: Tăng 50% sát thương nhưng chỉ có 75 HP.'}</span>
                    </div>
                  </div>
                </motion.div>

                {/* RIGHT PAGE: CHAPTER IV - ARENAS & REALMS */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-3 pl-0 md:pl-4"
                >
                  <div className="flex items-center gap-2 border-b border-yellow-500/30 pb-2">
                    <span className="text-sm font-pixel text-yellow-400">§ IV</span>
                    <h4 className="text-[10px] sm:text-xs font-pixel font-bold text-yellow-300 uppercase tracking-wide">
                      {isEn ? 'Tactical Masteries' : 'Kỳ Phổ Chiến Thuật'}
                    </h4>
                  </div>

                  <p className="text-[9px] sm:text-[9.5px] font-pixel text-amber-100/90 leading-relaxed">
                    {isEn ? (
                      <>
                        Mastering the synergy between your <strong>Character Class</strong>, <strong>Equipped Weapon</strong>, and dice probabilities is the path to legendary status.
                      </>
                    ) : (
                      <>
                        Bí quyết chinh phục đỉnh cao nằm ở việc kết hợp hài hòa giữa <strong>Hệ Nghề</strong>, <strong>Bảo Khí</strong> và tính toán xác suất đổ xúc xắc.
                      </>
                    )}
                  </p>

                  <div className="space-y-2 my-1 text-[8px] font-pixel text-slate-300">
                    <div className="bg-[#24170e] border border-purple-500/50 p-2 flex items-center justify-between">
                      <span className="text-purple-300">{isEn ? 'Mage Dual Arcana:' : 'Pháp Sư Bí Thuật:'}</span>
                      <span className="text-yellow-300">{isEn ? '50% chance for +1 D6 each turn' : '50% cơ hội thêm 1 lần D6 mỗi lượt'}</span>
                    </div>
                    <div className="bg-[#24170e] border border-emerald-500/50 p-2 flex items-center justify-between">
                      <span className="text-emerald-300">{isEn ? 'Boxer Advantage:' : 'Võ Sĩ Quyền Cước:'}</span>
                      <span className="text-yellow-300">{isEn ? 'Rolls 2x D20 (Picks Higher)' : 'Tung 2 viên D20 (chọn số to)'}</span>
                    </div>
                  </div>

                  {/* Wax Seal Stamp */}
                  <div className="mt-auto flex items-center justify-end gap-2 pt-2 border-t border-[#4a2e16]">
                    <div className="text-[7px] font-pixel text-amber-500/80 uppercase">
                      {isEn ? 'SEAL OF THE HIGH MASTERS' : 'DẤU NIÊM PHONG ĐẠI SƯ'}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-purple-900 border-2 border-yellow-500 flex items-center justify-center text-[10px] shadow">
                      ★
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
