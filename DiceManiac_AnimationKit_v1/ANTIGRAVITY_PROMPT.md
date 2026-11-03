# PROMPT TRIỂN KHAI ANIMATION — DICE MANIAC

Bạn đang sửa game Dice Maniac có sẵn. Hãy đọc toàn bộ tài liệu này và các file trong kit rồi thực hiện tích hợp code. Đầu ra phải có code hoạt động trong dự án, màn thử từng nhánh chiêu, báo cáo kiểm tra thực tế và các điểm còn chưa xác định. Không dừng ở mô tả kế hoạch.

## 1. Đọc dự án và nguồn asset

- Xác định framework, renderer (DOM/Canvas/Phaser/Pixi…), state trận đấu, cách server/client quyết định kết quả, hệ thống chọn mục tiêu và custom nhân vật. Tái sử dụng kiến trúc phù hợp, không tự viết lại cả game.
- Kit gồm 32 hiệu ứng, 8 sheet nguồn 4×4, 128 PNG frame đã cắt, 2 nút SKILL. Dùng một trong hai cách: atlas + manifest hoặc PNG riêng; không tải hai bản vào cùng cache.
- `manifest.json` ghi sourceRect chính xác của mỗi frame. Không mặc định mọi sheet có kích thước 1024 hoặc frame 256. Không dùng toàn bộ sheet làm một sprite.
- `runtime/vfx-player.js` là renderer tham khảo Canvas2D. `preview.html` chạy offline với ảnh nhúng, có thử từng hiệu ứng, từng nhánh chiêu và chỉnh tốc độ. Đây là demo trình diễn, không phải combat engine.
- Các ảnh nguồn được tạo bằng AI. Frame có thể có hạt/ánh sáng sát biên. Kiểm tra animation trên cả nền sáng và tối. Nếu vùng vẽ tràn ô hoặc tâm lệch, chỉnh sourceRect/offset của frame tương ứng, bổ sung vùng trống; không crop sát từng frame rồi phóng chúng cùng chiều cao.
- Giữ kích thước canvas và pivot ổn định trong cùng animation. Tắt smoothing; dùng image-rendering: pixelated nếu render DOM. Không gọi việc renderer không ném exception là bằng chứng hình ảnh hoàn hảo.

## 2. Luật đã biết, nguồn ưu tiên và điểm chưa rõ

Các mô tả cụ thể theo vũ khí bên dưới được giữ nguyên tên Skill 1/Skill 2 mà chủ game đã viết. Mô tả luật tổng quát từng nói Skill 1 dùng charge và Skill 2 theo mặt D6, nhưng Infinity Void/Dragon Dagger/Chronos được mô tả ngược. Không tự đổi tên chiêu để ép chúng vào quy tắc chung. Dùng abilityId ổn định và activation config riêng cho từng chiêu.

D20 công <= D20 thủ: không gây sát thương công kích thường. D20 công > D20 thủ: sát thương cơ bản bằng hiệu. Modifier class và hiệu ứng áp dụng trong combat engine theo cấu hình đã xác nhận. Animation tuyệt đối không tự roll D20/D6 hay trừ HP.

