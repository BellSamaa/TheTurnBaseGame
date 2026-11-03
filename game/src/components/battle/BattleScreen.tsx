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
          VỀ TRANG CHỦ
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

      const combat = calculateD20Combat(
        attackerRoll,
        defenderRoll,
        attackerClass,
        defenderClass
      );

      // Apply damage
      if (combat.isHit) {
        setFloatingDamage({
          target: defenderTarget,
          text: `-${combat.damage} HP`,
        });

        setBattleState((prev) => {
          if (!prev) return null;
          const targetPlayer = p1IsAttacker ? 'player2' : 'player1';
          return {
            ...prev,
            [targetPlayer]: {
              ...prev[targetPlayer],
              hp: Math.max(0, prev[targetPlayer].hp - combat.damage),
            },
          };
        });
      } else {
        setFloatingDamage({
          target: defenderTarget,
          text: 'ĐỠ ĐÒN (0 DMG)',
        });
      }

      addLog({
        turn: currentTurn,
        type: combat.isHit ? 'damage' : 'defend',
        message: `${p1IsAttacker ? player1.name : player2.name} tấn công: ${combat.logTextVi}`,
        messageVi: `${p1IsAttacker ? player1.name : player2.name} tấn công: ${combat.logTextVi}`,
      });

      setTimeout(() => setFloatingDamage(null), 1800);
    }, 1800);
  };

  // Handler: ROLL D6 (Skill Charge & Special Trigger)
  const handleRollD6 = () => {
    if (isRollingD6 || d6RolledThisTurn || phase === 'game_over') return;

    setIsRollingD6(true);

    // Mage rolls extra D6
    const rollP1 = rollD6();
    const rollP1Extra = p1Class.extraD6Rolls > 0 ? rollD6() : 0;
    const totalP1D6 = rollP1 + rollP1Extra;

    const rollP2 = rollD6();
    const rollP2Extra = p2Class.extraD6Rolls > 0 ? rollD6() : 0;
    const totalP2D6 = rollP2 + rollP2Extra;

    setD6P1(rollP1);
    setD6P2(rollP2);

    setTimeout(() => {
      setIsRollingD6(false);
      setD6RolledThisTurn(true);

      // Add charge points
      setBattleState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          player1: {
            ...prev.player1,
            skillCharge: prev.player1.skillCharge + totalP1D6,
          },
          player2: {
            ...prev.player2,
            skillCharge: prev.player2.skillCharge + totalP2D6,
          },
        };
      });

      addLog({
        turn: currentTurn,
        type: 'skill',
        message: `Xúc xắc D6: ${player1.name} nhận +${totalP1D6} điểm sạc | ${player2.name} nhận +${totalP2D6} điểm sạc.`,
        messageVi: `Xúc xắc D6: ${player1.name} nhận +${totalP1D6} điểm sạc | ${player2.name} nhận +${totalP2D6} điểm sạc.`,
      });

      // Check Skill 2 Special triggers
      const p1Skill2 = checkSkill2Trigger(rollP1, player1, player2);
      if (p1Skill2.triggered) {
        if (p1Skill2.damage > 0) {
          setFloatingDamage({ target: 'p2', text: `-${p1Skill2.damage} HP (SKILL 2)` });
          setBattleState((prev) =>
            prev
              ? {
                  ...prev,
                  player2: {
                    ...prev.player2,
                    hp: Math.max(0, prev.player2.hp - p1Skill2.damage),
                  },
                }
              : null
          );
        }
        if (p1Skill2.heal > 0) {
          setFloatingDamage({ target: 'p1', text: `+${p1Skill2.heal} HP`, isHeal: true });
          setBattleState((prev) =>
            prev
              ? {
                  ...prev,
                  player1: {
                    ...prev.player1,
                    hp: Math.min(prev.player1.maxHp, prev.player1.hp + p1Skill2.heal),
                  },
                }
              : null
          );
        }
        addLog({
          turn: currentTurn,
          type: 'skill',
          message: `${player1.name}: ${p1Skill2.logTextVi}`,
          messageVi: `${player1.name}: ${p1Skill2.logTextVi}`,
        });
      }

      const p2Skill2 = checkSkill2Trigger(rollP2, player2, player1);
      if (p2Skill2.triggered) {
        if (p2Skill2.damage > 0) {
          setFloatingDamage({ target: 'p1', text: `-${p2Skill2.damage} HP (SKILL 2)` });
          setBattleState((prev) =>
            prev
              ? {
                  ...prev,
                  player1: {
                    ...prev.player1,
                    hp: Math.max(0, prev.player1.hp - p2Skill2.damage),
                  },
                }
              : null
          );
        }
        if (p2Skill2.heal > 0) {
          setFloatingDamage({ target: 'p2', text: `+${p2Skill2.heal} HP`, isHeal: true });
          setBattleState((prev) =>
            prev
              ? {
                  ...prev,
                  player2: {
                    ...prev.player2,
                    hp: Math.min(prev.player2.maxHp, prev.player2.hp + p2Skill2.heal),
                  },
                }
              : null
          );
        }
        addLog({
          turn: currentTurn,
          type: 'skill',
          message: `${player2.name}: ${p2Skill2.logTextVi}`,
          messageVi: `${player2.name}: ${p2Skill2.logTextVi}`,
        });
      }

      setTimeout(() => setFloatingDamage(null), 1800);
    }, 1800);
  };

  // Handler: Activate Skill 1 (Point Threshold)
  const handleCastSkill1 = (caster: 'p1' | 'p2') => {
    const user = caster === 'p1' ? player1 : player2;
    const target = caster === 'p1' ? player2 : player1;

    const res = activateSkill1(user, target);
    if (!res.success) return;

    if (res.damage > 0) {
      setFloatingDamage({
        target: caster === 'p1' ? 'p2' : 'p1',
        text: `-${res.damage} HP (TUYỆT KỸ)`,
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
      message: `${user.name} kích hoạt: ${res.logTextVi}`,
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
      message: `--- BẮT ĐẦU HIỆP ${currentTurn + 1}: ${
        !p1IsAttacker ? player1.name : player2.name
      } LÀ BÊN TẤN CÔNG! ---`,
      messageVi: `--- BẮT ĐẦU HIỆP ${currentTurn + 1}: ${
        !p1IsAttacker ? player1.name : player2.name
      } LÀ BÊN TẤN CÔNG! ---`,
    });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center p-2 sm:p-4 overflow-hidden select-none">
      {/* 1. Map Arena Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={mapData.image}
          alt={mapData.nameVi}
          fill
          priority
          className="object-cover filter brightness-[0.8] contrast-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* 2. Top Header HUD: HP Bars & Turn Status */}
      <div className="relative z-20 w-full max-w-5xl flex flex-col gap-2">
        {/* Top Status Banner */}
        <div className="flex items-center justify-between px-3 py-1 bg-black/80 border border-yellow-500/60 shadow">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-yellow-400 font-bold">
              🗺️ {mapData.nameVi}
            </span>
          </div>

          <div className="text-[10px] text-yellow-300 font-bold font-pixel tracking-widest animate-pulse">
            LƯỢT {currentTurn} • BÊN CÔNG:{' '}
            <span className="text-red-400">
              {p1IsAttacker ? player1.name : player2.name}
            </span>
          </div>

          <button
            onClick={() => setPage('play')}
            className="text-[9px] text-slate-400 hover:text-white px-2 py-0.5 bg-slate-800 border border-slate-600"
          >
            ĐẦU HÀNG / THOÁT
          </button>
        </div>

        {/* Both Players HP & Stats Bar */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 items-center">
          {/* Player 1 Health HUD */}
          <div className="relative p-2 bg-black/75 border-2 border-yellow-500/70 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-yellow-300 flex items-center gap-1.5">
                <span>{p1IsAttacker ? '⚔️' : '🛡️'}</span>
                {player1.name} ({p1Class.nameVi})
              </span>
              <span className="text-[9px] font-bold text-cyan-300">
                SẠC: {player1.skillCharge} đ
              </span>
            </div>
            <HealthBar
              current={player1.hp}
              max={player1.maxHp}
              playerName=""
            />
          </div>

          {/* Player 2 Health HUD */}
          <div className="relative p-2 bg-black/75 border-2 border-red-500/70 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-red-300 flex items-center gap-1.5">
                <span>{!p1IsAttacker ? '⚔️' : '🛡️'}</span>
                {player2.name} ({p2Class.nameVi})
              </span>
              <span className="text-[9px] font-bold text-cyan-300">
                SẠC: {player2.skillCharge} đ
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

      {/* 3. Center Battle Arena: Characters & 3D Dice */}
      <div className="relative z-20 w-full max-w-5xl my-auto flex items-center justify-between px-2 sm:px-8">
        {/* Left: Player 1 Character Sprite Stage */}
        <div className="relative flex flex-col items-center">
          {/* Floating Damage Text */}
          <AnimatePresence>
            {floatingDamage?.target === 'p1' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -30, scale: 1.2 }}
                exit={{ opacity: 0 }}
                className={`absolute -top-10 font-pixel text-sm sm:text-base font-bold drop-shadow-[0_2px_4px_#000] z-30 ${
                  floatingDamage.isHeal ? 'text-emerald-400' : 'text-red-500'
                }`}
              >
                {floatingDamage.text}
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={`
              relative w-28 h-36 sm:w-40 sm:h-52 flex items-center justify-center transition-all duration-300
              ${p1IsAttacker ? 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : ''}
            `}
          >
            <Image
              src="/assets/images/characters/char-8transparent.png"
              alt="Player 1"
              fill
              className="object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
              style={{
                transform: `scale(1.3) translateX(-${(player1.character.baseIndex % 4) * 25}%) translateY(-${Math.floor(player1.character.baseIndex / 4) * 50}%)`,
                transformOrigin: 'top left',
              }}
            />
          </div>

          <span className="mt-1 text-[9px] font-pixel text-yellow-300 bg-black/80 px-2 py-0.5 border border-yellow-500">
            {p1IsAttacker ? '⚔️ TẤN CÔNG' : '🛡️ PHÒNG THỦ'}
          </span>
        </div>

        {/* Center: 3D Dice Rolling Arena */}
        <div className="relative flex flex-col items-center justify-center gap-2">
          {/* Tray Frame Images */}
          <div className="p-2 sm:p-4 bg-black/70 border-2 border-yellow-500/60 rounded-none shadow-[0_0_25px_rgba(0,0,0,0.9)] backdrop-blur-sm flex flex-col items-center">
            <div className="flex items-center gap-3 sm:gap-6">
              {/* D20 Dice 3D */}
              <div className="flex flex-col items-center">
                <DiceRoller3D
                  diceType="d20"
                  isRolling={isRollingD20}
                  targetValue={p1IsAttacker ? d20P1 : d20P2}
                  label="XÚC XẮC D20 (CÔNG/THỦ)"
                />
              </div>

              {/* D6 Skill Dice 3D */}
              <div className="flex flex-col items-center">
                <DiceRoller3D
                  diceType="d6"
                  isRolling={isRollingD6}
                  targetValue={d6P1}
                  label="XÚC XẮC D6 (SẠC CHIÊU)"
                />
              </div>
            </div>

            {/* Combat Roll Status Display */}
            <div className="mt-2 text-center">
              {d20P1 !== null && d20P2 !== null && (
                <div className="text-[10px] sm:text-xs font-bold text-yellow-300 bg-black/90 px-3 py-1 border border-yellow-400 shadow">
                  P1: {d20P1} điểm | P2: {d20P2} điểm
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Player 2 Character Sprite Stage (Mirrored) */}
        <div className="relative flex flex-col items-center">
          {/* Floating Damage Text */}
          <AnimatePresence>
            {floatingDamage?.target === 'p2' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -30, scale: 1.2 }}
                exit={{ opacity: 0 }}
                className={`absolute -top-10 font-pixel text-sm sm:text-base font-bold drop-shadow-[0_2px_4px_#000] z-30 ${
                  floatingDamage.isHeal ? 'text-emerald-400' : 'text-red-500'
                }`}
              >
                {floatingDamage.text}
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={`
              relative w-28 h-36 sm:w-40 sm:h-52 flex items-center justify-center transition-all duration-300 scale-x-[-1]
              ${!p1IsAttacker ? 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : ''}
            `}
          >
            <Image
              src="/assets/images/characters/char-8transparent.png"
              alt="Player 2"
              fill
              className="object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
              style={{
                transform: `scale(1.3) translateX(-${(player2.character.baseIndex % 4) * 25}%) translateY(-${Math.floor(player2.character.baseIndex / 4) * 50}%)`,
                transformOrigin: 'top left',
              }}
            />
          </div>

          <span className="mt-1 text-[9px] font-pixel text-red-300 bg-black/80 px-2 py-0.5 border border-red-500">
            {!p1IsAttacker ? '⚔️ TẤN CÔNG' : '🛡️ PHÒNG THỦ'}
          </span>
        </div>
      </div>

      {/* 4. Bottom Action Bar & Battle Log (Compact UI) */}
      <div className="relative z-20 w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3">
        {/* Left: Skill Cast & Weapon Powers (4 cols) */}
        <div className="md:col-span-4 bg-black/85 border border-yellow-500/60 p-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[9px] font-bold text-yellow-300 mb-1">
              <span>🗡️ {player1.weapon.nameVi}</span>
              <span className="text-cyan-300">{player1.skillCharge} / {player1.weapon.skill1.chargeRequired} đ</span>
            </div>

            <p className="text-[8px] text-slate-400 leading-tight mb-2">
              {player1.weapon.skill1.descriptionVi}
            </p>
          </div>

          <PixelButton
            variant={player1.skillCharge >= player1.weapon.skill1.chargeRequired ? 'gold' : 'frame'}
            size="sm"
            disabled={player1.skillCharge < player1.weapon.skill1.chargeRequired}
            onClick={() => handleCastSkill1('p1')}
            className="w-full text-[9px] py-2"
          >
            🔥 TUNG TUYỆT KỸ ({player1.weapon.skill1.chargeRequired} ĐIỂM)
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
              className="w-full text-[9px] py-2.5 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
            >
              {d20RolledThisTurn ? '✓ ĐÃ TUNG D20' : '🎲 TUNG D20 (CÔNG)'}
            </PixelButton>

            {/* Roll D6 Button */}
            <PixelButton
              variant="secondary"
              size="sm"
              disabled={isRollingD6 || d6RolledThisTurn}
              onClick={handleRollD6}
              className="w-full text-[9px] py-2.5"
            >
              {d6RolledThisTurn ? '✓ ĐÃ TUNG D6' : '⚡ TUNG D6 (SẠC)'}
            </PixelButton>
          </div>

          {/* End Turn Button */}
          <PixelButton
            variant={d20RolledThisTurn ? 'success' : 'frame'}
            size="sm"
            disabled={!d20RolledThisTurn}
            onClick={handleEndTurn}
            className="w-full text-[10px] py-2 font-bold"
          >
            KẾT THÚC LƯỢT ➔
          </PixelButton>
        </div>

        {/* Right: Battle Log Box (4 cols) */}
        <div className="md:col-span-4 bg-black/85 border border-slate-700 p-2 flex flex-col">
          <div className="text-[9px] text-yellow-400 font-bold mb-1 flex items-center justify-between border-b border-slate-800 pb-1">
            <span>📜 NHẬT KÝ CHIẾN ĐẤU</span>
            <span className="text-[7.5px] text-slate-500">REALTIME</span>
          </div>

          <div className="flex-1 max-h-24 overflow-y-auto space-y-1 text-[8px] text-slate-300 pr-1">
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
                title={winnerId === player1.id ? '👑 CHIẾN THẮNG HUY HOÀNG!' : '💀 BẠN ĐÃ THẤT BẠI!'}
              >
                <div className="flex flex-col items-center text-center py-4">
                  <span className="text-6xl mb-3 animate-float">
                    {winnerId === player1.id ? '🏆' : '💀'}
                  </span>

                  <h3
                    className={`text-base sm:text-lg font-bold mb-2 ${
                      winnerId === player1.id ? 'text-yellow-400' : 'text-red-500'
                    }`}
                  >
                    {winnerId === player1.id ? 'VICTORY - CHIẾN THẮNG!' : 'DEFEAT - THẤT TRẬN!'}
                  </h3>

                  <p className="text-[10px] text-slate-300 mb-6">
                    {winnerId === player1.id
                      ? `Chúc mừng ${player1.name}! Bạn đã hạ gục ${player2.name} sau ${currentTurn} lượt đấu cam go!`
                      : `${player2.name} đã đánh bại bạn! Hãy nâng cấp kỹ năng và thử lại.`}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <PixelButton
                      variant="gold"
                      size="md"
                      onClick={() => setPage('play')}
                      className="w-full"
                    >
                      CHƠI TIẾP TRẬN MỚI
                    </PixelButton>

                    <PixelButton
                      variant="frame"
                      size="md"
                      onClick={() => setPage('home')}
                      className="w-full"
                    >
                      VỀ TRANG CHỦ
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
