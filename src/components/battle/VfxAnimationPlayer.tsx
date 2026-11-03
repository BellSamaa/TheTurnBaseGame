'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface VfxEvent {
  id: string;
  effect: string; // folder name in /assets/vfx/frames/
  target: 'p1' | 'p2' | 'center';
  size?: number;
}

interface VfxAnimationPlayerProps {
  activeVfx: VfxEvent | null;
  onFinish?: (id: string) => void;
}

export default function VfxAnimationPlayer({ activeVfx, onFinish }: VfxAnimationPlayerProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!activeVfx) {
      setFrame(0);
      return;
    }

    setFrame(0);
    const interval = setInterval(() => {
      setFrame((prev) => {
        if (prev >= 3) {
          clearInterval(interval);
          onFinish?.(activeVfx.id);
          return 3;
        }
        return prev + 1;
      });
    }, 110); // 110ms per frame * 4 frames = 440ms crisp animation

    return () => clearInterval(interval);
  }, [activeVfx?.id]);

  if (!activeVfx) return null;

  const size = activeVfx.size || 140;

  return (
    <AnimatePresence>
      <motion.div
        key={activeVfx.id}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.15, opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-none select-none z-40 flex items-center justify-center"
        style={{
          width: size,
          height: size,
        }}
      >
        <img
          src={`/assets/vfx/frames/${activeVfx.effect}/${frame}.png`}
          alt={activeVfx.effect}
          className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]"
          style={{ imageRendering: 'pixelated' }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