Các giá trị CHƯA CHỐT phải lấy từ config dự án có nguồn rõ ràng, hoặc ghi vào `unresolvedRules`. Nếu nhánh gameplay phụ thuộc vào giá trị chưa có, khóa nhánh đó và nêu lý do; vẫn cho xem animation trong dev preview. Không biến một giá trị giả định thành luật chính thức:
- Ngưỡng charge/mặt D6 của Greatsword, Bow, Staff, Revolver; tiêu hao/reset charge; giới hạn dùng chiêu/lượt.
- Chiêu công kích của dagger có so D20 hay dùng sát thương cố định khi kích hoạt; thứ tự modifier, làm tròn và true damage.
- Bow: 5 damage lên mục tiêu đang bleed là tổng sát thương hay cộng thêm; chỉ hit của ai được kích hoạt.
- Leaf Headband: "5 sát thương cháy trong 3 lượt" là 5 mỗi tick, tổng 5, hay hit đầu 5 rồi DoT; "giảm 5 tấn" là trừ số D20, stat công hay damage.
- Burn/bleed tick đầu hay cuối lượt của ai; một lượt là hành động một bên hay một vòng; reapply/stack/refresh; trật tự chết do self-cost/DoT; miễn nhiễm có chặn DoT không.
- Chronos snapshot gồm gì, restore dùng thế nào, snapshot có lưu RNG/charge/status/summon không; xóa lượt có khôi phục state nào và chi phí nào; giới hạn ép reroll.
- Revolver auto reload có kích hoạt D6 thêm không; reload khi đầy có tính không; chain extra D6 có thể tạo vòng lặp không; chọn số đạn áp dụng hành động nào.
- Pet Rock khả năng lăn ngược xác suất bao nhiêu; điều kiện tính một lần bị tấn công; block 5 có tiêu hao HP rock không; rage counter reset thế nào; 50 HP có thay đổi khi to lên không.
- Warrior 120 HP mới là gợi ý; Tanker chưa có mức giảm damage. Không tự xác nhận hai thông số này.

## 3. Không gian, anchor và thứ tự lớp

Định nghĩa anchor từ sprite/rig thực tế của mỗi actor, theo tọa độ WORLD của sàn đấu, không lấy tọa độ viewport chưa đổi camera:
- `feet`: chính giữa hai bàn chân, điểm gốc actor.
- `head`: tâm đầu; `eyes`: giữa hai mắt; `chest`: giữa ngực; `hand`: tay cầm vũ khí hướng về mục tiêu; `weaponTip`: đầu vũ khí, nếu rig có.
- `aboveHead`: cao hơn đầu 0.12 lần chiều cao actor; `ground`: feet.
- `summonSlot`: trên sàn, phía trước caster khoảng 0.55 lần chiều cao actor, nằm giữa caster và địch; tránh che chân caster.
- `skyEntry(target)`: cao hơn target tối thiểu 1.2 lần chiều cao actor, nằm trong camera/biên sân; có thể lệch ngang để tạo đường chéo.

Đừng hardcode P1 ở x=250 và P2 ở x=800. Tính hướng từ vị trí caster/target mỗi lần resolve. Khi camera zoom/pan, actor và VFX dùng cùng transform. Giữ HUD theo tọa độ màn hình riêng.

Layer gợi ý: background → ground effects → summon/actors (sort theo feet.y) → projectile/slash → aura phía trước → số damage/status → HUD/modal. Aura bao người có thể tách back/front nếu asset hỗ trợ; không che mặt bằng một ảnh đục. Hiệu ứng nằm trong battle viewport, không đè lên nút thao tác.

Scale VFX theo chiều cao actor H: slash 0.55–0.9H, hit spark 0.25H, flame 0.65H ở feet, status trên đầu 0.18–0.28H, projectile 0.15–0.35H, meteor 0.65H, impact 0.9H. Đây là đề xuất thẩm mỹ, không phải hitbox hay luật damage.

Canonical direction được ghi trong manifest: arrow/orb/bullet/rock hướng phải; Hollow Purple hình nguồn có đuôi hướng phải nên mặc định bay trái; meteor mặc định chéo xuống phải. Đổi hướng bằng flip/rotation quanh pivot, không chỉ đổi vận tốc để đầu đạn bay ngược. Với projectile, quay từ góc canonical đến góc quỹ đạo. Các vị trí trong config là world anchor, không phải rect cắt ảnh.

## 4. Luồng sự kiện và animation

Combat engine/server tạo một `ResolvedAction` duy nhất:
```
{ actionId, revision, actorId, abilityId, branchId, targets,
  rolls, chargeBefore, chargeAfter, ammoBefore, ammoAfter,
  outcomes:[{targetId, kind:'hit|block|miss|dodge|immune', damage}],
  statusChanges, summonChanges, snapshotChanges, authoritativeState }
```
Kết quả đã resolve là nguồn duy nhất. VFX lấy branchId, không tung D6 lại để chọn màu. Mỗi target của AoE có outcome riêng; target né hoặc immune không được hiện damage số dương.

