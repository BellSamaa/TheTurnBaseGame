# Weapon New update 1

## Mở để xem

1. Giải nén toàn bộ gói vào cùng một thư mục.
2. Mở `START_HERE.html` bằng Chrome hoặc Edge. Trang dùng ảnh và script trong thư mục, không cần Internet.
3. Chọn vũ khí ở bên trái; đọc nội tại và từng nhánh skill bên dưới.
4. Chọn skill hoặc sự kiện rồi bấm **Chạy animation**. Có tùy chọn đổi bên, tốc độ và nền sáng.
5. Các kết quả D6, proc Akai, Niko và bố trí nhiều summon có mục demo riêng trong danh sách.

## Nội dung

- **12 ảnh vũ khí mới** theo phong cách pixel của bộ mẫu; **1 ảnh Infinity Void gốc** dùng cho mục cập nhật.
- **64 hiệu ứng mới**, mỗi hiệu ứng 4 frame; **7 hiệu ứng tái dùng** từ file Skill mẫu. Tổng **71 hiệu ứng / 284 frame rời**.
- Bốn nhân vật triệu hồi riêng: Golem, Người Lửa, Nhân Ngư và Niko; có cả pose PNG và chu kỳ idle.
- `weapons.json` + `WEAPON_NEW_UPDATE_1_CHI_TIET.md`: đầy đủ 13 mục, 37 nhánh skill, nội tại, chi phí, sát thương, thời hạn, điều kiện và điểm chưa chốt.
- `abilities.json`: **62 kịch bản** minh họa kỹ năng / nhánh kết quả / sự kiện.
- `manifest.json`: source rect và metadata để dùng sheet hoặc frame rời.
- `runtime/vfx-player.js`: bộ phát hiệu ứng Canvas2D, không thay đổi gameplay.
- `docs/INTEGRATION_GUIDE_VI.md`: phân biệt bộ đếm lượt, điều kiện, triệu hồi và tích hợp renderer.

Các hình người trong demo là mốc đặt hiệu ứng, không phải bộ sprite nhân vật. Màu, tốc độ và kích thước VFX là gợi ý mỹ thuật; không dùng mili giây thay số round. Đặc tả giữ nguyên số liệu được cung cấp; những giá trị thiếu hoặc câu chữ chưa rõ được đánh dấu, không tự bổ sung luật.

## Gốc tham khảo

Ảnh mới được tạo bằng công cụ tạo ảnh, theo phong cách các vũ khí người dùng gửi. Các hiệu ứng `legacy_*` là pixel nguồn của `DiceManiac_AnimationKit_v1`, dùng để giữ các nhánh Infinity Void và tái dùng hiệu ứng phù hợp. Không thay thế hoặc chỉnh sửa file RAR gốc.

`docs/art_specifications.json` ghi mô tả tạo hình cho từng vũ khí và từng hàng hiệu ứng. `qa.json` ghi các kiểm tra dữ liệu/file và giới hạn kiểm tra. Chưa có mã game để tích hợp thực tế.
