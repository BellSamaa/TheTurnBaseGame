'use client';

export const STANDS: Record<string, { src: string; name: string; clip: string; durationMs: number; aura: string }> = {
  infinity_ring: {src:'/assets/sprites/stands/gojo.png', name:'Gojo', clip:'gomen-amanai-jjk.mp3', durationMs:3984, aura:'#ab7cff'},
  fire_headband: {src:'/assets/sprites/stands/uchiha.png', name:'Madara & Sasuke', clip:'madara-ika.mp3', durationMs:7296, aura:'#f45b7d'},
  king_slasher: {src:'/assets/weapon-update-1/sukuna.png', name:'Sukuna', clip:'sukuna-domain-theme.mp3', durationMs:5150, aura:'#ff572e'},
  death_note: {src:'/assets/weapon-update-1/light.png', name:'Light', clip:'death-note-light-yagami-is-sus.mp3', durationMs:4317, aura:'#ce426e'},
  musashi: {src:'/assets/weapon-update-2/musashi-stand.webp', name:'Miyamoto Musashi', clip:'musashi-vs-hokusai-fight-intro.mp3', durationMs:19471, aura:'#a5d6ff'},
};

export default function WeaponStand({ weaponId, side }: { weaponId: string; side: 'left' | 'right' }) {
  const stand = STANDS[weaponId];
  if (!stand) return null;
  return <div className={`weapon-stand weapon-stand-${side}`} data-stand={weaponId} data-stand-side={side} aria-hidden="true">
    <img src={stand.src} alt={stand.name} width={1536} height={1024} draggable={false} />
  </div>;
}
