'use client';

const STANDS: Record<string, { src: string; name: string }> = {
  musashi:{src:'/assets/weapon-update-2/musashi-stand.webp',name:'Miyamoto Musashi'},
  king_slasher:{src:'/assets/weapon-update-1/sukuna.png',name:'Sukuna'},
  death_note:{src:'/assets/weapon-update-1/light.png',name:'Light'},
  infinity_ring: { src: '/assets/sprites/stands/gojo.png', name: 'Gojo' },
  fire_headband: { src: '/assets/sprites/stands/uchiha.png', name: 'Madara & Sasuke' },
};

export default function WeaponStand({ weaponId, side }: { weaponId: string; side: 'left' | 'right' }) {
  const stand = STANDS[weaponId];
  if (!stand) return null;
  return <div className={`weapon-stand weapon-stand-${side}`} data-stand={weaponId} aria-hidden="true">
    <img src={stand.src} alt={stand.name} width={1536} height={1024} draggable={false} />
  </div>;
}
