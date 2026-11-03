'use client';

import React from 'react';
import type { CharacterCustomization, WeaponInfo } from '@/types/game';
import { SPRITE_HELPERS } from '@/lib/constants';

export interface CharacterRendererProps {
  character: CharacterCustomization;
  weapon?: WeaponInfo;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  facing?: 'left' | 'right';
  showAura?: boolean;
  auraColor?: string;
  showShadow?: boolean;
  isHit?: boolean;
}

// Metadata for body landmarks (8 bodies: male/female across 4 builds)
export const BODY_METADATA: Record<
  number,
  {
    nameEn: string;
    nameVi: string;
    headTopPct: number;
    faceTopPct: number;
    torsoTopPct: number;
    waistTopPct: number;
    shirtWidthPct: number;
    pantsWidthPct: number;
  }
> = {
  0: { nameEn: 'Knight Male', nameVi: 'Chiến Binh Nam', headTopPct: 3, faceTopPct: 13.5, torsoTopPct: 27, waistTopPct: 55, shirtWidthPct: 56, pantsWidthPct: 46 },
  1: { nameEn: 'Paladin Male', nameVi: 'Hiệp Sĩ Nam', headTopPct: 3, faceTopPct: 13.5, torsoTopPct: 27, waistTopPct: 55, shirtWidthPct: 58, pantsWidthPct: 48 },
  2: { nameEn: 'Titan Male', nameVi: 'Đấu Sĩ Vạm Vỡ', headTopPct: 3, faceTopPct: 13.5, torsoTopPct: 26, waistTopPct: 54, shirtWidthPct: 64, pantsWidthPct: 52 },
  3: { nameEn: 'Juggernaut Male', nameVi: 'Khổng Lồ Thiết Giáp', headTopPct: 3, faceTopPct: 13.5, torsoTopPct: 26, waistTopPct: 54, shirtWidthPct: 68, pantsWidthPct: 55 },
  4: { nameEn: 'Rogue Female', nameVi: 'Sát Thủ Nữ', headTopPct: 3.5, faceTopPct: 14, torsoTopPct: 28, waistTopPct: 55, shirtWidthPct: 52, pantsWidthPct: 44 },
  5: { nameEn: 'Ranger Female', nameVi: 'Cung Thủ Nữ', headTopPct: 3.5, faceTopPct: 14, torsoTopPct: 28, waistTopPct: 55, shirtWidthPct: 54, pantsWidthPct: 46 },
  6: { nameEn: 'Mage Female', nameVi: 'Pháp Sư Nữ', headTopPct: 3.5, faceTopPct: 14, torsoTopPct: 27, waistTopPct: 55, shirtWidthPct: 56, pantsWidthPct: 47 },
  7: { nameEn: 'Valkyrie Female', nameVi: 'Chiến Binh Nữ', headTopPct: 3.5, faceTopPct: 14, torsoTopPct: 27, waistTopPct: 55, shirtWidthPct: 60, pantsWidthPct: 50 },
};

// Metadata for the 20 accessories with precise anchor points & attachment logic
export interface AccessoryMeta {
  type: 'glasses' | 'cape' | 'belt' | 'earring' | 'headband' | 'necklace';
  topPct: number;
  leftPct?: number; // default centered at 50%
  widthPct: number;
  zIndex: number;
}