Pipeline: validate input → resolve rules → enqueue presentation → windup → projectile/slash → impact marker → feedback → recovery → unlock input. Kết quả authoritative có thể cập nhật trước animation; dùng displayHP nếu muốn HP UI chạy ở thời điểm impact. Không trừ thêm damage ở callback animation.

- Dedupe theo `(revision, actionId)`; duplicate websocket không được phát lại damage hoặc VFX.
- Một action nhiều hit có các `hitId`/impact marker riêng do combat engine cung cấp. Không suy ra số hit từ số vệt trên sprite.
- Chỉ khóa input hành động liên quan; vẫn cho settings/surrender theo UI game. Cancel/unmount/disconnect phải giải phóng lock bằng finally hoặc queue manager.
- Timer dùng deltaTime/requestAnimationFrame; không dùng một setInterval cho mỗi particle. Clamp delta khi tab quay lại để tránh nhảy hàng loạt. Đồng bộ lại state trước nhận input mới.
- Giới hạn instance, cache texture, cleanup onComplete/cancel/scene dispose. Effect status có khóa `(ownerId,statusInstanceId)` để update thay vì spawn vô hạn.
- Persistent aura sống theo statusApplied/statusRemoved, không hết theo 3 giây khi luật nói 3 lượt. Pulse ngắn có thể loop 4 frame hoặc ping-pong; tránh lặp startup từ nhỏ đến lớn liên tục gây nhấp nháy.
- Cast thất bại/đủ charge chưa xác nhận: không phát hit. Disable nút có tooltip, không vừa trừ charge vừa báo lỗi.
- SFX theo setting; không autoplay khi chưa có tương tác người dùng. Reduced motion giảm rung, flash và chuyển động xa; vẫn hiển thị đúng kết quả.

## 5. Từng vũ khí — nhánh chiêu, vị trí và timeline

Các mốc mili giây bên dưới là ĐỀ XUẤT trình diễn. Engine gameplay quyết định damage/turn; chỉnh tốc độ animation không đổi kết quả. Các cue máy đọc được nằm trong `abilities.json`.

### GREAT SWORD
**S1 — `greatsword.s1`: 2 damage lên 1 địch.**
- Caster windup 0–140 ms, giữ feet. Cho nhân vật/vũ khí nghiêng hoặc nâng kiếm bằng rig nếu có; nếu chỉ sprite đứng, gọi đúng là chuyển động bằng code.
- 140–420 ms: `slash_light` ở target.chest, hướng vung từ caster sang target. Caster lunge nhẹ tối đa 0.15H rồi trở lại.
- Impact khoảng 280 ms: chỉ target hit phát `impact_physical`, số damage lấy resolved outcome, hit flash ngắn. Không đổi thành 15 true damage.
**S2 — `greatsword.s2`: 5 damage lên tất cả địch hợp lệ.**
- Windup 0–200; 200–600 `slash_heavy` trên từng target.chest, impact khoảng 360 ms.
- Resolve tập targets trước trình diễn. Render từng mục tiêu hoặc hiệu ứng rộng phủ nhóm; không gây damage lặp vì dùng cả hai. Không tác động đồng minh.

### BOW
**S1 — `bow.s1`: hit 1 damage, bleed 1 lượt; đánh trúng địch đang bleed có quy tắc 5 damage.**
- 0–120 kéo cung; 120–420 `arrow` đi caster.hand → target.chest.
- Khi đến: hit thì `impact_physical`, sau statusApplied đặt `bleed` nhỏ tại target.aboveHead. Nếu outcome dodge/miss/block thì dùng feedback tương ứng, không tự gắn bleed.
- Kiểm tra bleeding trong combat engine tại thời điểm được quy tắc chọn; không áp bleed mới rồi tự coi hit đầu đã kích hoạt bonus. Tổng/cộng thêm 5 và trigger scope phải được xác nhận.
- Khi một hit hợp lệ kích hoạt bleed bonus: pulse `bleed` tại chest, số damage lấy kết quả, không spawn thêm một hit giả. Xóa icon khi hết status.
**S2 — `bow.s2`: dùng lượt thủ, né công kích kế tiếp.**
- Kích hoạt: `dodge_attack` vòng ngắn tại caster.chest rồi hiện indicator sẵn sàng.
- Chỉ khi engine trả outcome dodge cho công kích đủ điều kiện: effect trên người thủ, dịch ngang khoảng 0.1H rồi về. Không dùng cho mọi kỹ năng. Tiêu hao lượt né theo engine, hiện "NÉ" và 0 damage.

