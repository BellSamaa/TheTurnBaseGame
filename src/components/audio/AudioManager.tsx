'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { BATTLE_TRACKS, LOBBY_BGM, LMS_BGM } from '@/lib/constants';

let globalBgmAudio: HTMLAudioElement | null = null;

// Headless Audio Controller (manages BGM tracks and playback)
export default function AudioManager() {
  const { currentPage, settings, battleState } = useGameStore();
  const [dungeonCombat,setDungeonCombat]=useState(false);
  useEffect(()=>{const listener=(event:Event)=>setDungeonCombat(!!(event as CustomEvent<boolean>).detail);window.addEventListener('dice-dungeon-scene',listener);return()=>window.removeEventListener('dice-dungeon-scene',listener)},[]);
  const [currentTrack, setCurrentTrack] = useState<string>(LOBBY_BGM);

  // Pick track based on currentPage (battle vs menu)
  useEffect(() => {
    if (currentPage === 'battle' && battleState?.lms) {setCurrentTrack(LMS_BGM);}
    else if (currentPage === 'battle'||currentPage==='pve'||currentPage==='dungeon'&&dungeonCombat) {
      const randomBattleTrack =
        BATTLE_TRACKS[Math.floor(Math.random() * BATTLE_TRACKS.length)];
      setCurrentTrack(randomBattleTrack);
    } else {
      setCurrentTrack(LOBBY_BGM);
    }
  }, [currentPage, Boolean(battleState?.lms),dungeonCombat]);

  // Audio setup & resilient playback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!globalBgmAudio) {
      globalBgmAudio = new Audio();
      globalBgmAudio.loop = true;
    }

    const audio = globalBgmAudio;
    const targetUrl = currentTrack.startsWith('http')
      ? currentTrack
      : window.location.origin + currentTrack;

    if (audio.src !== targetUrl && !audio.src.endsWith(currentTrack)) {
      audio.src = currentTrack;
    }

    audio.volume = settings.musicMuted ? 0 : Math.max(0, Math.min(1, settings.musicVolume ?? 0.7));

    const playBgm = () => {
      if (settings.musicMuted || !audio) return;
      audio.play().catch(() => {
        // Will be resumed by global capture listener
      });
    };

    // 1. Attempt immediate playback
    playBgm();

    // 2. Global capture listeners for the VERY FIRST interaction anywhere on document
    const handleFirstGesture = () => {
      playBgm();
      window.removeEventListener('pointerdown', handleFirstGesture, true);
      window.removeEventListener('click', handleFirstGesture, true);
      window.removeEventListener('keydown', handleFirstGesture, true);
      window.removeEventListener('touchstart', handleFirstGesture, true);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { capture: true, once: true });
    window.addEventListener('click', handleFirstGesture, { capture: true, once: true });
    window.addEventListener('keydown', handleFirstGesture, { capture: true, once: true });
    window.addEventListener('touchstart', handleFirstGesture, { capture: true, once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture, true);
      window.removeEventListener('click', handleFirstGesture, true);
      window.removeEventListener('keydown', handleFirstGesture, true);
      window.removeEventListener('touchstart', handleFirstGesture, true);
    };
  }, [currentTrack]);

  // Sync volume / mute changes
  useEffect(() => {
    if (!globalBgmAudio) return;
    globalBgmAudio.volume = settings.musicMuted ? 0 : Math.max(0, Math.min(1, settings.musicVolume ?? 0.7));
    if (settings.musicMuted) {
      globalBgmAudio.pause();
    } else {
      globalBgmAudio.play().catch(() => {});
    }
  }, [settings.musicMuted, settings.musicVolume]);

  return null;
}

// Reusable toolbar component for audio toggles
export function AudioToolbarControls() {
  const { settings, updateSettings } = useGameStore();

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => {
          const nextMuted = !settings.musicMuted;
          updateSettings({ musicMuted: nextMuted });
          if (!nextMuted && globalBgmAudio) {
            globalBgmAudio.play().catch(() => {});
          }
        }}
        className={`px-2 py-1 text-[8.5px] font-pixel border transition cursor-pointer select-none flex items-center gap-1 ${
          settings.musicMuted
            ? 'bg-red-950/70 border-red-500/60 text-red-300'
            : 'bg-yellow-950/70 border-yellow-500/70 text-yellow-300 hover:bg-yellow-900/60'
        }`}
        title="Toggle Music"
      >
        <span>{settings.musicMuted ? '🔇' : '🎵'}</span>
        <span className="hidden md:inline">{settings.musicMuted ? 'OFF' : 'BGM'}</span>
      </button>

      <button
        onClick={() => updateSettings({ sfxMuted: !settings.sfxMuted })}
        className={`px-2 py-1 text-[8.5px] font-pixel border transition cursor-pointer select-none flex items-center gap-1 ${
          settings.sfxMuted
            ? 'bg-red-950/70 border-red-500/60 text-red-300'
            : 'bg-cyan-950/70 border-cyan-500/70 text-cyan-300 hover:bg-cyan-900/60'
        }`}
        title="Toggle SFX"
      >
        <span>{settings.sfxMuted ? '🔕' : '🔊'}</span>
        <span className="hidden md:inline">{settings.sfxMuted ? 'OFF' : 'SFX'}</span>
      </button>
    </div>
  );
}
