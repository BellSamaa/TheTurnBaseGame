# Tích hợp Weapon New update 1

## Bộ dữ liệu này cung cấp gì?

- `weapons/`: 12 hình vũ khí mới và ảnh Infinity Void gốc người dùng cung cấp, PNG có alpha.
- `summons/`: một pose riêng của Golem, Người Lửa, Nhân Ngư và Niko; các pose idle còn lại ở `frames/`.
- `weapons.json`: 13 mục, gồm 12 vũ khí mới và một cập nhật Infinity Void; 37 nhánh skill. Chi tiết hiển thị tiếng Việt và thông số có cấu trúc đi cùng nhau.
- `WEAPON_NEW_UPDATE_1_CHI_TIET.md`: bản luật đầy đủ, đọc độc lập với trang demo.
- `manifest.json`: 64 hiệu ứng mới và 7 hiệu ứng tái dùng từ bộ Skill mẫu, tổng 71 hiệu ứng / 284 frame. Mỗi hiệu ứng có sheet, source rect, pivot, trình tự và đường dẫn frame rời.
- `abilities.json`: 62 kịch bản minh họa skill và sự kiện: bao gồm kết quả D6 của Death Note, nhánh triệu hồi, proc Akai, phản đòn, đòn thường King Slasher và ba hành động Niko.
- `runtime/vfx-player.js`: renderer Canvas2D thuần hình ảnh, dựa trên renderer của file mẫu. Bổ sung hướng gốc `down` cho đinh, giáo và sét rơi.

## Ranh giới gameplay và VFX

Game quyết định cast có hợp lệ, trừ PTS, tung xúc xắc, kiểm tra hit, giảm HP, giáp, né, miễn nhiễm, trạng thái và summon. Chỉ sau khi có kết quả mới phát sự kiện cho renderer. Renderer không được tự gây sát thương khi chạm frame thứ 3, và không được tự tung RNG để quyết định proc.

Các trường `startMs`, `durationMs`, `demoTtlMs`, `suggestedWorldSize` là gợi ý mỹ thuật. `demoTtlMs` chỉ giúp trang demo tắt trạng thái để dễ xem. Trong game thật, dùng sự kiện `statusRemoved`, `armorDepleted`, `summonDefeated`, `weatherEnded` hoặc `immuneConsumed` để dừng VFX.

Mỗi lần cast mới phải có một ID riêng. Khi hủy trận, đổi scene hoặc khôi phục snapshot, hủy toàn bộ animation tương ứng. Không để callback animation cũ sửa trạng thái combat mới.

## Đếm lượt đúng phạm vi

Không gom tất cả thành một biến `turnsRemaining` giảm ở mọi lượt. Ít nhất cần phân biệt:

| Hiệu ứng | Sự kiện giảm bộ đếm |
|---|---|
| Shield +2 Thủ | Round phòng thủ của chủ |
| Bát | Round tấn công của chủ, không tính phòng thủ |
| Giải / Slashing | Round phòng thủ của chủ |
| Aura đỏ Kagutsuchi | Lần đối phương vượt kiểm tra D20 để đánh trúng, trước khi xét né |
| Đinh thế mạng | Lần đối phương tấn công thành công |
| Tê liệt Giáo sấm sét | Round tấn công của mục tiêu |
| Độc ong chúa giảm Thủ | Round phòng thủ của mục tiêu |
| Song Giáo dạng băng khóa Thủ | Round phòng thủ của mục tiêu |
| Akai teleport | Cửa sổ 3 round có giai đoạn D20, bất kể vai trò |
| Mưa, băng giá, summon | Theo phạm vi “cả tấn công và phòng thủ” trong từng đặc tả |

Khái niệm “round/lượt tính cả tấn công và phòng thủ” chưa xác định tương đương một lượt hành động toàn bàn hay một lần chủ tham gia giao tranh. Cần dùng quy ước của dự án và xác nhận lại nếu chưa có; không tự đổi thành một vòng đủ 3–4 người.

## Các điểm bắt buộc giữ

