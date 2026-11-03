'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/lib/translations';
import {
  CLASS_DEFINITIONS,
  MAP_DEFINITIONS,
  SPRITE_HELPERS,
} from '@/lib/constants';
import {
  rollD20,
  rollD6,
  calculateD20Combat,
  activateSkill1,
  checkSkill2Trigger,
  executeAiDecisions,
} from '@/lib/battleLogic';
import type { BattleLogEntry, PlayerState } from '@/types/game';
import HealthBar from '@/components/ui/HealthBar';
import PixelButton from '@/components/ui/PixelButton';
import PixelFrame from '@/components/ui/PixelFrame';
import DiceRoller3D from './DiceRoller3D';

export default function BattleScreen() {
  const { battleState, setBattleState, setPage, settings } = useGameStore();
  const lang = settings.language;
  const isEn = lang === 'en';

  // Dice rolling state
  const [isRollingD20, setIsRollingD20] = useState(false);
  const [isRollingD6, setIsRollingD6] = useState(false);
  const [d20P1, setD20P1] = useState<number | null>(null);
  const [d20P2, setD20P2] = useState<number | null>(null);
  const [d6P1, setD6P1] = useState<number | null>(null);
  const [d6P2, setD6P2] = useState<number | null>(null);

  // Turn action states
  const [d20RolledThisTurn, setD20RolledThisTurn] = useState(false);
  const [d6RolledThisTurn, setD6RolledThisTurn] = useState(false);
  const [floatingDamage, setFloatingDamage] = useState<{
    target: 'p1' | 'p2';
    text: string;
    isHeal?: boolean;
  } | null>(null);

  if (!battleState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-pixel">
        <PixelButton variant="gold" onClick={() => setPage('home')}>
          {isEn ? 'BACK TO HOME' : 'VỀ TRANG CHỦ'}
        </PixelButton>
      </div>
    );
  }

  const { player1, player2, currentTurn, mapId, phase, winnerId, battleLog, isAiOpponent } =
    battleState;
  const p1IsAttacker = player1.isAttacker;
  const mapData = MAP_DEFINITIONS.find((m) => m.id === mapId) || MAP_DEFINITIONS[0];

  const p1Class = CLASS_DEFINITIONS[player1.classType] || CLASS_DEFINITIONS.warrior;
  const p2Class = CLASS_DEFINITIONS[player2.classType] || CLASS_DEFINITIONS.assassin;

  // Add message to battle log
  const addLog = (entry: Omit<BattleLogEntry, 'timestamp'>) => {
    setBattleState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        battleLog: [{ ...entry, timestamp: Date.now() }, ...prev.battleLog],
      };
    });
  };

  // Check victory / defeat
  useEffect(() => {
    if (player1.hp <= 0 && !winnerId) {
      setBattleState((prev) => (prev ? { ...prev, winnerId: player2.id, phase: 'game_over' } : null));
    } else if (player2.hp <= 0 && !winnerId) {
      setBattleState((prev) => (prev ? { ...prev, winnerId: player1.id, phase: 'game_over' } : null));
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }, [player1.hp, player2.hp, winnerId, setBattleState, player1.id, player2.id]);

  // Handler: ROLL D20 (Attack & Defense)
  const handleRollD20 = () => {
    if (isRollingD20 || d20RolledThisTurn || phase === 'game_over') return;

    setIsRollingD20(true);

    // Boxer rolls twice on attack and picks highest
    let r1 = rollD20();
    let r1Extra = 0;
    if (p1IsAttacker && p1Class.extraD20Rolls > 0) {
      r1Extra = rollD20();
      r1 = Math.max(r1, r1Extra);
    }

    let r2 = rollD20();
    let r2Extra = 0;
    if (!p1IsAttacker && p2Class.extraD20Rolls > 0) {
      r2Extra = rollD20();
      r2 = Math.max(r2, r2Extra);
    }

    setD20P1(r1);
    setD20P2(r2);

    setTimeout(() => {
      setIsRollingD20(false);
      setD20RolledThisTurn(true);

      // Determine attack vs defense
      const attackerRoll = p1IsAttacker ? r1 : r2;
      const defenderRoll = p1IsAttacker ? r2 : r1;
      const attackerClass = p1IsAttacker ? p1Class : p2Class;
      const defenderClass = p1IsAttacker ? p2Class : p1Class;
      const defenderTarget = p1IsAttacker ? 'p2' : 'p1';

      const combatResult = calculateD20Combat({
        attackerRoll,
        defenderRoll,
        attackerClass,
        defenderClass,
      });

      if (combatResult.isHit) {
        setFloatingDamage({
          target: defenderTarget,
          text: `-${combatResult.damageDealt} HP`,
        });

        setBattleState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            player1: {
              ...prev.player1,
              hp: defenderTarget === 'p1' ? Math.max(0, prev.player1.hp - combatResult.damageDealt) : prev.player1.hp,
            },
            player2: {
              ...prev.player2,
              hp: defenderTarget === 'p2' ? Math.max(0, prev.player2.hp - combatResult.damageDealt) : prev.player2.hp,
            },
          };
        });

        addLog({
          turn: currentTurn,
          type: 'damage',
          message: isEn
            ? `HIT! Attacker ${attackerRoll} > Defender ${defenderRoll}. Dealt ${combatResult.damageDealt} damage!`
            : `ĐÁNH TRÚNG! Công ${attackerRoll} > Thủ ${defenderRoll}. Gây ${combatResult.damageDealt} sát thương!`,
          messageVi: `ĐÁNH TRÚNG! Công ${attackerRoll} > Thủ ${defenderRoll}. Gây ${combatResult.damageDealt} sát thương!`,
        });
      } else {
        setFloatingDamage({
          target: defenderTarget,
          text: isEn ? 'BLOCKED!' : 'ĐỠ ĐÒN!',
        });

        addLog({
          turn: currentTurn,
          type: 'defend',
          message: isEn
            ? `BLOCKED! Attacker ${attackerRoll} <= Defender ${defenderRoll}. 0 damage dealt.`
            : `PHÒNG THỦ THÀNH CÔNG! Công ${attackerRoll} <= Thủ ${defenderRoll}. Không gây sát thương.`,
          messageVi: `PHÒNG THỦ THÀNH CÔNG! Công ${attackerRoll} <= Thủ ${defenderRoll}. Không gây sát thương.`,
        });
      }

      setTimeout(() => setFloatingDamage(null), 1600);
    }, 1200);
  };

  // Handler: ROLL D6 (Skill Charge)
  const handleRollD6 = () => {
    if (isRollingD6 || d6RolledThisTurn || phase === 'game_over') return;

    setIsRollingD6(true);

    // Mage rolls D6 twice
    const rollsP1 = [rollD6()];
    if (p1Class.extraD6Rolls > 0) rollsP1.push(rollD6());
    const totalP1 = rollsP1.reduce((a, b) => a + b, 0);

    const rollsP2 = [rollD6()];
    if (p2Class.extraD6Rolls > 0) rollsP2.push(rollD6());
    const totalP2 = rollsP2.reduce((a, b) => a + b, 0);

    setD6P1(totalP1);
    setD6P2(totalP2);

    setTimeout(() => {
      setIsRollingD6(false);
      setD6RolledThisTurn(true);

      setBattleState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          player1: { ...prev.player1, skillCharge: prev.player1.skillCharge + totalP1 },
          player2: { ...prev.player2, skillCharge: prev.player2.skillCharge + totalP2 },
        };
      });

      addLog({
        turn: currentTurn,
        type: 'skill',
        message: isEn
          ? `D6 Roll: ${player1.name} +${totalP1} charge, ${player2.name} +${totalP2} charge!`
          : `Tung D6: ${player1.name} nhận +${totalP1} điểm sạc, ${player2.name} nhận +${totalP2} điểm!`,
        messageVi: `Tung D6: ${player1.name} nhận +${totalP1} điểm sạc, ${player2.name} nhận +${totalP2} điểm!`,
      });

      // Check weapon skill 2 trigger
      const p1Trigger = checkSkill2Trigger(player1.weapon, totalP1);
      if (p1Trigger.triggered) {
        setFloatingDamage({ target: 'p2', text: `-${p1Trigger.damage} HP (SKILL 2!)` });
        setBattleState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            player2: { ...prev.player2, hp: Math.max(0, prev.player2.hp - p1Trigger.damage) },
          };
        });
        addLog({
          turn: currentTurn,
          type: 'skill',
          message: isEn
            ? `SPECIAL TRIGGER! ${player1.name} rolled ${totalP1} activating ${player1.weapon.skill2.name} dealing ${p1Trigger.damage} DMG!`
            : `KÍCH HOẠT ĐẶC BIỆT! ${player1.name} đổ ra ${totalP1} kích hoạt ${player1.weapon.skill2.nameVi} gây ${p1Trigger.damage} sát thương!`,
          messageVi: `KÍCH HOẠT ĐẶC BIỆT! ${player1.name} đổ ra ${totalP1} kích hoạt ${player1.weapon.skill2.nameVi} gây ${p1Trigger.damage} sát thương!`,
        });
      }
    }, 1000);
  };

  // Handler: CAST SKILL 1 (Charge threshold skill)
  const handleCastSkill1 = (caster: 'p1' | 'p2') => {
    const user = caster === 'p1' ? player1 : player2;
    const opponent = caster === 'p1' ? player2 : player1;

    if (user.skillCharge < user.weapon.skill1.chargeRequired) return;

    const res = activateSkill1(user.weapon);

    if (res.damage > 0) {
      setFloatingDamage({
        target: caster === 'p1' ? 'p2' : 'p1',
        text: `-${res.damage} HP`,
      });
    }

    setBattleState((prev) => {
      if (!prev) return null;
      const isP1 = caster === 'p1';
      return {
        ...prev,
        player1: {
          ...prev.player1,
          skillCharge: isP1 ? prev.player1.skillCharge - res.cost : prev.player1.skillCharge,
          hp: !isP1
            ? Math.max(0, prev.player1.hp - res.damage)
            : Math.min(prev.player1.maxHp, prev.player1.hp + res.heal),
        },
        player2: {
          ...prev.player2,
          skillCharge: !isP1 ? prev.player2.skillCharge - res.cost : prev.player2.skillCharge,
          hp: isP1
            ? Math.max(0, prev.player2.hp - res.damage)
            : Math.min(prev.player2.maxHp, prev.player2.hp + res.heal),
        },
      };
    });

    addLog({
      turn: currentTurn,
      type: 'skill',
      message: isEn
        ? `${user.name} unleashes: ${user.weapon.skill1.name} dealing ${res.damage} DMG!`
        : `${user.name} kích hoạt: ${res.logTextVi}`,
      messageVi: `${user.name} kích hoạt: ${res.logTextVi}`,
    });

    setTimeout(() => setFloatingDamage(null), 1800);
  };

  // Handler: END TURN (Switches Attacker / Defender)
  const handleEndTurn = () => {
    if (!d20RolledThisTurn) return; // Must roll D20 to finish combat turn

    // AI Skill Decision before ending
    if (isAiOpponent) {
      const ai = executeAiDecisions(battleState);
      if (ai.wantsToUseSkill1) {
        handleCastSkill1('p2');
      }
    }

    setD20RolledThisTurn(false);
    setD6RolledThisTurn(false);
    setD20P1(null);
    setD20P2(null);
    setD6P1(null);
    setD6P2(null);

    setBattleState((prev) => {
      if (!prev) return null;
      const nextP1IsAttacker = !prev.player1.isAttacker;
      return {
        ...prev,
        currentTurn: prev.currentTurn + 1,
        attackerId: nextP1IsAttacker ? prev.player1.id : prev.player2.id,
        player1: { ...prev.player1, isAttacker: nextP1IsAttacker },
        player2: { ...prev.player2, isAttacker: !nextP1IsAttacker },
      };
    });

    addLog({
      turn: currentTurn + 1,
      type: 'system',
      message: isEn
        ? `--- ROUND ${currentTurn + 1}: ${!p1IsAttacker ? player1.name : player2.name} IS NOW ATTACKING! ---`
        : `--- BẮT ĐẦU HIỆP ${currentTurn + 1}: ${!p1IsAttacker ? player1.name : player2.name} LÀ BÊN TẤN CÔNG! ---`,
      messageVi: `--- BẮT ĐẦU HIỆP ${currentTurn + 1}: ${!p1IsAttacker ? player1.name : player2.name} LÀ BÊN TẤN CÔNG! ---`,
    });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center p-2 sm:p-4 overflow-hidden select-none bg-[#07070b]">
      {/* 1. Map Arena Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={mapData.image}
          alt={mapData.name}
          fill
          priority
          className="object-cover filter brightness-[0.7] contrast-[1.15]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/70 pointer-events-none" />
      </div>

      {/* 2. Top Header HUD: HP Bars & Turn Status */}
      <div className="relative z-20 w-full max-w-5xl flex flex-col gap-2">
        {/* Top Status Banner */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-black/85 border border-yellow-500/60 shadow">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-yellow-400 font-pixel font-bold">
              🗺️ {isEn ? mapData.name : mapData.nameVi}
            </span>
          </div>

          <div className="text-[9px] sm:text-[10px] text-yellow-300 font-bold font-pixel tracking-widest animate-pulse">
            {isEn ? `TURN ${currentTurn} • ATK: ` : `LƯỢT ${currentTurn} • BÊN CÔNG: `}
            <span className="text-red-400">
              {p1IsAttacker ? player1.name : player2.name}
            </span>
          </div>

          <button
            onClick={() => setPage('play')}
            className="text-[8px] font-pixel text-slate-400 hover:text-white px-2 py-1 bg-slate-800 border border-slate-600 transition"
          >
            {isEn ? 'SURRENDER' : 'ĐẦU HÀNG'}
          </button>
        </div>

        {/* Both Players HP & Stats Bar */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 items-center">
          {/* Player 1 Health HUD */}
          <div className="relative p-2 bg-black/80 border-2 border-yellow-500/70 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-pixel font-bold text-yellow-300 flex items-center gap-1.5">
                <span>{p1IsAttacker ? '⚔️' : '🛡️'}</span>
                {player1.name} ({isEn ? p1Class.name : p1Class.nameVi})
              </span>
              <span className="text-[8px] font-pixel font-bold text-cyan-300">
                {isEn ? `CHARGE: ${player1.skillCharge} pts` : `SẠC: ${player1.skillCharge} đ`}
              </span>
            </div>
            <HealthBar
              current={player1.hp}
              max={player1.maxHp}
              playerName=""
            />
          </div>

          {/* Player 2 Health HUD */}
          <div className="relative p-2 bg-black/80 border-2 border-red-500/70 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-pixel font-bold text-red-300 flex items-center gap-1.5">
                <span>{!p1IsAttacker ? '⚔️' : '🛡️'}</span>
                {player2.name} ({isEn ? p2Class.name : p2Class.nameVi})
              </span>
              <span className="text-[8px] font-pixel font-bold text-cyan-300">
                {isEn ? `CHARGE: ${player2.skillCharge} pts` : `SẠC: ${player2.skillCharge} đ`}
              </span>
            </div>
            <HealthBar
              current={player2.hp}
              max={player2.maxHp}
              playerName=""
            />
          </div>
        </div>
      </div>

      {/* 3. Center Battle Arena: Sliced Layered Characters & 3D Dice */}
      <div className="relative z-20 w-full max-w-5xl my-auto flex items-center justify-between px-2 sm:px-8">
        {/* Left: Player 1 Sliced Layered Character Stage */}
        <div className="relative flex flex-col items-center">
          {/* Floating Damage Text */}
          <AnimatePresence>
            {floatingDamage?.target === 'p1' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -30, scale: 1.2 }}
                exit={{ opacity: 0 }}
                className={`absolute -top-10 font-pixel text-xs sm:text-sm font-bold drop-shadow-[0_2px_4px_#000] z-30 ${
                  floatingDamage.isHeal ? 'text-emerald-400' : 'text-red-500'
                }`}
              >
                {floatingDamage.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Player 1 Sliced Layered Sprite Avatar */}
          <div
            className={`
              relative w-28 h-40 sm:w-36 sm:h-52 flex items-center justify-center transition-all duration-300
              ${p1IsAttacker ? 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : ''}
            `}
          >
            {/* 1. Body */}
            <img
              src={SPRITE_HELPERS.body(player1.character.baseIndex)}
              alt="Player 1 Body"
              className="absolute inset-0 w-full h-full object-contain pixelated z-10 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
            />
            {/* Body Skin Tint */}
            <div
              className="absolute inset-0 z-11 pointer-events-none mix-blend-color opacity-30"
              style={{ backgroundColor: player1.character.skinColor }}
            />
            {/* 2. Pants */}
            <img
              src={SPRITE_HELPERS.pants(player1.character.pantsIndex)}
              alt="Pants"
              className="absolute inset-0 w-full h-full object-contain pixelated z-20 pointer-events-none"
            />
            {/* 3. Shirt */}
            <img
              src={SPRITE_HELPERS.shirt(player1.character.shirtIndex)}
              alt="Shirt"
              className="absolute inset-0 w-full h-full object-contain pixelated z-30 pointer-events-none"
            />
            {/* 4. Face */}
            <img
              src={SPRITE_HELPERS.face(player1.character.faceIndex)}
              alt="Face"
              className="absolute inset-0 w-full h-full object-contain pixelated z-40 pointer-events-none"
            />
            {/* 5. Hair */}
            <img
              src={SPRITE_HELPERS.hair(player1.character.hairIndex)}
              alt="Hair"
              className="absolute inset-0 w-full h-full object-contain pixelated z-50 pointer-events-none"
            />
            {/* 6. Accessory */}
            <img
              src={SPRITE_HELPERS.accessory(player1.character.accessoryIndex)}
              alt="Accessory"
              className="absolute inset-0 w-full h-full object-contain pixelated z-60 pointer-events-none"
            />
          </div>

          <span className="mt-1 text-[8px] font-pixel text-yellow-300 bg-black/80 px-2 py-0.5 border border-yellow-500">
            {p1IsAttacker ? (isEn ? '⚔️ ATTACKING' : '⚔️ TẤN CÔNG') : (isEn ? '🛡️ DEFENDING' : '🛡️ PHÒNG THỦ')}
          </span>
        </div>

        {/* Center: 3D Dice Rolling Arena */}
        <div className="relative flex flex-col items-center justify-center gap-2">
          <div className="p-2 sm:p-4 bg-black/75 border-2 border-yellow-500/60 rounded-none shadow-[0_0_25px_rgba(0,0,0,0.9)] backdrop-blur-sm flex flex-col items-center">
            <div className="flex items-center gap-3 sm:gap-6">
              {/* D20 Dice 3D */}
              <div className="flex flex-col items-center">
                <DiceRoller3D
                  diceType="d20"
                  isRolling={isRollingD20}
                  targetValue={p1IsAttacker ? d20P1 : d20P2}
                  label={isEn ? 'D20 COMBAT DIE' : 'XÚC XẮC D20 (CÔNG/THỦ)'}
                />
              </div>

              {/* D6 Skill Dice 3D */}
              <div className="flex flex-col items-center">
                <DiceRoller3D
                  diceType="d6"
                  isRolling={isRollingD6}
                  targetValue={d6P1}
                  label={isEn ? 'D6 SKILL DIE' : 'XÚC XẮC D6 (SẠC CHIÊU)'}
                />
              </div>
            </div>

            {/* Combat Roll Status Display */}
            <div className="mt-2 text-center">
              {d20P1 !== null && d20P2 !== null && (
                <div className="text-[9px] sm:text-[10px] font-pixel font-bold text-yellow-300 bg-black/90 px-3 py-1 border border-yellow-400 shadow">
                  P1: {d20P1} pts | P2: {d20P2} pts
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Player 2 Sliced Layered Character Stage (Mirrored) */}
        <div className="relative flex flex-col items-center">
          {/* Floating Damage Text */}
          <AnimatePresence>
            {floatingDamage?.target === 'p2' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -30, scale: 1.2 }}
                exit={{ opacity: 0 }}
                className={`absolute -top-10 font-pixel text-xs sm:text-sm font-bold drop-shadow-[0_2px_4px_#000] z-30 ${
                  floatingDamage.isHeal ? 'text-emerald-400' : 'text-red-500'
                }`}
              >
                {floatingDamage.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Player 2 Sliced Layered Sprite Avatar (Mirrored) */}
          <div
            className={`
              relative w-28 h-40 sm:w-36 sm:h-52 flex items-center justify-center transition-all duration-300 scale-x-[-1]
              ${!p1IsAttacker ? 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : ''}
            `}
          >
            {/* 1. Body */}
            <img
              src={SPRITE_HELPERS.body(player2.character.baseIndex)}
              alt="Player 2 Body"
              className="absolute inset-0 w-full h-full object-contain pixelated z-10 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
            />
            {/* Body Skin Tint */}
            <div
              className="absolute inset-0 z-11 pointer-events-none mix-blend-color opacity-30"
              style={{ backgroundColor: player2.character.skinColor }}
            />
            {/* 2. Pants */}
            <img
              src={SPRITE_HELPERS.pants(player2.character.pantsIndex)}
              alt="Pants"
              className="absolute inset-0 w-full h-full object-contain pixelated z-20 pointer-events-none"
            />
            {/* 3. Shirt */}
            <img
              src={SPRITE_HELPERS.shirt(player2.character.shirtIndex)}
              alt="Shirt"
              className="absolute inset-0 w-full h-full object-contain pixelated z-30 pointer-events-none"
            />
            {/* 4. Face */}
            <img
              src={SPRITE_HELPERS.face(player2.character.faceIndex)}
              alt="Face"
              className="absolute inset-0 w-full h-full object-contain pixelated z-40 pointer-events-none"
            />
            {/* 5. Hair */}
            <img
              src={SPRITE_HELPERS.hair(player2.character.hairIndex)}
              alt="Hair"
              className="absolute inset-0 w-full h-full object-contain pixelated z-50 pointer-events-none"
            />
            {/* 6. Accessory */}
            <img
              src={SPRITE_HELPERS.accessory(player2.character.accessoryIndex)}
              alt="Accessory"
              className="absolute inset-0 w-full h-full object-contain pixelated z-60 pointer-events-none"
            />
          </div>

          <span className="mt-1 text-[8px] font-pixel text-red-300 bg-black/80 px-2 py-0.5 border border-red-500">
            {!p1IsAttacker ? (isEn ? '⚔️ ATTACKING' : '⚔️ TẤN CÔNG') : (isEn ? '🛡️ DEFENDING' : '🛡️ PHÒNG THỦ')}
          </span>
        </div>
      </div>

      {/* 4. Bottom Action Bar & Battle Log (Compact UI) */}
      <div className="relative z-20 w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3">
        {/* Left: Skill Cast & Weapon Powers (4 cols) */}
        <div className="md:col-span-4 bg-black/85 border border-yellow-500/60 p-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[8.5px] font-pixel font-bold text-yellow-300 mb-1">
              <span>🗡️ {isEn ? player1.weapon.name : player1.weapon.nameVi}</span>
              <span className="text-cyan-300">{player1.skillCharge} / {player1.weapon.skill1.chargeRequired} pts</span>
            </div>

            <p className="text-[7.5px] font-pixel text-slate-400 leading-tight mb-2">
              {isEn ? player1.weapon.skill1.description : player1.weapon.skill1.descriptionVi}
            </p>
          </div>

          <PixelButton
            variant={player1.skillCharge >= player1.weapon.skill1.chargeRequired ? 'gold' : 'frame'}
            size="sm"
            disabled={player1.skillCharge < player1.weapon.skill1.chargeRequired}
            onClick={() => handleCastSkill1('p1')}
            className="w-full text-[8.5px] font-pixel py-2"
          >
            {isEn
              ? `🔥 UNLEASH SKILL (${player1.weapon.skill1.chargeRequired} PTS)`
              : `🔥 TUNG TUYỆT KỸ (${player1.weapon.skill1.chargeRequired} ĐIỂM)`}
          </PixelButton>
        </div>

        {/* Center: Action Buttons (D20, D6, End Turn) (4 cols) */}
        <div className="md:col-span-4 bg-black/85 border border-cyan-500/60 p-2.5 flex flex-col justify-between gap-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Roll D20 Button */}
            <PixelButton
              variant="danger"
              size="sm"
              disabled={isRollingD20 || d20RolledThisTurn}
              onClick={handleRollD20}
              className="w-full text-[8px] font-pixel py-2.5 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
            >
              {d20RolledThisTurn
                ? (isEn ? '✓ D20 ROLLED' : '✓ ĐÃ TUNG D20')
                : (isEn ? '🎲 ROLL D20 (ATK)' : '🎲 TUNG D20 (CÔNG)')}
            </PixelButton>

            {/* Roll D6 Button */}
            <PixelButton
              variant="secondary"
              size="sm"
              disabled={isRollingD6 || d6RolledThisTurn}
              onClick={handleRollD6}
              className="w-full text-[8px] font-pixel py-2.5"
            >
              {d6RolledThisTurn
                ? (isEn ? '✓ D6 ROLLED' : '✓ ĐÃ TUNG D6')
                : (isEn ? '⚡ ROLL D6 (CHARGE)' : '⚡ TUNG D6 (SẠC)')}
            </PixelButton>
          </div>

          {/* End Turn Button */}
          <PixelButton
            variant={d20RolledThisTurn ? 'success' : 'frame'}
            size="sm"
            disabled={!d20RolledThisTurn}
            onClick={handleEndTurn}
            className="w-full text-[9px] font-pixel py-2 font-bold"
          >
            {isEn ? 'END TURN ➔' : 'KẾT THÚC LƯỢT ➔'}
          </PixelButton>
        </div>

        {/* Right: Battle Log Box (4 cols) */}
        <div className="md:col-span-4 bg-black/85 border border-slate-700 p-2 flex flex-col">
          <div className="text-[8.5px] font-pixel text-yellow-400 font-bold mb-1 flex items-center justify-between border-b border-slate-800 pb-1">
            <span>📜 {isEn ? 'COMBAT LOG' : 'NHẬT KÝ CHIẾN ĐẤU'}</span>
            <span className="text-[7px] text-slate-500 font-pixel">LIVE</span>
          </div>

          <div className="flex-1 max-h-24 overflow-y-auto space-y-1 text-[7.5px] font-pixel text-slate-300 pr-1">
            {battleLog.slice(0, 8).map((log, idx) => (
              <div
                key={idx}
                className={`
                  p-1 border-l-2
                  ${
                    log.type === 'damage'
                      ? 'border-red-500 bg-red-950/20 text-red-200'
                      : log.type === 'defend'
                      ? 'border-cyan-400 bg-cyan-950/20 text-cyan-200'
                      : log.type === 'skill'
                      ? 'border-yellow-400 bg-yellow-950/20 text-yellow-200'
                      : 'border-slate-500 bg-slate-900/30'
                  }
                `}
              >
                {log.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Game Over / Victory Modal */}
      <AnimatePresence>
        {phase === 'game_over' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-md"
            >
              <PixelFrame
                variant={winnerId === player1.id ? 'gold' : 'red'}
                title={
                  winnerId === player1.id
                    ? (isEn ? '👑 GLORIOUS VICTORY!' : '👑 CHIẾN THẮNG HUY HOÀNG!')
                    : (isEn ? '💀 DEFEATED IN COMBAT!' : '💀 BẠN ĐÃ THẤT BẠI!')
                }
              >
                <div className="flex flex-col items-center text-center py-4">
                  <span className="text-6xl mb-3 animate-float">
                    {winnerId === player1.id ? '🏆' : '💀'}
                  </span>

                  <h3
                    className={`text-sm sm:text-base font-pixel font-bold mb-2 ${
                      winnerId === player1.id ? 'text-yellow-400' : 'text-red-500'
                    }`}
                  >
                    {winnerId === player1.id
                      ? (isEn ? 'VICTORY - TRIUMPH!' : 'VICTORY - CHIẾN THẮNG!')
                      : (isEn ? 'DEFEAT - CRUSHED!' : 'DEFEAT - THẤT TRẬN!')}
                  </h3>

                  <p className="text-[9px] font-pixel text-slate-300 mb-6">
                    {winnerId === player1.id
                      ? (isEn
                          ? `Congratulations ${player1.name}! You defeated ${player2.name} in round ${currentTurn}!`
                          : `Chúc mừng ${player1.name}! Bạn đã hạ gục ${player2.name} sau ${currentTurn} lượt đấu cam go!`)
                      : (isEn
                          ? `${player2.name} has bested you! Refine your tactics and roll again.`
                          : `${player2.name} đã đánh bại bạn! Hãy nâng cấp kỹ năng và thử lại.`)}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <PixelButton
                      variant="gold"
                      size="md"
                      onClick={() => setPage('play')}
                      className="w-full text-xs font-pixel"
                    >
                      {isEn ? 'PLAY ANOTHER MATCH' : 'CHƠI TIẾP TRẬN MỚI'}
                    </PixelButton>

                    <PixelButton
                      variant="frame"
                      size="md"
                      onClick={() => setPage('home')}
                      className="w-full text-xs font-pixel"
                    >
                      {t('home', lang)}
                    </PixelButton>
                  </div>
                </div>
              </PixelFrame>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
