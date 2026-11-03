# Dice Maniac Character Kit v2

Đây là bộ sprite MỚI, dựng trực tiếp trên cùng lưới pixel, không phải bản sửa pixel của bộ v1. Phong cách đơn giản hơn để ưu tiên khả năng ghép chính xác.

## Dùng nhanh
Mở preview.html bằng Chrome/Edge. Trang này nhúng toàn bộ sprite, không cần server hoặc mạng. Chọn thân, tóc, mặt, áo, quần, phụ kiện và màu; có thể tải PNG ghép.

## Quy tắc tích hợp
- Canvas logic của MỌI layer là 64×96; đặt mọi layer ở (0,0).
- Không trim riêng, không object-fit hay scale riêng từng món. Chỉ scale nhân vật đã ghép bằng nearest-neighbor.
- Chọn đúng thư mục male_1..4 hoặc female_1..4 cho áo, quần và phụ kiện. Các biến thể này được dựng theo hình học của thân tương ứng.
- Thứ tự layer trong manifest.json: accessory_back, hair_back, body, pants, shirt, face, hair_front, accessory_front.
- Tất cả điểm mắt, đầu và chân chung nhau; xem anchors trong manifest.json.
- Đổi màu bằng nhân màu theo độ sáng; giữ nguyên pixel viền tối và alpha. preview.html chứa mã tham khảo.
- Dùng CharacterRenderer chung cho preview và trận đấu.
- 20 phụ kiện bao gồm các kiểu kính, khuyên, khăn, mũ, tai nghe, vương miện, băng đầu, bịt mắt, khẩu trang, dây chuyền, nơ, balô, vòng tay và túi đeo hông.

## Giới hạn
- Chỉ tư thế đứng chính diện; chưa có animation đi/chém hoặc góc nghiêng.
- Các dạng thân nữ/nam là cách điệu; khác biệt hình thể được thể hiện bằng đường eo, không phải ảnh giải phẫu.
- Mỗi lần chọn 1 áo, 1 quần, 1 phụ kiện. Không hỗ trợ chồng nhiều phụ kiện cùng lúc.
- Một số phụ kiện chủ động che tóc/mặt (mũ, khẩu trang, bịt mắt). Đây là hành vi thiết kế.
- Thân có đồ lót nền; áo hở và quần ngắn không loại bỏ đồ lót nền.
- Đây là bộ khởi đầu code-native, không tái tạo toàn bộ mức chi tiết mỹ thuật của bộ v1.

## Kiểm tra
qa.json ghi số file và kiểm tra kỹ thuật: canvas, alpha nhị phân, không chạm biên. preview_32_combinations.png là 32 tổ hợp mẫu; không đại diện kiểm duyệt mọi tổ hợp có thể có.
