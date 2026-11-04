DICE MANIAC — BỘ MÔ HÌNH 3D LOW-POLY

NỘI DUNG
- scenes/: 9 đấu trường + 1 lobby .glb có hình học 3D thật, xem được mọi hướng.
- props/: 38 đồ vật .glb riêng: cây, đá, tinh thể, cổng, cờ, đèn, nấm, nhà, bàn ghế, cửa, kệ sách...
- previews/: 4 ảnh dựng từ hình học của mỗi cảnh, tổng cộng 40 ảnh.
- OPEN_3D_VIEWER.html: mở bằng trình duyệt hỗ trợ WebGL 2, không cần Internet. Chọn cảnh, kéo chuột để xoay, cuộn để zoom; nút Mở GLB rời dùng cho props.
- source/: mã nguồn dựng lại và chỉnh sửa hình học (Python 3 + NumPy + Pillow).

TÍCH HỢP
Trục Y hướng lên; đơn vị mét. Sân đấu 16 x 16 m, giữ phần giữa cho nhân vật. Lobby 20 x 15 m. GLB dùng vật liệu PBR màu đơn sắc; hãy thêm camera, ánh sáng và skybox phù hợp trong engine.
Mỗi đấu trường có node rỗng SPAWN_1 đến SPAWN_4 và ARENA_CENTER.
Lobby có SPAWN_LOBBY, DOOR_SELECT_GAME_MODE bên trái và DOOR_CREATE_ROOM bên phải. Hai cửa hiện là mô hình tĩnh, có bảng tên trống. Gắn trigger/chuyển màn vào vị trí node theo logic game.
manifest.json ghi danh sách file, điểm spawn và tọa độ cửa.

PHẠM VI
Đây là bộ hình học low-poly cơ bản, không phải bản sao chi tiết từng điểm của ảnh nền. Bộ PNG riêng là minh họa phong phú hơn; chỉ các ảnh trong previews/ và PNG props/ là render từ mô hình thật. Không dùng ảnh nền PNG làm tường 3D.
Các mô hình tĩnh; chưa kèm animation, collider, navmesh, script chiến đấu, chuyển phòng, shader thời tiết hay hệ thống đèn trong engine. Cực quang, lửa và nước trong GLB là hình học tĩnh có màu/emission.
Đã kiểm tra cấu trúc nhị phân của 48 GLB, số liệu mesh và vector pháp tuyến; dựng ảnh kiểm tra từ bốn hướng. Trình xem HTML đã kiểm tra cú pháp JavaScript; chưa kiểm thử trên game của bạn.
