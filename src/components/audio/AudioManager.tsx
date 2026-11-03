'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { BATTLE_TRACKS, LOBBY_BGM } from '@/lib/constants';

// Headless Audio Controller (manages BGM tracks and playback)
export default function AudioManager() {
  const { currentPage, settings } = useGameStore();
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<string>(LOBBY_BGM);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Pick track based on currentPage (battle vs menu)
  useEffect(() => {
    if (currentPage === 'battle') {
      const randomBattleTrack =
        BATTLE_TRACKS[Math.floor(Math.random() * BATTLE_TRACKS.length)];
      setCurrentTrack(randomBattleTrack);
    } else {
      setCurrentTrack(LOBBY_BGM);
    }
  }, [currentPage]);

  // Audio setup & playback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!bgmAudioRef.current) {
      bgmAudioRef.current = new Audio();
      bgmAudioRef.current.loop = true;
    }

    const audio = bgmAudioRef.current;
    if (audio.src !== window.location.origin + currentTrack && !audio.src.endsWith(currentTrack)) {
      audio.src = currentTrack;
    }

    audio.volume = settings.musicMuted ? 0 : settings.musicVolume;

    if (hasInteracted && !settings.musicMuted) {
      audio.play().catch(() => {
        // Autoplay policy waiting for user click
      });
    }

    const unlockAudio = () => {
      setHasInteracted(true);
      if (!settings.musicMuted && bgmAudioRef.current) {
        bgmAudioRef.current.play().catch(() => {});
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [currentTrack, hasInteracted, settings.musicMuted, settings.musicVolume]);

  // Update volume / mute when settings change
  useEffect(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.volume = settings.musicMuted ? 0 : settings.musicVolume;
      if (settings.musicMuted) {
        bgmAudioRef.current.pause();
      } else if (hasInteracted) {
        bgmAudioRef.current.play().catch(() => {});
      }
    }
  }, [settings.musicMuted, settings.musicVolume, hasInteracted]);

  // Headless - does not render floating element that collides with header!
  return null;
}

// Reusable toolbar component for audio toggles
export function AudioToolbarControls() {
  const { settings, updateSettings } = useGameStore();

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => updateSettings({ musicMuted: !settings.musicMuted })}
        className={`px-3 py-1.5 text-[10px] sm:text-xs font-pixel border-2 transition cursor-pointer select-none flex items-center gap-1 ${
          settings.musicMuted
            ? 'bg-red-950/70 border-red-500/60 text-red-300'
            : 'bg-yellow-950/70 border-yellow-400/70 text-yellow-300 hover:bg-yellow-900/60 shadow-[0_0_10px_rgba(250,204,21,0.2)]'
        }`}
        title="Toggle Music"
      >
        <span>{settings.musicMuted ? '🔇' : '🎵'}</span>
        <span className="hidden md:inline">{settings.musicMuted ? 'OFF' : 'BGM'}</span>
      </button>

      <button
        onClick={() => updateSettings({ sfxMuted: !settings.sfxMuted })}
        className={`px-3 py-1.5 text-[10px] sm:text-xs font-pixel border-2 transition cursor-pointer select-none flex items-center gap-1 ${
          settings.sfxMuted
            ? 'bg-red-950/70 border-red-500/60 text-red-300'
            : 'bg-cyan-950/70 border-cyan-400/70 text-cyan-300 hover:bg-cyan-900/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
        }`}
        title="Toggle SFX"
      >
        <span>{settings.sfxMuted ? '🔕' : '🔊'}</span>
        <span className="hidden md:inline">{settings.sfxMuted ? 'OFF' : 'SFX'}</span>
      </button>
    </div>
  );
}
