'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { CharacterCustomization, WeaponInfo } from '@/types/game';
import { drawCharacterPose, type CharacterMotion } from '@/lib/characterMotion';
import { getCharacterV2Layers } from '@/lib/characterKitV2';

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
  animation?: CharacterMotion;
}

const SIZE_MAP: Record<string, { width: number; height: number; weaponSize: number }> = {
  xs: { width: 48, height: 72, weaponSize: 28 },
  sm: { width: 64, height: 96, weaponSize: 36 },
  md: { width: 96, height: 144, weaponSize: 52 },
  lg: { width: 128, height: 192, weaponSize: 68 },
  xl: { width: 192, height: 288, weaponSize: 96 },
};

// Global image cache for instant rendering
const imageCache: Record<string, HTMLImageElement> = {};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (imageCache[src]) return Promise.resolve(imageCache[src]);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache[src] = img;
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Exact luminosity color-multiplying algorithm from DiceManiac Character Kit v2 (preview.html)
 * Preserves alpha transparency and dark pixel outlines.
 */
function drawLayer(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  color?: string
) {
  if (!color) {
    ctx.drawImage(img, 0, 0);
    return;
  }
  const tmp = document.createElement('canvas');
  tmp.width = 64;
  tmp.height = 96;
  const t = tmp.getContext('2d');
  if (!t) return;

  t.drawImage(img, 0, 0);
  const data = t.getImageData(0, 0, 64, 96);
  const d = data.data;

  // Parse hex color into RGB
  const hex = color.replace('#', '');
  const rgb = [
    parseInt(hex.slice(0, 2), 16) || 0,
    parseInt(hex.slice(2, 4), 16) || 0,
    parseInt(hex.slice(4, 6), 16) || 0,
  ];

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue; // transparent pixel
    const lum = Math.max(d[i], d[i + 1], d[i + 2]);
    // Keep dark outlines (lum < 55) untouched; tint highlight/body areas (lum >= 55)
    if (lum >= 55) {
      d[i] = Math.round((rgb[0] * lum) / 244);
      d[i + 1] = Math.round((rgb[1] * lum) / 244);
      d[i + 2] = Math.round((rgb[2] * lum) / 244);
    }
  }

  t.putImageData(data, 0, 0);
  ctx.drawImage(tmp, 0, 0);
}

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
  animation = 'idle',
}: CharacterRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const spriteRef = useRef<HTMLCanvasElement | null>(null);

  const dim = SIZE_MAP[size] || SIZE_MAP.md;

  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const composed = document.createElement('canvas');
    composed.width = 64; composed.height = 96;
    const ctx = composed.getContext('2d');
    if (!ctx) return;

    const layers = getCharacterV2Layers(character);

    // Preload all layers concurrently
    Promise.all(layers.map((l) => loadImage(l.path))).then((loadedImages) => {
      if (!active) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 64, 96);

      layers.forEach((layer, idx) => {
        const img = loadedImages[idx];
        if (img) {
          drawLayer(ctx, img, layer.color);
        }
      });

      spriteRef.current = composed;
      const output = canvas.getContext('2d');
      if (output) drawCharacterPose(output, composed, 'still', 0);
      setIsRendered(true);
    });

    return () => {
      active = false;
    };
  }, [
    character?.baseIndex,
    character?.hairIndex,
    character?.hairColor,
    character?.skinColor,
    character?.shirtIndex,
    character?.shirtColor,
    character?.pantsIndex,
    character?.pantsColor,
    character?.accessoryIndex,
    character?.faceIndex,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !isRendered) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, previous = 0;
    const start = performance.now();
    const render = (now: number) => {
      if (now - previous >= 80 && spriteRef.current && !document.hidden) {
        drawCharacterPose(ctx, spriteRef.current, reduced.matches || isHit ? 'still' : animation, now - start);
        previous = now;
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [animation, isRendered, isHit]);

  const isFacingLeft = facing === 'left';

  return (
    <div
      data-character-motion={animation}
      className={`character-motion character-motion-${animation} relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: dim.width + dim.weaponSize * 0.45,
        height: dim.height,
      }}
    >
      {/* 1. Foot Shadow Baseline */}
      {showShadow && (
        <div
          className="absolute bottom-0 z-0 bg-black/60 rounded-full blur-[1px] pointer-events-none"
          style={{
            width: dim.width * 0.8,
            height: dim.height * 0.12,
            left: dim.weaponSize * 0.2,
          }}
        />
      )}

      {/* 2. Character Body & Weapon Container */}
      <div
        className={`relative flex items-center transition-transform duration-200 ${
          isHit ? 'animate-hit-shake filter brightness-150 contrast-125' : ''
        }`}
        style={{
          transform: isFacingLeft ? 'scaleX(-1)' : 'none',
        }}
      >
        {/* Aura Ring / Glow */}
        {showAura && (
          <div
            className="absolute inset-0 -m-2 rounded-lg pointer-events-none animate-pulse"
            style={{
              boxShadow: `0 0 20px ${auraColor}, inset 0 0 10px ${auraColor}`,
              border: `1px solid ${auraColor}`,
            }}
          />
        )}

        {/* 64x96 Character Canvas scaled via CSS nearest-neighbor */}
        <canvas
          ref={canvasRef}
          width={64}
          height={96}
          className="block select-none"
          style={{
            width: dim.width,
            height: dim.height,
            imageRendering: 'pixelated',
          }}
        />

        {/* 3. Handheld Weapon Sprite */}
        {weapon && (
          <div
            className="character-handheld absolute z-30 pointer-events-none flex items-center justify-center"
            style={{
              width: dim.weaponSize,
              height: dim.weaponSize,
              right: -dim.weaponSize * 0.4,
              top: dim.height * 0.42,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
            }}
          >
            <img
              src={weapon.image}
              alt={weapon.name}
              className="w-full h-full object-contain pointer-events-none"
              style={{
                imageRendering: 'pixelated',
                transform: 'rotate(15deg)',
              }}
              draggable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
