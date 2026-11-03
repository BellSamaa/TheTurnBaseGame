'use client';

import React, { useState, useEffect } from 'react';
import PixelIcon from '@/components/ui/PixelIcon';
import { playDiceRollSound } from '@/lib/soundEffects';

interface PixelDiceProps {
  // D20 Attack & Defense
  isRollingD20: boolean;
  atkRoll: number | null;
  defRoll: number | null;
  boxerRolls?: { r1: number; r2: number; chosen: number } | null;
  isP1Attacker: boolean;
  p1Name: string;
  p2Name: string;

  // D6 Skill Charge
  isRollingD6: boolean;
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
  atkRoll,
  defRoll,
  boxerRolls,
  isP1Attacker,
  p1Name,
  p2Name,
  isRollingD6,
  d6P1Rolls,
  d6P2Rolls,
  p1IsMage = false,
  p2IsMage = false,
  combatFormula,
  isEn = false,
}: PixelDiceProps) {
  // Rapid shuffle animation numbers during roll
  const [displayAtk, setDisplayAtk] = useState<number | string>(20);
  const [displayDef, setDisplayDef] = useState<number | string>(20);
  const [displayD6, setDisplayD6] = useState<number | string>(6);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRollingD20) {
      playDiceRollSound();
      interval = setInterval(() => {
        setDisplayAtk(Math.floor(Math.random() * 20) + 1);
        setDisplayDef(Math.floor(Math.random() * 20) + 1);
      }, 50);
    } else {
      if (atkRoll !== null) setDisplayAtk(atkRoll);
      if (defRoll !== null) setDisplayDef(defRoll);
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

  return (
    <div className="flex flex-col items-center gap-2.5 w-full max-w-xl select-none">
      {/* 1. D20 & D6 ARENA TRAYS */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 bg-[#0c101c]/90 border-2 border-yellow-500/80 p-3 sm:p-4 shadow-[0_0_20px_rgba(0,0,0,0.95)]">
        {/* D20 ATTACK TRAY */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-1 text-[8px] font-pixel font-bold text-red-400">
            <PixelIcon name="sword" size={12} color="#f87171" />
            <span>{isEn ? 'D20 ATTACK' : 'D20 CÔNG'}</span>
          </div>
          <span className="text-[7px] font-pixel text-slate-400 mb-1.5 truncate max-w-[100px]">
            {attackerName}
          </span>

          {/* If Boxer is attacking, display both rolls */}
          {boxerRolls && !isRollingD20 ? (
            <div className="flex items-center gap-1.5">
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 flex flex-col items-center justify-center border-2 ${
                  boxerRolls.chosen === boxerRolls.r1
                    ? 'border-yellow-400 bg-yellow-950/80 shadow-[0_0_10px_#facc15]'
                    : 'border-slate-700 bg-slate-900/80 opacity-60'
                }`}
                style={{ clipPath: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)' }}
              >
                <span className="text-xs sm:text-sm font-pixel font-bold text-yellow-300">
                  {boxerRolls.r1}
                </span>
                {boxerRolls.chosen === boxerRolls.r1 && (
                  <span className="text-[6px] font-pixel text-yellow-400">BEST</span>
                )}
              </div>

              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 flex flex-col items-center justify-center border-2 ${
                  boxerRolls.chosen === boxerRolls.r2
                    ? 'border-yellow-400 bg-yellow-950/80 shadow-[0_0_10px_#facc15]'
                    : 'border-slate-700 bg-slate-900/80 opacity-60'
                }`}
                style={{ clipPath: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)' }}
              >
                <span className="text-xs sm:text-sm font-pixel font-bold text-yellow-300">
                  {boxerRolls.r2}
                </span>
                {boxerRolls.chosen === boxerRolls.r2 && (
                  <span className="text-[6px] font-pixel text-yellow-400">BEST</span>
                )}
              </div>
            </div>
          ) : (
            /* Single D20 Attack Die */
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center border-2 transition-all ${
                isRollingD20
                  ? 'border-red-500 bg-red-950/80 animate-dice-shake'
                  : atkRoll !== null && atkRoll === 20
                  ? 'border-yellow-400 bg-yellow-500/40 shadow-[0_0_18px_#facc15] scale-105'
                  : 'border-red-500/80 bg-slate-950/95'
              }`}
              style={{ clipPath: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)' }}
            >
              <span className="text-lg sm:text-xl font-pixel font-bold text-red-300 drop-shadow">
                {isRollingD20 ? displayAtk : atkRoll !== null ? atkRoll : '20'}
              </span>
            </div>
          )}
        </div>

        {/* VS DIVIDER */}
        <div className="flex flex-col items-center justify-center pt-4">
          <span className="text-xs font-pixel font-bold text-yellow-400 tracking-widest">VS</span>
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

          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center border-2 transition-all ${
              isRollingD20
                ? 'border-cyan-400 bg-cyan-950/80 animate-dice-shake'
                : defRoll !== null && defRoll === 20
                ? 'border-cyan-300 bg-cyan-500/40 shadow-[0_0_18px_#38bdf8] scale-105'
                : 'border-cyan-500/80 bg-slate-950/95'
            }`}
            style={{ clipPath: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)' }}
          >
            <span className="text-lg sm:text-xl font-pixel font-bold text-cyan-300 drop-shadow">
              {isRollingD20 ? displayDef : defRoll !== null ? defRoll : '20'}
            </span>
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
            <div className="flex items-center gap-1.5">
              <div className="w-9 h-9 flex flex-col items-center justify-center border-2 border-cyan-400 bg-cyan-950/90 shadow">
                <span className="text-xs font-pixel font-bold text-cyan-200">{d6P1Rolls[0]}</span>
              </div>
              <span className="text-[10px] font-pixel text-yellow-400">+</span>
              <div className="w-9 h-9 flex flex-col items-center justify-center border-2 border-cyan-400 bg-cyan-950/90 shadow">
                <span className="text-xs font-pixel font-bold text-cyan-200">{d6P1Rolls[1]}</span>
              </div>
              <span className="text-[8px] font-pixel text-yellow-300">
                ={d6P1Rolls.reduce((a, b) => a + b, 0)}
              </span>
            </div>
          ) : (
            /* Single D6 Die */
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center border-2 transition-all ${
                isRollingD6
                  ? 'border-yellow-400 bg-yellow-950/80 animate-dice-shake'
                  : 'border-yellow-500/80 bg-slate-950/95 shadow-[0_0_10px_rgba(250,204,21,0.2)]'
              }`}
            >
              <span className="text-lg sm:text-xl font-pixel font-bold text-yellow-300 drop-shadow">
                {isRollingD6
                  ? displayD6
                  : d6P1Rolls && d6P1Rolls.length > 0
                  ? d6P1Rolls.reduce((a, b) => a + b, 0)
                  : '6'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. COMBAT COMPARISON FORMULA BANNER */}
      {combatFormula && (
        <div
          className={`px-3 py-1.5 border-2 text-[9px] sm:text-[10px] font-pixel font-bold text-center tracking-wider shadow-[0_0_12px_rgba(0,0,0,0.8)] animate-pulse ${
            combatFormula.isHit
              ? 'bg-red-950/90 border-red-500 text-yellow-300'
              : 'bg-cyan-950/90 border-cyan-400 text-cyan-200'
          }`}
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
        </div>
      )}
    </div>
  );
}
