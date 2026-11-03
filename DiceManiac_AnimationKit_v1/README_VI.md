# DiceManiac Animation Kit v1

## Bắt đầu
1. Giải nén toàn bộ folder.
2. Mở `preview.html` bằng Chrome/Edge. Không cần cài thư viện hoặc mạng.
3. Chọn chiêu/nhánh, bấm Chạy animation. Có tốc độ, đổi bên công/thủ, Rock lăn ngược và nền sáng để quan sát mép ảnh.
4. Gửi folder này cho Antigravity và yêu cầu đọc `ANTIGRAVITY_PROMPT.md` đầy đủ trước khi sửa game.

## File
- `ANTIGRAVITY_PROMPT.md`: prompt chi tiết 9 vũ khí, từng nhánh, activation, vị trí, timeline, rules chưa rõ và checklist tích hợp.
- `abilities.json`: 25 kịch bản chiêu/nhánh + 4 sự kiện phụ =29. Cue gồm thời điểm, effectId, anchor, quỹ đạo và kích thước gợi ý.
- `manifest.json`: 32 hiệu ứng, source rect của128 frame, pivot, hướng nguồn và đường dẫn.
- `frames/<effectId>/0.png..3.png`: 128 ảnh frame cắt riêng, không trim từng hình để tránh thay đổi gốc do trim.
- `sheets/`: 8 ảnh nguồn. Dùng sheet+manifest HOẶC frame riêng, không đưa cả sheet lên sàn đấu.
- `ui/skill_1.png`, `ui/skill_2.png`: hai nút riêng có chữ.
- `runtime/vfx-player.js`: renderer Canvas2D dùng delta time, sprite frames, trajectory, pivot, mirror, loop, cleanup.
- `docs/INTEGRATION_EXAMPLE.md`: cách preload, spawn, bám anchor, quản lý status, hủy khi Chronos đổi revision.
- `docs/EFFECT_MAP.csv`: danh mục hàng và ID.
- `qa.json`: kết quả kiểm tra máy và phạm vi chưa kiểm tra.

## Cách hiểu demo
Các hình người đơn giản là mốc đặt VFX, không phải CharacterKit. Người dùng chiêu bên trái, mục tiêu bên phải; có nút đổi bên. Targets AoE được biểu diễn bằng thêm VFX mẫu, không mô phỏng đầy đủ hệ nhiều người.

Demo hiển thị quá trình thành công của chiêu, không mô phỏng hit/block/dodge/immune của combat engine. Nhánh reroll, snapshot restore, extra D6, damage tick và summon thường trực cần tích hợp game theo prompt.

Hiệu ứng kéo và lunge của cơ thể chưa được thực hiện bởi renderer VFX này. Ném Dragon Dagger cần sprite vũ khí của dự án; trong demo chỉ có phần va chạm/lửa. Entity Pet Rock thường trực cần sprite pet riêng. Trạng thái trong demo tạm tắt sau2.5giây để xem mẫu, trong game phải theo events và số lượt.

## Phạm vi hình ảnh
Frame được cắt theo lưới4×4 từ ảnh nguồn AI, giữ nguyên pixel nguồn. Không tuyên bố đã sửa tất cả hạt sáng sát mép, căn pivot hoàn hảo hoặc animation mượt như bộ vẽ tay. Dùng nền sáng/tối trong preview để rà mép, chỉnh rect/offset khi cần. Tốc độ và size trong kit là đề xuất trình diễn; không phải gameplay rules.

Không có code dự án Dice Maniac được cung cấp trong phiên này; kit chưa được tích hợp hoặc kiểm tra trong game thật. Xem qa.json để phân biệt kiểm tra renderer với kiểm tra trình duyệt/game.
