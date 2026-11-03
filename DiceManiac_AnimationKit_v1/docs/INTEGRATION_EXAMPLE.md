# Ví dụ tích hợp tối thiểu (Canvas2D)

Nạp `runtime/vfx-player.js` trước code này. Cách preload bên dưới cần chạy qua web server của game; riêng preview.html đã nhúng dữ liệu và mở offline được.

```js
const base = new URL('/assets/DiceManiac_AnimationKit_v1/', location.href);
const response = await fetch(new URL('manifest.json', base));
if (!response.ok) throw new Error('Không tải được VFX manifest');
const manifest = await response.json();
const images = {};
const sheets = [...new Set(Object.values(manifest.effects).map(x => x.sheet))];
await Promise.all(sheets.map(path => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => { images[path] = image; resolve(); };
  image.onerror = reject;
  image.src = new URL(path, base).href;
})));
const vfx = new DiceVfxPlayer(manifest, images);

// Dùng vòng render sẵn có của game. Đừng tạo RAF thứ hai nếu đã có game loop.
function renderBattle(dtMs, ctx, camera) {
  vfx.update(dtMs);
  ctx.save();
  camera.apply(ctx); // chính transform được dùng cho các nhân vật
  // drawBackground/ground/actors tùy kiến trúc dự án
  vfx.draw(ctx);
  ctx.restore();
  // drawHUD(ctx)
}

// Ví dụ: engine đã xác nhận S1 Greatsword đánh trúng.
// Hàm này không trừ HP, không tạo xúc xắc hoặc thay đổi combat state.
function showGreatswordHit(event, getAnchor) {
  const outcome = event.outcomes[0];
  if (outcome.kind !== 'hit') return;
  vfx.spawn('slash_light', {
    id: `${event.revision}:${event.actionId}:slash`,
    at: () => getAnchor(outcome.targetId, 'chest'),
    size: [140, 140], durationMs: 280,
    flipX: getAnchor(event.actorId, 'feet').x > getAnchor(outcome.targetId, 'feet').x
  });
}

// Projectile: chuyển động của ảnh từ tay đến ngực, không dùng collision ảnh làm gameplay hit.
function showBullet(event, getAnchor) {
  const targetId = event.outcomes[0].targetId;
  const endpoint = getAnchor(targetId, 'chest'); // snapshot nếu target có thể despawn
  return vfx.spawn('bullet', {
    id: `${event.revision}:${event.actionId}:bullet`,
    from: getAnchor(event.actorId, 'hand'), to: endpoint,
    orientToPath: true, durationMs: 160, size: [70, 70]
  });
}

// Status VFX dùng khóa instance của engine, không timer số lượt bằng giây.
function onStatusApplied(status, getAnchor) {
  const effect = { burnOrange:'burn_orange', burnBlue:'burn_blue',
    burnBlack:'burn_black', bleed:'bleed', stun:'stun',
    timeLock:'time_lock', panic:'panic', infinity:'infinity' }[status.type];
  if (!effect) return;
  const isBurn = effect.startsWith('burn_');
  const at = isBurn ? 'feet' : effect === 'infinity' ? 'chest' : 'aboveHead';
  vfx.spawn(effect, {
    id: `status:${status.ownerId}:${status.id}`,
    at: () => getAnchor(status.ownerId, at),
    durationMs: 650, loop: true,
    sequence: manifest.effects[effect].statusLoopSequence,
    size: isBurn ? [145,145] : effect === 'infinity' ? [180,180] : [48,48],
    opacity: isBurn ? 0.8 : 1
  });
}
function onStatusRemoved(status) {
  vfx.stop(`status:${status.ownerId}:${status.id}`);
}

// Khi revision thay đổi do Chronos: clear queue presentation bên ngoài,
// rồi clear VFX và dựng lại trạng thái còn hiệu lực từ snapshot authoritative.
function onNewRevision(state, getAnchor) {
  vfx.clear();
  for (const status of state.statuses) onStatusApplied(status, getAnchor);
}
// onSceneUnmount: hủy callback queue/RAF, tháo listeners, rồi vfx.dispose().
```

## API

- `spawn(effectId, options)` trả instance ID, hoặc null nếu vượt maxInstances. Không silent sửa rules khi thiếu VFX.
- `at`, `from`, `to`: `{x,y}` world coordinates hoặc hàm trả anchor hiện tại. Projectile thông thường nên chụp start/end tại lúc bắn; aura dùng hàm để bám actor.
- `durationMs`: thời gian chạy một chu kỳ frame. `travelMs`: thời gian đi hết quỹ đạo, mặc định bằng duration.
- `loop`: mặc định false. `ttlMs`: giới hạn sống nếu có; không truyền TTL giả theo giây cho status trong gameplay.
- `size`: [width,height] world units; `pivot`: [0..1,0..1]; `rotation`: radian; `orientToPath`: tự xoay theo hướng nguồn; `flipX`, `opacity`, `sequence` tùy chọn.
- `update(dtMs)`: clamp mỗi bước tối đa100ms. Khi tab hidden, host phải pause clock presentation lẫn VFX cùng nhau, rồi reconcile state khi hiện lại.
- `draw(ctx)`: không clear canvas để không xóa actor/background. Host tự clear theo vòng game.
- `stop(id)`, `clear()`, `dispose()` dọn bộ nhớ instance. Cache image do host quản lý.

Đây là renderer hình ảnh tham khảo, không có combat resolver, event dedupe, mạng multiplayer hoặc animator cơ thể. Hãy triển khai các phần này theo ANTIGRAVITY_PROMPT.md trong kiến trúc dự án.
