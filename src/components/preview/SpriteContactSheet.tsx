'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/stores/gameStore';
import { SPRITE_HELPERS } from '@/lib/constants';
import PixelButton from '@/components/ui/PixelButton';
import PixelFrame from '@/components/ui/PixelFrame';

export default function SpriteContactSheet() {
  const { setPage } = useGameStore();
  const [activeTab, setActiveTab] = useState<
    'characters' | 'hair' | 'faces' | 'shirts' | 'pants' | 'accessories' | 'weapons' | 'classes' | 'frames'
  >('characters');

  // Interactive Live Assembly Preview
  const [selectedBody, setSelectedBody] = useState(0);
  const [selectedHair, setSelectedHair] = useState(0);
  const [selectedFace, setSelectedFace] = useState(0);
  const [selectedShirt, setSelectedShirt] = useState(0);
  const [selectedPants, setSelectedPants] = useState(0);
  const [selectedAcc, setSelectedAcc] = useState(0);

  const categories = [
    { id: 'characters', label: '8 BODIES', count: 8 },
    { id: 'hair', label: '20 HAIRS', count: 20 },
    { id: 'faces', label: '10 FACES', count: 10 },
    { id: 'shirts', label: '20 SHIRTS', count: 20 },
    { id: 'pants', label: '20 PANTS', count: 20 },
    { id: 'accessories', label: '20 ACCS', count: 20 },
    { id: 'weapons', label: '9 WEAPONS', count: 9 },
    { id: 'classes', label: '6 CLASSES', count: 6 },
    { id: 'frames', label: 'UI & FRAMES', count: 46 },
  ];

  return (
    <div className="min-h-screen w-full bg-[#07090e] text-slate-100 p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between pb-6 border-b-2 border-yellow-500/50 gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-pixel text-yellow-400 flex items-center gap-2">
            <span>🔬</span> SPRITE CONTACT SHEET & VERIFICATION MATRIX
          </h1>
          <p className="text-[10px] text-slate-400 mt-1">
            Total 159 individual sliced sprites with alpha transparency & zero overlapping bleeding.
          </p>
        </div>

        <div className="flex gap-2">
          <PixelButton variant="gold" size="sm" onClick={() => setPage('home')}>
            ⬅ RETURN TO GAME
          </PixelButton>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Layered Assembly Preview (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <PixelFrame variant="gold" title="LIVE CHARACTER COMPOSITE">
            <div className="flex flex-col items-center p-3">
              {/* Paper Doll Canvas */}
              <div className="relative w-48 h-64 bg-slate-950 border-2 border-yellow-500/70 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden mb-3">
                {/* 1. Body */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src={SPRITE_HELPERS.body(selectedBody)}
                    alt="Body"
                    width={110}
                    height={170}
                    className="object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
                  />
                </div>

                {/* 2. Pants */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Image
                    src={SPRITE_HELPERS.pants(selectedPants)}
                    alt="Pants"
                    width={85}
                    height={85}
                    className="object-contain translate-y-10"
                  />
                </div>

                {/* 3. Shirt */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Image
                    src={SPRITE_HELPERS.shirt(selectedShirt)}
                    alt="Shirt"
                    width={95}
                    height={85}
                    className="object-contain translate-y-0"
                  />
                </div>

                {/* 4. Face */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Image
                    src={SPRITE_HELPERS.face(selectedFace)}
                    alt="Face"
                    width={45}
                    height={45}
                    className="object-contain -translate-y-10"
                  />
                </div>

                {/* 5. Hair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Image
                    src={SPRITE_HELPERS.hair(selectedHair)}
                    alt="Hair"
                    width={90}
                    height={70}
                    className="object-contain -translate-y-14"
                  />
                </div>

                {/* 6. Accessory */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Image
                    src={SPRITE_HELPERS.accessory(selectedAcc)}
                    alt="Accessory"
                    width={95}
                    height={95}
                    className="object-contain translate-y-1"
                  />
                </div>
              </div>

              {/* Current Active Assembly Stats */}
              <div className="w-full text-[8.5px] font-pixel text-slate-300 space-y-1 bg-slate-900/80 p-2.5 border border-slate-700">
                <p>• Body: #{selectedBody + 1} (body_{String(selectedBody + 1).padStart(2, '0')}.png)</p>
                <p>• Hair: #{selectedHair + 1} (hair_{String(selectedHair + 1).padStart(2, '0')}.png)</p>
                <p>• Face: #{selectedFace + 1} (face_{String(selectedFace + 1).padStart(2, '0')}.png)</p>
                <p>• Shirt: #{selectedShirt + 1} (shirt_{String(selectedShirt + 1).padStart(2, '0')}.png)</p>
                <p>• Pants: #{selectedPants + 1} (pants_{String(selectedPants + 1).padStart(2, '0')}.png)</p>
                <p>• Acc: #{selectedAcc + 1} (acc_{String(selectedAcc + 1).padStart(2, '0')}.png)</p>
              </div>
            </div>
          </PixelFrame>
        </div>

        {/* Right Column: Sprite Contact Sheet Grids (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-black/70 border border-slate-700">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id as typeof activeTab)}
                className={`
                  px-2.5 py-1.5 text-[9px] font-pixel transition cursor-pointer
                  ${
                    activeTab === cat.id
                      ? 'bg-yellow-500 text-black font-bold shadow-[0_0_8px_rgba(234,179,8,0.7)]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sliced Sprites Grid Showcase */}
          <PixelFrame variant="cyan" title={`SLICED SPRITES: ${activeTab.toUpperCase()}`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[550px] overflow-y-auto pr-1">
              {/* 1. Bodies */}
              {activeTab === 'characters' &&
                Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedBody(i)}
                    className={`
                      p-2 bg-slate-900 border-2 cursor-pointer flex flex-col items-center justify-between text-center transition
                      ${selectedBody === i ? 'border-yellow-400 bg-yellow-950/40 shadow' : 'border-slate-700 hover:border-slate-500'}
                    `}
                  >
                    <div className="relative w-20 h-28 mb-1">
                      <Image
                        src={SPRITE_HELPERS.body(i)}
                        alt={`Body ${i + 1}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[8px] font-bold text-yellow-300">body_{String(i + 1).padStart(2, '0')}.png</span>
                    <span className="text-[7px] text-slate-400">Click to preview</span>
                  </div>
                ))}

              {/* 2. Hairs */}
              {activeTab === 'hair' &&
                Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedHair(i)}
                    className={`
                      p-2 bg-slate-900 border-2 cursor-pointer flex flex-col items-center justify-between text-center transition
                      ${selectedHair === i ? 'border-yellow-400 bg-yellow-950/40 shadow' : 'border-slate-700 hover:border-slate-500'}
                    `}
                  >
                    <div className="relative w-16 h-16 mb-1">
                      <Image
                        src={SPRITE_HELPERS.hair(i)}
                        alt={`Hair ${i + 1}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[8px] font-bold text-yellow-300">hair_{String(i + 1).padStart(2, '0')}.png</span>
                  </div>
                ))}

              {/* 3. Faces */}
              {activeTab === 'faces' &&
                Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedFace(i)}
                    className={`
                      p-2 bg-slate-900 border-2 cursor-pointer flex flex-col items-center justify-between text-center transition
                      ${selectedFace === i ? 'border-yellow-400 bg-yellow-950/40 shadow' : 'border-slate-700 hover:border-slate-500'}
                    `}
                  >
                    <div className="relative w-16 h-16 mb-1">
                      <Image
                        src={SPRITE_HELPERS.face(i)}
                        alt={`Face ${i + 1}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[8px] font-bold text-yellow-300">face_{String(i + 1).padStart(2, '0')}.png</span>
                  </div>
                ))}

              {/* 4. Shirts */}
              {activeTab === 'shirts' &&
                Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedShirt(i)}
                    className={`
                      p-2 bg-slate-900 border-2 cursor-pointer flex flex-col items-center justify-between text-center transition
                      ${selectedShirt === i ? 'border-yellow-400 bg-yellow-950/40 shadow' : 'border-slate-700 hover:border-slate-500'}
                    `}
                  >
                    <div className="relative w-16 h-16 mb-1">
                      <Image
                        src={SPRITE_HELPERS.shirt(i)}
                        alt={`Shirt ${i + 1}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[8px] font-bold text-yellow-300">shirt_{String(i + 1).padStart(2, '0')}.png</span>
                  </div>
                ))}

              {/* 5. Pants */}
              {activeTab === 'pants' &&
                Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedPants(i)}
                    className={`
                      p-2 bg-slate-900 border-2 cursor-pointer flex flex-col items-center justify-between text-center transition
                      ${selectedPants === i ? 'border-yellow-400 bg-yellow-950/40 shadow' : 'border-slate-700 hover:border-slate-500'}
                    `}
                  >
                    <div className="relative w-16 h-16 mb-1">
                      <Image
                        src={SPRITE_HELPERS.pants(i)}
                        alt={`Pants ${i + 1}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[8px] font-bold text-yellow-300">pants_{String(i + 1).padStart(2, '0')}.png</span>
                  </div>
                ))}

              {/* 6. Accessories */}
              {activeTab === 'accessories' &&
                Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedAcc(i)}
                    className={`
                      p-2 bg-slate-900 border-2 cursor-pointer flex flex-col items-center justify-between text-center transition
                      ${selectedAcc === i ? 'border-yellow-400 bg-yellow-950/40 shadow' : 'border-slate-700 hover:border-slate-500'}
                    `}
                  >
                    <div className="relative w-16 h-16 mb-1">
                      <Image
                        src={SPRITE_HELPERS.accessory(i)}
                        alt={`Acc ${i + 1}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[8px] font-bold text-yellow-300">acc_{String(i + 1).padStart(2, '0')}.png</span>
                  </div>
                ))}

              {/* 7. Weapons */}
              {activeTab === 'weapons' &&
                [
                  'weapon_greatsword',
                  'weapon_bow',
                  'weapon_dagger_dragon',
                  'weapon_revolver',
                  'weapon_staff',
                  'weapon_infinity_ring',
                  'weapon_spirit_stone',
                  'weapon_chronos_watch',
                  'weapon_headband_fire',
                ].map((wid) => (
                  <div
                    key={wid}
                    className="p-2 bg-slate-900 border-2 border-slate-700 flex flex-col items-center justify-between text-center"
                  >
                    <div className="relative w-20 h-20 mb-1">
                      <Image
                        src={`/assets/sprites/weapons/${wid}.png`}
                        alt={wid}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[8px] font-bold text-yellow-300">{wid}.png</span>
                  </div>
                ))}

              {/* 8. Classes */}
              {activeTab === 'classes' &&
                [
                  'class_assassin',
                  'class_boxer',
                  'class_juggernaut',
                  'class_mage',
                  'class_tanker',
                  'class_warrior',
                ].map((cid) => (
                  <div
                    key={cid}
                    className="p-2 bg-slate-900 border-2 border-slate-700 col-span-2 flex flex-col items-center justify-between text-center"
                  >
                    <div className="relative w-full h-14 mb-1">
                      <Image
                        src={`/assets/sprites/ui/classes/${cid}.png`}
                        alt={cid}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[8px] font-bold text-yellow-300">{cid}.png</span>
                  </div>
                ))}

              {/* 9. UI Frames & Modes */}
              {activeTab === 'frames' &&
                [
                  'tier_01', 'tier_02', 'tier_03', 'tier_04', 'tier_05', 'tier_06', 'tier_07',
                  'frame_d20_tray', 'frame_d6_tray', 'frame_battle_log', 'frame_hp_gold',
                  'frame_square_cyan', 'frame_skill_slot', 'btn_roll_dice', 'btn_end_turn'
                ].map((fid) => (
                  <div
                    key={fid}
                    className="p-2 bg-slate-900 border-2 border-slate-700 flex flex-col items-center justify-between text-center"
                  >
                    <div className="relative w-16 h-16 mb-1">
                      <Image
                        src={`/assets/sprites/ui/frames/${fid}.png`}
                        alt={fid}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[7px] font-bold text-yellow-300">{fid}.png</span>
                  </div>
                ))}
            </div>
          </PixelFrame>
        </div>
      </div>
    </div>
  );
}