### TRƯỢNG GỖ
**S1 — `staff.s1`: cầu phép 2 damage lên toàn bộ địch.**
- 0–180 ms tạo `magic_orb` tại caster.hand; 180–560 ms bay tới tâm nhóm địch hoặc target chính.
- Khoảng 560 ms, nổ/pulse orb trên chest của từng target; đọc riêng outcome, damage và status. Một quả cầu có thể biểu diễn AoE; số projectile vẽ không quyết định số hit.
**S2 — `staff.s2`: lượt thủ, né kỹ năng kế tiếp.**
- `dodge_spell` ở caster.chest khi armed; khi một skill bị né, pulse vòng rune rồi fade. Vẫn có thể bị công kích thường nếu engine không cho né nó. Không đánh đồng với S2 Bow.

### REVOLVER
**Nội tại:** băng 6 viên; người chơi chọn số đạn dùng theo luật; hồi 1 viên mỗi turn. HUD đạn chỉ cập nhật từ ammo events, clamp 0..6. Hiệu ứng reload không tự tăng ammo.
**S1 — `revolver.s1`: nạp ngay 1 viên; mỗi lần nạp được 1 viên cho thêm 1 lần D6.**
- 0–280 `reload` ở caster.hand/gun; tại ammoReloaded pulse thêm một dấu đạn trên HUD.
- Sau đó enqueue D6 roll UI từ event extraRollGranted. Hiệu ứng này không tung hay cộng điểm D6 trực tiếp.
- Không phát "+1" khi đầy nếu không có viên thực sự được nạp. Auto reload có trigger extra D6 không và chain loop phải chốt; không tạo vòng callback nạp → roll → nạp không giới hạn.
**S2 — `revolver.s2`: bắn 1 viên xuyên phòng thủ, vẫn né được, damage bằng D20 theo luật đã xác nhận.**
- Consume ammo trong engine; 0–80 windup, 80–240 `bullet` từ gun/hand tới target.chest.
- Hit: impact tại chest; bỏ qua so thủ theo tính chất xuyên phòng thủ, không tự thêm cả damage công kích thường. Dodge: bullet đi quá mục tiêu rồi fade và `dodge_attack` tại target; không trừ HP. Immune nếu có phải do engine quyết định.

### INFINITY VOID — SECRET
Skill 1 chọn nhánh bằng kết quả D6 đã resolve; các mặt khác không được tự rơi vào một nhánh.
**S1 D6=3 — `void.s1.aoi`: hút + choáng 1 lượt.**
- 0–220 `void_blue` hình thành ở điểm trước caster; 220–650 đặt vortex gần target.chest.
- Kéo hiển thị target về phía vortex tối đa 0.15H, không tự đổi vị trí gameplay/hitbox. Impact 500 ms; khi stunApplied đặt `stun` ở aboveHead đến statusRemoved. Không thêm damage chưa được yêu cầu.
**S1 D6=4 — `void.s1.akai`: 10 damage.**
- 0–180 charge đỏ tại caster.hand; 180–500 `void_red` phóng/pulse ở target.chest. Impact ~450, đẩy hình ảnh target nhẹ nếu trúng. Không thêm stun.
**S1 D6=6 — `void.s1.infinity`: miễn damage 1 lần.**
- `infinity` bao caster.chest. Armed indicator tồn tại theo status. Khi immuneConsumed: pulse tại người được bảo vệ, hiện IMMUNE, damage=0, rồi gỡ aura. Không làm thành miễn nhiễm toàn lượt.
**S2 charge 30 — `void.s2.purple`: Hollow Purple 50 damage.**
- 0–350 tạo blue/red nhỏ hai bên caster.hand; 350–650 hợp thành `hollow_purple`; 650–1100 phóng tới target.chest, impact 1100 rồi fade 300.
- Quỹ đạo phải đúng canonical trái của asset. Phạm vi đơn mục tiêu hay AoE chưa nêu: lấy target list được engine xác nhận, không tự đổi thành toàn sân.

