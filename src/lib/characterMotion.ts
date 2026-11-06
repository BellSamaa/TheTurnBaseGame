export type CharacterMotion = 'idle' | 'walk' | 'run' | 'still' | 'sit';

const WAIST = 67;

// Pose the already-composited 64x96 character so equipment colors stay aligned.
export function drawCharacterPose(ctx: CanvasRenderingContext2D, sprite: HTMLCanvasElement, motion: CharacterMotion, elapsedMs: number) {
  ctx.clearRect(0, 0, 64, 96);
  ctx.imageSmoothingEnabled = false;
  if (motion === 'sit') {
    // Bend the legs at the chair edge while keeping the torso upright.
    ctx.drawImage(sprite, 0, 0, 64, WAIST, 0, 7, 64, WAIST);
    ctx.drawImage(sprite, 0, WAIST, 32, 82 - WAIST, -4, 72, 36, 8);
    ctx.drawImage(sprite, 32, WAIST, 32, 82 - WAIST, 32, 72, 36, 8);
    ctx.drawImage(sprite, 0, 82, 32, 14, -4, 80, 32, 14);
    ctx.drawImage(sprite, 32, 82, 32, 14, 36, 80, 32, 14);
    return;
  }
  if (motion === 'still') { ctx.drawImage(sprite, 0, 0); return; }
  if (motion === 'idle') {
    const breath = Math.sin(elapsedMs / 2200 * Math.PI * 2) > 0 ? 1 : 0;
    ctx.drawImage(sprite, 0, WAIST, 64, 96 - WAIST, 0, WAIST, 64, 96 - WAIST);
    ctx.drawImage(sprite, 0, 0, 64, WAIST, 0, breath, 64, WAIST - breath);
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
    ctx.translate(side === -1 ? 25 : 39, WAIST - bob);
    ctx.rotate(side * stride * (running ? .22 : .11));
    ctx.drawImage(sprite, x, WAIST, 32, 96 - WAIST, x - (side === -1 ? 25 : 39), 0, 32, 96 - WAIST - Math.round(lift));
    ctx.restore();
  }
  ctx.drawImage(sprite, 0, 0, 64, WAIST, running ? 1 : 0, -bob, 64, WAIST + 2);
}
