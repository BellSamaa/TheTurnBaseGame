# Điểm thắng Rank

Mỗi trận thắng nhận điểm theo Rank tại thời điểm chốt kết quả:

| Rank hiện tại | RP/sao | Tỷ lệ sao/trận thắng | RP thắng |
|---|---:|---:|---:|
| Đồng | 100 | 100% | 100 |
| Sắt | 150 | 100% của 100 RP | 100 |
| Vàng | 220 | 90% của 100 RP | 90 |
| Kim Cương | 320 | 80% của 100 RP | 80 |
| Bạch Kim | 450 | 60% của 100 RP | 60 |
| Huyền Thoại Xúc Sắc | 650 | 50% của 100 RP | 50 |
| Xúc Sắc Hoàng Kim | 900 | 10% của 100 RP | 10 |
| Vua trò chơi | 1300 | 10% của 100 RP | 10 |

Điểm thua vẫn dùng công thức Elo hiện tại. Thưởng Gem/Ruby/EXP không thay đổi. Không cộng lại điểm cho kết quả trận đã chốt.

Chạy `sql/20261105-rank-gains-profile.sql` sau các migration progression cũ. Không reset dữ liệu tài khoản hoặc điểm đã có.

Display Callsign lưu ở `users.username`; Bio lưu ở `users.bio`. Form chỉ báo thành công khi API lưu thành công. Đổi Callsign cũng đổi tên đăng nhập bằng username hiện tại.

F5 trong trận online sẽ kết nối lại bằng mã phòng và tài khoản hiện tại, tải trạng thái mới nhất từ server. PvE mở lại run lưu trên server. Trận phải còn tồn tại và tài khoản vẫn còn trong danh sách người tham gia. Reset không tạm dừng các bộ đếm của trận.

Cập nhật: dùng sql/20261105-chat-rank-correction.sql cho mức điểm thắng tính theo gốc cố định 100 RP và dọn chat khi lobby hết người. Giá RP mỗi sao vẫn giữ bảng hiện tại.
