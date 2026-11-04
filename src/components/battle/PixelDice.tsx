'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import PixelIcon from '@/components/ui/PixelIcon';
import ThreeDiceCanvas from './ThreeDiceCanvas';
import { playDiceRollSound } from '@/lib/soundEffects';

export interface PixelDiceProps {
  // Turn Phase Stepper: D20 atk > D20 def > D6 atk > D6 def > D12
  turnStep?: 'd20_atk' | 'd20_def' | 'd6_atk' | 'd6_def' | 'd12';
  hasDefSkill?: boolean;

  // P1 Dice State
  p1Name: string;
  p1IsAttacker: boolean;
  p1D20: number | null;
  p1D6: number | null;
  p1IsRolling: boolean;
  p1IsRollingD20?: boolean;
  p1IsRollingD6?: boolean;
  p1HasRolled: boolean;
  p1IsBoxer?: boolean;
  p1BoxerRolls?: { r1: number; r2: number; chosen: number } | null;
  p1IsMage?: boolean;
  p1MageRolls?: number[] | null;
  p1Pts?: number;
  p1PtsMax?: number;

  // P2 Dice State
  p2Name: string;
  p2D20: number | null;
  p2D6: number | null;
  p2IsRolling: boolean;
  p2IsRollingD20?: boolean;
  p2IsRollingD6?: boolean;
  p2HasRolled: boolean;
  p2IsBoxer?: boolean;
  p2BoxerRolls?: { r1: number; r2: number; chosen: number } | null;
  p2IsMage?: boolean;
  p2MageRolls?: number[] | null;
  p2Pts?: number;
  p2PtsMax?: number;

  // Combat Outcome Formula
  combatFormula?: {
    isHit: boolean;
    damage: number;
    atkRoll: number;
    defRoll: number;
    attackerName?: string;
    defenderName?: string;
  } | null;

  currentRound?: number;
  turnTimer?: number;
  isOnline?: boolean;
  isEn?: boolean;
}