### DRAGON DAGGER — LEGENDARY
**S1 D6=1 — `dagger.s1.throw`: ném dao công kích 5 + burn 1 mỗi lượt, 3 lượt.**
- Dùng sprite VŨ KHÍ Dragon Dagger sẵn trong dự án làm projectile xoay quanh cán/center; kit không có ảnh dao bay riêng. Không dùng mũi tên thay dao mà gọi là hoàn thành.
- 0–120 chuẩn bị, 120–450 dao bay hand→chest; hit pulse `slash_light`, áp `burn_orange` ở target.feet nếu engine xác nhận.
- Mỗi burnTick pulse lửa và damage 1 từ event; đủ 3 tick theo boundary đã chốt thì remove. Không gây 3 damage mỗi lần animation loop.
**S1 D6=2 — `dagger.s1.multi`: multi-slash 5; hóa lửa dagger, lượt tiếp chém thêm 5.**
- 0–120 lunge; 120–520 `slash_multi` tại target.chest, có thể xoay nhẹ nhiều vệt.
- Tổng damage 5 của chiêu không tự nhân theo số vệt. Gắn flame nhỏ tại caster.weaponTip/hand biểu thị buff chém lượt kế.
- Next eligible attack được engine tiêu hao buff: thêm hiệu ứng lửa/impact và dùng damage đã resolve; không tự cộng 5 vào mọi hit sau đó. Cách xử lý khi lượt tiếp không chém cần config.
**S2 charge 30 — `dagger.s2.blue`: chém lửa xanh tổng 20 + burn 2 mỗi lượt, 5 lượt.**
- 0–350 `burn_blue` nhỏ tại weaponTip; 350–900 chém bằng `slash_multi` kết hợp `burn_blue` tại target.chest/feet.
- Các vệt liên tục chỉ là trình diễn; tổng 20 không chia/nhân tùy ý. Nếu engine cung cấp hit breakdown thì theo breakdown, nếu chưa có dùng một damage event 20.
- Sau hit: blue burn status, tick 2 trong 5 lượt. Stack với orange/black burn thế nào còn chưa xác nhận, không tự refresh tất cả.

### CHRONOS — MYTHIC
**S1 D6=2 — `chronos.s1.save_restore`: lần 1 lưu trạng thái, lần kích hoạt lại restore.**
- Dùng branch `save` hoặc `restore` từ engine, không suy ra bằng việc có đang phát aura.
- Save: `time_save` ở caster.feet/chest 0–500; đặt dấu đồng hồ nhỏ ở aboveHead hoặc marker.worldPosition gắn snapshotId.
- Restore: animation cùng asset theo frame ngược và luồng hạt quay về; marker→caster trong 500 ms; UI phản ánh state restore từ server. Không tự heal max, reset cả trận, phục hồi mọi người hay hoàn ammo nếu snapshot scope không bao gồm.
**S1 D6=4 — `chronos.s1.reroll`: đánh dấu người khác, khi họ tấn công bằng xúc xắc có thể bắt tung lại.**
- Đặt `time_reroll` nhỏ ở target.aboveHead; giữ theo mark status.
- Khi quyền reroll được dùng hợp lệ, pulse tại target và D20 tray của người đó. Hiển thị roll bị hủy rồi roll thay thế lấy từ engine. Đừng render một số ngẫu nhiên rồi coi nó là kết quả thật.
- Quyết định dùng quyền trước khi finalize damage của roll cũ theo luật đã chốt; không đánh damage cũ xong đánh tiếp damage mới.
**S1 D6=6 — `chronos.s1.lock`: khóa người chơi đó 1 lượt.**
- `time_lock` tại target.chest khi cast, rồi icon nhỏ aboveHead. Disable hành động do state lock; animation không tự chặn DOM input của người khác. Loại hành động bị khóa và boundary hết hạn do rules.
**S2 — `chronos.s2.erase`: xóa 1 turn đã lưu.**
- 0–600 `time_erase` tại marker của turn được chọn, cùng hiệu ứng nhẹ trên các actor liên quan.
- Server tạo revision mới/state sau xóa. Hủy queue/VFX thuộc revision cũ, rebuild aura từ authoritative statuses và summon state; bỏ callback damage cũ.
- Effect time_erase của revision mới vẫn được phép chạy; đừng cancel chính nó khi dọn scene cũ. Không tùy tiện xóa combat log hay dùng DOM snapshot làm state.
- Điều kiện kích hoạt, turn nào được lưu và phạm vi undo chưa rõ: chưa có config thì chỉ dev preview, không giả vờ gameplay đã xong.

