'use client';

import React from 'react';

export type PixelIconType =
  | 'sword'
  | 'shield'
  | 'dagger'
  | 'dice20'
  | 'dice6'
  | 'sparkles'
  | 'lightning'
  | 'heart'
  | 'skull'
  | 'trophy'
  | 'crown'
  | 'robot'
  | 'flame'
  | 'freeze'
  | 'poison'
  | 'stun'
  | 'user'
  | 'hair'
  | 'face'
  | 'shirt'
  | 'pants'
  | 'ring'
  | 'palette'
  | 'map'
  | 'scroll'
  | 'save'
  | 'arrowLeft'
  | 'cross'
  | 'check'
  | 'volumeOn'
  | 'volumeOff'
  | 'gear'
  | 'lock'
  | 'users'
  | 'eye'
  | 'ban';

interface PixelIconProps {
  name: PixelIconType;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string;
}

const SIZE_MAP: Record<string, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export default function PixelIcon({
  name,
  size = 'md',
  className = '',
  color = 'currentColor',
}: PixelIconProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 20;

  const renderIcon = () => {
    switch (name) {
      case 'sword':
        // Pixel Sword (blade, crossguard, hilt, pommel)
        return (
          <g fill={color}>
            <rect x="13" y="2" width="2" height="2" />
            <rect x="11" y="4" width="2" height="2" />
            <rect x="9" y="6" width="2" height="2" />
            <rect x="7" y="8" width="2" height="2" />
            <rect x="5" y="10" width="2" height="2" />
            {/* Crossguard */}
            <rect x="3" y="9" width="2" height="2" />
            <rect x="4" y="10" width="2" height="2" />
            <rect x="7" y="11" width="2" height="2" />
            <rect x="8" y="12" width="2" height="2" />
            {/* Hilt */}
            <rect x="3" y="12" width="2" height="2" />
            {/* Pommel */}
            <rect x="2" y="13" width="2" height="2" />
          </g>
        );

      case 'shield':
        // Pixel Shield
        return (
          <g fill={color}>
            <rect x="3" y="2" width="10" height="2" />
            <rect x="2" y="4" width="12" height="4" />
            <rect x="3" y="8" width="10" height="3" />
            <rect x="4" y="11" width="8" height="2" />
            <rect x="6" y="13" width="4" height="2" />
            <rect x="7" y="15" width="2" height="1" />
          </g>
        );

      case 'dagger':
        // Pixel Dagger
        return (
          <g fill={color}>
            <rect x="12" y="2" width="2" height="2" />
            <rect x="10" y="4" width="2" height="3" />
            <rect x="8" y="7" width="2" height="3" />
            <rect x="5" y="9" width="4" height="2" />
            <rect x="4" y="11" width="2" height="2" />
            <rect x="3" y="13" width="2" height="2" />
          </g>
        );

      case 'dice20':
        // Pixel D20 Icosahedron Silhouette
        return (
          <g fill={color}>
            <rect x="6" y="1" width="4" height="2" />
            <rect x="4" y="3" width="8" height="2" />
            <rect x="2" y="5" width="12" height="6" />
            <rect x="4" y="11" width="8" height="2" />
            <rect x="6" y="13" width="4" height="2" />
            {/* Facet lines */}
            <rect x="7" y="4" width="2" height="8" opacity="0.3" fill="#000" />
            <rect x="4" y="7" width="8" height="2" opacity="0.3" fill="#000" />
          </g>
        );

      case 'dice6':
        // Pixel D6 Cube
        return (
          <g fill={color}>
            <rect x="2" y="2" width="12" height="12" rx="1" />
            {/* Pips in black */}
            <rect x="4" y="4" width="2" height="2" fill="#000" />
            <rect x="10" y="4" width="2" height="2" fill="#000" />
            <rect x="7" y="7" width="2" height="2" fill="#000" />
            <rect x="4" y="10" width="2" height="2" fill="#000" />
            <rect x="10" y="10" width="2" height="2" fill="#000" />
          </g>
        );

      case 'lightning':
        // Pixel Lightning Bolt
        return (
          <g fill={color}>
            <rect x="9" y="1" width="3" height="3" />
            <rect x="7" y="4" width="4" height="3" />
            <rect x="5" y="7" width="7" height="2" />
            <rect x="4" y="9" width="4" height="3" />
            <rect x="5" y="12" width="2" height="3" />
          </g>
        );

      case 'sparkles':
        // Pixel Magic Sparkle
        return (
          <g fill={color}>
            <rect x="7" y="2" width="2" height="12" />
            <rect x="2" y="7" width="12" height="2" />
            <rect x="5" y="5" width="6" height="6" />
            <rect x="12" y="3" width="2" height="2" />
            <rect x="2" y="11" width="2" height="2" />
          </g>
        );

      case 'heart':
        // Pixel Heart
        return (
          <g fill={color}>
            <rect x="3" y="3" width="4" height="2" />
            <rect x="9" y="3" width="4" height="2" />
            <rect x="2" y="5" width="12" height="4" />
            <rect x="3" y="9" width="10" height="2" />
            <rect x="5" y="11" width="6" height="2" />
            <rect x="7" y="13" width="2" height="2" />
          </g>
        );

      case 'skull':
        // Pixel Skull
        return (
          <g fill={color}>
            <rect x="4" y="2" width="8" height="2" />
            <rect x="2" y="4" width="12" height="6" />
            <rect x="4" y="10" width="8" height="4" />
            {/* Eye sockets & nose */}
            <rect x="4" y="6" width="2" height="2" fill="#000" />
            <rect x="10" y="6" width="2" height="2" fill="#000" />
            <rect x="7" y="8" width="2" height="1" fill="#000" />
            {/* Teeth */}
            <rect x="5" y="11" width="1" height="2" fill="#000" />
            <rect x="7" y="11" width="1" height="2" fill="#000" />
            <rect x="9" y="11" width="1" height="2" fill="#000" />
          </g>
        );

      case 'trophy':
        // Pixel Trophy
        return (
          <g fill={color}>
            <rect x="4" y="2" width="8" height="6" />
            <rect x="2" y="3" width="2" height="3" />
            <rect x="12" y="3" width="2" height="3" />
            <rect x="6" y="8" width="4" height="2" />
            <rect x="7" y="10" width="2" height="2" />
            <rect x="4" y="12" width="8" height="3" />
          </g>
        );

      case 'crown':
        // Pixel Crown
        return (
          <g fill={color}>
            <rect x="2" y="4" width="2" height="3" />
            <rect x="7" y="2" width="2" height="5" />
            <rect x="12" y="4" width="2" height="3" />
            <rect x="3" y="7" width="10" height="3" />
            <rect x="2" y="10" width="12" height="3" />
            <rect x="4" y="11" width="2" height="1" fill="#000" opacity="0.4" />
            <rect x="7" y="11" width="2" height="1" fill="#000" opacity="0.4" />
            <rect x="10" y="11" width="2" height="1" fill="#000" opacity="0.4" />
          </g>
        );

      case 'robot':
        // Pixel Robot / AI
        return (
          <g fill={color}>
            <rect x="7" y="1" width="2" height="2" />
            <rect x="3" y="3" width="10" height="9" />
            <rect x="1" y="6" width="2" height="3" />
            <rect x="13" y="6" width="2" height="3" />
            {/* Eyes & mouth */}
            <rect x="5" y="5" width="2" height="2" fill="#000" />
            <rect x="9" y="5" width="2" height="2" fill="#000" />
            <rect x="5" y="9" width="6" height="1" fill="#000" />
            <rect x="5" y="12" width="2" height="3" />
            <rect x="9" y="12" width="2" height="3" />
          </g>
        );

      case 'flame':
        // Pixel Flame / Burn status
        return (
          <g fill={color}>
            <rect x="7" y="2" width="2" height="3" />
            <rect x="5" y="5" width="6" height="3" />
            <rect x="3" y="8" width="10" height="5" />
            <rect x="5" y="13" width="6" height="2" />
            {/* Core */}
            <rect x="6" y="8" width="4" height="4" fill="#ffeb3b" />
          </g>
        );

      case 'freeze':
        // Pixel Ice Snowflake
        return (
          <g fill={color}>
            <rect x="7" y="1" width="2" height="14" />
            <rect x="1" y="7" width="14" height="2" />
            <rect x="4" y="4" width="2" height="2" />
            <rect x="10" y="4" width="2" height="2" />
            <rect x="4" y="10" width="2" height="2" />
            <rect x="10" y="10" width="2" height="2" />
          </g>
        );

      case 'poison':
        // Pixel Poison Drop / Bleed
        return (
          <g fill={color}>
            <rect x="7" y="2" width="2" height="2" />
            <rect x="6" y="4" width="4" height="3" />
            <rect x="4" y="7" width="8" height="5" />
            <rect x="6" y="12" width="4" height="2" />
          </g>
        );

      case 'stun':
        // Pixel Stun / Dizzy Swirl
        return (
          <g fill={color}>
            <rect x="4" y="3" width="8" height="2" />
            <rect x="10" y="5" width="2" height="4" />
            <rect x="4" y="9" width="8" height="2" />
            <rect x="4" y="5" width="2" height="2" />
            <rect x="6" y="6" width="3" height="2" />
          </g>
        );

      case 'user':
        // Pixel Character Silhouette
        return (
          <g fill={color}>
            <rect x="6" y="2" width="4" height="4" />
            <rect x="4" y="7" width="8" height="4" />
            <rect x="5" y="11" width="2" height="4" />
            <rect x="9" y="11" width="2" height="4" />
          </g>
        );

      case 'hair':
        // Pixel Hair Wig
        return (
          <g fill={color}>
            <rect x="4" y="2" width="8" height="4" />
            <rect x="2" y="4" width="3" height="6" />
            <rect x="11" y="4" width="3" height="6" />
            <rect x="5" y="6" width="6" height="2" />
          </g>
        );

      case 'face':
        // Pixel Face
        return (
          <g fill={color}>
            <rect x="4" y="3" width="8" height="10" />
            <rect x="6" y="6" width="1" height="2" fill="#000" />
            <rect x="9" y="6" width="1" height="2" fill="#000" />
            <rect x="6" y="10" width="4" height="1" fill="#000" />
          </g>
        );

      case 'shirt':
        // Pixel Shirt / Armor
        return (
          <g fill={color}>
            <rect x="4" y="3" width="8" height="3" />
            <rect x="2" y="5" width="3" height="4" />
            <rect x="11" y="5" width="3" height="4" />
            <rect x="4" y="6" width="8" height="6" />
          </g>
        );

      case 'pants':
        // Pixel Pants
        return (
          <g fill={color}>
            <rect x="4" y="3" width="8" height="3" />
            <rect x="4" y="6" width="3" height="7" />
            <rect x="9" y="6" width="3" height="7" />
          </g>
        );

      case 'ring':
        // Pixel Ring / Accessory
        return (
          <g fill={color}>
            <rect x="5" y="2" width="6" height="2" />
            <rect x="4" y="4" width="2" height="6" />
            <rect x="10" y="4" width="2" height="6" />
            <rect x="5" y="10" width="6" height="2" />
            {/* Gem */}
            <rect x="7" y="1" width="2" height="2" fill="#00e5ff" />
          </g>
        );

      case 'palette':
        // Pixel Paint Palette
        return (
          <g fill={color}>
            <rect x="4" y="2" width="8" height="3" />
            <rect x="2" y="5" width="12" height="6" />
            <rect x="4" y="11" width="6" height="3" />
            {/* Color spots */}
            <rect x="5" y="4" width="2" height="2" fill="#f87171" />
            <rect x="9" y="4" width="2" height="2" fill="#60a5fa" />
            <rect x="4" y="7" width="2" height="2" fill="#facc15" />
            <rect x="10" y="7" width="2" height="2" fill="#4ade80" />
          </g>
        );

      case 'map':
        // Pixel Arena Map
        return (
          <g fill={color}>
            <rect x="2" y="3" width="12" height="10" />
            <rect x="4" y="5" width="2" height="3" fill="#000" opacity="0.3" />
            <rect x="8" y="7" width="4" height="4" fill="#000" opacity="0.3" />
          </g>
        );

      case 'scroll':
        // Pixel Scroll / Combat Log
        return (
          <g fill={color}>
            <rect x="3" y="2" width="10" height="12" />
            <rect x="2" y="3" width="1" height="10" />
            <rect x="13" y="3" width="1" height="10" />
            <rect x="5" y="5" width="6" height="1" fill="#000" opacity="0.5" />
            <rect x="5" y="7" width="6" height="1" fill="#000" opacity="0.5" />
            <rect x="5" y="9" width="4" height="1" fill="#000" opacity="0.5" />
          </g>
        );

      case 'save':
        // Pixel Floppy Disk
        return (
          <g fill={color}>
            <rect x="2" y="2" width="12" height="12" />
            <rect x="4" y="2" width="6" height="4" fill="#000" opacity="0.3" />
            <rect x="4" y="8" width="8" height="5" fill="#000" opacity="0.3" />
          </g>
        );

      case 'arrowLeft':
        // Pixel Arrow Left
        return (
          <g fill={color}>
            <rect x="7" y="3" width="2" height="2" />
            <rect x="5" y="5" width="2" height="2" />
            <rect x="3" y="7" width="10" height="2" />
            <rect x="5" y="9" width="2" height="2" />
            <rect x="7" y="11" width="2" height="2" />
          </g>
        );

      case 'cross':
        // Pixel X
        return (
          <g fill={color}>
            <rect x="3" y="3" width="2" height="2" />
            <rect x="11" y="3" width="2" height="2" />
            <rect x="5" y="5" width="2" height="2" />
            <rect x="9" y="5" width="2" height="2" />
            <rect x="7" y="7" width="2" height="2" />
            <rect x="5" y="9" width="2" height="2" />
            <rect x="9" y="9" width="2" height="2" />
            <rect x="3" y="11" width="2" height="2" />
            <rect x="11" y="11" width="2" height="2" />
          </g>
        );

      case 'check':
        // Pixel Checkmark
        return (
          <g fill={color}>
            <rect x="11" y="4" width="2" height="2" />
            <rect x="9" y="6" width="2" height="2" />
            <rect x="7" y="8" width="2" height="2" />
            <rect x="5" y="10" width="2" height="2" />
            <rect x="3" y="8" width="2" height="2" />
          </g>
        );

      case 'volumeOn':
        // Pixel Sound Speaker
        return (
          <g fill={color}>
            <rect x="2" y="6" width="3" height="4" />
            <rect x="5" y="4" width="3" height="8" />
            <rect x="10" y="5" width="1" height="6" />
            <rect x="12" y="3" width="1" height="10" />
          </g>
        );

      case 'volumeOff':
        // Pixel Sound Muted
        return (
          <g fill={color}>
            <rect x="2" y="6" width="3" height="4" />
            <rect x="5" y="4" width="3" height="8" />
            <rect x="10" y="6" width="1" height="1" />
            <rect x="12" y="8" width="1" height="1" />
            <rect x="10" y="9" width="1" height="1" />
          </g>
        );

      case 'gear':
        // Pixel Settings Gear
        return (
          <g fill={color}>
            <rect x="6" y="2" width="4" height="12" />
            <rect x="2" y="6" width="12" height="4" />
            <rect x="4" y="4" width="8" height="8" />
            <rect x="6" y="6" width="4" height="4" fill="#000" />
          </g>
        );

      case 'lock':
        // Pixel Padlock
        return (
          <g fill={color}>
            <rect x="5" y="2" width="6" height="4" />
            <rect x="7" y="4" width="2" height="2" fill="#000" />
            <rect x="4" y="6" width="8" height="7" />
            <rect x="7" y="8" width="2" height="2" fill="#000" />
          </g>
        );

      case 'users':
        // Pixel Multiple Users / Friends / Party
        return (
          <g fill={color}>
            <rect x="4" y="3" width="3" height="3" />
            <rect x="3" y="7" width="5" height="4" />
            <rect x="10" y="4" width="3" height="3" opacity="0.75" />
            <rect x="9" y="8" width="5" height="4" opacity="0.75" />
          </g>
        );

      case 'eye':
        // Pixel Eye / View
        return (
          <g fill={color}>
            <rect x="5" y="4" width="6" height="1" />
            <rect x="3" y="6" width="10" height="4" />
            <rect x="5" y="11" width="6" height="1" />
            <rect x="7" y="7" width="2" height="2" fill="#000" />
          </g>
        );

      case 'ban':
        // Pixel circle with slash (none / disabled)
        return (
          <g fill={color}>
            <rect x="5" y="2" width="6" height="2" />
            <rect x="3" y="4" width="2" height="2" />
            <rect x="11" y="4" width="2" height="2" />
            <rect x="2" y="6" width="2" height="4" />
            <rect x="12" y="6" width="2" height="4" />
            <rect x="5" y="5" width="2" height="2" />
            <rect x="7" y="7" width="2" height="2" />
            <rect x="9" y="9" width="2" height="2" />
            <rect x="3" y="10" width="2" height="2" />
            <rect x="11" y="10" width="2" height="2" />
            <rect x="5" y="12" width="6" height="2" />
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 16 16"
      className={`inline-block shrink-0 pixelated select-none ${className}`}
      style={{ imageRendering: 'pixelated' }}
    >
      {renderIcon()}
    </svg>
  );
}
