'use client';

import React, { useState, useEffect } from 'react';

export type ParticleShape = 'star' | 'circle' | 'diamond';

export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  shape: ParticleShape;
  color: string;
  duration: number;
  delay: number;
}

interface ParticleEffectProps {
  density?: number;
  colors?: string[];
  className?: string;
}

const DEFAULT_COLORS = ['#ffd700', '#00e5ff', '#b44dff', '#ff6699', '#ffffff'];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const SHAPES: ParticleShape[] = ['star', 'circle', 'diamond'];

function generateParticles(density: number, colors: string[]): Particle[] {
  return Array.from({ length: density }, (_, i) => ({
    id: i,
    x: randomBetween(0, 100),
    y: randomBetween(0, 100),
    size: randomBetween(2, 6),
    opacity: randomBetween(0.2, 0.7),
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
    duration: randomBetween(4, 12),
    delay: randomBetween(0, 8),
  }));
}

function ShapeSVG({ shape, color, size }: { shape: ParticleShape; color: string; size: number }) {
  if (shape === 'circle') {
    return (
      <svg width={size} height={size} viewBox="0 0 10 10">
        <circle cx="5" cy="5" r="4" fill={color} />
      </svg>
    );
  }
  if (shape === 'diamond') {
    return (
      <svg width={size} height={size} viewBox="0 0 10 10">
        <polygon points="5,0 10,5 5,10 0,5" fill={color} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 10 10">
      <polygon
        points="5,0 6.2,3.5 10,3.8 7.1,6.3 8,10 5,7.8 2,10 2.9,6.3 0,3.8 3.8,3.5"
        fill={color}
      />
    </svg>
  );
}

export default function ParticleEffect({
  density = 28,
  colors = DEFAULT_COLORS,
  className = '',
}: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(generateParticles(density, colors));
  }, [density, colors]);

  if (particles.length === 0) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-10 overflow-hidden ${className}`}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute inline-block animate-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            filter: `drop-shadow(0 0 ${p.size * 2}px ${p.color})`,
          }}
        >
          <ShapeSVG shape={p.shape} color={p.color} size={p.size * 2} />
        </span>
      ))}
    </div>
  );
}
