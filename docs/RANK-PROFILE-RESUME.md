# Điểm thắng Rank

Mỗi trận thắng nhận điểm theo Rank tại thời điểm chốt kết quả:

| Rank hiện tại | RP/sao | Tỷ lệ sao/trận thắng | RP thắng |
|---|---:|---:|---:|
| Đồng | 100 | 100% | 100 |
| Sắt | 150 | 100% | 150 |
| Vàng | 220 | 90% | 198 |
| Kim Cương | 320 | 80% | 256 |
| Bạch Kim | 450 | 60% | 270 |
| Huyền Thoại Xúc Sắc | 650 | 50% | 325 |
| Xúc Sắc Hoàng Kim | 900 | 10% | 90 |
| Vua trò chơi | 1300 | 10% | 130 |

Điểm thua vẫn dùng công thức Elo hiện tại. Thưởng Gem/Ruby/EXP không thay đổi. Không cộng lại điểm cho kết quả trận đã chốt.

Chạy `sql/20261105-rank-gains-profile.sql` sau các migration progression cũ. Không reset dữ liệu tài khoản hoặc điểm đã có.

Display Callsign lưu ở `users.username`; Bio lưu ở `users.bio`. Form chỉ báo thành công khi API lưu thành công. Đổi Callsign cũng đổi tên đăng nhập bằng username hiện tại.

F5 trong trận online sẽ kết nối lại bằng mã phòng và tài khoản hiện tại, tải trạng thái mới nhất từ server. PvE mở lại run lưu trên server. Trận phải còn tồn tại và tài khoản vẫn còn trong danh sách người tham gia. Reset không tạm dừng các bộ đếm của trận.
