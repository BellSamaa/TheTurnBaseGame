// ============================================================
// Retro 8-bit Sound Synthesizers via Web Audio API
// No external assets required; fully controllable volume & mute
// ============================================================

import { useGameStore } from '@/stores/gameStore';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    return new AudioCtx();
  } catch {
    return null;
  }
}

function canPlaySound(): { canPlay: boolean; volume: number } {
  try {
    const settings = useGameStore.getState().settings;
    if (settings.sfxMuted) return { canPlay: false, volume: 0 };
    return { canPlay: true, volume: Math.max(0, Math.min(1, settings.sfxVolume ?? 0.8)) };
  } catch {
    return { canPlay: false, volume: 0 };
  }
}

// 1. Crisp UI Button Click (Quick double chirp)
export function playClickSound() {
  const { canPlay, volume } = canPlaySound();
  if (!canPlay) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(480, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(960, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}

// 2. Dice Rattle / Roll Sound (Series of rapid tumbling clicks)
export function playDiceRollSound() {
  const { canPlay, volume } = canPlaySound();
  if (!canPlay) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  for (let i = 0; i < 6; i++) {
    const time = ctx.currentTime + i * 0.045;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250 + Math.random() * 400, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.035);

    gain.gain.setValueAtTime(volume * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.035);
  }
}

// 3. Combat Direct Hit Sound (Heavy low crunch + noise impact)
export function playHitSound() {
  const { canPlay, volume } = canPlaySound();
  if (!canPlay) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Punch bass tone
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.18);

  gain.gain.setValueAtTime(volume * 0.45, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.18);
}

// 4. Defend / Shield Block Sound (Sharp metallic clink)
export function playBlockSound() {
  const { canPlay, volume } = canPlaySound();
  if (!canPlay) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.04);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);

  gain.gain.setValueAtTime(volume * 0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

// 5. Skill Surge Sound (Magical upward arpeggio)
export function playSkillSound() {
  const { canPlay, volume } = canPlaySound();
  if (!canPlay) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [330, 440, 554, 659, 880];
  notes.forEach((freq, idx) => {
    const time = ctx.currentTime + idx * 0.05;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(volume * 0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.12);
  });
}

// 6. Turn Change / Banner Slide Sound
export function playTurnSound() {
  const { canPlay, volume } = canPlaySound();
  if (!canPlay) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(320, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

// 7. Victory Fanfare
export function playVictorySound() {
  const { canPlay, volume } = canPlaySound();
  if (!canPlay) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const fanfare = [
    { freq: 523.25, time: 0, dur: 0.12 },
    { freq: 659.25, time: 0.12, dur: 0.12 },
    { freq: 783.99, time: 0.24, dur: 0.12 },
    { freq: 1046.5, time: 0.36, dur: 0.35 },
  ];

  fanfare.forEach((n) => {
    const t = ctx.currentTime + n.time;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(n.freq, t);

    gain.gain.setValueAtTime(volume * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + n.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + n.dur);
  });
}

// 8. Save Sound (Double chime)
export function playSaveSound() {
  const { canPlay, volume } = canPlaySound();
  if (!canPlay) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  [587.33, 880].forEach((freq, idx) => {
    const time = ctx.currentTime + idx * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(volume * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.15);
  });
}

