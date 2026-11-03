'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import PixelIcon from '@/components/ui/PixelIcon';
import ThreeDiceCanvas from './ThreeDiceCanvas';
import { playDiceRollSound } from '@/lib/soundEffects';

export interface PixelDiceProps {
  // P1 Dice State
  p1Name: string;
  p1IsAttacker: boolean;
  p1D20: number | null;
  p1D6: number | null;
  p1IsRolling: boolean;
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
  p1Name,
  p1IsAttacker,
  p1D20,
  p1D6,
  p1IsRolling,
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
  // Shuffling numbers during rolling animation
  const [shuffleP1D20, setShuffleP1D20] = useState(20);
  const [shuffleP1D6, setShuffleP1D6] = useState(6);
  const [shuffleP2D20, setShuffleP2D20] = useState(20);
  const [shuffleP2D6, setShuffleP2D6] = useState(6);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (p1IsRolling) {
      playDiceRollSound();
      timer = setInterval(() => {
        setShuffleP1D20(Math.floor(Math.random() * 20) + 1);
        setShuffleP1D6(Math.floor(Math.random() * 6) + 1);
      }, 50);
    }
    return () => clearInterval(timer);
  }, [p1IsRolling]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (p2IsRolling) {
      playDiceRollSound();
      timer = setInterval(() => {
        setShuffleP2D20(Math.floor(Math.random() * 20) + 1);
        setShuffleP2D6(Math.floor(Math.random() * 6) + 1);
      }, 50);
    }
    return () => clearInterval(timer);
  }, [p2IsRolling]);

  const bothHaveRolled = p1HasRolled && p2HasRolled;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-1.5 select-none">
      {/* Symmetrical Dual Trays Arena Container */}
      <div className="w-full grid grid-cols-1 md:grid-cols-11 gap-2 items-center">
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
                p1IsRolling
                  ? 'bg-yellow-500 text-black animate-pulse'
                  : p1HasRolled
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-900 text-slate-400 border border-slate-700'
              }`}
            >
              {p1IsRolling
                ? isEn ? 'ROLLING...' : 'ĐANG TUNG...'
                : p1HasRolled
                ? isEn ? '✓ ROLLED' : '✓ ĐÃ TUNG'
                : isEn ? 'WAITING' : 'CHỜ TUNG'}
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
              <Image
                src="/assets/sprites/ui/frames/frame_dual_dice_premium.png"
                alt="Khung xúc xắc pixel đôi cao cấp"
                fill
                className="object-contain"
                priority
                unoptimized
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
                  isRolling={p1IsRolling}
                  value={p1IsRolling ? shuffleP1D20 : (p1D20 ?? 20)}
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
                {p1IsRolling
                  ? `D20: ${shuffleP1D20}`
                  : p1HasRolled
                  ? `${p1IsAttacker ? 'ATK' : 'DEF'}: ${p1D20 ?? '--'}`
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
              {p1IsMage && p1MageRolls && p1MageRolls.length > 1 && !p1IsRolling ? (
                <div className="flex items-center gap-1 scale-90">
                  <ThreeDiceCanvas diceType="d6" theme="cyan" isRolling={false} value={p1MageRolls[0]} size={36} />
                  <span className="text-[9px] font-pixel text-cyan-300">+</span>
                  <ThreeDiceCanvas diceType="d6" theme="cyan" isRolling={false} value={p1MageRolls[1]} size={36} />
                </div>
              ) : (
                <ThreeDiceCanvas
                  diceType="d6"
                  theme="cyan"
                  isRolling={p1IsRolling}
                  value={p1IsRolling ? shuffleP1D6 : (p1D6 ?? 6)}
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
                {p1IsRolling
                  ? `D6: ${shuffleP1D6}`
                  : p1HasRolled
                  ? `D6: +${p1D6 ?? 0} PTS`
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

          {/* VS Diamond Crest */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-amber-700 flex items-center justify-center border-2 border-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.6)]">
            <span className="text-[9px] font-pixel font-bold text-black">VS</span>
          </div>

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
                p2IsRolling
                  ? 'bg-yellow-500 text-black animate-pulse'
                  : p2HasRolled
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-900 text-slate-400 border border-slate-700'
              }`}
            >
              {p2IsRolling
                ? isEn ? 'ROLLING...' : 'ĐANG TUNG...'
                : p2HasRolled
                ? isEn ? '✓ ROLLED' : '✓ ĐÃ TUNG'
                : isEn ? 'WAITING' : 'CHỜ TUNG'}
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
              <Image
                src="/assets/sprites/ui/frames/frame_dual_dice_premium.png"
                alt="Khung xúc xắc pixel đôi cao cấp"
                fill
                className="object-contain"
                priority
                unoptimized
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
                  isRolling={p2IsRolling}
                  value={p2IsRolling ? shuffleP2D20 : (p2D20 ?? 20)}
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
                {p2IsRolling
                  ? `D20: ${shuffleP2D20}`
                  : p2HasRolled
                  ? `${!p1IsAttacker ? 'ATK' : 'DEF'}: ${p2D20 ?? '--'}`
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
              {p2IsMage && p2MageRolls && p2MageRolls.length > 1 && !p2IsRolling ? (
                <div className="flex items-center gap-1 scale-90">
                  <ThreeDiceCanvas diceType="d6" theme="cyan" isRolling={false} value={p2MageRolls[0]} size={36} />
                  <span className="text-[9px] font-pixel text-cyan-300">+</span>
                  <ThreeDiceCanvas diceType="d6" theme="cyan" isRolling={false} value={p2MageRolls[1]} size={36} />
                </div>
              ) : (
                <ThreeDiceCanvas
                  diceType="d6"
                  theme="cyan"
                  isRolling={p2IsRolling}
                  value={p2IsRolling ? shuffleP2D6 : (p2D6 ?? 6)}
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
                {p2IsRolling
                  ? `D6: ${shuffleP2D6}`
                  : p2HasRolled
                  ? `D6: +${p2D6 ?? 0} PTS`
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
