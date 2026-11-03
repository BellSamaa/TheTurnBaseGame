'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import type { BattleLogEntry } from '@/types/game';
import HealthBar from '@/components/ui/HealthBar';
import PixelButton from '@/components/ui/PixelButton';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelIcon from '@/components/ui/PixelIcon';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import PixelDice from './PixelDice';
import PixelDamagePopup, { DamageEvent } from './PixelDamagePopup';
import {
  playHitSound,
  playBlockSound,
  playSkillSound,
  playTurnSound,
  playVictorySound,
} from '@/lib/soundEffects';

export default function BattleScreen() {
  const { battleState, setBattleState, setPage, settings, updateSettings } = useGameStore();
  const lang = settings.language;
  const isEn = lang === 'en';

  // Rolling states
  const [isRollingD20, setIsRollingD20] = useState(false);
  const [isRollingD6, setIsRollingD6] = useState(false);
  const [d20RolledThisTurn, setD20RolledThisTurn] = useState(false);
  const [d6RolledThisTurn, setD6RolledThisTurn] = useState(false);
  const [isEndingTurn, setIsEndingTurn] = useState(false);

  // Rolls data
  const [atkRoll, setAtkRoll] = useState<number | null>(null);
  const [defRoll, setDefRoll] = useState<number | null>(null);
  const [boxerRolls, setBoxerRolls] = useState<{ r1: number; r2: number; chosen: number } | null>(null);
  const [d6P1Rolls, setD6P1Rolls] = useState<number[] | null>(null);
  const [d6P2Rolls, setD6P2Rolls] = useState<number[] | null>(null);

  // Combat formula display
  const [combatFormula, setCombatFormula] = useState<{
    isHit: boolean;
    damage: number;
    atkRoll: number;
    defRoll: number;
  } | null>(null);

  // Character hit reactions & floating text
  const [p1IsHit, setP1IsHit] = useState(false);
  const [p2IsHit, setP2IsHit] = useState(false);
  const [damagePopup, setDamagePopup] = useState<DamageEvent | null>(null);

  // Turn transition slide banner
  const [turnBannerText, setTurnBannerText] = useState<string | null>(null);

  // Expandable combat log modal/drawer
  const [logExpanded, setLogExpanded] = useState(false);

  // Mounted cleanup ref
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const addTimer = (timer: NodeJS.Timeout) => {
    timersRef.current.push(timer);
    return timer;
  };

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  if (!battleState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080c] text-white font-pixel">
        <PixelButton variant="gold" onClick={() => setPage('home')}>
          {isEn ? 'BACK TO HOME' : 'VỀ TRANG CHỦ'}
        </PixelButton>
      </div>
    );
  }

  const { player1, player2, currentTurn, mapId, phase, winnerId, battleLog, isAiOpponent, mode } =
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
      playVictorySound();
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
    }
  }, [player1.hp, player2.hp, winnerId, setBattleState, player1.id, player2.id]);

  // Handler: ROLL D20 (Attack & Defense)
  const handleRollD20 = () => {
    if (isRollingD20 || d20RolledThisTurn || phase === 'game_over') return;

    setIsRollingD20(true);

    // Boxer rolls twice on attack ONLY and picks highest
    let r1 = rollD20();
    let boxerData: { r1: number; r2: number; chosen: number } | null = null;
    if (p1IsAttacker && p1Class.extraD20Rolls > 0) {
      const r1Extra = rollD20();
      const chosen = Math.max(r1, r1Extra);
      boxerData = { r1, r2: r1Extra, chosen };
      r1 = chosen;
    }

    let r2 = rollD20();
    if (!p1IsAttacker && p2Class.extraD20Rolls > 0) {
      const r2Extra = rollD20();
      const chosen = Math.max(r2, r2Extra);
      boxerData = { r1: r2, r2: r2Extra, chosen };
      r2 = chosen;
    }

    setBoxerRolls(boxerData);

    const calculatedAtk = p1IsAttacker ? r1 : r2;
    const calculatedDef = p1IsAttacker ? r2 : r1;
    setAtkRoll(calculatedAtk);
    setDefRoll(calculatedDef);

    addTimer(
      setTimeout(() => {
        setIsRollingD20(false);
        setD20RolledThisTurn(true);

        const attackerClass = p1IsAttacker ? p1Class : p2Class;
        const defenderClass = p1IsAttacker ? p2Class : p1Class;
        const defenderTarget = p1IsAttacker ? 'p2' : 'p1';

        const combatResult = calculateD20Combat(
          calculatedAtk,
          calculatedDef,
          attackerClass,
          defenderClass
        );

        setCombatFormula({
          isHit: combatResult.isHit,
          damage: combatResult.damage,
          atkRoll: calculatedAtk,
          defRoll: calculatedDef,
        });

        if (combatResult.isHit) {
          playHitSound();
          if (defenderTarget === 'p1') {
            setP1IsHit(true);
            setTimeout(() => setP1IsHit(false), 400);
          } else {
            setP2IsHit(true);
            setTimeout(() => setP2IsHit(false), 400);
          }

          const isCrit = calculatedAtk === 20;
          setDamagePopup({
            id: String(Date.now()),
            target: defenderTarget,
            text: isCrit ? `CRIT! -${combatResult.damage} DMG` : `-${combatResult.damage} DMG`,
            type: isCrit ? 'crit' : 'damage',
            subtext: isCrit ? (isEn ? 'CRITICAL HIT 20!' : 'BẠO KÍCH XÚC XẮC 20!') : undefined,
          });

          setBattleState((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              player1: {
                ...prev.player1,
                hp: defenderTarget === 'p1' ? Math.max(0, prev.player1.hp - combatResult.damage) : prev.player1.hp,
              },
              player2: {
                ...prev.player2,
                hp: defenderTarget === 'p2' ? Math.max(0, prev.player2.hp - combatResult.damage) : prev.player2.hp,
              },
            };
          });

          addLog({
            turn: currentTurn,
            type: 'damage',
            message: isEn
              ? `HIT! Attacker ${calculatedAtk} > Defender ${calculatedDef}. Dealt ${combatResult.damage} damage!`
              : `ĐÁNH TRÚNG! Công ${calculatedAtk} > Thủ ${calculatedDef}. Gây ${combatResult.damage} sát thương!`,
            messageVi: `ĐÁNH TRÚNG! Công ${calculatedAtk} > Thủ ${calculatedDef}. Gây ${combatResult.damage} sát thương!`,
          });
        } else {
          playBlockSound();
          setDamagePopup({
            id: String(Date.now()),
            target: defenderTarget,
            text: isEn ? 'BLOCKED!' : 'ĐỠ ĐÒN THÀNH CÔNG!',
            type: 'block',
            subtext: isEn ? `${calculatedAtk} ≤ ${calculatedDef}` : `Công ${calculatedAtk} ≤ Thủ ${calculatedDef}`,
          });

          addLog({
            turn: currentTurn,
            type: 'defend',
            message: isEn
              ? `BLOCKED! Attacker ${calculatedAtk} <= Defender ${calculatedDef}. 0 damage taken.`
              : `PHÒNG THỦ THÀNH CÔNG! Công ${calculatedAtk} <= Thủ ${calculatedDef}. Không nhận sát thương.`,
            messageVi: `PHÒNG THỦ THÀNH CÔNG! Công ${calculatedAtk} <= Thủ ${calculatedDef}. Không nhận sát thương.`,
          });
        }

        addTimer(setTimeout(() => setDamagePopup(null), 1600));
      }, 900)
    );
  };

  // Handler: ROLL D6 (Skill Charge)
  const handleRollD6 = () => {
    if (isRollingD6 || d6RolledThisTurn || phase === 'game_over') return;

    setIsRollingD6(true);

    const rollsP1 = [rollD6()];
    if (p1Class.extraD6Rolls > 0) rollsP1.push(rollD6());
    const totalP1 = rollsP1.reduce((a, b) => a + b, 0);

    const rollsP2 = [rollD6()];
    if (p2Class.extraD6Rolls > 0) rollsP2.push(rollD6());
    const totalP2 = rollsP2.reduce((a, b) => a + b, 0);

    setD6P1Rolls(rollsP1);
    setD6P2Rolls(rollsP2);

    addTimer(
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

        // Check weapon skill 2 trigger for player 1
        const p1Trigger = checkSkill2Trigger(totalP1, player1, player2);
        if (p1Trigger.triggered) {
          playSkillSound();
          setP2IsHit(true);
          setTimeout(() => setP2IsHit(false), 400);

          setDamagePopup({
            id: String(Date.now()),
            target: 'p2',
            text: `-${p1Trigger.damage} SKILL DMG`,
            type: 'skill',
            subtext: isEn ? 'PASSIVE DIE TRIGGER!' : 'KÍCH HOẠT MẶT ĐẶC BIỆT!',
          });
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
              ? `SPECIAL TRIGGER! ${player1.name} rolled face ${totalP1} activating ${player1.weapon.skill2.name} dealing ${p1Trigger.damage} DMG!`
              : `KÍCH HOẠT ĐẶC BIỆT! ${player1.name} đổ ra mặt ${totalP1} kích hoạt ${player1.weapon.skill2.nameVi} gây ${p1Trigger.damage} sát thương!`,
            messageVi: `KÍCH HOẠT ĐẶC BIỆT! ${player1.name} đổ ra mặt ${totalP1} kích hoạt ${player1.weapon.skill2.nameVi} gây ${p1Trigger.damage} sát thương!`,
          });
        }
      }, 800)
    );
  };

  // Handler: CAST SKILL 1 (Charge threshold skill)
  const handleCastSkill1 = (caster: 'p1' | 'p2') => {
    const user = caster === 'p1' ? player1 : player2;
    const opponent = caster === 'p1' ? player2 : player1;

    if (user.skillCharge < user.weapon.skill1.chargeRequired) return;

    playSkillSound();
    const res = activateSkill1(user, opponent);

    if (res.damage > 0) {
      if (caster === 'p1') {
        setP2IsHit(true);
        setTimeout(() => setP2IsHit(false), 400);
      } else {
        setP1IsHit(true);
        setTimeout(() => setP1IsHit(false), 400);
      }

      setDamagePopup({
        id: String(Date.now()),
        target: caster === 'p1' ? 'p2' : 'p1',
        text: `-${res.damage} DMG`,
        type: 'crit',
        subtext: isEn ? `SKILL: ${user.weapon.skill1.name}` : `KỸ NĂNG: ${user.weapon.skill1.nameVi}`,
      });
    } else if (res.heal > 0) {
      setDamagePopup({
        id: String(Date.now()),
        target: caster === 'p1' ? 'p1' : 'p2',
        text: `+${res.heal} HP`,
        type: 'heal',
        subtext: isEn ? 'RESTORATION' : 'HỒI MÁU',
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

    addTimer(setTimeout(() => setDamagePopup(null), 1800));
  };

  // Handler: END TURN (With Debounce Protection)
  const handleEndTurn = () => {
    if (!d20RolledThisTurn || isEndingTurn) return;

    setIsEndingTurn(true);
    playTurnSound();

    // AI Skill Decision before ending turn
    if (isAiOpponent) {
      const ai = executeAiDecisions(battleState);
      if (ai.wantsToUseSkill1) {
        handleCastSkill1('p2');
      }
    }

    setD20RolledThisTurn(false);
    setD6RolledThisTurn(false);
    setAtkRoll(null);
    setDefRoll(null);
    setBoxerRolls(null);
    setD6P1Rolls(null);
    setD6P2Rolls(null);
    setCombatFormula(null);

    const nextP1IsAttacker = !p1IsAttacker;
    const bannerMsg = nextP1IsAttacker
      ? (isEn ? 'YOUR TURN - ATTACKING!' : 'LƯỢT CỦA BẠN - TẤN CÔNG!')
      : (isEn ? 'DEFENDING - INCOMING ATTACK!' : 'ĐANG PHÒNG THỦ - ĐỐI THỦ CÔNG!');

    setTurnBannerText(bannerMsg);
    setTimeout(() => setTurnBannerText(null), 1800);

    setBattleState((prev) => {
      if (!prev) return null;
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
        ? `--- ROUND ${currentTurn + 1}: ${nextP1IsAttacker ? player1.name : player2.name} IS NOW ATTACKING! ---`
        : `--- BẮT ĐẦU HIỆP ${currentTurn + 1}: ${nextP1IsAttacker ? player1.name : player2.name} LÀ BÊN TẤN CÔNG! ---`,
      messageVi: `--- BẮT ĐẦU HIỆP ${currentTurn + 1}: ${nextP1IsAttacker ? player1.name : player2.name} LÀ BÊN TẤN CÔNG! ---`,
    });

    setTimeout(() => setIsEndingTurn(false), 500);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center p-2 sm:p-4 overflow-hidden select-none bg-[#07090e]">
      {/* 1. Map Arena Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={mapData.image}
          alt={mapData.name}
          fill
          priority
          className="object-cover filter brightness-[0.75] contrast-[1.12]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-black/25 to-[#07090e]/80 pointer-events-none" />
      </div>

      {/* Turn Transition Slide Banner */}
      <AnimatePresence>
        {turnBannerText && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed top-16 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="px-6 py-2.5 bg-yellow-500 text-black border-y-4 border-yellow-200 font-pixel text-xs sm:text-sm font-bold tracking-widest shadow-[0_0_25px_rgba(250,204,21,0.8)]">
              {turnBannerText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. TOP HEADER HUD: Title, Turn Banner, Compact Toolbar */}
      <header className="relative z-30 w-full max-w-5xl flex flex-col gap-2">
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#0c101c]/95 border-2 border-yellow-500/80 shadow-[0_0_15px_rgba(0,0,0,0.85)]">
          {/* Realm & Mode */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] text-yellow-400 font-pixel font-bold flex items-center gap-1.5">
              <PixelIcon name="map" size={14} color="#facc15" />
              <span>{isEn ? mapData.name : mapData.nameVi}</span>
            </span>
            <span className="text-[8px] font-pixel text-slate-400 bg-slate-900 px-2 py-0.5 border border-slate-700 uppercase">
              {mode}
            </span>
          </div>

          {/* TURN STATE BANNER */}
          <div className="flex items-center gap-1.5 px-3 py-0.5 bg-black/80 border border-yellow-500/50">
            <span className="text-[9px] sm:text-[10px] font-pixel font-bold text-yellow-300">
              {isEn ? `ROUND ${currentTurn}` : `HIỆP ${currentTurn}`} •
            </span>
            {p1IsAttacker ? (
              <span className="text-[9px] sm:text-[10px] font-pixel font-bold text-yellow-400 flex items-center gap-1 animate-pulse">
                <PixelIcon name="sword" size={13} color="#facc15" />
                {isEn ? 'YOUR ATTACK TURN' : 'LƯỢT CỦA BẠN'}
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-pixel font-bold text-cyan-400 flex items-center gap-1 animate-pulse">
                <PixelIcon name="shield" size={13} color="#38bdf8" />
                {isEn ? 'DEFENDING' : 'ĐANG PHÒNG THỦ'}
              </span>
            )}
          </div>

          {/* Compact Right Toolbar: Lang + Surrender */}
          <div className="flex items-center gap-2">
            <div className="flex border border-slate-700 bg-slate-950 p-0.5">
              <button
                onClick={() => updateSettings({ language: 'en' })}
                className={`text-[8px] font-pixel px-1.5 py-0.5 transition ${
                  isEn ? 'bg-yellow-500 text-black font-bold' : 'text-slate-400'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => updateSettings({ language: 'vi' })}
                className={`text-[8px] font-pixel px-1.5 py-0.5 transition ${
                  !isEn ? 'bg-yellow-500 text-black font-bold' : 'text-slate-400'
                }`}
              >
                VI
              </button>
            </div>

            <button
              onClick={() => setPage('play')}
              className="text-[8.5px] font-pixel text-red-400 hover:text-white px-2 py-1 bg-red-950/80 hover:bg-red-900 border border-red-500/60 transition cursor-pointer"
            >
              {isEn ? 'SURRENDER' : 'ĐẦU HÀNG'}
            </button>
          </div>
        </div>

        {/* DUAL COMBATANT CLUSTERS: Player 1 (Left) & Player 2 (Right) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 items-center">
          {/* Player 1 Cluster */}
          <div
            className={`p-2 sm:p-2.5 bg-[#0c101c]/95 border-2 shadow-[0_0_15px_rgba(0,0,0,0.8)] transition-all ${
              p1IsAttacker ? 'border-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.25)]' : 'border-cyan-500/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              {/* Name, Class & Role Badge */}
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`text-[7.5px] font-pixel font-bold px-1.5 py-0.5 border flex items-center gap-1 ${
                    p1IsAttacker
                      ? 'bg-yellow-500 text-black border-yellow-200'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-500'
                  }`}
                >
                  <PixelIcon name={p1IsAttacker ? 'sword' : 'shield'} size={10} color={p1IsAttacker ? '#000' : '#38bdf8'} />
                  <span>{p1IsAttacker ? (isEn ? 'ATTACK' : 'CÔNG') : (isEn ? 'DEFEND' : 'THỦ')}</span>
                </span>
                <span className="text-[9.5px] font-pixel font-bold text-yellow-300 truncate">
                  {player1.name}
                </span>
                <span className="text-[7.5px] font-pixel text-slate-400">
                  ({isEn ? p1Class.name : p1Class.nameVi})
                </span>
              </div>

              {/* D6 Charge Meter Badge */}
              <div className="flex items-center gap-1 bg-[#07090e] px-2 py-0.5 border border-yellow-500/50">
                <PixelIcon name="lightning" size={11} color="#facc15" />
                <span className="text-[8px] font-pixel font-bold text-yellow-300">
                  {player1.skillCharge} / {player1.weapon.skill1.chargeRequired}
                </span>
              </div>
            </div>

            {/* Health Bar with Chip-Loss Ghost Lag */}
            <HealthBar current={player1.hp} max={player1.maxHp} variant={p1IsAttacker ? 'gold' : 'cyan'} />
          </div>

          {/* Player 2 Cluster */}
          <div
            className={`p-2 sm:p-2.5 bg-[#0c101c]/95 border-2 shadow-[0_0_15px_rgba(0,0,0,0.8)] transition-all ${
              !p1IsAttacker ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]' : 'border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              {/* Name, Class & Role Badge */}
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`text-[7.5px] font-pixel font-bold px-1.5 py-0.5 border flex items-center gap-1 ${
                    !p1IsAttacker
                      ? 'bg-red-500 text-white border-red-300'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-500'
                  }`}
                >
                  <PixelIcon name={!p1IsAttacker ? 'sword' : 'shield'} size={10} color={!p1IsAttacker ? '#fff' : '#38bdf8'} />
                  <span>{!p1IsAttacker ? (isEn ? 'ATTACK' : 'CÔNG') : (isEn ? 'DEFEND' : 'THỦ')}</span>
                </span>
                <span className="text-[9.5px] font-pixel font-bold text-red-300 truncate">
                  {player2.name}
                </span>
                <span className="text-[7.5px] font-pixel text-slate-400">
                  ({isEn ? p2Class.name : p2Class.nameVi})
                </span>
              </div>

              {/* D6 Charge Meter Badge */}
              <div className="flex items-center gap-1 bg-[#07090e] px-2 py-0.5 border border-cyan-500/50">
                <PixelIcon name="lightning" size={11} color="#38bdf8" />
                <span className="text-[8px] font-pixel font-bold text-cyan-300">
                  {player2.skillCharge} / {player2.weapon.skill1.chargeRequired}
                </span>
              </div>
            </div>

            {/* Health Bar with Chip-Loss Ghost Lag */}
            <HealthBar current={player2.hp} max={player2.maxHp} variant={!p1IsAttacker ? 'red' : 'cyan'} />
          </div>
        </div>
      </header>

      {/* 3. CENTER BATTLE ARENA: Characters Baseline & Dedicated Pixel Dice */}
      <main className="relative z-20 w-full max-w-5xl my-auto flex flex-col items-center justify-between px-2 py-2">
        <div className="w-full flex items-end justify-between px-2 sm:px-8">
          {/* LEFT: Player 1 Character on Ground Baseline */}
          <div className="relative flex flex-col items-center">
            {/* Floating Pixel Combat Damage Numbers */}
            <AnimatePresence>
              {damagePopup?.target === 'p1' && (
                <PixelDamagePopup event={damagePopup} />
              )}
            </AnimatePresence>

            <CharacterRenderer
              character={player1.character}
              weapon={player1.weapon}
              size="md"
              facing="right"
              showAura={p1IsAttacker}
              auraColor="#facc15"
              showShadow={true}
              isHit={p1IsHit}
            />

            {/* Role indicator under feet */}
            <div className="mt-1 flex items-center gap-1 bg-[#0c101c]/90 px-2 py-0.5 border border-yellow-500/60 shadow">
              <PixelIcon name={p1IsAttacker ? 'sword' : 'shield'} size={11} color={p1IsAttacker ? '#facc15' : '#38bdf8'} />
              <span className="text-[8px] font-pixel text-yellow-300 font-bold">
                {p1IsAttacker ? (isEn ? 'ATTACKING' : 'TẤN CÔNG') : (isEn ? 'DEFENDING' : 'PHÒNG THỦ')}
              </span>
            </div>
          </div>

          {/* CENTER: Dedicated Pixel Dice Arena */}
          <div className="my-auto px-1 sm:px-4">
            <PixelDice
              isRollingD20={isRollingD20}
              d20RolledThisTurn={d20RolledThisTurn}
              atkRoll={atkRoll}
              defRoll={defRoll}
              boxerRolls={boxerRolls}
              isP1Attacker={p1IsAttacker}
              p1Name={player1.name}
              p2Name={player2.name}
              isRollingD6={isRollingD6}
              d6RolledThisTurn={d6RolledThisTurn}
              d6P1Rolls={d6P1Rolls}
              d6P2Rolls={d6P2Rolls}
              p1IsMage={p1Class.extraD6Rolls > 0}
              p2IsMage={p2Class.extraD6Rolls > 0}
              combatFormula={combatFormula}
              isEn={isEn}
            />
          </div>

          {/* RIGHT: Player 2 Character on Ground Baseline */}
          <div className="relative flex flex-col items-center">
            {/* Floating Pixel Combat Damage Numbers */}
            <AnimatePresence>
              {damagePopup?.target === 'p2' && (
                <PixelDamagePopup event={damagePopup} />
              )}
            </AnimatePresence>

            <CharacterRenderer
              character={player2.character}
              weapon={player2.weapon}
              size="md"
              facing="left"
              showAura={!p1IsAttacker}
              auraColor="#ef4444"
              showShadow={true}
              isHit={p2IsHit}
            />

            {/* Role indicator under feet */}
            <div className="mt-1 flex items-center gap-1 bg-[#0c101c]/90 px-2 py-0.5 border border-red-500/60 shadow">
              <PixelIcon name={!p1IsAttacker ? 'sword' : 'shield'} size={11} color={!p1IsAttacker ? '#ef4444' : '#38bdf8'} />
              <span className="text-[8px] font-pixel text-red-300 font-bold">
                {!p1IsAttacker ? (isEn ? 'ATTACKING' : 'TẤN CÔNG') : (isEn ? 'DEFENDING' : 'PHÒNG THỦ')}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* 4. BOTTOM ACTION BAR: Weapon Skills, Roll Dice, End Turn & Combat Log */}
      <footer className="relative z-30 w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3">
        {/* Left: Two Separate Weapon Skill Slots (5 cols) */}
        <div className="md:col-span-5 bg-[#0c101c]/95 border-2 border-yellow-500/80 p-2.5 flex flex-col justify-between gap-2 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
          {/* Header */}
          <div className="flex items-center justify-between text-[8.5px] font-pixel font-bold text-yellow-300 border-b border-slate-800 pb-1">
            <span className="flex items-center gap-1">
              <PixelIcon name="dagger" size={13} color="#facc15" />
              <span>{isEn ? player1.weapon.name : player1.weapon.nameVi}</span>
            </span>
            <span className="text-cyan-300">
              {player1.skillCharge} / {player1.weapon.skill1.chargeRequired} PTS
            </span>
          </div>

          {/* Skill 1: Charge Threshold Skill */}
          <div className="p-1.5 bg-[#07090e] border border-yellow-500/40 flex items-center justify-between gap-2">
            <div className="flex-1">
              <span className="text-[8px] font-pixel font-bold text-yellow-300 flex items-center gap-1">
                <PixelIcon name="lightning" size={10} color="#facc15" />
                <span>SKILL 1: {isEn ? player1.weapon.skill1.name : player1.weapon.skill1.nameVi}</span>
              </span>
              <p className="text-[7px] text-slate-300 font-sans leading-tight mt-0.5">
                {isEn ? player1.weapon.skill1.description : player1.weapon.skill1.descriptionVi}
              </p>
            </div>
            <button
              disabled={player1.skillCharge < player1.weapon.skill1.chargeRequired}
              onClick={() => handleCastSkill1('p1')}
              title={
                player1.skillCharge < player1.weapon.skill1.chargeRequired
                  ? isEn
                    ? `Requires ${player1.weapon.skill1.chargeRequired} charge points`
                    : `Cần đủ ${player1.weapon.skill1.chargeRequired} điểm sạc D6`
                  : ''
              }
              className={`px-2 py-1.5 text-[7.5px] font-pixel font-bold border transition ${
                player1.skillCharge >= player1.weapon.skill1.chargeRequired
                  ? 'bg-yellow-400 text-black border-yellow-200 hover:bg-yellow-300 shadow-[0_0_10px_#facc15] cursor-pointer'
                  : 'bg-slate-900 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              {player1.skillCharge >= player1.weapon.skill1.chargeRequired
                ? (isEn ? 'CAST!' : 'TUNG CHIÊU!')
                : `[${player1.weapon.skill1.chargeRequired} PTS]`}
            </button>
          </div>

          {/* Skill 2: Special Face Trigger (Passive/Auto) */}
          <div className="p-1.5 bg-[#07090e] border border-cyan-500/40 flex items-center justify-between gap-2">
            <div className="flex-1">
              <span className="text-[8px] font-pixel font-bold text-cyan-300 flex items-center gap-1">
                <PixelIcon name="sparkles" size={10} color="#38bdf8" />
                <span>SKILL 2: {isEn ? player1.weapon.skill2.name : player1.weapon.skill2.nameVi}</span>
              </span>
              <p className="text-[7px] text-slate-300 font-sans leading-tight mt-0.5">
                {isEn ? player1.weapon.skill2.description : player1.weapon.skill2.descriptionVi}
              </p>
            </div>
            <span className="px-1.5 py-1 text-[7px] font-pixel bg-cyan-950 text-cyan-200 border border-cyan-500/60 font-bold whitespace-nowrap">
              {isEn ? `ON DIE ${player1.weapon.skill2.triggerNumber}` : `MẶT ${player1.weapon.skill2.triggerNumber}`}
            </span>
          </div>
        </div>

        {/* Center: Action Buttons (D20, D6, End Turn) (3 cols) */}
        <div className="md:col-span-3 bg-[#0c101c]/95 border-2 border-cyan-500/80 p-2.5 flex flex-col justify-between items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
          {/* Authentic Sliced Roll Dice Button */}
          <PixelSpriteButton
            sprite="roll_dice"
            disabled={isRollingD20 || d20RolledThisTurn}
            onClick={handleRollD20}
            className="w-full max-w-[210px]"
            title={d20RolledThisTurn ? (isEn ? '✓ D20 Rolled' : '✓ Đã tung D20') : (isEn ? 'Roll D20' : 'Tung D20')}
          />

          {/* Roll D6 Button */}
          <PixelButton
            variant="secondary"
            size="sm"
            disabled={isRollingD6 || d6RolledThisTurn}
            onClick={handleRollD6}
            icon={<PixelIcon name="dice6" size={12} color="#001a22" />}
            className="w-full max-w-[210px] text-[8px] font-pixel py-1.5"
          >
            {d6RolledThisTurn
              ? (isEn ? '✓ D6 CHARGED' : '✓ ĐÃ SẠC D6')
              : (isEn ? '⚡ ROLL D6 CHARGE' : '⚡ TUNG D6 SẠC CHIÊU')}
          </PixelButton>

          {/* Authentic Sliced End Turn Button */}
          <PixelSpriteButton
            sprite="end_turn"
            disabled={!d20RolledThisTurn || isEndingTurn}
            onClick={handleEndTurn}
            className="w-full max-w-[210px]"
            title={isEn ? 'End Turn' : 'Kết thúc lượt'}
          />
        </div>

        {/* Right: Expandable Battle Log (4 cols) */}
        <div className="md:col-span-4 bg-[#0c101c]/95 border-2 border-slate-700 p-2 flex flex-col justify-between shadow-[0_0_15px_rgba(0,0,0,0.8)]">
          <div className="relative w-full h-7 mb-1 border border-slate-800 flex items-center justify-between px-2 bg-[#07090e]">
            <span className="text-[8px] font-pixel font-bold text-yellow-400 flex items-center gap-1">
              <PixelIcon name="scroll" size={11} color="#facc15" />
              <span>{isEn ? 'COMBAT LOG' : 'NHẬT KÝ CHIẾN ĐẤU'}</span>
            </span>
            <button
              onClick={() => setLogExpanded(!logExpanded)}
              className="text-[7px] text-cyan-400 hover:text-white font-pixel underline cursor-pointer"
            >
              {logExpanded ? (isEn ? 'COLLAPSE' : 'THU GỌN') : (isEn ? 'VIEW ALL' : 'XEM HẾT')}
            </button>
          </div>

          <div className="flex-1 max-h-24 overflow-y-auto space-y-1 text-[7px] font-pixel text-slate-300 pr-1">
            {battleLog.slice(0, 7).map((log, idx) => (
              <div
                key={idx}
                className={`p-1 border-l-2 ${
                  log.type === 'damage'
                    ? 'border-red-500 bg-red-950/20 text-red-200'
                    : log.type === 'defend'
                    ? 'border-cyan-400 bg-cyan-950/20 text-cyan-200'
                    : log.type === 'skill'
                    ? 'border-yellow-400 bg-yellow-950/20 text-yellow-200'
                    : 'border-slate-500 bg-slate-900/30 text-slate-300'
                }`}
              >
                {log.message}
              </div>
            ))}
          </div>
        </div>
      </footer>

      {/* Expanded Combat Log Modal */}
      <AnimatePresence>
        {logExpanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl"
            >
              <PixelFrame
                variant="gold"
                title={isEn ? 'FULL BATTLE HISTORY' : 'LỊCH SỬ CHIẾN ĐẤU ĐẦY ĐỦ'}
                headerRight={
                  <button
                    onClick={() => setLogExpanded(false)}
                    className="text-xs text-slate-400 hover:text-white font-pixel px-2 py-0.5 bg-slate-800"
                  >
                    ✕
                  </button>
                }
              >
                <div className="max-h-80 overflow-y-auto space-y-1.5 p-2 font-pixel text-[8px]">
                  {battleLog.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 border-l-2 ${
                        log.type === 'damage'
                          ? 'border-red-500 bg-red-950/30 text-red-200'
                          : log.type === 'defend'
                          ? 'border-cyan-400 bg-cyan-950/30 text-cyan-200'
                          : log.type === 'skill'
                          ? 'border-yellow-400 bg-yellow-950/30 text-yellow-200'
                          : 'border-slate-500 bg-slate-900/40 text-slate-300'
                      }`}
                    >
                      <span className="text-[7px] text-slate-500 mr-2">[R{log.turn}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </PixelFrame>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    ? (isEn ? 'GLORIOUS VICTORY!' : 'CHIẾN THẮNG HUY HOÀNG!')
                    : (isEn ? 'DEFEATED IN COMBAT!' : 'BẠN ĐÃ THẤT BẠI!')
                }
              >
                <div className="flex flex-col items-center text-center py-4">
                  <div className="mb-3 animate-float">
                    <PixelIcon
                      name={winnerId === player1.id ? 'trophy' : 'skull'}
                      size={48}
                      color={winnerId === player1.id ? '#facc15' : '#ef4444'}
                    />
                  </div>

                  <h3
                    className={`text-sm sm:text-base font-pixel font-bold mb-2 ${
                      winnerId === player1.id ? 'text-yellow-400' : 'text-red-500'
                    }`}
                  >
                    {winnerId === player1.id
                      ? (isEn ? 'VICTORY - TRIUMPH!' : 'VICTORY - CHIẾN THẮNG!')
                      : (isEn ? 'DEFEAT - CRUSHED!' : 'DEFEAT - THẤT TRẬN!')}
                  </h3>

                  <p className="text-[8.5px] font-pixel text-slate-300 mb-6 leading-relaxed">
                    {winnerId === player1.id
                      ? (isEn
                          ? `Congratulations ${player1.name}! You defeated ${player2.name} in round ${currentTurn}!`
                          : `Chúc mừng ${player1.name}! Bạn đã hạ gục ${player2.name} sau ${currentTurn} hiệp đấu cam go!`)
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
