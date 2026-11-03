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
  rollD12,
  calculateD20Combat,
  executeSkill1D6,
  executeSkill2D12,
  executeAiDecisions,
} from '@/lib/battleLogic';
import type { BattleLogEntry, BattleState } from '@/types/game';
import HealthBar from '@/components/ui/HealthBar';
import PixelButton from '@/components/ui/PixelButton';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelIcon from '@/components/ui/PixelIcon';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import PixelDice from './PixelDice';
import PixelDamagePopup, { DamageEvent } from './PixelDamagePopup';
import WeaponItemSlot from './WeaponItemSlot';
import { getTierConfig } from '@/lib/tierStyles';
import {
  playHitSound,
  playBlockSound,
  playSkillSound,
  playTurnSound,
  playVictorySound,
} from '@/lib/soundEffects';

export default function BattleScreen() {
  const {
    battleState,
    setBattleState,
    setPage,
    settings,
    currentUser,
    onlineRoomCode,
  } = useGameStore();

  const lang = settings.language;
  const isEn = lang === 'en';

  // Rolling states
  const [isRollingD20, setIsRollingD20] = useState(false);
  const [isRollingD6, setIsRollingD6] = useState(false);
  const [isRollingD12, setIsRollingD12] = useState(false);
  const [d20RolledThisTurn, setD20RolledThisTurn] = useState(false);
  const [d6RolledThisTurn, setD6RolledThisTurn] = useState(false);
  const [d12RolledThisTurn, setD12RolledThisTurn] = useState(false);
  const [isEndingTurn, setIsEndingTurn] = useState(false);

  // Rolls data
  const [atkRoll, setAtkRoll] = useState<number | null>(null);
  const [defRoll, setDefRoll] = useState<number | null>(null);
  const [boxerRolls, setBoxerRolls] = useState<{ r1: number; r2: number; chosen: number } | null>(null);
  const [d6P1Rolls, setD6P1Rolls] = useState<number[] | null>(null);
  const [d6P2Rolls, setD6P2Rolls] = useState<number[] | null>(null);
  const [d12P1Rolls, setD12P1Rolls] = useState<number[] | null>(null);

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

  // Sync state to remote server for Online Battles
  const syncOnlineBattle = async (newState: BattleState) => {
    if (!onlineRoomCode) return;
    try {
      await fetch(`/api/rooms/${onlineRoomCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'battle_update', battleState: newState }),
      });
    } catch (err) {
      console.warn('Failed to sync online battle', err);
    }
  };

  // Real-time polling for remote opponent's turns in Online Battles
  useEffect(() => {
    if (!onlineRoomCode) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${onlineRoomCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.room?.battleState) {
            const remote: BattleState = data.room.battleState;
            setBattleState((current) => {
              if (!current) return remote;
              if (
                remote.currentTurn > current.currentTurn ||
                remote.player1.hp !== current.player1.hp ||
                remote.player2.hp !== current.player2.hp ||
                remote.winnerId !== current.winnerId ||
                remote.attackerId !== current.attackerId
              ) {
                return remote;
              }
              return current;
            });
          }
        }
      } catch (err) {
        // network glitch
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onlineRoomCode, setBattleState]);

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

  const isMyTurn = !onlineRoomCode || (battleState.attackerId === currentUser?.id || (!isAiOpponent && !onlineRoomCode));

  // Add message to battle log
  const addLog = (entry: Omit<BattleLogEntry, 'timestamp'>) => {
    setBattleState((prev) => {
      if (!prev) return null;
      const updated: BattleState = {
        ...prev,
        battleLog: [{ ...entry, timestamp: Date.now() }, ...prev.battleLog],
      };
      syncOnlineBattle(updated);
      return updated;
    });
  };

  // Check victory / defeat
  useEffect(() => {
    if (player1.hp <= 0 && !winnerId) {
      setBattleState((prev) => {
        if (!prev) return null;
        const next: BattleState = { ...prev, winnerId: player2.id, phase: 'game_over' };
        syncOnlineBattle(next);
        return next;
      });
    } else if (player2.hp <= 0 && !winnerId) {
      setBattleState((prev) => {
        if (!prev) return null;
        const next: BattleState = { ...prev, winnerId: player1.id, phase: 'game_over' };
        syncOnlineBattle(next);
        return next;
      });
      playVictorySound();
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
    }
  }, [player1.hp, player2.hp, winnerId, setBattleState, player1.id, player2.id]);

  // Handler: ROLL D20 (Attack & Defense)
  const handleRollD20 = () => {
    if (isRollingD20 || d20RolledThisTurn || phase === 'game_over' || !isMyTurn) return;

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
        const attackerState = p1IsAttacker ? player1 : player2;
        const defenderState = p1IsAttacker ? player2 : player1;
        const defenderTarget = p1IsAttacker ? 'p2' : 'p1';

        const combatResult = calculateD20Combat(
          calculatedAtk,
          calculatedDef,
          attackerClass,
          defenderClass,
          attackerState,
          defenderState
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
            const updated: BattleState = {
              ...prev,
              player1: {
                ...prev.player1,
                hp: defenderTarget === 'p1' ? Math.max(0, prev.player1.hp - combatResult.damage) : prev.player1.hp,
                isBleeding: defenderTarget === 'p1' ? false : prev.player1.isBleeding,
              },
              player2: {
                ...prev.player2,
                hp: defenderTarget === 'p2' ? Math.max(0, prev.player2.hp - combatResult.damage) : prev.player2.hp,
                isBleeding: defenderTarget === 'p2' ? false : prev.player2.isBleeding,
              },
            };
            syncOnlineBattle(updated);
            return updated;
          });

          addLog({
            turn: currentTurn,
            type: 'damage',
            message: isEn ? combatResult.logTextEn : combatResult.logTextVi,
            messageVi: combatResult.logTextVi,
          });
        } else {
          playBlockSound();
          setDamagePopup({
            id: String(Date.now()),
            target: defenderTarget,
            text: combatResult.isDodged
              ? (isEn ? 'EVADED!' : 'NÉ ĐÒN!')
              : combatResult.isImmune
              ? (isEn ? 'IMMUNE!' : 'MIỄN NHIỄM!')
              : (isEn ? 'BLOCKED!' : 'ĐỠ ĐÒN THÀNH CÔNG!'),
            type: 'block',
            subtext: isEn ? `${calculatedAtk} ≤ ${calculatedDef}` : `Công ${calculatedAtk} ≤ Thủ ${calculatedDef}`,
          });

          addLog({
            turn: currentTurn,
            type: 'defend',
            message: isEn ? combatResult.logTextEn : combatResult.logTextVi,
            messageVi: combatResult.logTextVi,
          });
        }

        addTimer(setTimeout(() => setDamagePopup(null), 1600));
      }, 900)
    );
  };

  // Handler: ROLL D6 (Skill 1 Action)
  const handleRollD6 = () => {
    if (isRollingD6 || d6RolledThisTurn || phase === 'game_over' || !isMyTurn) return;

    setIsRollingD6(true);
    const r6 = rollD6();
    setD6P1Rolls([r6]);

    addTimer(
      setTimeout(() => {
        setIsRollingD6(false);

        const caster = p1IsAttacker ? player1 : player2;
        const opponent = p1IsAttacker ? player2 : player1;
        const targetSide = p1IsAttacker ? 'p2' : 'p1';

        const res = executeSkill1D6(r6, caster, opponent);

        // If extra D6 roll was granted (e.g. Revolver Quick Reload), allow another roll!
        if (!res.extraD6Roll) {
          setD6RolledThisTurn(true);
        }

        if (res.damage > 0) {
          playSkillSound();
          if (targetSide === 'p1') {
            setP1IsHit(true);
            setTimeout(() => setP1IsHit(false), 400);
          } else {
            setP2IsHit(true);
            setTimeout(() => setP2IsHit(false), 400);
          }

          setDamagePopup({
            id: String(Date.now()),
            target: targetSide,
            text: `-${res.damage} DMG`,
            type: 'skill',
            subtext: isEn ? `SKILL 1 (D6 FACE ${r6})` : `CHIÊU 1 (D6 MẶT ${r6})`,
          });
        }

        setBattleState((prev) => {
          if (!prev) return null;
          const isP1Caster = p1IsAttacker;
          const updated: BattleState = {
            ...prev,
            player1: isP1Caster
              ? {
                  ...prev.player1,
                  hp: Math.max(0, prev.player1.hp - res.recoil + res.heal),
                  bullets: caster.bullets,
                  flameBladeBuff: caster.flameBladeBuff,
                  timeAnchorHp: caster.timeAnchorHp,
                  immuneDamageNext: caster.immuneDamageNext,
                  petRockHp: caster.petRockHp,
                  petRockHits: caster.petRockHits,
                }
              : {
                  ...prev.player1,
                  hp: Math.max(0, prev.player1.hp - res.damage),
                  isBleeding: opponent.isBleeding,
                  isStunned: opponent.isStunned,
                  burnTicks: opponent.burnTicks,
                  burnDmgPerTurn: opponent.burnDmgPerTurn,
                  fateSealActive: opponent.fateSealActive,
                  timeLockActive: opponent.timeLockActive,
                },
            player2: !isP1Caster
              ? {
                  ...prev.player2,
                  hp: Math.max(0, prev.player2.hp - res.recoil + res.heal),
                  bullets: caster.bullets,
                  flameBladeBuff: caster.flameBladeBuff,
                  timeAnchorHp: caster.timeAnchorHp,
                  immuneDamageNext: caster.immuneDamageNext,
                  petRockHp: caster.petRockHp,
                  petRockHits: caster.petRockHits,
                }
              : {
                  ...prev.player2,
                  hp: Math.max(0, prev.player2.hp - res.damage),
                  isBleeding: opponent.isBleeding,
                  isStunned: opponent.isStunned,
                  burnTicks: opponent.burnTicks,
                  burnDmgPerTurn: opponent.burnDmgPerTurn,
                  fateSealActive: opponent.fateSealActive,
                  timeLockActive: opponent.timeLockActive,
                },
          };
          syncOnlineBattle(updated);
          return updated;
        });

        addLog({
          turn: currentTurn,
          type: 'skill',
          message: isEn ? res.logTextEn : res.logTextVi,
          messageVi: res.logTextVi,
        });

        addTimer(setTimeout(() => setDamagePopup(null), 1600));
      }, 800)
    );
  };

  // Handler: ROLL D12 (Skill 2 Burst / Charge)
  const handleRollD12 = () => {
    if (isRollingD12 || d12RolledThisTurn || phase === 'game_over' || !isMyTurn) return;

    setIsRollingD12(true);
    const r12 = rollD12();
    setD12P1Rolls([r12]);

    addTimer(
      setTimeout(() => {
        setIsRollingD12(false);
        setD12RolledThisTurn(true);

        const caster = p1IsAttacker ? player1 : player2;
        const opponent = p1IsAttacker ? player2 : player1;
        const targetSide = p1IsAttacker ? 'p2' : 'p1';

        const res = executeSkill2D12(r12, caster, opponent, p1IsAttacker);

        if (res.damage > 0) {
          playSkillSound();
          if (targetSide === 'p1') {
            setP1IsHit(true);
            setTimeout(() => setP1IsHit(false), 400);
          } else {
            setP2IsHit(true);
            setTimeout(() => setP2IsHit(false), 400);
          }

          setDamagePopup({
            id: String(Date.now()),
            target: targetSide,
            text: `-${res.damage} DMG`,
            type: 'crit',
            subtext: isEn ? 'D12 ULTIMATE BURST!' : 'D12 TUYỆT KỸ BỘC PHÁ!',
          });
        }

        setBattleState((prev) => {
          if (!prev) return null;
          const isP1Caster = p1IsAttacker;
          const updated: BattleState = {
            ...prev,
            player1: isP1Caster
              ? {
                  ...prev.player1,
                  d12Charge: caster.d12Charge,
                  bullets: caster.bullets,
                  dodgeNextAttack: caster.dodgeNextAttack,
                  dodgeNextSkill: caster.dodgeNextSkill,
                  petRockEnraged: caster.petRockEnraged,
                  petRockHits: caster.petRockHits,
                }
              : {
                  ...prev.player1,
                  hp: Math.max(0, prev.player1.hp - res.damage),
                  burnTicks: opponent.burnTicks,
                  burnDmgPerTurn: opponent.burnDmgPerTurn,
                  panicAttackDebuff: opponent.panicAttackDebuff,
                  panicTurns: opponent.panicTurns,
                },
            player2: !isP1Caster
              ? {
                  ...prev.player2,
                  d12Charge: caster.d12Charge,
                  bullets: caster.bullets,
                  dodgeNextAttack: caster.dodgeNextAttack,
                  dodgeNextSkill: caster.dodgeNextSkill,
                  petRockEnraged: caster.petRockEnraged,
                  petRockHits: caster.petRockHits,
                }
              : {
                  ...prev.player2,
                  hp: Math.max(0, prev.player2.hp - res.damage),
                  burnTicks: opponent.burnTicks,
                  burnDmgPerTurn: opponent.burnDmgPerTurn,
                  panicAttackDebuff: opponent.panicAttackDebuff,
                  panicTurns: opponent.panicTurns,
                },
          };
          syncOnlineBattle(updated);
          return updated;
        });

        addLog({
          turn: currentTurn,
          type: 'skill',
          message: isEn ? res.logTextEn : res.logTextVi,
          messageVi: res.logTextVi,
        });

        addTimer(setTimeout(() => setDamagePopup(null), 1800));
      }, 900)
    );
  };

  // Handler: END TURN (With Debounce Protection)
  const handleEndTurn = () => {
    if (!d20RolledThisTurn || isEndingTurn || !isMyTurn) return;

    setIsEndingTurn(true);
    playTurnSound();

    // AI decisions in PvE mode
    if (isAiOpponent) {
      const ai = executeAiDecisions(battleState);
      if (ai.wantsToUseD6) {
        handleRollD6();
      }
      if (ai.wantsToUseD12) {
        handleRollD12();
      }
    }

    // Passive Bullet Regen for Revolver (+1 bullet every turn)
    const p1RevolverBullets =
      player1.weapon.id === 'revolver' ? Math.min(6, (player1.bullets ?? 6) + 1) : player1.bullets;
    const p2RevolverBullets =
      player2.weapon.id === 'revolver' ? Math.min(6, (player2.bullets ?? 6) + 1) : player2.bullets;

    // Apply Burn Ticks
    let p1BurnDmg = 0;
    let p1NewBurnTicks = player1.burnTicks ?? 0;
    if (p1NewBurnTicks > 0) {
      p1BurnDmg = player1.burnDmgPerTurn || 1;
      p1NewBurnTicks -= 1;
    }

    let p2BurnDmg = 0;
    let p2NewBurnTicks = player2.burnTicks ?? 0;
    if (p2NewBurnTicks > 0) {
      p2BurnDmg = player2.burnDmgPerTurn || 1;
      p2NewBurnTicks -= 1;
    }

    // Reset Turn Flags
    setD20RolledThisTurn(false);
    setD6RolledThisTurn(false);
    setD12RolledThisTurn(false);
    setAtkRoll(null);
    setDefRoll(null);
    setBoxerRolls(null);
    setD6P1Rolls(null);
    setD12P1Rolls(null);
    setCombatFormula(null);

    const nextP1IsAttacker = !p1IsAttacker;
    const bannerMsg = nextP1IsAttacker
      ? isEn
        ? 'YOUR TURN - ATTACKING!'
        : 'LƯỢT CỦA BẠN - TẤN CÔNG!'
      : isEn
      ? 'DEFENDING - INCOMING ATTACK!'
      : 'ĐANG PHÒNG THỦ - ĐỐI THỦ CÔNG!';

    setTurnBannerText(bannerMsg);
    setTimeout(() => setTurnBannerText(null), 1800);

    setBattleState((prev) => {
      if (!prev) return null;
      const updated: BattleState = {
        ...prev,
        currentTurn: prev.currentTurn + 1,
        attackerId: nextP1IsAttacker ? prev.player1.id : prev.player2.id,
        player1: {
          ...prev.player1,
          isAttacker: nextP1IsAttacker,
          bullets: p1RevolverBullets,
          hp: Math.max(0, prev.player1.hp - p1BurnDmg),
          burnTicks: p1NewBurnTicks,
          panicTurns: Math.max(0, (prev.player1.panicTurns ?? 0) - 1),
        },
        player2: {
          ...prev.player2,
          isAttacker: !nextP1IsAttacker,
          bullets: p2RevolverBullets,
          hp: Math.max(0, prev.player2.hp - p2BurnDmg),
          burnTicks: p2NewBurnTicks,
          panicTurns: Math.max(0, (prev.player2.panicTurns ?? 0) - 1),
        },
      };
      syncOnlineBattle(updated);
      return updated;
    });

    if (p1BurnDmg > 0 || p2BurnDmg > 0) {
      addLog({
        turn: currentTurn,
        type: 'damage',
        message: isEn ? `Flame Burn: Dealt damage this turn!` : `Thiêu đốt lửa: Gây sát thương theo lượt!`,
        messageVi: `Thiêu đốt lửa: Gây sát thương theo lượt!`,
      });
    }

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

  const p1Tier = getTierConfig(player1.weapon.tier);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#07090e] select-none text-slate-100">
      {/* 1. Background Arena Map */}
      <div className="absolute inset-0 z-0">
        <Image
          src={mapData.image}
          alt={mapData.name}
          fill
          priority
          className="object-cover filter brightness-[0.4] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-black/30 to-black/60 pointer-events-none" />
      </div>

      {/* Turn Transition Slide Banner */}
      <AnimatePresence>
        {turnBannerText && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-20 left-0 right-0 z-50 py-2.5 bg-gradient-to-r from-red-600/90 via-yellow-500/95 to-amber-600/90 border-y-2 border-yellow-300 text-center shadow-[0_0_30px_rgba(250,204,21,0.8)]"
          >
            <span className="text-xs sm:text-base font-pixel font-bold text-black tracking-widest drop-shadow">
              ⚔️ {turnBannerText} ⚔️
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Online Turn Lock Warning */}
      {!isMyTurn && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 bg-blue-950/90 border-2 border-cyan-400 px-4 py-1.5 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse">
          <span className="text-[9px] font-pixel text-cyan-200 font-bold flex items-center gap-2">
            <span>🔒</span>
            <span>{isEn ? "WAITING FOR OPPONENT'S TURN..." : 'CHỜ ĐỐI THỦ THAO TÁC...'}</span>
          </span>
        </div>
      )}

      {/* 2. Top Combat HUD Header */}
      <header className="relative z-20 w-full px-3 py-2 bg-black/75 border-b-2 border-yellow-500/50 backdrop-blur-sm flex items-center justify-between gap-2">
        {/* Left: Player 1 Health & Status */}
        <div className="flex-1 max-w-[280px]">
          <div className="flex items-center justify-between text-[9px] font-pixel mb-1">
            <span className="font-bold text-yellow-300 truncate max-w-[140px] flex items-center gap-1">
              <span>{player1.name}</span>
              {p1IsAttacker && (
                <span className="text-[7px] bg-red-600 text-white px-1 py-0.2 rounded-xs font-bold animate-pulse">
                  ATK
                </span>
              )}
            </span>
            <span className="text-slate-300 font-pixel">
              {player1.hp}/{player1.maxHp} HP
            </span>
          </div>
          <HealthBar current={player1.hp} max={player1.maxHp} variant="gold" />
        </div>

        {/* Center: Turn Counter & Map Badge */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-xs font-pixel font-bold text-yellow-400 drop-shadow">
            ROUND {currentTurn}
          </span>
          <span className="text-[7.5px] font-pixel text-slate-400 truncate max-w-[130px]">
            {isEn ? mapData.name : mapData.nameVi}
          </span>
        </div>

        {/* Right: Player 2 / AI Health & Status */}
        <div className="flex-1 max-w-[280px]">
          <div className="flex items-center justify-between text-[9px] font-pixel mb-1 flex-row-reverse">
            <span className="font-bold text-cyan-300 truncate max-w-[140px] flex items-center gap-1 flex-row-reverse">
              <span>{player2.name}</span>
              {!p1IsAttacker && (
                <span className="text-[7px] bg-red-600 text-white px-1 py-0.2 rounded-xs font-bold animate-pulse">
                  ATK
                </span>
              )}
            </span>
            <span className="text-slate-300 font-pixel">
              {player2.hp}/{player2.maxHp} HP
            </span>
          </div>
          <HealthBar current={player2.hp} max={player2.maxHp} variant="red" />
        </div>
      </header>

      {/* 3. Center Battle Stage (Characters + Dice Tray + Weapons Item Slots) */}
      <main className="relative z-10 flex-1 flex flex-col justify-between items-center py-2 px-2 sm:px-6">
        {/* Dice Arena Tray (D20 Atk/Def + D6 Skill 1 + D12 Skill 2) */}
        <div className="w-full max-w-2xl mx-auto my-1">
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
            isRollingD12={isRollingD12}
            d12RolledThisTurn={d12RolledThisTurn}
            d12P1Rolls={d12P1Rolls}
            combatFormula={combatFormula}
            isEn={isEn}
          />
        </div>

        {/* Characters Podiums with Equipped Weapon Item Slot underneath! */}
        <div className="w-full flex items-end justify-between px-2 sm:px-8 mt-auto mb-2">
          {/* LEFT: Player 1 Character + Item Slot */}
          <div className="relative flex flex-col items-center">
            <AnimatePresence>
              {damagePopup?.target === 'p1' && <PixelDamagePopup event={damagePopup} />}
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

            {/* EQUIPPED WEAPON ITEM SLOT UNDER PLAYER 1 */}
            <WeaponItemSlot
              player={player1}
              isCurrentTurnAttacker={p1IsAttacker}
              isEn={isEn}
              align="left"
            />
          </div>

          {/* RIGHT: Player 2 Character + Item Slot */}
          <div className="relative flex flex-col items-center">
            <AnimatePresence>
              {damagePopup?.target === 'p2' && <PixelDamagePopup event={damagePopup} />}
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

            {/* EQUIPPED WEAPON ITEM SLOT UNDER PLAYER 2 */}
            <WeaponItemSlot
              player={player2}
              isCurrentTurnAttacker={!p1IsAttacker}
              isEn={isEn}
              align="right"
            />
          </div>
        </div>
      </main>

      {/* 4. Bottom Tactical Command Center */}
      <footer className="relative z-20 w-full px-2 sm:px-4 py-2 bg-black/90 border-t-2 border-yellow-500/70 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        {/* Left: Weapon Skills & Gauge Overview (Cols 5) */}
        <div className="md:col-span-5 flex flex-col gap-1.5 p-2 bg-[#0c101c]/95 border border-slate-700">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[8px] font-pixel">
            <span className="font-bold flex items-center gap-1.5" style={{ color: p1Tier.accentColor }}>
              <span>⚔️</span>
              <span>{isEn ? player1.weapon.name : player1.weapon.nameVi}</span>
            </span>
            <span className={`px-1.5 py-0.2 border text-[6.5px] font-bold ${p1Tier.badgeClass}`}>
              {isEn ? p1Tier.labelEn : p1Tier.labelVi}
            </span>
          </div>

          {/* Skill 1 (D6) Info */}
          <div className="p-1.5 bg-[#07090e] border border-yellow-500/40 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <span className="text-[7.5px] font-pixel font-bold text-yellow-300 flex items-center gap-1">
                <span>🎲</span>
                <span>SKILL 1 (D6): {isEn ? player1.weapon.skill1.name : player1.weapon.skill1.nameVi}</span>
              </span>
              <p className="text-[6.5px] text-slate-300 font-pixel truncate mt-0.5">
                {isEn ? player1.weapon.skill1.description : player1.weapon.skill1.descriptionVi}
              </p>
            </div>
            <span className="px-1.5 py-0.5 text-[6.5px] font-pixel bg-yellow-950 text-yellow-300 border border-yellow-500/60 font-bold whitespace-nowrap">
              {d6RolledThisTurn ? '✓ ROLLED' : 'D6 READY'}
            </span>
          </div>

          {/* Skill 2 (D12) Info */}
          <div className="p-1.5 bg-[#07090e] border border-purple-500/40 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <span className="text-[7.5px] font-pixel font-bold text-purple-300 flex items-center gap-1">
                <span>✨</span>
                <span>SKILL 2 (D12): {isEn ? player1.weapon.skill2.name : player1.weapon.skill2.nameVi}</span>
              </span>
              <p className="text-[6.5px] text-slate-300 font-pixel truncate mt-0.5">
                {isEn ? player1.weapon.skill2.description : player1.weapon.skill2.descriptionVi}
              </p>
            </div>
            <span className="px-1.5 py-0.5 text-[6.5px] font-pixel bg-purple-950 text-purple-300 border border-purple-500/60 font-bold whitespace-nowrap">
              {player1.weapon.skill2.chargeRequired
                ? `${player1.d12Charge ?? 0}/${player1.weapon.skill2.chargeRequired} PTS`
                : d12RolledThisTurn
                ? '✓ ROLLED'
                : 'D12 READY'}
            </span>
          </div>
        </div>

        {/* Center: Action Buttons (D20, D6, D12, End Turn) (Cols 3) */}
        <div className="md:col-span-3 bg-[#0c101c]/95 border-2 border-cyan-500/80 p-2 flex flex-col justify-between items-center gap-1.5 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
          {/* 1. Roll D20 Button */}
          <PixelSpriteButton
            sprite="roll_dice"
            disabled={isRollingD20 || d20RolledThisTurn || !isMyTurn}
            onClick={handleRollD20}
            className="w-full max-w-[210px]"
            title={d20RolledThisTurn ? (isEn ? '✓ D20 Rolled' : '✓ Đã tung D20') : (isEn ? 'Roll D20' : 'Tung D20')}
          />

          {/* 2. Roll D6 & Roll D12 in row */}
          <div className="w-full max-w-[210px] grid grid-cols-2 gap-1">
            <PixelButton
              variant="secondary"
              size="sm"
              disabled={isRollingD6 || d6RolledThisTurn || !isMyTurn}
              onClick={handleRollD6}
              icon={<PixelIcon name="dice6" size={11} color="#001a22" />}
              className="text-[7.5px] font-pixel py-1.5 truncate"
            >
              {d6RolledThisTurn ? (isEn ? '✓ D6' : '✓ D6') : (isEn ? 'ROLL D6' : 'TUNG D6')}
            </PixelButton>

            <PixelButton
              variant="gold"
              size="sm"
              disabled={isRollingD12 || d12RolledThisTurn || !isMyTurn}
              onClick={handleRollD12}
              icon={<PixelIcon name="sparkles" size={11} color="#000" />}
              className="text-[7.5px] font-pixel py-1.5 truncate"
            >
              {d12RolledThisTurn ? (isEn ? '✓ D12' : '✓ D12') : (isEn ? 'ROLL D12' : 'TUNG D12')}
            </PixelButton>
          </div>

          {/* 3. End Turn Button */}
          <PixelSpriteButton
            sprite="end_turn"
            disabled={!d20RolledThisTurn || isEndingTurn || !isMyTurn}
            onClick={handleEndTurn}
            className="w-full max-w-[210px]"
            title={isEn ? 'End Turn' : 'Kết thúc lượt'}
          />
        </div>

        {/* Right: Expandable Battle Log (Cols 4) */}
        <div className="md:col-span-4 bg-[#0c101c]/95 border-2 border-slate-700 p-2 flex flex-col justify-between shadow-[0_0_15px_rgba(0,0,0,0.8)]">
          <div className="relative w-full h-6 mb-1 border border-slate-800 flex items-center justify-between px-2 bg-[#07090e]">
            <span className="text-[7.5px] font-pixel font-bold text-yellow-400 flex items-center gap-1">
              <PixelIcon name="scroll" size={10} color="#facc15" />
              <span>{isEn ? 'COMBAT LOG' : 'NHẬT KÝ CHIẾN ĐẤU'}</span>
            </span>
            <button
              onClick={() => setLogExpanded(!logExpanded)}
              className="text-[6.5px] text-cyan-400 hover:text-white font-pixel underline cursor-pointer"
            >
              {logExpanded ? (isEn ? 'COLLAPSE' : 'THU GỌN') : (isEn ? 'VIEW ALL' : 'XEM HẾT')}
            </button>
          </div>

          <div className="flex-1 max-h-20 overflow-y-auto space-y-1 text-[6.5px] font-pixel text-slate-300 pr-1">
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

      {/* Victory / Game Over Modal */}
      <AnimatePresence>
        {phase === 'game_over' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-[#0a0d17] border-2 border-yellow-500 p-6 text-center shadow-[0_0_35px_rgba(250,204,21,0.6)]"
            >
              <h2 className="text-xl sm:text-2xl font-pixel text-yellow-400 drop-shadow mb-2">
                {winnerId === player1.id ? (isEn ? 'VICTORY!' : 'CHIẾN THẮNG!') : (isEn ? 'DEFEAT!' : 'THẤT BẠI!')}
              </h2>
              <p className="text-[10px] font-pixel text-slate-300 mb-6">
                {winnerId === player1.id
                  ? isEn
                    ? 'You have dominated the dice arena!'
                    : 'Bạn đã thống trị đấu trường xúc xắc!'
                  : isEn
                  ? 'Your foe prevailed this time. Train and return!'
                  : 'Đối thủ đã vượt qua bạn. Hãy rèn luyện thêm!'}
              </p>
              <PixelButton
                variant="gold"
                size="md"
                onClick={() => setPage('home')}
                className="w-full font-pixel"
              >
                {isEn ? 'RETURN TO HOME' : 'VỀ TRANG CHỦ'}
              </PixelButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
