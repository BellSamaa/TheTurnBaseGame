'use client';

import {useEffect, useRef, type RefObject} from 'react';
import {useGameStore} from '@/stores/gameStore';
import {STANDS} from './WeaponStand';

function playIntro(stand: (typeof STANDS)[string], signal: AbortSignal) {
  return new Promise<void>(resolve => {
    const audio = new Audio(`/assets/sounds/secret-intros/${stand.clip}`);
    const started = performance.now();
    let timer: ReturnType<typeof setTimeout>;
    let finished = false;

    function syncVolume() {
      const {sfxMuted, sfxVolume} = useGameStore.getState().settings;
      audio.muted = sfxMuted;
      audio.volume = Math.max(0, Math.min(1, sfxVolume ?? .8));
    }

    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      audio.pause();
      unsubscribe();
      signal.removeEventListener('abort', finish);
      window.removeEventListener('pointerdown', retry, true);
      window.removeEventListener('keydown', retry, true);
      resolve();
    }

    function retry() {
      window.removeEventListener('pointerdown', retry, true);
      window.removeEventListener('keydown', retry, true);
      audio.currentTime = Math.min((performance.now() - started) / 1000, (stand.durationMs - 100) / 1000);
      void audio.play().catch(() => {});
    }

    const unsubscribe = useGameStore.subscribe(syncVolume);
    syncVolume();
    audio.addEventListener('ended', finish, {once:true});
    signal.addEventListener('abort', finish, {once:true});
    timer = setTimeout(finish, stand.durationMs + 2500);
    void audio.play().catch(() => {
      if (finished) return;
      clearTimeout(timer);
      timer = setTimeout(finish, Math.max(0, stand.durationMs - (performance.now() - started)));
      window.addEventListener('pointerdown', retry, true);
      window.addEventListener('keydown', retry, true);
    });
  });
}

/** A single opening queue per battle, independent of room polling and dice timers. */
export default function SecretStandIntro({battleKey, opening, root}: {
  battleKey: string;
  opening: boolean;
  root: RefObject<HTMLDivElement | null>;
}) {
  const lastPlayed = useRef<string>(undefined);
  const openingRef = useRef(opening);
  openingRef.current = opening;

  useEffect(() => {
    if (!openingRef.current || !battleKey || lastPlayed.current === battleKey) return;
    const stage = root.current;
    if (!stage) return;
    const storageKey = `dice-secret-intro:${battleKey}`;
    try { if (sessionStorage.getItem(storageKey)) return; } catch {}

    const queue = Array.from(stage.querySelectorAll<HTMLElement>('[data-stand][data-stand-side]'));
    if (!queue.length) return;
    queue.sort((a, b) => Number(a.dataset.stand === 'musashi') - Number(b.dataset.stand === 'musashi')
      || Number(a.dataset.standSide === 'right') - Number(b.dataset.standSide === 'right')
      || a.getBoundingClientRect().left - b.getBoundingClientRect().left);

    const controller = new AbortController();
    const {signal} = controller;
    let overlay: HTMLElement | undefined;
    let hiddenStand: HTMLElement | undefined;
    let motion: Animation | undefined;

    function restore() {
      motion?.cancel();
      hiddenStand?.removeAttribute('data-intro-hidden');
      overlay?.remove();
    }

    async function run() {
      lastPlayed.current = battleKey;
      try { sessionStorage.setItem(storageKey, '1'); } catch {}
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      for (const original of queue) {
        if (signal.aborted) return;
        const weaponId = original.dataset.stand!;
        const stand = STANDS[weaponId];
        if (!stand || !original.isConnected) continue;

        overlay = document.createElement('div');
        overlay.className = 'secret-stand-intro';
        overlay.dataset.weapon = weaponId;
        overlay.dataset.side = original.dataset.standSide;
        overlay.style.setProperty('--stand-aura', stand.aura);
        overlay.setAttribute('aria-hidden', 'true');
        const image = document.createElement('img');
        image.src = stand.src;
        image.alt = '';
        const aura = document.createElement('span');
        aura.className = 'secret-stand-intro-aura';
        overlay.append(aura, image);
        document.body.append(overlay);
        hiddenStand = original;
        original.setAttribute('data-intro-hidden', '');

        const clip = playIntro(stand, signal);
        if (!reduced) motion = overlay.animate([
          {transform:'scale(.55)', opacity:0}, {transform:'scale(1)', opacity:1},
        ], {duration:380, easing:'cubic-bezier(.2,.8,.2,1)'});
        await clip;
        if (signal.aborted) return;

        const from = overlay.getBoundingClientRect();
        const to = original.getBoundingClientRect();
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        const scale = Math.min(to.width / from.width, to.height / from.height);
        motion = overlay.animate([
          {transform:'scale(1)', opacity:1},
          {transform:`translate(${dx}px, ${dy}px) scale(${scale})`, opacity:0},
        ], {duration:reduced ? 0 : 440, easing:'ease-in-out', fill:'forwards'});
        await motion.finished.catch(() => {});
        restore();
      }
    }

    // Defer one frame so all fighter positions are laid out and Strict Mode can cleanly cancel.
    const frame = requestAnimationFrame(() => void run());
    return () => {
      cancelAnimationFrame(frame);
      controller.abort();
      restore();
    };
  }, [battleKey, root]);

  return null;
}
