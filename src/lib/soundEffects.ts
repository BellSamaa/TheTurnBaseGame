import {createHitSoundPicker,HIT_SOUND_FILES} from './combatHits';
// ============================================================
// Retro 8-bit Sound Synthesizers via Web Audio API
// UI/cast synthesis plus supplied impact recordings; volume and mute apply to both.
// ============================================================

import { useGameStore } from '@/stores/gameStore';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
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

// Confirmed HP damage uses the supplied hit sound set, never the generic VFX dispatcher.
const nextHitSound=createHitSoundPicker();
const hitAudio=new Set<HTMLAudioElement>();
let hitPreload:HTMLAudioElement[]=[];
export function preloadHitSounds(){
 if(typeof Audio==='undefined'||hitPreload.length)return;
 hitPreload=HIT_SOUND_FILES.map(file=>{const clip=new Audio('/assets/sounds/hits/'+encodeURIComponent(file));clip.preload='auto';clip.load();return clip;});
}
export function playHitSound(strength=1){
 const {canPlay,volume}=canPlaySound();if(!canPlay||volume<=0||typeof Audio==='undefined')return;
 const clip=new Audio(nextHitSound());clip.volume=Math.min(1,volume*Math.min(1.2,Math.max(.5,strength)));clip.preload='auto';
 while(hitAudio.size>=4){const oldest=hitAudio.values().next().value!;oldest.pause();hitAudio.delete(oldest);}
 hitAudio.add(clip);const done=()=>hitAudio.delete(clip);clip.addEventListener('ended',done,{once:true});clip.addEventListener('error',done,{once:true});void clip.play().catch(done);
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

// 9. Sharp Blade Slash Sound (Swords, Daggers)
export function playSlashSound() {
  const { canPlay, volume } = canPlaySound();
  if (!canPlay) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

// 10. Revolver Gunshot Sound (Explosive pop + low crackle)
export function playGunshotSound() {
  const { canPlay, volume } = canPlaySound();
  if (!canPlay) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Sharp initial pop
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);

  gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

// 11. Celestial Magic Cast Sound (Staff, Infinity Void)
export function playMagicCastSound() {
  const { canPlay, volume } = canPlaySound();
  if (!canPlay) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  [440, 659.25, 880, 1174.66].forEach((freq, idx) => {
    const time = ctx.currentTime + idx * 0.04;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(volume * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.25);
  });
}

// 12. Meteor Rumble & Ground Impact (Leaf Headband Tengai Shinsei, Pet Rock)
export function playMeteorRumbleSound() {
  const { canPlay, volume } = canPlaySound();
  if (!canPlay) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(110, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.45);

  gain.gain.setValueAtTime(volume * 0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.45);
}

// 13. Ultimate Skill 2 Burst Aura Fanfare
export function playUltimateAuraSound() {
  const { canPlay, volume } = canPlaySound();
  if (!canPlay) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  [330, 440, 554.37, 659.25, 880].forEach((freq, idx) => {
    const time = ctx.currentTime + idx * 0.06;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(volume * 0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.35);
  });
}

/** Short, distinct battle cues; respects the same SFX volume/mute setting. */
export function playBattleCue(kind:'phase'|'ready'|'result') {
  const {canPlay,volume}=canPlaySound();if(!canPlay)return;
  const ctx=getAudioContext();if(!ctx)return;
  const notes=kind==='ready'?[523,659,784]:kind==='result'?[880,1175]:[440,554];
  notes.forEach((frequency,i)=>{
    const at=ctx.currentTime+i*.065,osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=kind==='ready'?'triangle':'sine';osc.frequency.setValueAtTime(frequency,at);
    gain.gain.setValueAtTime(.001,at);gain.gain.linearRampToValueAtTime(volume*.12,at+.008);gain.gain.exponentialRampToValueAtTime(.001,at+.12);
    osc.connect(gain);gain.connect(ctx.destination);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(at);osc.stop(at+.13);
  });
}
export function playBattleEffect(effect:string,skill:boolean){
  if(/guard|block|infinity|dodge/.test(effect)){playBlockSound();return;}
  if(/meteor|rock_roll|rock_rage/.test(effect)){playMeteorRumbleSound();return;}
  if(/purple|void|time_erase/.test(effect)){playUltimateAuraSound();return;}
  if(/bullet|gun|revolver/.test(effect)){playGunshotSound();return;}
  if(/slash|arrow|sword/.test(effect)){playSlashSound();return;}
  if(skill){playMagicCastSound();return;}
  playSlashSound();
}