### LEAF HEADBAND
**S1 — `leaf.s1.blackfire`: lửa đen từ mắt, cháy 3 lượt, người dùng mất 3 HP mỗi lần dùng.**
- 0–150: small black flame tại caster.eyes và bleed pulse nhỏ gần mắt; self-cost -3 lấy từ engine (không gắn bleed DoT vĩnh viễn cho caster).
- 150–450: vệt năng lượng đen từ eyes đến target.chest (có thể dùng nhiều sprite `burn_black` nhỏ nối theo đường, pooling); khi đến, lửa ở target.feet.
- Damage "5 ... trong 3 lượt" chưa rõ tổng/tick; không tự chọn. `damage` mỗi lần hiển thị lấy từ outcome/statusTick.
- Không thêm sát thương riêng cho từng flame sprite. Nếu self-cost khiến caster chết, việc chiêu còn đi tiếp hay dừng do rule, không do animation kết thúc sớm.
**S2 charge 20 — `leaf.s2.meteor20`: 1 thiên thạch, 10 damage.**
- 0–250 báo vùng rơi dưới target; 250–850 `meteor_one` từ skyEntry → ground; tại 850 `meteor_impact` ở ground, hiển thị 10 theo outcome. Không tự thêm panic nhánh này.
**S2 charge 30 — `leaf.s2.meteor30`: 2 thiên thạch, tổng 30 damage, panic giảm 5 tấn trong 2 lượt.**
- Lựa chọn 20 hay 30 phải rõ trong UI và payload; không tự tiêu 30 khi người chơi chọn bản 20. Quy tắc tiêu charge do config.
- Dùng `meteor_two` làm một hiệu ứng đôi HOẶC hai instance `meteor_one`; không vẽ cả hai cách gây bốn viên. Có thể impact lệch nhau 100–160 ms nhưng tổng damage từ engine vẫn 30, không phải 30 mỗi viên.
- Khi panicApplied, `panic` ở target.aboveHead đến hết 2 lượt. Tooltip thể hiện đúng stat bị giảm sau khi được xác nhận.

### THE PET ROCK
**S1 — `rock.s1.summon`: Rock 50 HP, chặn 5 cho chủ, dùng D6 gây damage.**
- 0–500 `rock_summon` tại caster.summonSlot. Sau effect, tạo/hiện entity rock từ summon state, có summonId, HP và counter riêng.
- Kit là VFX, không có bộ idle/hit/death hoàn chỉnh của pet. Dùng sprite Pet Rock có sẵn trong dự án cho entity thường trực. Không giữ vĩnh viễn cả sheet triệu hồi.
- Khi block event: `rock_block` giữa đòn tới và chủ; số bị chặn=giá trị engine, không tự trừ 5 lần nữa. Xử lý HP rock và chủ riêng theo luật đã chốt.
- Khi rock được phép đánh: animation rock hướng target, impact tại target.chest; D6 và damage lấy summon attack event. Không nhầm D6 gây damage với D6 sạc kỹ năng của chủ.
**S2 sau bị tấn công 5 lần — `rock.s2.rage_roll`: to gấp đôi người chơi, lăn gây D20, có thể lăn ngược về chủ.**
- Count event được engine xác nhận; shield bị đánh, miss, DoT, multi-hit có tính không phải do rules.
- 0–500 `rock_rage` tại rock.feet; scale entity đến chiều cao 2× caster H (phần camera có thể phải zoom ra).
- 500–1300 `rock_roll` chạy từ rock.feet đến destination.ground. Destination có thể là địch HOẶC chủ, lấy từ resolvedEvent.backfire/targetId, không random trong VFX.
- Đảo hướng cả sprite và đường chạy khi lăn ngược. Khi chạm target, impact và damage D20 từ engine. Không cho rock va chạm hình ảnh với nhiều actor rồi tự gây thêm damage.
- Sau roll, vị trí/size/counter/HP lấy state mới. Xóa aura/entity khi pet chết hoặc despawn; chủ đổi scene phải cleanup.

