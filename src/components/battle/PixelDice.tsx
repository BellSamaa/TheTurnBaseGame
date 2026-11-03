'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PixelIcon from '@/components/ui/PixelIcon';
import ThreeDiceCanvas from './ThreeDiceCanvas';
import { playDiceRollSound } from '@/lib/soundEffects';

interface PixelDiceProps {
  // D20 Attack & Defense
  isRollingD20: boolean;
  d20RolledThisTurn: boolean;
  atkRoll: number | null;
  defRoll: number | null;
  boxerRolls?: { r1: number; r2: number; chosen: number } | null;
  isP1Attacker: boolean;
  p1Name: string;
  p2Name: string;

  // D6 Skill Charge
  isRollingD6: boolean;
  d6RolledThisTurn?: boolean;
  d6P1Rolls: number[] | null;
  d6P2Rolls: number[] | null;
  p1IsMage?: boolean;
  p2IsMage?: boolean;

  // Combat Outcome Formula
  combatFormula?: {
    isHit: boolean;
    damage: number;
    atkRoll: number;
    defRoll: number;
  } | null;

  isEn?: boolean;
}

export default function PixelDice({
  isRollingD20,
  d20RolledThisTurn,
  atkRoll,
  defRoll,
  boxerRolls,
  isP1Attacker,
  p1Name,
  p2Name,
  isRollingD6,
  d6RolledThisTurn = false,
  d6P1Rolls,
  d6P2Rolls,
  p1IsMage = false,
  p2IsMage = false,
  combatFormula,
  isEn = false,
}: PixelDiceProps) {
  // Rapid shuffle numbers during roll
  const [displayAtk, setDisplayAtk] = useState<number>(20);
  const [displayDef, setDisplayDef] = useState<number>(20);
  const [displayD6, setDisplayD6] = useState<number>(6);

  // Preserve landed numbers permanently so they stay right where they landed
  const [landedAtk, setLandedAtk] = useState<number | null>(null);
  const [landedDef, setLandedDef] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRollingD20) {
      playDiceRollSound();
      interval = setInterval(() => {
        setDisplayAtk(Math.floor(Math.random() * 20) + 1);
        setDisplayDef(Math.floor(Math.random() * 20) + 1);
      }, 50);
    } else {
      if (atkRoll !== null) {
        setDisplayAtk(atkRoll);
        setLandedAtk(atkRoll);
      }
      if (defRoll !== null) {
        setDisplayDef(defRoll);
        setLandedDef(defRoll);
      }
    }
    return () => clearInterval(interval);
  }, [isRollingD20, atkRoll, defRoll]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRollingD6) {
      playDiceRollSound();
      interval = setInterval(() => {
        setDisplayD6(Math.floor(Math.random() * 6) + 1);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isRollingD6]);

  const attackerName = isP1Attacker ? p1Name : p2Name;
  const defenderName = isP1Attacker ? p2Name : p1Name;

  // Position state:
  // When idle/waiting to roll: docked towards corner
  // When rolling or after landed: centered right in the middle of the arena
  const isCentered = isRollingD20 || d20RolledThisTurn;

  return (
    <motion.div
      layout
      initial={{ scale: 0.9, y: 20 }}
      animate={{
        scale: isRollingD20 ? 1.15 : isCentered ? 1.0 : 0.92,
        y: isRollingD20 ? -12 : isCentered ? 0 : 18,
        opacity: 1,
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="flex flex-col items-center gap-2 select-none w-full max-w-xl mx-auto"
    >
      {/* Turn indicator when resting in corner/ready position */}
      {!isCentered && (
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="px-2.5 py-0.5 bg-yellow-500/20 border border-yellow-400 text-[8px] font-pixel text-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.4)]"
        >
          {isEn ? '🎲 READY TO ROLL ➔ WILL LAUNCH TO CENTER' : '🎲 SẴN SÀNG ➔ BẤM TUNG ĐỂ BAY RA GIỮA SÂN'}
        </motion.div>
      )}

      {/* Main Dice Arena Tray */}
      <div
        className={`relative flex flex-wrap items-center justify-center gap-3 sm:gap-6 p-3 sm:p-4 transition-all duration-300 ${
          isRollingD20
            ? 'bg-[#150a0a]/95 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.7)] scale-105'
            : isCentered
            ? 'bg-[#0c101c]/95 border-2 border-yellow-500/90 shadow-[0_0_25px_rgba(0,0,0,0.95)]'
            : 'bg-[#0c101c]/80 border border-slate-700/80 shadow-[0_0_15px_rgba(0,0,0,0.7)]'
        }`}
        style={{
          boxShadow: isRollingD20
            ? '0 0 25px rgba(239,68,68,0.6), inset 0 0 15px rgba(250,204,21,0.3)'
            : '0 0 20px rgba(0,0,0,0.9), inset 2px 2px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* D20 ATTACK TRAY */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-1 text-[8px] font-pixel font-bold text-red-400">
            <PixelIcon name="sword" size={12} color="#f87171" />
            <span>{isEn ? 'D20 ATTACK' : 'D20 CÔNG'}</span>
          </div>
          <span className="text-[7px] font-pixel text-slate-400 mb-1.5 truncate max-w-[100px]">
            {attackerName}
          </span>

          {/* Boxer double roll */}
          {boxerRolls && !isRollingD20 ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <ThreeDiceCanvas
                  diceType="d20"
                  theme={boxerRolls.chosen === boxerRolls.r1 ? 'gold' : 'red'}
                  isRolling={false}
                  value={boxerRolls.r1}
                  size={56}
                />
                {boxerRolls.chosen === boxerRolls.r1 && (
                  <span className="text-[6.5px] font-pixel text-yellow-400 font-bold mt-0.5">BEST</span>
                )}
              </div>
              <div className="flex flex-col items-center">
                <ThreeDiceCanvas
                  diceType="d20"
                  theme={boxerRolls.chosen === boxerRolls.r2 ? 'gold' : 'red'}
                  isRolling={false}
                  value={boxerRolls.r2}
                  size={56}
                />
                {boxerRolls.chosen === boxerRolls.r2 && (
                  <span className="text-[6.5px] font-pixel text-yellow-400 font-bold mt-0.5">BEST</span>
                )}
              </div>
            </div>
          ) : (
            /* Single D20 Attack 3D Die */
            <div className="relative flex items-center justify-center p-1 bg-black/60 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <ThreeDiceCanvas
                diceType="d20"
                theme="red"
                isRolling={isRollingD20}
                value={isRollingD20 ? displayAtk : (landedAtk ?? atkRoll ?? 20)}
                size={68}
              />
            </div>
          )}
        </div>

        {/* VS DIVIDER */}
        <div className="flex flex-col items-center justify-center pt-2">
          <span className="text-xs font-pixel font-bold text-yellow-400 tracking-widest drop-shadow">
            VS
          </span>
        </div>

        {/* D20 DEFENSE TRAY */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-1 text-[8px] font-pixel font-bold text-cyan-400">
            <PixelIcon name="shield" size={12} color="#38bdf8" />
            <span>{isEn ? 'D20 DEFENSE' : 'D20 THỦ'}</span>
          </div>
          <span className="text-[7px] font-pixel text-slate-400 mb-1.5 truncate max-w-[100px]">
            {defenderName}
          </span>

          {/* Single D20 Defense 3D Die */}
          <div className="relative flex items-center justify-center p-1 bg-black/60 border border-cyan-500/50 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
            <ThreeDiceCanvas
              diceType="d20"
              theme="cyan"
              isRolling={isRollingD20}
              value={isRollingD20 ? displayDef : (landedDef ?? defRoll ?? 20)}
              size={68}
            />
          </div>
        </div>

        {/* VERTICAL DIVIDER */}
        <div className="hidden sm:block w-[1px] h-16 bg-slate-700/80 mx-1" />

        {/* D6 SKILL CHARGE TRAY */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-1 text-[8px] font-pixel font-bold text-yellow-400">
            <PixelIcon name="lightning" size={12} color="#facc15" />
            <span>{isEn ? 'D6 SKILL CHARGE' : 'D6 SẠC CHIÊU'}</span>
          </div>
          <span className="text-[7px] font-pixel text-slate-400 mb-1.5">
            {isEn ? 'ENERGY TRAY' : 'NẠP ĐIỂM SẠC'}
          </span>

          {/* If Mage rolled 2 D6 dice */}
          {p1IsMage && d6P1Rolls && d6P1Rolls.length > 1 && !isRollingD6 ? (
            <div className="flex items-center gap-1.5 p-1 bg-black/60 border border-yellow-500/40">
              <ThreeDiceCanvas diceType="d6" theme="cyan" isRolling={false} value={d6P1Rolls[0]} size={48} />
              <span className="text-[10px] font-pixel text-yellow-400">+</span>
              <ThreeDiceCanvas diceType="d6" theme="cyan" isRolling={false} value={d6P1Rolls[1]} size={48} />
              <span className="text-[8px] font-pixel text-yellow-300 font-bold ml-1">
                ={d6P1Rolls.reduce((a, b) => a + b, 0)}
              </span>
            </div>
          ) : (
            /* Single D6 3D Die */
            <div className="relative flex items-center justify-center p-1 bg-black/60 border border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.3)]">
              <ThreeDiceCanvas
                diceType="d6"
                theme="gold"
                isRolling={isRollingD6}
                value={
                  isRollingD6
                    ? displayD6
                    : d6P1Rolls && d6P1Rolls.length > 0
                    ? d6P1Rolls.reduce((a, b) => a + b, 0)
                    : 6
                }
                size={58}
              />
            </div>
          )}
        </div>
      </div>

      {/* COMBAT OUTCOME FORMULA BANNER (Remains right under landed dice) */}
      {combatFormula && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`px-3 py-1.5 border-2 text-[9px] sm:text-[10px] font-pixel font-bold text-center tracking-wider shadow-[0_0_12px_rgba(0,0,0,0.8)] ${
            combatFormula.isHit
              ? 'bg-red-950/90 border-red-500 text-yellow-300'
              : 'bg-cyan-950/90 border-cyan-400 text-cyan-200'
          }`}
          style={{ textShadow: '1px 1px 0px #000' }}
        >
          {combatFormula.isHit ? (
            <span>
              {isEn ? 'HIT!' : 'ĐÁNH TRÚNG!'}{' '}
              <span className="text-red-400 font-bold">{combatFormula.atkRoll}</span> −{' '}
              <span className="text-cyan-400 font-bold">{combatFormula.defRoll}</span> ={' '}
              <span className="text-yellow-400 text-xs font-bold underline">
                {combatFormula.damage} {isEn ? 'DAMAGE' : 'SÁT THƯƠNG'}
              </span>
            </span>
          ) : (
            <span>
              {isEn ? 'DEFENDED!' : 'PHÒNG THỦ THÀNH CÔNG!'}{' '}
              <span className="text-red-400">{combatFormula.atkRoll}</span> ≤{' '}
              <span className="text-cyan-400">{combatFormula.defRoll}</span> ➔{' '}
              <span className="text-emerald-400 font-bold">0 {isEn ? 'DAMAGE' : 'SÁT THƯƠNG'}</span>
            </span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