- Chi phí tới 50 PTS là số người dùng yêu cầu. Không tự chặn kỹ năng ở trần 20 PTS nếu dự án cũ đang có giới hạn đó; trước hết phải kiểm tra trần tài nguyên.
- Shield Skill 1 là tự động khi D6 ra 4, không phải một nút luôn sử dụng được.
- King Slasher: +4 sát thương khi Bát đánh trúng và 5 sát thương khi thất bại là hai nhánh khác nhau. Lưu lượng sát thương từ engine, không từ hình ảnh.
- Nhát cắt ẩn chỉ hiện khi mục tiêu có khắc ấn. Nó bỏ qua giáp, né và miễn nhiễm như mô tả; không ngầm áp cùng quy tắc đó cho các skill khác.
- Death Note phải tung D6 phân giải riêng, không cộng kết quả này vào PTS. D6 1–2 vẫn gây 5 sát thương cho mục tiêu và 3 cho chủ. D6 3/4/5/6 tương ứng 8/10/15/18. Phán quyết lấy 75% **HP hiện tại**, làm tròn lên.
- Kagutsuchi: bonus 3 sát thương từ proc tấn công không yêu cầu đòn cơ bản trúng. Phản công khi thủ cũng không yêu cầu thủ thành công.
- Độc ong chúa là -3 điểm thủ qua 5 lượt mục tiêu thủ, không tự biến thành DoT mất HP. Ong thợ từ Queen Bee không kế thừa độc của Worker Bees.
- Mưa của Giáo sấm sét mở hai dạng Skill 1 giá 5 PTS. Hai dạng này không phải đổi giá của toàn bộ skill.
- Giáo Băng Skill 1 cường hóa có tỷ lệ đóng băng 30%; passive đóng băng khác vẫn chưa có tỷ lệ nền.
- Song Giáo dùng hai passive kế thừa, không tự cộng xác suất reroll thành một con số mới. Hai nhánh Skill 2 có hai kiểu enchant khác nhau.
- Mirror Suck chỉ đổi phần hồi **dư** thành giáp. Không lấy toàn bộ 20 thành giáp nếu HP còn thiếu.
- Infinity Void: giữ Aoi, Infinity và Hollow Purple từ kit gốc. Chỉ thay Akai cơ bản 10 → 12 sát thương và thêm cửa sổ proc mới. Không coi “Akai bắn thêm” là tự động trả thêm PTS.

## Entity triệu hồi

Mỗi summon cần ID, ownerId, HP, trạng thái hoạt động, bộ đếm và vị trí riêng. Ba summon nhỏ nhận sát thương thay chủ theo mô tả. Chưa có quy tắc sát thương tràn, thứ tự nhận đòn khi nhiều summon, và tương tác của nhát cắt xuyên mọi phòng vệ với HP summon; các trường này phải được quyết định trước khi viết damage resolver.

Golem dừng ném sau 5 lượt nhưng vẫn đứng. Không tự xóa Golem bằng timer animation. Skill 2 Nhẫn nguyên tố xóa các summon trước đó của người dùng rồi tạo Niko 25 HP; không xóa summon của người chơi khác.

Đặt sprite theo slot riêng bên cạnh chủ. Demo có ba mốc `caster.summon1`, `caster.summon2`, `caster.summon3` cách nhau 90–100 px theo trục ngang và cùng khu vực thấp hơn chủ. Trong game, hãy tính bounding box theo scale thực tế, mirror theo hướng nhân vật và dàn thêm hàng nếu vượt ba summon. “2–3 summon không đè nhau” là yêu cầu bố trí, không phải giới hạn số summon đã chốt.

Các ảnh summon có bốn pose idle. Renderer có thể lặp idle trong khi entity sống; projectile và hành động được spawn bằng event riêng. Niko proc một hành động theo RNG của game; trang demo cho chọn từng nhánh để quan sát, không tự đặt xác suất chọn đều ba hành động.

## Dùng atlas hoặc frame rời

Chọn một đường render: cắt theo `manifest.effects[id].frames[n].rect` từ `sheet`, hoặc load `frames/<id>/0.png..3.png`. Không vẽ cả atlas lên nhân vật. Không trim từng frame riêng vì sẽ đổi gốc đặt ảnh và làm rung animation.

Nguồn AI được cắt theo lưới, giữ nguyên pixel. Một số hạt sáng nằm sát rìa cell; `qa.json` liệt kê hoạt động sát mép để rà khi tích hợp. Bốn frame là một chu kỳ minh họa ngắn, không phải animation vẽ tay có pivot hoàn hảo. Xem trên cả nền sáng/tối rồi chỉnh rect/offset nếu game yêu cầu.

## Những phần chưa được xác định

Đọc `UNRESOLVED_RULES.json` và mục “Thông số chưa chốt” của từng vũ khí. Giá trị `null` nghĩa là thiếu thông tin, không có nghĩa bằng 0, không giới hạn, hay mặc định 100%. Không tự đổi số liệu nhằm cân bằng.

Chưa có mã dự án game trong yêu cầu này. Bộ asset, đặc tả và demo chưa được tích hợp hoặc kiểm thử trong game thật. Trang HTML không phải combat engine.