## 6. Status, miss/block và nhiều mục tiêu

- Burn orange/blue/black: đặt feet, có thể hạ alpha để không che nhân vật; tick pulse ở chest; status icon nhỏ aboveHead. Loop không phát lại damage.
- Bleed: icon trên đầu, pulse khi đúng bleed interaction/tick; chưa có luật tick bleed riêng thì không tạo tick damage.
- Stun/lock/panic: icon khác nhau, không dùng chung một hiệu ứng cho cả ba. Tooltip ghi số lượt còn lại từ state.
- Block: `guard`/`rock_block` chỉ cho outcome thích hợp. Attack<=defense có thể hiển thị BLOCK hoặc MISS theo thiết kế engine, đều damage 0; không tự gán dodge consumable.
- Immune: `infinity`, damage 0; riêng né skill/attack phải dùng đúng type.
- AoE: one resolved action với list targets; timeline có thể đồng thời, mọi outcome đọc độc lập. Target chết/despawn giữa timeline cần anchor snapshot để impact vẫn có vị trí, không crash.

## 7. Hai nút SKILL và lựa chọn nhánh

- Dùng ui/skill_1.png và ui/skill_2.png làm background ảnh của button thật; accessible label riêng, focus keyboard, không thêm chữ chồng lên chữ đã có.
- Tooltip/panel nhỏ cạnh nút ghi tên chiêu, activation, charge/ammo và target. Dùng DOM text cho thông tin động.
- Void S1 có 3 nhánh, Dagger S1 có 2, Chronos S1 có 3 (nhánh 2 lại save/restore). Nút gọi ability theo kết quả hợp lệ; không cho tự chọn một mặt D6 khác kết quả.
- Leaf S2 có lựa chọn 20/30 khi được phép; Chronos restore/erase có lựa chọn snapshot/turn hợp lệ; Revolver có chọn số đạn theo rules.
- Disabled khi không đúng lượt, thiếu charge/ammo, khóa trạng thái, đang resolve hoặc không có target hợp lệ. Tách disabled bởi đang chạy VFX với disabled bởi luật để không khóa vĩnh viễn khi animation bị cancel.

## 8. Bàn giao và kiểm tra bắt buộc trong dự án

1. Hoàn thành Greatsword S1 end-to-end rồi mở rộng, không báo xong chỉ vì tải đủ ảnh.
2. Có dev scene dropdown từng ability/branch và outcome hit/block/dodge/immune; đi cả trái→phải và phải→trái, 1/2/nhiều target.
3. Kiểm tra status sống qua lượt, tick đúng số lần; VFX loop không tăng damage. Kiểm tra duplicate event, action cancel, tab hide/show, disconnect/reconnect, target chết, đổi scene.
4. Kiểm tra restore/erase hủy effect cũ và đồng bộ state mới; rock backfire hướng về chủ; leaf 2 meteors không nhân đôi damage; revolver cap 6 và extra D6 không lặp vô hạn.
5. Kiểm tra số damage đúng trên cả class modifiers; giữ unresolved rules có nguồn rõ ràng.
6. Chụp/ghi lại ảnh hoặc clip runtime của từng nhóm. Báo file đã sửa, đã test gì, lỗi còn lại. Không ghi "đã test trong game" nếu mới chạy kit preview.
