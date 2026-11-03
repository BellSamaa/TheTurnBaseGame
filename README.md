# 🎲 DICE MANIAC - The Turn-Base RPG Game (Game Tung Xúc Xắc 20 Mặt)

> Game Turn-Base RPG Fantasy 1v1 đỉnh cao với đồ họa Pixel Art, cơ chế xúc xắc 3D D20 & D6, hiệu ứng tuyệt kỹ sống động và hỗ trợ chơi mạng Realtime qua Supabase!

Game tạo bởi **<span style="color:#ff4444">Bell</span>**, **<span style="color:#ffffff">Snow</span>** và **<span style="color:#ffd700">Shiratosi</span>** và 1 số cái khác.

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Giao Diện RPG Fantasy Pixel Chuẩn Mực:**
   - Sử dụng toàn bộ bộ Frame UI 16-bit, viền vàng hoàng gia, viền lam ngọc, hiệu ứng sparkle lấp lánh và font chữ Pixel `Press Start 2P`.
   - Ảnh nền trang chủ lấy từ bìa game `Background.png`, logo chính thức `Logo DICE MANIAC pixel cầu vồng`.
   - Footer chú thích với màu chữ tùy biến và hiệu ứng lấp lánh (Shiratosi).

2. **Hệ Thống Tùy Biến Nhân Vật (Character Studio):**
   - 8 khuôn mẫu nhân vật RPG pixel nền trong suốt.
   - Thay đổi màu da (Skin Tone), màu tóc (Hair Color) và màu quần áo (Outfit Color) theo bảng mã màu đa dạng.
   - Tùy chọn 12 kiểu tóc, 20 mẫu áo giáp RPG, quần và 10 biểu cảm khuôn mặt.

3. **Cơ Chế Chiến Đấu Xúc Xắc 3D (3D Dice Physics & Rolling):**
   - Tích hợp mô hình 3D thực tế GLB của **D20** (`dice_d20.glb`) và **D6** (`dice_d6.glb`).
   - Hiệu ứng xoay tròn, tung lộn nhào sống động như tung xúc xắc trên bàn cờ thật.

4. **Luật Chơi Đối Kháng 1v1 (Chi Tiết Chuẩn Quy Tắc):**
   - **Máu gốc (HP):** 100 HP (có điều chỉnh theo Class).
   - **Xúc xắc D20 (Công / Thủ):**
     - Mỗi lượt 1 người Công, 1 người Thủ; cả hai cùng đổ D20.
     - Nếu Công ≤ Thủ: Phòng thủ thành công (0 sát thương).
     - Nếu Công > Thủ: Đánh trúng, Sát thương = Công - Thủ (nhân chỉ số Class).
   - **Xúc xắc D6 (Sạc & Tuyệt Kỹ Vũ Khí):**
     - Mỗi lượt cả hai bên đổ D6 để cộng dồn vào "Điểm sạc".
     - **Skill 1 (Theo mốc sạc 15 - 30 điểm):** Đủ điểm là người chơi có quyền kích hoạt tuyệt kỹ tối thượng!
     - **Skill 2 (Kích hoạt đặc biệt):** Kích hoạt lập tức khi đổ xúc xắc ra con số yêu cầu cụ thể của từng loại vũ khí!

5. **6 Hệ Class Nghề Nghiệp Độc Đáo:**
   - **Assassin (Sát Thủ):** Tăng 50% sát thương gây ra, giảm 1/4 HP tối đa (75 HP).
   - **Tanker (Đỡ Đòn):** Giáp dày giảm 30% toàn bộ sát thương nhận vào (100 HP).
   - **Juggernaut (Khổng Lồ):** Tăng 50% HP tối đa (150 HP), giảm 25% sát thương gây ra.
   - **Mage (Pháp Sư):** Tung xúc xắc D6 thêm 1 lần mỗi lượt (2 lần D6 sạc siêu nhanh).
   - **Boxer (Võ Sĩ):** Tung xúc xắc tấn công D20 2 lần và lấy kết quả lớn hơn!
   - **Warrior (Chiến Binh):** HP gốc 120, chiến đấu toàn diện cân bằng.

6. **9 Bảo Khí Huyền Thoại (Weapons Gallery):**
   - Đại Kiếm Bạc Hai Tay (Silver Greatsword)
   - Cung Gỗ Cong Tên Đỏ (Curved Wood Bow)
   - Dao Găm Rồng Lửa Xanh (Dragon Dagger)
   - Súng Lục Bạc Sáu Ổ Đạn (Six-Chamber Revolver)
   - Trượng Gỗ Phép Ngọc Lam (Arcane Staff)
   - Vòng Vô Cực Hư Không (Infinity Void Ring)
   - Đá Linh Thú Giận Dữ (Spirit Stone)
   - Đồng Hồ Bỏ Túi Chronos (Chronos Pocket Watch)
   - Băng Đô Lá Hắc Hỏa (Fire Headband)

7. **9 Đấu Trường Chiến Địa (Map Arenas):**
   - Lâu Đài Dưới Trăng, Sân Thượng Cyberpunk, Rừng Cổ, Đấu Trường Băng Cực Quang, Thảo Nguyên Cối Xay Gió, Đảo Bay Mây Hồng, Đầm Lầy Phát Quang, Biển Dung Nham Bazan, Sa Mạc Hoàng Hôn.

8. **Âm Thanh & Nhạc Nền Hoàn Chỉnh:**
   - Nhạc nền Lobby: `BackgroundMusic.mp3`.
   - Nhạc chiến đấu: Random 1 trong 4 bản Battle Music (`BatteMusic1` đến `BattleMusic4`).
   - Tùy chỉnh âm lượng BGM / SFX và bật/tắt tiếng trong Cài Đặt.

9. **Chơi Online & Chơi Cùng Bạn Bè:**
   - Đấu với Máy (PvE AI thông minh).
   - Chơi 2 người trên cùng 1 máy (Pass & Play).
   - Tạo phòng / Vào phòng chơi Online qua Supabase Realtime (đã kèm sẵn mã SQL).

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### 1. Khởi chạy máy chủ phát triển (Development)
```bash
cd game
npm run dev
```
Mở trình duyệt tại: `http://localhost:3000`

### 2. Build ứng dụng sản xuất (Production Build)
```bash
cd game
npm run build
npm run start
```

---

## 🗄️ CẤU HÌNH SUPABASE CHO MULTIPLAYER ONLINE

1. Tạo dự án mới tại [Supabase](https://supabase.com).
2. Vào **SQL Editor**, mở file `supabase-setup.sql` trong thư mục này và chạy toàn bộ mã SQL.
3. Tạo file `game/.env.local` và điền:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## ☁️ HƯỚNG DẪN DEPLOY LÊN VERCEL

1. Đẩy mã nguồn lên GitHub.
2. Truy cập [Vercel](https://vercel.com) -> **Add New Project** -> Chọn repository.
3. Cấu hình Vercel:
   - **Root Directory:** `game` (hoặc để mặc định theo `vercel.json`).
   - Thêm biến môi trường (nếu dùng Supabase): `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Bấm **Deploy** và trải nghiệm game online cùng bạn bè!
