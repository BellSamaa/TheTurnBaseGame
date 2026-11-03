'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { BATTLE_TRACKS, LOBBY_BGM } from '@/lib/constants';

export default function AudioManager() {
  const { currentPage, settings, updateSettings } = useGameStore();
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

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
      <button
        onClick={() => updateSettings({ musicMuted: !settings.musicMuted })}
        className="px-2.5 py-1.5 text-[9px] font-pixel bg-slate-900/80 border-2 border-yellow-500/70 text-yellow-300 hover:bg-slate-800 transition shadow-[0_0_10px_rgba(234,179,8,0.3)] flex items-center gap-1.5 cursor-pointer select-none"
        title="Toggle Music (Bật/Tắt Nhạc)"
      >
        <span>{settings.musicMuted ? '🔇' : '🎵'}</span>
        <span className="hidden sm:inline">
          {settings.musicMuted ? 'MUTE' : 'MUSIC'}
        </span>
      </button>

      <button
        onClick={() => updateSettings({ sfxMuted: !settings.sfxMuted })}
        className="px-2.5 py-1.5 text-[9px] font-pixel bg-slate-900/80 border-2 border-cyan-500/70 text-cyan-300 hover:bg-slate-800 transition shadow-[0_0_10px_rgba(6,182,212,0.3)] flex items-center gap-1.5 cursor-pointer select-none"
        title="Toggle SFX (Bật/Tắt Hiệu Ứng Âm Thanh)"
      >
        <span>{settings.sfxMuted ? '🔕' : '🔊'}</span>
        <span className="hidden sm:inline">
          {settings.sfxMuted ? 'SFX OFF' : 'SFX'}
        </span>
      </button>
    </div>
  );
}