export const ACCESSORY_METADATA: Record<number, AccessoryMeta> = {
  0: { type: 'glasses', topPct: 15.5, widthPct: 28, zIndex: 60 },
  1: { type: 'glasses', topPct: 15.5, widthPct: 27, zIndex: 60 },
  2: { type: 'glasses', topPct: 15, widthPct: 29, zIndex: 60 },
  3: { type: 'earring', topPct: 14, leftPct: 40, widthPct: 15, zIndex: 60 },
  4: { type: 'headband', topPct: 8, widthPct: 34, zIndex: 55 },
  5: { type: 'glasses', topPct: 16, widthPct: 24, zIndex: 60 },
  6: { type: 'cape', topPct: 25, widthPct: 64, zIndex: 12 }, // Behind body
  7: { type: 'cape', topPct: 24, widthPct: 66, zIndex: 12 }, // Behind body
  8: { type: 'cape', topPct: 24, widthPct: 66, zIndex: 12 },
  9: { type: 'cape', topPct: 26, widthPct: 58, zIndex: 12 },
  10: { type: 'cape', topPct: 20, widthPct: 76, zIndex: 12 }, // Wings
  11: { type: 'cape', topPct: 25, widthPct: 52, zIndex: 12 }, // Quiver
  12: { type: 'necklace', topPct: 24, widthPct: 46, zIndex: 35 },
  13: { type: 'glasses', topPct: 18, widthPct: 30, zIndex: 60 }, // Shinobi mask
  14: { type: 'belt', topPct: 53, widthPct: 44, zIndex: 35 },
  15: { type: 'cape', topPct: 28, leftPct: 40, widthPct: 42, zIndex: 12 },
  16: { type: 'belt', topPct: 53, widthPct: 43, zIndex: 35 },
  17: { type: 'belt', topPct: 52, widthPct: 45, zIndex: 35 },
  18: { type: 'necklace', topPct: 25, widthPct: 28, zIndex: 35 },
  19: { type: 'headband', topPct: 5, widthPct: 35, zIndex: 55 }, // Crown
};

