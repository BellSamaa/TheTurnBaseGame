export type CharacterMotion = 'idle' | 'walk' | 'run' | 'still' | 'sit';

// Pose the already-composited 64x96 character so equipment colors stay aligned.
export function drawCharacterPose(ctx: CanvasRenderingContext2D, sprite: HTMLCanvasElement, motion: CharacterMotion, elapsedMs: number) {
  ctx.clearRect(0, 0, 64, 96);
  ctx.imageSmoothingEnabled = false;
  if (motion === 'sit') {
    // Bend the legs at the chair edge while keeping the torso upright.
    ctx.drawImage(sprite, 0, 0, 64, 62, 0, 12, 64, 62);
    ctx.drawImage(sprite, 0, 62, 32, 20, -4, 70, 36, 10);
    ctx.drawImage(sprite, 32, 62, 32, 20, 32, 70, 36, 10);
    ctx.drawImage(sprite, 0, 82, 32, 14, -4, 80, 32, 14);
    ctx.drawImage(sprite, 32, 82, 32, 14, 36, 80, 32, 14);
    return;
  }
  if (motion === 'still') { ctx.drawImage(sprite, 0, 0); return; }
  if (motion === 'idle') {
    const breath = Math.sin(elapsedMs / 2200 * Math.PI * 2) > 0 ? 1 : 0;
    ctx.drawImage(sprite, 0, 60, 64, 36, 0, 60, 64, 36);
    ctx.drawImage(sprite, 0, 0, 64, 60, 0, breath, 64, 60 - breath);
    return;
  }
  const running = motion === 'run';
  const phase = elapsedMs / (running ? 380 : 760) * Math.PI * 2;
  const stride = Math.sin(phase);
  const bob = Math.round(Math.abs(Math.cos(phase)) * (running ? 3 : 1));
  // Split below the waist. Both legs retain their matching pants/boots pixels.
  for (const side of [-1, 1]) {
    const x = side === -1 ? 0 : 32;
    const lift = Math.max(0, side * stride) * (running ? 6 : 3);
    ctx.save();
    ctx.translate(side === -1 ? 25 : 39, 62 - bob);
    ctx.rotate(side * stride * (running ? .22 : .11));
    ctx.drawImage(sprite, x, 62, 32, 34, x - (side === -1 ? 25 : 39), 0, 32, 34 - Math.round(lift));
    ctx.restore();
  }
  ctx.drawImage(sprite, 0, 0, 64, 62, running ? 1 : 0, -bob, 64, 64);
}
