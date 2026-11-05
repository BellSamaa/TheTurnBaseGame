'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { playClickSound } from '@/lib/soundEffects';

export type SpriteButtonName =
  | 'play'
  | 'character'
  | 'weapons'
  | 'friends'
  | 'settings'
  | 'start'
  | 'ranked'
  | 'casual'
  | 'create_room'
  | 'join_room'
  | 'quests'
  | 'rewards'
  | 'leaderboard'
  | 'profile'
  | 'confirm'
  | 'cancel'
  | 'back'
  | 'exit'
  | 'inventory'
  | 'shop'
  | 'roll_dice'
  | 'end_turn';

const SPRITE_PATHS: Record<SpriteButtonName, { src: string; width: number; height: number; alt: string }> = {
  play: { src: '/assets/sprites/ui/buttons/btn_play.png', width: 439, height: 177, alt: 'PLAY' },
  character: { src: '/assets/sprites/ui/buttons/btn_character.png', width: 443, height: 178, alt: 'CHARACTER' },
  weapons: { src: '/assets/sprites/ui/buttons/btn_weapons.png', width: 443, height: 177, alt: 'WEAPONS' },
  friends: { src: '/assets/sprites/ui/buttons/btn_friends.png', width: 440, height: 181, alt: 'FRIENDS' },
  settings: { src: '/assets/sprites/ui/buttons/btn_settings.png', width: 437, height: 182, alt: 'SETTINGS' },
  start: { src: '/assets/sprites/ui/buttons/btn_start.png', width: 440, height: 181, alt: 'START' },
  ranked: { src: '/assets/sprites/ui/buttons/btn_ranked.png', width: 438, height: 176, alt: 'RANKED' },
  casual: { src: '/assets/sprites/ui/buttons/btn_casual.png', width: 442, height: 175, alt: 'CASUAL' },
  create_room: { src: '/assets/sprites/ui/buttons/btn_create_room.png', width: 442, height: 176, alt: 'CREATE ROOM' },
  join_room: { src: '/assets/sprites/ui/buttons/btn_join_room.png', width: 441, height: 176, alt: 'JOIN ROOM' },
  quests: { src: '/assets/sprites/ui/buttons/btn_quests.png', width: 438, height: 175, alt: 'QUESTS' },
  rewards: { src: '/assets/sprites/ui/buttons/btn_rewards.png', width: 440, height: 175, alt: 'REWARDS' },
  leaderboard: { src: '/assets/sprites/ui/buttons/btn_leaderboard.png', width: 442, height: 175, alt: 'LEADERBOARD' },
  profile: { src: '/assets/sprites/ui/buttons/btn_profile.png', width: 438, height: 175, alt: 'PROFILE' },
  confirm: { src: '/assets/sprites/ui/buttons/btn_confirm.png', width: 438, height: 162, alt: 'CONFIRM' },
  cancel: { src: '/assets/sprites/ui/buttons/btn_cancel.png', width: 436, height: 172, alt: 'CANCEL' },
  back: { src: '/assets/sprites/ui/buttons/btn_back.png', width: 442, height: 162, alt: 'BACK' },
  exit: { src: '/assets/sprites/ui/buttons/btn_exit.png', width: 438, height: 172, alt: 'EXIT' },
  inventory: { src: '/assets/sprites/ui/buttons/btn_inventory.png', width: 440, height: 175, alt: 'INVENTORY' },
  shop: { src: '/assets/sprites/ui/buttons/btn_shop.png', width: 440, height: 175, alt: 'SHOP' },
  roll_dice: { src: '/assets/sprites/ui/frames/btn_roll_dice.png', width: 1120, height: 240, alt: 'ROLL DICE' },
  end_turn: { src: '/assets/sprites/ui/frames/btn_end_turn.png', width: 1120, height: 240, alt: 'END TURN' },
};

interface PixelSpriteButtonProps {
  sprite: SpriteButtonName;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  sound?: boolean;
}

export default function PixelSpriteButton({
  sprite,
  onClick,
  disabled = false,
  className = '',
  title,
  type = 'button',
  sound = true,
}: PixelSpriteButtonProps) {
  const meta = SPRITE_PATHS[sprite] || SPRITE_PATHS.play;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (sound) playClickSound();
    onClick?.(e);
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.96, y: 1 }}
      title={title || meta.alt}
      className={`
        relative inline-block select-none cursor-pointer border-0 bg-transparent p-0
        transition-all duration-150 focus:outline-none
        ${disabled ? 'opacity-40 grayscale cursor-not-allowed pointer-events-none' : 'hover:brightness-110 active:brightness-95 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] hover:drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]'}
        ${className}
      `}
      style={{
        imageRendering: 'pixelated',
      }}
    >
      <img
        src={meta.src}
        alt={meta.alt}
        className="w-full h-auto object-contain block pointer-events-none"
        style={{
          imageRendering: 'pixelated',
        }}
        draggable={false}
      />
    </motion.button>
  );
}