export default function PixelDice({
  turnStep = 'd20_atk',
  hasDefSkill = true,
  p1Name,
  p1IsAttacker,
  p1D20,
  p1D6,
  p1IsRolling,
  p1IsRollingD20,
  p1IsRollingD6,
  p1HasRolled,
  p1IsBoxer = false,
  p1BoxerRolls = null,
  p1IsMage = false,
  p1MageRolls = null,
  p1Pts = 0,
  p1PtsMax = 30,

  p2Name,
  p2D20,
  p2D6,
  p2IsRolling,
  p2IsRollingD20,
  p2IsRollingD6,
  p2HasRolled,
  p2IsBoxer = false,
  p2BoxerRolls = null,
  p2IsMage = false,
  p2MageRolls = null,
  p2Pts = 0,
  p2PtsMax = 30,

  combatFormula,
  currentRound = 1,
  turnTimer,
  isOnline = false,
  isEn = true,
}: PixelDiceProps) {
  // Granular dice rolling per step - ONLY active when the roll is currently in progress
  const p1D20Rolling = p1IsRollingD20 !== undefined ? p1IsRollingD20 : (p1IsRolling && turnStep === 'd20_atk' && p1IsAttacker);
  const p1D6Rolling = p1IsRollingD6 !== undefined ? p1IsRollingD6 : (p1IsRolling && turnStep === 'd6_atk' && p1IsAttacker);
  const p2D20Rolling = p2IsRollingD20 !== undefined ? p2IsRollingD20 : (p2IsRolling && turnStep === 'd20_atk' && !p1IsAttacker);
  const p2D6Rolling = p2IsRollingD6 !== undefined ? p2IsRollingD6 : (p2IsRolling && turnStep === 'd6_atk' && !p1IsAttacker);

  const p1IsActiveRolling = p1D20Rolling || p1D6Rolling;
  const p2IsActiveRolling = p2D20Rolling || p2D6Rolling;

  const p1NeedsToRoll =
    (turnStep === 'd20_atk' && p1IsAttacker) ||
    (turnStep === 'd20_def' && !p1IsAttacker) ||
    (turnStep === 'd6_atk' && p1IsAttacker) ||
    (turnStep === 'd6_def' && !p1IsAttacker && hasDefSkill);

  const p2NeedsToRoll =
    (turnStep === 'd20_atk' && !p1IsAttacker) ||
    (turnStep === 'd20_def' && p1IsAttacker) ||
    (turnStep === 'd6_atk' && !p1IsAttacker) ||
    (turnStep === 'd6_def' && p1IsAttacker && hasDefSkill);

  // Shuffling numbers during rolling animation
  const [shuffleP1D20, setShuffleP1D20] = useState(20);
  const [shuffleP1D6, setShuffleP1D6] = useState(6);
  const [shuffleP2D20, setShuffleP2D20] = useState(20);
  const [shuffleP2D6, setShuffleP2D6] = useState(6);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (p1D20Rolling) {
      playDiceRollSound();
      timer = setInterval(() => {
        setShuffleP1D20(Math.floor(Math.random() * 20) + 1);
      }, 50);
    }
    return () => clearInterval(timer);
  }, [p1D20Rolling]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (p1D6Rolling) {
      playDiceRollSound();
      timer = setInterval(() => {
        setShuffleP1D6(Math.floor(Math.random() * 6) + 1);
      }, 50);
    }
    return () => clearInterval(timer);
  }, [p1D6Rolling]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (p2D20Rolling) {
      playDiceRollSound();
      timer = setInterval(() => {
        setShuffleP2D20(Math.floor(Math.random() * 20) + 1);
      }, 50);
    }
    return () => clearInterval(timer);
  }, [p2D20Rolling]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (p2D6Rolling) {
      playDiceRollSound();
      timer = setInterval(() => {
        setShuffleP2D6(Math.floor(Math.random() * 6) + 1);
      }, 50);
    }
    return () => clearInterval(timer);
  }, [p2D6Rolling]);

  const bothHaveRolled = p1HasRolled && p2HasRolled;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-1.5 select-none">
      {/* 5-Step Turn Flow Stepper: D20 atk > D20 def > D6 atk > D6 def > D12 */}
      <div className="w-full flex items-center justify-center gap-1 sm:gap-2 px-2 py-1 bg-[#060814]/90 border border-yellow-500/50 rounded-sm shadow-md overflow-x-auto select-none">
        <div
          className={`px-2 py-0.5 text-[7px] sm:text-[8px] font-pixel rounded-xs transition-all flex items-center gap-1 ${
            turnStep === 'd20_atk'
              ? 'bg-red-600 text-white font-bold ring-2 ring-red-400 shadow-[0_0_12px_#ef4444] animate-pulse scale-105'
              : 'bg-slate-900/90 text-slate-400 border border-slate-700/60'
          }`}
        >
          <span>⚔️</span>
          <span>1. D20 ATK</span>
        </div>

        <span className="text-yellow-500/60 font-pixel text-[8px]">›</span>

        <div
          className={`px-2 py-0.5 text-[7px] sm:text-[8px] font-pixel rounded-xs transition-all flex items-center gap-1 ${
            turnStep === 'd20_def'
              ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400 shadow-[0_0_12px_#3b82f6] animate-pulse scale-105'
              : 'bg-slate-900/90 text-slate-400 border border-slate-700/60'
          }`}
        >
          <span>🛡️</span>
          <span>2. D20 DEF</span>
        </div>

        <span className="text-yellow-500/60 font-pixel text-[8px]">›</span>

        <div
          className={`px-2 py-0.5 text-[7px] sm:text-[8px] font-pixel rounded-xs transition-all flex items-center gap-1 ${
            turnStep === 'd6_atk'
              ? 'bg-amber-600 text-white font-bold ring-2 ring-amber-400 shadow-[0_0_12px_#f59e0b] animate-pulse scale-105'
              : 'bg-slate-900/90 text-slate-400 border border-slate-700/60'
          }`}
        >
          <span>✨</span>
          <span>3. D6 ATK</span>
        </div>

        <span className="text-yellow-500/60 font-pixel text-[8px]">›</span>

        <div
          className={`px-2 py-0.5 text-[7px] sm:text-[8px] font-pixel rounded-xs transition-all flex items-center gap-1 ${
            turnStep === 'd6_def'
              ? 'bg-teal-600 text-white font-bold ring-2 ring-teal-400 shadow-[0_0_12px_#14b8a6] animate-pulse scale-105'
              : !hasDefSkill
              ? 'bg-slate-900/50 text-slate-500 border border-slate-800 opacity-50'
              : 'bg-slate-900/90 text-slate-400 border border-slate-700/60'
          }`}
        >
          <span>🔰</span>
          <span>{hasDefSkill ? '4. D6 DEF' : '4. D6 DEF (No Skill)'}</span>
        </div>

        <span className="text-yellow-500/60 font-pixel text-[8px]">›</span>

        <div
          className={`px-2 py-0.5 text-[7px] sm:text-[8px] font-pixel rounded-xs transition-all flex items-center gap-1 ${
            turnStep === 'd12'
              ? 'bg-purple-600 text-white font-bold ring-2 ring-purple-400 shadow-[0_0_12px_#a855f7] animate-pulse scale-105'
              : 'bg-slate-900/90 text-slate-400 border border-slate-700/60'
          }`}
        >
          <span>⚡</span>
          <span>5. D12</span>
        </div>
      </div>
      {/* Symmetrical Dual Trays Arena Container */}
      <div className="dice-trays w-full grid grid-cols-1 md:grid-cols-11 gap-2 items-center">
        {/* ============================================================ */}
        {/* LEFT SIDE: PLAYER 1 AUTHENTIC DUAL DICE TRAY (Cols 5) */}
        {/* ============================================================ */}
        <div className="md:col-span-5 flex flex-col items-center">
          {/* Header Badge */}
          <div className="w-full flex items-center justify-between px-2 mb-1 text-[8px] font-pixel">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-yellow-400 font-bold truncate max-w-[130px] drop-shadow">{p1Name}</span>
              <span
                className={`px-1.5 py-0.2 text-[6.5px] font-bold ${
                  p1IsAttacker
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-cyan-600 text-white'
                }`}
              >
                {p1IsAttacker ? (isEn ? 'ATTACKER' : 'BÊN CÔNG') : (isEn ? 'DEFENDER' : 'BÊN THỦ')}
              </span>
            </div>

            {/* Roll Status Pill */}
            <span
              className={`text-[6.5px] px-2 py-0.5 font-bold ${
                p1IsActiveRolling
                  ? 'bg-yellow-500 text-black animate-pulse'
                  : turnStep === 'd12'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  : p1NeedsToRoll
                  ? 'bg-red-950 text-red-200 border border-red-500/60 animate-pulse'
                  : 'bg-slate-900 text-slate-400 border border-slate-700'
              }`}
            >
              {p1IsActiveRolling
                ? isEn ? 'ROLLING...' : 'ĐANG TUNG...'
                : turnStep === 'd12'
                ? isEn ? '✓ ROLLED' : '✓ ĐÃ TUNG'
                : p1NeedsToRoll
                ? isEn ? 'YOUR TURN' : 'LƯỢT TUNG'
                : isEn ? 'WAITING' : 'CHỜ ĐỐI THỦ'}
            </span>
          </div>

          {/* Authentic Dual Dice Frame Sprite Container (Aspect 2:1) */}
          <div
            className={`relative w-full max-w-[390px] aspect-[2/1] transition-all duration-300 ${
              p1IsRolling
                ? 'scale-[1.03] filter drop-shadow-[0_0_15px_rgba(250,204,21,0.7)]'
                : p1HasRolled
                ? 'filter drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]'
                : 'opacity-90'
            }`}
          >
            {/* The Authentic Pixel Dual Frame Image */}
            <div className="absolute inset-0 pointer-events-none z-20">
              <img
                src="/assets/sprites/ui/frames/frame_dual_dice_premium.png"
                alt="Khung xúc xắc pixel đôi cao cấp"
                className="w-full h-full object-contain pointer-events-none select-none"
              />
            </div>

            {/* Inner Dark Background Backdrop */}
            <div className="absolute inset-[8%] bg-[#060812]/80 -z-10 rounded-sm" />

            {/* 1. LEFT WINDOW: D20 COMBAT DIE (14% left, 30.5% width, 14% top, 56.5% height) */}
            <div
              className="absolute z-10 flex items-center justify-center overflow-hidden"
              style={{
                left: '14%',
                width: '30.5%',
                top: '14%',
                height: '56.5%',
              }}
            >
              {p1IsBoxer && p1BoxerRolls && !p1IsRolling ? (
                <div className="flex items-center gap-1 scale-90">
                  <ThreeDiceCanvas
                    diceType="d20"
                    theme={p1BoxerRolls.chosen === p1BoxerRolls.r1 ? 'gold' : 'red'}
                    isRolling={false}
                    value={p1BoxerRolls.r1}
                    size={42}
                  />
                  <ThreeDiceCanvas
                    diceType="d20"
                    theme={p1BoxerRolls.chosen === p1BoxerRolls.r2 ? 'gold' : 'red'}
                    isRolling={false}
                    value={p1BoxerRolls.r2}
                    size={42}
                  />
                </div>
              ) : (
                <ThreeDiceCanvas
                  diceType="d20"
                  theme={p1IsAttacker ? 'red' : 'gold'}
                  isRolling={p1D20Rolling}
                  value={p1D20Rolling ? shuffleP1D20 : (p1D20 ?? 20)}
                  size={58}
                />
              )}
            </div>

            {/* 1. LEFT PLATE: D20 VALUE LABEL (14% left, 31% width, 76% top, 12% height) */}
            <div
              className="absolute z-30 flex items-center justify-center pointer-events-none px-1"
              style={{
                left: '14%',
                width: '31%',
                top: '76%',
                height: '12%',
              }}
            >
              <span
                className="text-[8.5px] sm:text-[9.5px] font-pixel font-bold text-yellow-300 drop-shadow truncate"
                style={{ textShadow: '1px 1px 0px #000, -1px -1px 0px #000' }}
              >
                {p1D20Rolling
                  ? `D20: ${shuffleP1D20}`
                  : p1D20 != null
                  ? `${p1IsAttacker ? 'ATK' : 'DEF'}: ${p1D20}`
                  : `${p1IsAttacker ? 'D20 ATK' : 'D20 DEF'}`}
              </span>
            </div>

            {/* 2. RIGHT WINDOW: D6 SKILL DIE (55.3% left, 30.5% width, 14% top, 56.5% height) */}
            <div
              className="absolute z-10 flex items-center justify-center overflow-hidden"
              style={{
                left: '55.3%',
                width: '30.5%',
                top: '14%',
                height: '56.5%',
              }}
            >
              {p1IsMage && p1MageRolls && p1MageRolls.length > 1 && !p1D6Rolling ? (
                <div className="flex items-center gap-1 scale-90">
                  <ThreeDiceCanvas diceType="d6" theme="cyan" isRolling={false} value={p1MageRolls[0]} size={36} />
                  <span className="text-[9px] font-pixel text-cyan-300">+</span>
                  <ThreeDiceCanvas diceType="d6" theme="cyan" isRolling={false} value={p1MageRolls[1]} size={36} />
                </div>
              ) : (
                <ThreeDiceCanvas
                  diceType="d6"
                  theme="cyan"
                  isRolling={p1D6Rolling}
                  value={p1D6Rolling ? shuffleP1D6 : (p1D6 ?? 6)}
                  size={52}
                />
              )}
            </div>

            {/* 2. RIGHT PLATE: D6 PTS VALUE LABEL (55% left, 31% width, 76% top, 12% height) */}
            <div
              className="absolute z-30 flex items-center justify-center pointer-events-none px-1"
              style={{
                left: '55%',
                width: '31%',
                top: '76%',
                height: '12%',
              }}
            >
              <span
                className="text-[8.5px] sm:text-[9.5px] font-pixel font-bold text-cyan-300 drop-shadow truncate"
                style={{ textShadow: '1px 1px 0px #000, -1px -1px 0px #000' }}
              >
                {p1D6Rolling
                  ? `D6: ${shuffleP1D6}`
                  : p1D6 != null
                  ? `D6: +${p1D6} PTS`
                  : `D6 (${p1Pts}/${p1PtsMax})`}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CENTER COLUMN: VS CREST & TURN COUNTDOWN TIMER (Cols 1) */}
        {/* ============================================================ */}
        <div className="md:col-span-1 flex flex-col items-center justify-center py-1 gap-1">
          {/* Round Turn Countdown Timer */}
          {turnTimer !== undefined && (
            <motion.div
              key={turnTimer}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              className={`px-2 py-0.5 rounded-sm border text-[9px] sm:text-[10px] font-pixel font-bold text-center whitespace-nowrap shadow-md ${
                turnTimer <= 3
                  ? 'bg-red-950 text-red-300 border-red-500 animate-ping'
                  : turnTimer <= 5
                  ? 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse'
                  : 'bg-black/90 text-yellow-300 border-yellow-500/70'
              }`}
            >
              ⏳ {turnTimer}s
            </motion.div>
          )}

          <img
            src="/assets/sprites/ui/frames/battle_vs.png"
            alt="VS"
            width={96}
            height={64}
            draggable={false}
            className="w-20 sm:w-24 max-w-full h-auto object-contain mix-blend-screen select-none pointer-events-none"
          />

          <span className="text-[7.5px] font-pixel text-slate-400">R{currentRound}</span>
        </div>

        {/* ============================================================ */}
        {/* RIGHT SIDE: PLAYER 2 AUTHENTIC DUAL DICE TRAY (Cols 5) */}
        {/* ============================================================ */}
        <div className="md:col-span-5 flex flex-col items-center">
          {/* Header Badge */}
          <div className="w-full flex items-center justify-between px-2 mb-1 text-[8px] font-pixel flex-row-reverse">
            <div className="flex items-center gap-1.5 min-w-0 flex-row-reverse">
              <span className="text-cyan-400 font-bold truncate max-w-[130px] drop-shadow">{p2Name}</span>
              <span
                className={`px-1.5 py-0.2 text-[6.5px] font-bold ${
                  !p1IsAttacker
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-cyan-600 text-white'
                }`}
              >
                {!p1IsAttacker ? (isEn ? 'ATTACKER' : 'BÊN CÔNG') : (isEn ? 'DEFENDER' : 'BÊN THỦ')}
              </span>
            </div>

            {/* Roll Status Pill */}
            <span
              className={`text-[6.5px] px-2 py-0.5 font-bold ${
                p2IsActiveRolling
                  ? 'bg-yellow-500 text-black animate-pulse'
                  : turnStep === 'd12'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  : p2NeedsToRoll
                  ? 'bg-red-950 text-red-200 border border-red-500/60 animate-pulse'
                  : 'bg-slate-900 text-slate-400 border border-slate-700'
              }`}
            >
              {p2IsActiveRolling
                ? isEn ? 'ROLLING...' : 'ĐANG TUNG...'
                : turnStep === 'd12'
                ? isEn ? '✓ ROLLED' : '✓ ĐÃ TUNG'
                : p2NeedsToRoll
                ? isEn ? 'YOUR TURN' : 'LƯỢT TUNG'
                : isEn ? 'WAITING' : 'CHỜ ĐỐI THỦ'}
            </span>
          </div>

          {/* Authentic Dual Dice Frame Sprite Container (Aspect 2:1) */}
          <div
            className={`relative w-full max-w-[390px] aspect-[2/1] transition-all duration-300 ${
              p2IsRolling
                ? 'scale-[1.03] filter drop-shadow-[0_0_15px_rgba(250,204,21,0.7)]'
                : p2HasRolled
                ? 'filter drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]'
                : 'opacity-90'
            }`}
          >
            {/* The Authentic Pixel Dual Frame Image */}
            <div className="absolute inset-0 pointer-events-none z-20">
              <img
                src="/assets/sprites/ui/frames/frame_dual_dice_premium.png"
                alt="Khung xúc xắc pixel đôi cao cấp"
                className="w-full h-full object-contain pointer-events-none select-none"
              />
            </div>

            {/* Inner Dark Background Backdrop */}
            <div className="absolute inset-[8%] bg-[#060812]/80 -z-10 rounded-sm" />

            {/* 1. LEFT WINDOW: D20 COMBAT DIE (14% left, 30.5% width, 14% top, 56.5% height) */}
            <div
              className="absolute z-10 flex items-center justify-center overflow-hidden"
              style={{
                left: '14%',
                width: '30.5%',
                top: '14%',
                height: '56.5%',
              }}
            >
              {p2IsBoxer && p2BoxerRolls && !p2IsRolling ? (
                <div className="flex items-center gap-1 scale-90">
                  <ThreeDiceCanvas
                    diceType="d20"
                    theme={p2BoxerRolls.chosen === p2BoxerRolls.r1 ? 'gold' : 'red'}
                    isRolling={false}
                    value={p2BoxerRolls.r1}
                    size={42}
                  />
                  <ThreeDiceCanvas
                    diceType="d20"
                    theme={p2BoxerRolls.chosen === p2BoxerRolls.r2 ? 'gold' : 'red'}
                    isRolling={false}
                    value={p2BoxerRolls.r2}
                    size={42}
                  />
                </div>
              ) : (
                <ThreeDiceCanvas
                  diceType="d20"
                  theme={!p1IsAttacker ? 'red' : 'gold'}
                  isRolling={p2D20Rolling}
                  value={p2D20Rolling ? shuffleP2D20 : (p2D20 ?? 20)}
                  size={58}
                />
              )}
            </div>

            {/* 1. LEFT PLATE: D20 VALUE LABEL (14% left, 31% width, 76% top, 12% height) */}
            <div
              className="absolute z-30 flex items-center justify-center pointer-events-none px-1"
              style={{
                left: '14%',
                width: '31%',
                top: '76%',
                height: '12%',
              }}
            >
              <span
                className="text-[8.5px] sm:text-[9.5px] font-pixel font-bold text-yellow-300 drop-shadow truncate"
                style={{ textShadow: '1px 1px 0px #000, -1px -1px 0px #000' }}
              >
                {p2D20Rolling
                  ? `D20: ${shuffleP2D20}`
                  : p2D20 != null
                  ? `${!p1IsAttacker ? 'ATK' : 'DEF'}: ${p2D20}`
                  : `${!p1IsAttacker ? 'D20 ATK' : 'D20 DEF'}`}
              </span>
            </div>

            {/* 2. RIGHT WINDOW: D6 SKILL DIE (55.3% left, 30.5% width, 14% top, 56.5% height) */}
            <div
              className="absolute z-10 flex items-center justify-center overflow-hidden"
              style={{
                left: '55.3%',
                width: '30.5%',
                top: '14%',
                height: '56.5%',
              }}
            >
              {p2IsMage && p2MageRolls && p2MageRolls.length > 1 && !p2D6Rolling ? (
                <div className="flex items-center gap-1 scale-90">
                  <ThreeDiceCanvas diceType="d6" theme="cyan" isRolling={false} value={p2MageRolls[0]} size={36} />
                  <span className="text-[9px] font-pixel text-cyan-300">+</span>
                  <ThreeDiceCanvas diceType="d6" theme="cyan" isRolling={false} value={p2MageRolls[1]} size={36} />
                </div>
              ) : (
                <ThreeDiceCanvas
                  diceType="d6"
                  theme="cyan"
                  isRolling={p2D6Rolling}
                  value={p2D6Rolling ? shuffleP2D6 : (p2D6 ?? 6)}
                  size={52}
                />
              )}
            </div>

            {/* 2. RIGHT PLATE: D6 PTS VALUE LABEL (55% left, 31% width, 76% top, 12% height) */}
            <div
              className="absolute z-30 flex items-center justify-center pointer-events-none px-1"
              style={{
                left: '55%',
                width: '31%',
                top: '76%',
                height: '12%',
              }}
            >
              <span
                className="text-[8.5px] sm:text-[9.5px] font-pixel font-bold text-cyan-300 drop-shadow truncate"
                style={{ textShadow: '1px 1px 0px #000, -1px -1px 0px #000' }}
              >
                {p2D6Rolling
                  ? `D6: ${shuffleP2D6}`
                  : p2D6 != null
                  ? `D6: +${p2D6} PTS`
                  : `D6 (${p2Pts}/${p2PtsMax})`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Symmetrical Combat Outcome Banner (when both have rolled) */}
      <AnimatePresence>
        {bothHaveRolled && combatFormula && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`px-4 py-1.5 border-2 text-center shadow-lg font-pixel text-[8px] sm:text-[9px] ${
              combatFormula.isHit
                ? 'bg-red-950/90 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'bg-cyan-950/90 border-cyan-500 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
            }`}
          >
            {combatFormula.isHit ? (
              <span>
                ⚔️ {isEn ? 'ATTACK HIT!' : 'TẤN CÔNG TRÚNG!'} (ATK {combatFormula.atkRoll} &gt; DEF{' '}
                {combatFormula.defRoll}) ➜{' '}
                <strong className="text-yellow-400 font-bold">-{combatFormula.damage} HP</strong>
              </span>
            ) : (
              <span>
                🛡️ {isEn ? 'BLOCKED / DEFENDED!' : 'PHÒNG THỦ THÀNH CÔNG!'} (DEF {combatFormula.defRoll} ≥ ATK{' '}
                {combatFormula.atkRoll}) ➜ <strong className="text-cyan-300 font-bold">0 DMG</strong>
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
