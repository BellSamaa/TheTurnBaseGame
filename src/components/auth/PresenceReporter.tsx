'use client';
import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
export default function PresenceReporter() {
  const userId = useGameStore(s => s.currentUser?.id);
  useEffect(() => {
    if (!userId) return;
    const tabId = crypto.randomUUID();
    let closed = false;
    let last = '';
    // Serialize writes so a delayed heartbeat cannot restore a closed tab.
    let queue = Promise.resolve();
    const send = (activity: string) => {
      queue = queue.then(async () => {
        await fetch('/api/presence', { method: 'POST', keepalive: true,
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tabId, activity }) });
      }).catch(() => {});
    };
    const activity = () => {
      const s = useGameStore.getState();
      return s.currentPage === 'pve' ? 'battle' : s.currentPage === 'battle' && s.battleState?.phase !== 'game_over' ? 'battle' : s.onlineRoomCode ? 'lobby' : 'online';
    };
    const beat = () => { if (!closed) { last = activity(); send(last); } };
    const unsubscribe = useGameStore.subscribe(() => { if (!closed && activity() !== last) beat(); });
    const leave = () => { closed = true; send('offline'); };
    const resume = () => { closed = false; beat(); };
    beat();
    const timer = setInterval(beat, 20000);
    window.addEventListener('pagehide', leave);
    window.addEventListener('pageshow', resume);
    window.addEventListener('focus', beat);
    return () => { clearInterval(timer); unsubscribe(); window.removeEventListener('pagehide', leave); window.removeEventListener('pageshow', resume); window.removeEventListener('focus', beat); leave(); };
  }, [userId]);
  return null;
}