export default function CharacterRenderer({
  character,
  weapon,
  className = '',
  size = 'md',
  facing = 'right',
  showAura = false,
  auraColor = '#fbbf24',
  showShadow = true,
  isHit = false,
}: CharacterRendererProps) {
  const bodyIdx = (character?.baseIndex ?? 0) % 8;
  const meta = BODY_METADATA[bodyIdx] || BODY_METADATA[0];

  const hairIdx = (character?.hairIndex ?? 0) % 20;
  const faceIdx = (character?.faceIndex ?? 0) % 10;
  const shirtIdx = (character?.shirtIndex ?? 0) % 20;
  const pantsIdx = (character?.pantsIndex ?? 0) % 20;

  // Has accessory check: -1 means NONE
  const hasAccessory =
    character?.accessoryIndex !== undefined &&
    character?.accessoryIndex !== null &&
    character.accessoryIndex >= 0 &&
    character.accessoryIndex < 20;
  const accIdx = hasAccessory ? character.accessoryIndex : -1;
  const accMeta = hasAccessory ? ACCESSORY_METADATA[accIdx] || ACCESSORY_METADATA[0] : null;

  // Size mappings (aspect ratio 2:3 preserved)
  const sizeClasses = {
    xs: 'w-10 h-15',
    sm: 'w-20 h-30',
    md: 'w-36 h-54',
    lg: 'w-48 h-72',
    xl: 'w-60 h-90',
  }[size];

  const mirrorClass = facing === 'left' ? 'scale-x-[-1]' : '';
  const hitShakeClass = isHit ? 'animate-dice-shake brightness-150 filter' : '';

  return (
    <div
      className={`relative inline-block select-none overflow-visible ${sizeClasses} ${mirrorClass} ${hitShakeClass} ${className}`}
      style={{ aspectRatio: '2 / 3' }}
    >
      {/* Optional Aura Glow */}
      {showAura && (
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-45 animate-pulse pointer-events-none"
          style={{ backgroundColor: auraColor }}
        />
      )}

      {/* Ground Pixel Drop Shadow */}
      {showShadow && (
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[70%] h-3 rounded-[50%] bg-black/65 blur-[1px] pointer-events-none z-10"
        />
      )}

      {/* 1. Cape / Back Accessory Layer (zIndex: 12, behind body) */}
      {hasAccessory && accMeta && accMeta.zIndex < 20 && (
        <img
          src={SPRITE_HELPERS.accessory(accIdx)}
          alt="Cape/Back Item"
          className="absolute object-contain pixelated pointer-events-none transition-all drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
          style={{
            top: `${accMeta.topPct}%`,
            left: `${accMeta.leftPct ?? 50}%`,
            transform: 'translateX(-50%)',
            width: `${accMeta.widthPct}%`,
            zIndex: accMeta.zIndex,
          }}
        />
      )}

      {/* 2. Base Body Layer (zIndex: 15, anchored at bottom) */}
      <img
        src={SPRITE_HELPERS.body(bodyIdx)}
        alt="Character Body"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[96%] w-auto max-w-full object-contain pixelated z-15 transition-all drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
      />

      {/* 3. Pants Layer (zIndex: 20, anchored at waist) */}
      <div
        className="absolute pointer-events-none transition-all"
        style={{
          top: `${meta.waistTopPct}%`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${meta.pantsWidthPct}%`,
          zIndex: 20,
        }}
      >
        <img
          src={SPRITE_HELPERS.pants(pantsIdx)}
          alt="Pants"
          className="w-full h-auto object-contain pixelated drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
        />
        {/* Subtle isolated tint for pants color */}
        {character?.pantsColor && (
          <div
            className="absolute inset-0 mix-blend-color opacity-25 pointer-events-none"
            style={{ backgroundColor: character.pantsColor }}
          />
        )}
      </div>

      {/* 4. Shirt Layer (zIndex: 30, anchored at torso/shoulders) */}
      <div
        className="absolute pointer-events-none transition-all"
        style={{
          top: `${meta.torsoTopPct}%`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${meta.shirtWidthPct}%`,
          zIndex: 30,
        }}
      >
        <img
          src={SPRITE_HELPERS.shirt(shirtIdx)}
          alt="Shirt"
          className="w-full h-auto object-contain pixelated drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
        />
        {/* Subtle isolated tint for shirt color */}
        {character?.shirtColor && (
          <div
            className="absolute inset-0 mix-blend-color opacity-25 pointer-events-none"
            style={{ backgroundColor: character.shirtColor }}
          />
        )}
      </div>

      {/* 5. Mid Accessories (Belts/Necklaces, zIndex: 35) */}
      {hasAccessory && accMeta && accMeta.zIndex >= 30 && accMeta.zIndex < 40 && (
        <img
          src={SPRITE_HELPERS.accessory(accIdx)}
          alt="Accessory Belt/Necklace"
          className="absolute object-contain pixelated pointer-events-none transition-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
          style={{
            top: `${accMeta.topPct}%`,
            left: `${accMeta.leftPct ?? 50}%`,
            transform: 'translateX(-50%)',
            width: `${accMeta.widthPct}%`,
            zIndex: accMeta.zIndex,
          }}
        />
      )}

      {/* 6. Face Layer (zIndex: 40, anchored on head) */}
      <img
        src={SPRITE_HELPERS.face(faceIdx)}
        alt="Face"
        className="absolute object-contain pixelated pointer-events-none transition-all"
        style={{
          top: `${meta.faceTopPct}%`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '32%',
          zIndex: 40,
        }}
      />

      {/* 7. Hair Layer (zIndex: 50, anchored to top of head) */}
      <div
        className="absolute pointer-events-none transition-all"
        style={{
          top: `${meta.headTopPct}%`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '50%',
          zIndex: 50,
        }}
      >
        <img
          src={SPRITE_HELPERS.hair(hairIdx)}
          alt="Hair"
          className="w-full h-auto object-contain pixelated drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)]"
        />
        {/* Isolated tint for hair color */}
        {character?.hairColor && (
          <div
            className="absolute inset-0 mix-blend-color opacity-30 pointer-events-none"
            style={{ backgroundColor: character.hairColor }}
          />
        )}
      </div>

      {/* 8. Top Accessories (Glasses, Masks, Headbands, zIndex: 55-60) */}
      {hasAccessory && accMeta && accMeta.zIndex >= 50 && (
        <img
          src={SPRITE_HELPERS.accessory(accIdx)}
          alt="Accessory Glasses/Head"
          className="absolute object-contain pixelated pointer-events-none transition-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
          style={{
            top: `${accMeta.topPct}%`,
            left: `${accMeta.leftPct ?? 50}%`,
            transform: 'translateX(-50%)',
            width: `${accMeta.widthPct}%`,
            zIndex: accMeta.zIndex,
          }}
        />
      )}

      {/* 9. Weapon Attachment (if equipped) */}
      {weapon && (
        <div
          className="absolute pointer-events-none transition-all"
          style={{
            bottom: '15%',
            right: '-10%',
            width: '42%',
            zIndex: 65,
          }}
        >
          <img
            src={weapon.image}
            alt={weapon.name}
            className="w-full h-auto object-contain pixelated drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
          />
        </div>
      )}
    </div>
  );
}
