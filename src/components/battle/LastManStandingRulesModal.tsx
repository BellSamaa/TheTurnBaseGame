'use client';

import {LMS_BUFFS,LMS_BUFF_HELP} from '@/lib/lmsBuffs';
import React from 'react';
import { motion } from 'framer-motion';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelButton from '@/components/ui/PixelButton';
import { playClickSound } from '@/lib/soundEffects';

interface LastManStandingRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom?: () => void;
  isEn?: boolean;
}

export default function LastManStandingRulesModal({
  isOpen,
  onClose,
  onCreateRoom,
  isEn = false,
}: LastManStandingRulesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 15 }}
        className="w-full max-w-2xl my-auto"
      >
        <PixelFrame
          variant="gold"
          title={isEn ? 'LAST MAN STANDING · TOURNAMENT RULES' : 'LUẬT CHƠI · ĐẤU TRƯỜNG SINH TỒN'}
          headerRight={
            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="text-slate-400 hover:text-white text-xs font-pixel px-2 py-0.5 bg-slate-900 border border-slate-700 cursor-pointer"
            >
              ✕
            </button>
          }
        >
          <div className="p-4 sm:p-5 text-left space-y-4 max-h-[75vh] overflow-y-auto text-slate-200">
            <p className="border border-amber-500 p-3 text-sm text-amber-200">Bản thử nghiệm hiện có: 3–4 người, 200 HP gốc, sát thương 15 + chênh lệch D20. Sạc D6 → dùng skill/chọn mục tiêu → Công/Thủ → 5 giây can thiệp (3 PTS đổi ±1 Công) → kết thúc lượt. Hạ gục hồi 30 HP và nhận 5 PTS. Mỗi người có 1 trong 20 buff ẩn, lật một lần đúng điều kiện. Vòng bo từ vòng 8 gây 10 HP, mỗi vòng tăng 5. Bom nổ sau 2 vòng. Buff Im Lặng cấm skill, can thiệp PTS và buff trong vòng đó.</p>
            <details><summary>Danh sách 20 buff</summary><ol>{LMS_BUFFS.map((name,i)=><li key={name}>{i+1}. {name}: {LMS_BUFF_HELP[i]}</li>)}</ol></details>{/* Header intro */}
            <div className="bg-yellow-950/40 border border-yellow-500/50 p-3 rounded text-center">
              <h3 className="text-xs sm:text-sm font-pixel text-yellow-300 font-bold mb-1">
                {isEn ? '🔥 COLOSSEUM BATTLE ROYALE (3–4 PLAYERS) 🔥' : '🔥 ĐẤU TRƯỜNG SINH TỬ VÒNG TRÒN (3–4 ĐẤU SĨ) 🔥'}
              </h3>
              <p className="text-[8.5px] sm:text-[9.5px] font-sans text-amber-200/90 leading-relaxed">
                {isEn
                  ? 'A high-intensity free-for-all arena where each warrior fights to be the ultimate survivor!'
                  : 'Chế độ sinh tồn hỗn chiến tự do trong đấu trường La Mã. Người trụ lại cuối cùng sẽ giành vương miện vô địch!'}
              </p>
            </div>

            {/* Rule 1 */}
            <div className="border-l-2 border-yellow-500 pl-3">
              <h4 className="text-[10px] sm:text-xs font-pixel text-yellow-400 font-bold mb-1">
                {isEn ? '1. PLAYER SLOTS & ROOM CODE (3–4 PLAYERS)' : '1. QUY MÔ & TẠO PHÒNG (3–4 NGƯỜI)'}
              </h4>
              <p className="text-[8.5px] sm:text-[9px] font-sans text-slate-300 leading-relaxed">
                {isEn
                  ? 'Minimum 3 players required to start, up to 4 players max. The room host can generate a 4-digit room code to invite friends or wait for challengers in the Lobby.'
                  : 'Cần tối thiểu 3 người chơi và tối đa 4 người để khai chiến. Chủ phòng tạo phòng sẽ có mã số 4 chữ số để chia sẻ cho bạn bè tham gia.'}
              </p>
            </div>

            {/* Rule 2 */}
            <div className="border-l-2 border-emerald-500 pl-3">
              <h4 className="text-[10px] sm:text-xs font-pixel text-emerald-400 font-bold mb-1">
                {isEn ? '2. BASE HP STANDARD (200 HP)' : '2. MÁU CƠ SỞ (200 HP)'}
              </h4>
              <p className="text-[8.5px] sm:text-[9px] font-sans text-slate-300 leading-relaxed">
                {isEn
                  ? 'Every warrior enters the ring with 200 base HP (Juggernaut titan starts with 300 HP, Assassin glass cannon with 150 HP).'
                  : 'Tất cả đấu sĩ khởi đầu với 200 HP máu gốc (hệ Khổng Lồ nhận 300 HP, hệ Sát Thủ nhận 150 HP).'}
              </p>
            </div>

            {/* Rule 3 */}
            <div className="border-l-2 border-red-500 pl-3">
              <h4 className="text-[10px] sm:text-xs font-pixel text-red-400 font-bold mb-1">
                {isEn ? '3. FAST-PACED COMBAT FORMULA' : '3. CƠ CHẾ SÁT THƯƠNG RÚT MÁU NHANH'}
              </h4>
              <p className="text-[8.5px] sm:text-[9px] font-sans text-slate-300 leading-relaxed">
                {isEn
                  ? 'Whenever D20 Attack > D20 Defense, the hit connects and deals: 15 Base DMG + (Atk - Def) + Class/Weapon bonus. No more endless paper cuts; each hit takes 16–25+ HP!'
                  : 'Chỉ cần số xúc xắc Công D20 > Thủ D20, đòn đánh trúng đích gây ngay: 15 Sát thương cơ sở + (D20 Công - D20 Thủ) + Hệ vũ khí. Mỗi cú đánh lấy đi 16–25+ HP, giúp trận đấu diễn ra kịch tính và dứt khoát!'}
              </p>
            </div>

            {/* Rule 4 */}
            <div className="border-l-2 border-cyan-500 pl-3">
              <h4 className="text-[10px] sm:text-xs font-pixel text-cyan-400 font-bold mb-1">
                {isEn ? '4. ROUND-ROBIN ATTACK ROTATION' : '4. THỨ TỰ LƯỢT ĐẤU XOAY VÒNG'}
              </h4>
              <p className="text-[8.5px] sm:text-[9px] font-sans text-slate-300 leading-relaxed">
                {isEn
                  ? 'Fighters stand in a circular arena. Each turn rotates to the next living player as the Attacker. The Attacker selects a target among living opponents to strike. The defender rolls D20 to protect themselves.'
                  : 'Các đấu sĩ đứng theo vòng tròn đấu trường. Lượt đánh lần lượt xoay vòng cho từng người còn sống. Người tấn công có quyền chọn 1 mục tiêu đối thủ còn sống để ra đòn. Người bị nhắm tới sẽ tung D20 Thủ.'}
              </p>
            </div>

            {/* Rule 5 */}
            <div className="border-l-2 border-purple-500 pl-3">
              <h4 className="text-[10px] sm:text-xs font-pixel text-purple-400 font-bold mb-1">
                {isEn ? '5. D6 CHARGE & D12 CHARGED SKILLS' : '5. NẠP D6 & KÍCH HOẠT KỸ NĂNG D12'}
              </h4>
              <p className="text-[8.5px] sm:text-[9px] font-sans text-slate-300 leading-relaxed">
                {isEn
                  ? 'Roll D6 each turn to accumulate skill PTS. When you have enough PTS, unleash devastating D12 skills (Skill 1 & Skill 2) to heal, pierce shields, or obliterate opponents!'
                  : 'Tung D6 mỗi hiệp để tích lũy điểm kỹ năng (PTS). Khi đủ PTS, bạn có thể kích hoạt Kỹ năng 1 hoặc 2 của vũ khí để đảo ngược cục diện!'}
              </p>
            </div>

            {/* Rule 6 */}
            <div className="border-l-2 border-amber-500 pl-3">
              <h4 className="text-[10px] sm:text-xs font-pixel text-amber-400 font-bold mb-1">
                {isEn ? '6. ELIMINATION & CHAMPION' : '6. LOẠI TRỰC TIẾP & VÔ ĐỊCH'}
              </h4>
              <p className="text-[8.5px] sm:text-[9px] font-sans text-slate-300 leading-relaxed">
                {isEn
                  ? 'Any fighter reduced to 0 HP is ELIMINATED from the arena immediately. The last warrior standing wins the battle with +35 Rank Points!'
                  : 'Bất kỳ đấu sĩ nào bị tụt hết 0 HP sẽ bị LOẠI (ELIMINATED) ngay lập tức. Người duy nhất sống sót cuối cùng là NHÀ VÔ ĐỊCH (LAST MAN STANDING) nhận +35 điểm Rank!'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center justify-end gap-2 border-t border-yellow-500/30">
              <PixelButton
                variant="frame"
                size="sm"
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="font-pixel"
              >
                {isEn ? 'CLOSE' : 'ĐÓNG'}
              </PixelButton>

              {onCreateRoom && (
                <PixelButton
                  variant="gold"
                  size="sm"
                  onClick={() => {
                    playClickSound();
                    onCreateRoom();
                  }}
                  className="font-pixel action-beacon"
                >
                  {isEn ? 'CREATE LMS ROOM (3–4P)' : 'TẠO PHÒNG SINH TỒN (3–4P)'}
                </PixelButton>
              )}
            </div>
          </div>
        </PixelFrame>
      </motion.div>
    </div>
  );
}
