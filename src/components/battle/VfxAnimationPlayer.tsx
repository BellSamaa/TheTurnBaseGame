'use client';

import {animationSpec,animationFrameAt} from '@/lib/weaponUpdate2Effects';
import {effectFrame} from '@/lib/weaponUpdateAssets';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface VfxEvent {
  caster?:'p1'|'p2';
  damage?:number;
  id: string;
  effect: string; // folder name in /assets/vfx/frames/
  target: 'p1' | 'p2' | 'center';
  size?: number;
  flipX?:boolean;
}

interface VfxAnimationPlayerProps {
  activeVfx: VfxEvent | null;
  onFinish?: (id: string) => void;
}

export default function VfxAnimationPlayer({ activeVfx, onFinish }: VfxAnimationPlayerProps) {
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!activeVfx) {
      setFrame(0);
      return;
    }

    setFrame(0);
    const started=performance.now(),spec=animationSpec(activeVfx.effect);
    const interval = setInterval(() => {
      const elapsed=performance.now()-started;
      if (elapsed < spec.ms) {
        setFrame(animationFrameAt(activeVfx.effect,elapsed));
      } else {
        clearInterval(interval);
        finishRef.current?.(activeVfx.id);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [activeVfx?.id]);

  if (!activeVfx) return null;

  const size = activeVfx.size || 160;

  if(activeVfx.effect.startsWith('dn:'))return <div className="death-note-vfx"><div className="death-red-flash"/><img src={effectFrame(activeVfx.effect,0)} alt="Purging Judgement" style={{width:size,height:size}}/></div>;
  return (
    <AnimatePresence>{['mu:S2_A_Void_Flash','mu:Musashi_Skill2_Normal_NoFlash'].includes(activeVfx.effect)&&<div className="musashi-screen-flash"/>}
      <motion.div
        key={activeVfx.id}
        data-vfx-effect={activeVfx.effect}
        data-vfx-target={activeVfx.target}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1.25, opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-none select-none z-50 flex items-center justify-center relative"
        style={{
          width: size,
          height: size,
        }}
      >
        {/* Render all 4 frames to ensure immediate browser caching without blank delay */}
        {Array.from({length:animationSpec(activeVfx.effect).frames},(_,i)=>i).map((f) => (
          <img
            key={f}
            src={effectFrame(activeVfx.effect,f)}
            alt={`${activeVfx.effect}-${f}`}
            className={`absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(250,204,21,0.9)] transition-opacity duration-75 ${
              frame === f ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ imageRendering: 'pixelated',transform:activeVfx.flipX?'scaleX(-1)':undefined }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
