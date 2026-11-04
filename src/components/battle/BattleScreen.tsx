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
} from '@/lib/battleLogic';
import type { BattleLogEntry, BattleState, PlayerState } from '@/types/game';
import { normalAttackEffect, skillPresentation, skillEffectPlan } from '@/lib/skillPresentation';
import { castChargedSkill, skillCost } from '@/lib/chargedSkills';
import { RockHealthBar, RockCompanion } from './RockCompanion';
import HealthBar from '@/components/ui/HealthBar';
import PixelButton from '@/components/ui/PixelButton';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelIcon from '@/components/ui/PixelIcon';
import { applyOpponentDamage, recordOpponentDamage, skillIsLocked } from '@/lib/combatDamage';
import { applyChargeRoll } from '@/lib/chargeRoll';
import PurpleSkyEffect from './PurpleSkyEffect';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import PixelDice from './PixelDice';
import PixelDamagePopup, { DamageEvent } from './PixelDamagePopup';
import WeaponItemSlot from './WeaponItemSlot';
import CinematicSkillBanner, { SkillActivationEvent } from './CinematicSkillBanner';
import VfxAnimationPlayer, { VfxEvent } from './VfxAnimationPlayer';
import { getTierConfig } from '@/lib/tierStyles';
import {
  playHitSound,
  playBlockSound,
  playSkillSound,
  playTurnSound,
  playVictorySound,
  playSlashSound,
  playGunshotSound,
  playMagicCastSound,
  playMeteorRumbleSound,
  playDiceRollSound,
  playUltimateAuraSound,
} from '@/lib/soundEffects';

function playWeaponSound(weaponId: string) {
  switch (weaponId) {
    case 'revolver':
      playGunshotSound();
      break;
    case 'staff':
      playMagicCastSound();
      break;
    case 'leaf_headband':
    case 'fire_headband':
    case 'pet_rock':
    case 'spirit_stone':
      playMeteorRumbleSound();
      break;
    case 'greatsword':
    case 'dragon_dagger':
    case 'dagger':
      playSlashSound();
      break;
    default:
      playHitSound();
      break;
  }
}

export function weaponHasDefenseSkill(weaponId: string): boolean {
  return weaponId === 'bow' || weaponId === 'staff' || weaponId === 'pet_rock' || weaponId === 'spirit_stone';
}
function spendAttackBullet(player: PlayerState): PlayerState {
  return player.weapon.id === 'revolver' ? { ...player, bullets: Math.max(0, (player.bullets ?? 6) - 1) } : player;
}
export default function BattleScreen() {
  const {
    battleState,
    setBattleState,
    setPage,
    settings,
    currentUser,
    onlineRoomCode,
    setOnlineRoomCode,
  } = useGameStore();

  const lang = settings.language;
  const isEn = lang === 'en';

  const [openSkillInfo, setOpenSkillInfo] = useState<1 | 2 | null>(null);
  const [voidForm, setVoidForm] = useState(1);
  const [lockSlot, setLockSlot] = useState<1 | 2>(1);
  const [meteorCost, setMeteorCost] = useState(20);
  const [selectedSkillForm, setSelectedSkillForm] = useState<number | undefined>();
  const castLockRef = useRef(false);
  const chargeRollLockRef = useRef(false);
  const [lobbyError, setLobbyError] = useState('');
  const [returningToLobby, setReturningToLobby] = useState(false);

  // Rolling states
  const [turnStep, setTurnStep] = useState<'d20_atk' | 'd20_def' | 'd6_atk' | 'd6_def' | 'd12'>(
    battleState?.turnStep || 'd20_atk'
  );
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

  // AnimationKit VFX Event
  const [vfxQueue, setVfxQueue] = useState<VfxEvent[]>([]);
  const activeVfx = vfxQueue[0] ?? null;
  const finishVfx = (id: string) => setVfxQueue(queue => queue.filter(event => event.id !== id));

  // Turn transition slide banner
  const [turnBannerText, setTurnBannerText] = useState<string | null>(null);

  // Cinematic Skill Banner Queue
  const seenVfx = useRef(new Set<string>());
  const seenPopups = useRef(new Set<string>());
  const seenSkillBanners = useRef(new Set<string>(battleState?.activeSkillBanner ? [battleState.activeSkillBanner.id] : []));
  const [skillBannerQueue, setSkillBannerQueue] = useState<SkillActivationEvent[]>([]);

  // Centered combat log modal
  const [logModalOpen, setLogModalOpen] = useState(false);

  // Forfeit confirmation modal
  const [forfeitModalOpen, setForfeitModalOpen] = useState(false);

  // Turn countdown timer: 20s for Round 1, 10s for Round 2+
  const currentRound = battleState?.currentTurn || 1;
  const [turnTimer, setTurnTimer] = useState<number>(currentRound === 1 ? 20 : 10);

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
  const syncPendingRef = useRef(false);
  const syncOnlineBattle = async (newState: BattleState) => {
    if (!onlineRoomCode) return;
    syncPendingRef.current = true;
    const expectedRevision = newState.revision ?? 0;
    newState.revision = expectedRevision + 1;
    try {
      const response = await fetch(`/api/rooms/${onlineRoomCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'battle_update', battleState: newState, expectedRevision, userId: currentUser?.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.room?.battleState) setBattleState(data.room.battleState);
        else throw new Error(data.error || 'Battle sync failed');
      }
    } catch (err) {
      console.warn('Failed to sync online battle', err);
      // Reconcile an uncertain write before accepting another remote snapshot.
      try {
        const res = await fetch(`/api/rooms/${onlineRoomCode}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.room?.battleState) setBattleState(data.room.battleState);
      } catch {
        // Allow the next successful poll to reconcile the uncertain write.
        setBattleState(current => current ? { ...current, revision: -1 } : current);
      }
    } finally {
      syncPendingRef.current = false;
    }
  };

  // Real-time polling for remote opponent's turns in Online Battles
  useEffect(() => {
    if (!onlineRoomCode || battleState?.phase === 'game_over') return;

    const interval = setInterval(async () => {
      if (syncPendingRef.current) return;
      try {
        const res = await fetch(`/api/rooms/${onlineRoomCode}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.room?.battleState) {
            const remote: BattleState = data.room.battleState;
            setBattleState((current) => {
              if (!current) return remote;
              if (syncPendingRef.current || (remote.revision ?? 0) <= (current.revision ?? 0)) return current;

              const hasChanged =
                remote.revision !== current.revision ||
                remote.currentTurn !== current.currentTurn ||
                remote.attackerId !== current.attackerId ||
                remote.turnStep !== current.turnStep ||
                remote.p1HasRolled !== current.p1HasRolled ||
                remote.p2HasRolled !== current.p2HasRolled ||
                remote.p1D20 !== current.p1D20 ||
                remote.p2D20 !== current.p2D20 ||
                remote.player1.hp !== current.player1.hp ||
                remote.player1.petRockHp !== current.player1.petRockHp ||
                remote.player2.petRockHp !== current.player2.petRockHp ||
                remote.player2.hp !== current.player2.hp ||
                remote.player1.bullets !== current.player1.bullets ||
                remote.player2.bullets !== current.player2.bullets ||
                remote.player1.d12Charge !== current.player1.d12Charge ||
                remote.player2.d12Charge !== current.player2.d12Charge ||
                remote.p1EndedTurn !== current.p1EndedTurn ||
                remote.p2EndedTurn !== current.p2EndedTurn ||
                remote.winnerId !== current.winnerId ||
                (remote.battleLog?.length || 0) !== (current.battleLog?.length || 0);

              if (hasChanged) {
                if (remote.damagePopup && !seenPopups.current.has(remote.damagePopup.id)) {
                  seenPopups.current.add(remote.damagePopup.id);
                  setDamagePopup(remote.damagePopup);
                }

                if (remote.activeSkillBanner && !seenSkillBanners.current.has(remote.activeSkillBanner.id)) {
                  seenSkillBanners.current.add(remote.activeSkillBanner.id);
                  setSkillBannerQueue([remote.activeSkillBanner!]);
                }

                // If both rolled D20, calculate combat formula
                if (remote.p1D20 != null && remote.p2D20 != null) {
                  const atk = remote.player1.isAttacker ? remote.p1D20 : remote.p2D20;
                  const def = remote.player1.isAttacker ? remote.p2D20 : remote.p1D20;
                  const hit = atk > def;
                  const dmg = Math.max(0, atk - def);
                  setCombatFormula({
                    isHit: hit,
                    damage: dmg,
                    atkRoll: atk,
                    defRoll: def,
                  });
                }

                // If remote D6 was rolled
                if (remote.d6Results?.player1) {
                  setD6P1Rolls(remote.d6Results.player1);
                }

                // If remote D12 was rolled
                if (remote.d12Results?.player1) {
                  setD12P1Rolls(remote.d12Results.player1);
                }

                // If turn changed, reset local rolling flags and play sound
                if (remote.currentTurn !== current.currentTurn || remote.attackerId !== current.attackerId) {
                  setAtkRoll(null);
                  setDefRoll(null);
                  setD20RolledThisTurn(false);
                  setD6RolledThisTurn(false);
                  setD12RolledThisTurn(false);
                  playTurnSound();

                  const amAttacking = remote.attackerId === currentUser?.id;
                  setTurnBannerText(
                    amAttacking
                      ? (isEn ? 'YOUR TURN - ATTACKING!' : 'LƯỢT CỦA BẠN - TẤN CÔNG!')
                      : (isEn ? 'DEFENDING - INCOMING ATTACK!' : 'ĐANG PHÒNG THỦ - ĐỐI THỦ CÔNG!')
                  );
                  setTimeout(() => setTurnBannerText(null), 1800);
                }

                // If my HP dropped, show hit reaction & damage popup
                if (currentUser?.id === remote.player1.id && remote.player1.hp < current.player1.hp) {
                  const lost = current.player1.hp - remote.player1.hp;
                  playHitSound();
                  setP1IsHit(true);
                  setTimeout(() => setP1IsHit(false), 400);
                  setDamagePopup({
                    id: String(Date.now()),
                    target: 'p1',
                    text: `-${lost} DMG`,
                    type: 'damage',
                  });
                } else if (currentUser?.id === remote.player2.id && remote.player2.hp < current.player2.hp) {
                  const lost = current.player2.hp - remote.player2.hp;
                  playHitSound();
                  setP2IsHit(true);
                  setTimeout(() => setP2IsHit(false), 400);
                  setDamagePopup({
                    id: String(Date.now()),
                    target: 'p2',
                    text: `-${lost} DMG`,
                    type: 'damage',
                  });
                }

                return remote;
              }
              return current;
            });
          }
        }
      } catch {
        // network glitch
      }
    }, 500);

    return () => clearInterval(interval);
  }, [onlineRoomCode, currentUser?.id, isEn, battleState?.phase, setBattleState]);

  // Keep local turnStep always in sync with battleState.turnStep
  useEffect(() => {
    if (battleState?.turnStep) {
      setTurnStep(battleState.turnStep);
    }
  }, [battleState?.turnStep]);

  useEffect(() => {
    const events = battleState?.vfxSequence ?? (battleState?.activeVfx ? [battleState.activeVfx] : []);
    const fresh = events.filter(event => !seenVfx.current.has(event.id));
    fresh.forEach(event => seenVfx.current.add(event.id));
    if (fresh.length) setVfxQueue(queue => [...queue, ...fresh]);
  }, [battleState?.vfxSequence, battleState?.activeVfx]);

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

  const isP1User = !onlineRoomCode || !currentUser || currentUser.id === player1.id || currentUser.username === player1.name;
  const isP2User = currentUser?.id === player2.id || currentUser?.username === player2.name;

  const isAttacker = isP1User ? p1IsAttacker : !p1IsAttacker;
  const defenderWeaponId = p1IsAttacker ? player2.weapon.id : player1.weapon.id;
  const defenderHasDefenseSkill = true; // Both players charge PTS each round.

  // Discrete roll gating
  let canLocalRoll = false;
  let rollButtonTitle = '';

  if (phase === 'game_over') {
    canLocalRoll = false;
    rollButtonTitle = isEn ? 'Game Over' : 'Trận Đấu Đã Kết Thúc';
  } else if (turnStep === 'd20_atk') {
    canLocalRoll = isAttacker && !isRollingD20;
    rollButtonTitle = isAttacker
      ? (isEn ? 'Roll D20 Attack' : 'Tung D20 Tấn Công')
      : (isEn ? 'Waiting for Attacker D20...' : 'Chờ Bên Công Tung D20...');
  } else if (turnStep === 'd20_def') {
    canLocalRoll = !isAttacker && !isRollingD20;
    rollButtonTitle = !isAttacker
      ? (isEn ? 'Roll D20 Defense' : 'Tung D20 Phòng Thủ')
      : (isEn ? 'Waiting for Defender D20...' : 'Chờ Bên Thủ Tung D20...');
  } else if (turnStep === 'd6_atk') {
    canLocalRoll = isAttacker && !isRollingD6;
    rollButtonTitle = isAttacker
      ? (isEn ? 'Roll D6 Skill Charge (ATK)' : 'Tung D6 Sạc Chiêu (Công)')
      : (isEn ? 'Waiting for Attacker D6...' : 'Chờ Bên Công Tung D6...');
  } else if (turnStep === 'd6_def') {
    canLocalRoll = !isAttacker && defenderHasDefenseSkill && !isRollingD6;
    rollButtonTitle = !isAttacker
      ? (isEn ? 'Roll D6 · Charge PTS' : 'Tung D6 · Sạc PTS')
      : (isEn ? 'Waiting for Defender D6...' : 'Chờ Bên Thủ Tung D6...');
  } else if (turnStep === 'd12') {
    canLocalRoll = false;
    rollButtonTitle = isEn ? '✓ All Rolls Done' : '✓ Đã Hoàn Tất Tung';
  }

  if (canLocalRoll && (turnStep === 'd6_atk' || turnStep === 'd6_def')) {
    const rollingPlayer = isP1User ? player1 : player2;
    const count = 1 + (CLASS_DEFINITIONS[rollingPlayer.classType]?.extraD6Rolls ?? 0);
    const completed = battleState.d6Results?.[isP1User ? 'player1' : 'player2']?.length ?? 0;
    rollButtonTitle += ' · ' + Math.min(count, completed + 1) + '/' + count;
  }

  const bothPlayersHaveRolled = turnStep === 'd12';
  const hasLocalPlayerRolled =
    turnStep === 'd12' ||
    (isAttacker ? turnStep !== 'd20_atk' : turnStep !== 'd20_atk' && turnStep !== 'd20_def');
  const hasLocalPlayerEndedTurn = onlineRoomCode
    ? (isP1User ? !!battleState.p1EndedTurn : !!battleState.p2EndedTurn)
    : false;

  const myPlayer = isP1User ? player1 : player2;
  const myCurrentPts = myPlayer.d12Charge || 0;
  const myReqPts = myPlayer.weapon.skill2.chargeRequired || 20;
  const canCastSkill2 = (myPlayer.weapon.id !== 'spirit_stone' || (myPlayer.petRockHp ?? 0) > 0) && !skillIsLocked(myPlayer, 2, currentTurn) && myCurrentPts >= skillCost(myPlayer, 2, meteorCost) && myPlayer.skill2UsedTurn !== currentTurn && !hasLocalPlayerEndedTurn && turnStep === 'd12' && !(myPlayer.weapon.id === 'revolver' && (myPlayer.bullets ?? 6) <= 0);
  const canCastSkill1 = !skillIsLocked(myPlayer, 1, currentTurn) && (myPlayer.weapon.id !== 'fire_headband' || myPlayer.leafSkillReadyTurn === currentTurn) && myCurrentPts >= skillCost(myPlayer, 1) && myPlayer.skill1UsedTurn !== currentTurn && !hasLocalPlayerEndedTurn && turnStep === 'd12';

  // Add message to battle log (Local state only; actions include logs in their synced state)
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

  // Turn Countdown Timer & Auto-Roll Handler
  // Round 1: 20s, Round 2+: 10s. Resets on each active roll step.
  useEffect(() => {
    setTurnTimer(currentTurn === 1 ? 20 : 10);
  }, [currentTurn, turnStep]);

  useEffect(() => {
    if (phase === 'game_over' || !canLocalRoll) return;

    const timer = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRollDice();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTurn, turnStep, canLocalRoll, phase]);

  // PvE AI Bot Automation (Bot acts automatically ONLY when it's the bot's turn!)
  useEffect(() => {
    if (onlineRoomCode || !isAiOpponent || phase === 'game_over') return;
    const botIsAttacker = !p1IsAttacker;

    if (turnStep === 'd20_atk' && botIsAttacker && !isRollingD20) {
      const t = setTimeout(() => executeRollD20Atk(), 850);
      return () => clearTimeout(t);
    }
    if (turnStep === 'd20_def' && !botIsAttacker && !isRollingD20) {
      const t = setTimeout(() => executeRollD20Def(), 850);
      return () => clearTimeout(t);
    }
    if (turnStep === 'd6_atk' && botIsAttacker && !isRollingD6) {
      const t = setTimeout(() => executeRollD6Atk(), 850);
      return () => clearTimeout(t);
    }
    if (turnStep === 'd6_def' && !botIsAttacker && defenderHasDefenseSkill && !isRollingD6) {
      const t = setTimeout(() => executeRollD6Def(), 850);
      return () => clearTimeout(t);
    }
    if (turnStep === 'd12') {
      const slot = (player2.weapon.id !== 'spirit_stone' || (player2.petRockHp ?? 0) > 0) && (player2.d12Charge || 0) >= skillCost(player2, 2) && player2.skill2UsedTurn !== currentTurn && !skillIsLocked(player2, 2, currentTurn) ? 2
        : (player2.d12Charge || 0) >= skillCost(player2, 1) && player2.skill1UsedTurn !== currentTurn && !skillIsLocked(player2, 1, currentTurn) && (player2.weapon.id !== 'fire_headband' || player2.leafSkillReadyTurn === currentTurn) ? 1 : null;
      if (slot) { const t = setTimeout(() => handleCastSkill(slot, true), 850); return () => clearTimeout(t); }
    }
  }, [
    turnStep,
    isAiOpponent,
    p1IsAttacker,
    defenderHasDefenseSkill,
    phase,
    isRollingD20,
    isRollingD6,
    d12RolledThisTurn,
    player2.d12Charge,
    player2.skill1UsedTurn,
    player2.skill2UsedTurn,
    player2.weapon.skill2.chargeRequired,
  ]);

  // ==========================================
  // DISCRETE ROLL STEP 1: D20 ATTACK
  // ==========================================
  const executeRollD20Atk = () => {
    if (isRollingD20 || phase === 'game_over') return;
    setIsRollingD20(true);
    playDiceRollSound();

    const isP1Attacking = p1IsAttacker;
    const attackerClass = isP1Attacking ? p1Class : p2Class;

    const attackingPlayer = isP1Attacking ? player1 : player2;
    const emptyRevolver = attackingPlayer.weapon.id === 'revolver' && (attackingPlayer.bullets ?? 6) <= 0;
    let finalD20 = emptyRevolver ? 0 : rollD20();
    let boxerData: { r1: number; r2: number; chosen: number } | null = null;
    if (!emptyRevolver && attackerClass.extraD20Rolls > 0) {
      const extra = rollD20();
      finalD20 = Math.max(finalD20, extra);
      boxerData = { r1: finalD20, r2: extra, chosen: finalD20 };
      setBoxerRolls(boxerData);
    }

    addTimer(
      setTimeout(() => {
        setIsRollingD20(false);
        setAtkRoll(finalD20);
        setTurnStep('d20_def');

        const atkName = isP1Attacking ? player1.name : player2.name;
        const newLogEntry: BattleLogEntry = {
          turn: currentTurn,
          type: 'attack',
          message: isEn
            ? `${atkName} rolled D20 Attack: ${finalD20}`
            : `${atkName} tung D20 Tấn Công: ${finalD20}`,
          messageVi: `${atkName} tung D20 Tấn Công: ${finalD20}`,
          timestamp: Date.now(),
        };

        setBattleState((prev) => {
          if (!prev) return null;
          const updated: BattleState = {
            ...prev,
            p1D20: isP1Attacking ? finalD20 : prev.p1D20,
            p2D20: !isP1Attacking ? finalD20 : prev.p2D20,
            player1: isP1Attacking ? spendAttackBullet(prev.player1) : prev.player1,
            player2: !isP1Attacking ? spendAttackBullet(prev.player2) : prev.player2,
            turnStep: 'd20_def',
            battleLog: [newLogEntry, ...prev.battleLog],
          };
          syncOnlineBattle(updated);
          return updated;
        });
      }, 700)
    );
  };

  // ==========================================
  // DISCRETE ROLL STEP 2: D20 DEFENSE
  // ==========================================
  const executeRollD20Def = () => {
    if (isRollingD20 || phase === 'game_over') return;
    setIsRollingD20(true);
    playDiceRollSound();

    const isP1Defending = !p1IsAttacker;
    const defenderClass = isP1Defending ? p1Class : p2Class;
    const attackerClass = p1IsAttacker ? p1Class : p2Class;
    const attackerState = structuredClone(p1IsAttacker ? player1 : player2);
    const defenderState = structuredClone(p1IsAttacker ? player2 : player1);
    const defenderTarget: 'p1' | 'p2' = p1IsAttacker ? 'p2' : 'p1';

    let finalDefD20 = rollD20();
    if (defenderClass.extraD20Rolls > 0) {
      const extra = rollD20();
      finalDefD20 = Math.max(finalDefD20, extra);
    }

    addTimer(
      setTimeout(() => {
        setIsRollingD20(false);
        setDefRoll(finalDefD20);

        const currentAtkRoll = (p1IsAttacker ? battleState.p1D20 : battleState.p2D20) ?? atkRoll ?? 0;
        const combatResult = calculateD20Combat(
          currentAtkRoll,
          finalDefD20,
          attackerClass,
          defenderClass,
          attackerState,
          defenderState
        );

        const defName = isP1Defending ? player1.name : player2.name;
        const logsToAdd: BattleLogEntry[] = [
          {
            turn: currentTurn,
            type: 'defend',
            message: isEn
              ? `${defName} rolled D20 Defense: ${finalDefD20}`
              : `${defName} tung D20 Phòng Thủ: ${finalDefD20}`,
            messageVi: `${defName} tung D20 Phòng Thủ: ${finalDefD20}`,
            timestamp: Date.now(),
          },
        ];

        // Set Combat Formula display
        setCombatFormula({
          isHit: combatResult.isHit,
          damage: combatResult.damage,
          atkRoll: currentAtkRoll,
          defRoll: finalDefD20,
        });

        let newActiveVfx: BattleState['activeVfx'] = null;
        let newDamagePopup: BattleState['damagePopup'] = null;

        if (combatResult.isHit && combatResult.damage > 0) {
          playWeaponSound(attackerState.weapon.id);
          const vfxName = normalAttackEffect(attackerState.weapon.id);
          newActiveVfx = {
            id: String(Date.now()),
            effect: vfxName,
            target: defenderTarget,
            size: 160,
          };

          if (defenderTarget === 'p1') {
            setP1IsHit(true);
            setTimeout(() => setP1IsHit(false), 400);
          } else {
            setP2IsHit(true);
            setTimeout(() => setP2IsHit(false), 400);
          }

          const isCrit = currentAtkRoll === 20;
          newDamagePopup = {
            id: String(Date.now()),
            target: defenderTarget,
            text: isCrit ? `CRIT! -${combatResult.damage} DMG` : `-${combatResult.damage} DMG`,
            type: isCrit ? 'crit' : 'damage',
            subtext: isCrit ? (isEn ? 'CRITICAL HIT 20!' : 'BẠO KÍCH XÚC XẮC 20!') : undefined,
          };
          seenPopups.current.add(newDamagePopup.id);
          setDamagePopup(newDamagePopup);

          logsToAdd.unshift({
            turn: currentTurn,
            type: 'damage',
            message: isEn ? combatResult.logTextEn : combatResult.logTextVi,
            messageVi: combatResult.logTextVi,
            timestamp: Date.now() + 1,
          });
        } else {
          playBlockSound();
          newDamagePopup = {
            id: String(Date.now()),
            target: defenderTarget,
            text: combatResult.isDodged
              ? (isEn ? 'EVADED!' : 'NÉ ĐÒN!')
              : combatResult.isImmune
              ? (isEn ? 'IMMUNE!' : 'MIỄN NHIỄM!')
              : (isEn ? 'BLOCKED!' : 'ĐỠ ĐÒN THÀNH CÔNG!'),
            type: 'block',
            subtext: combatResult.absorbedByRock ? 'ROCK -' + combatResult.absorbedByRock + ' HP' : combatResult.isImmune || combatResult.isDodged ? undefined : (isEn ? `${currentAtkRoll} ≤ ${finalDefD20}` : `Công ${currentAtkRoll} ≤ Thủ ${finalDefD20}`),
          };
          setDamagePopup(newDamagePopup);

          logsToAdd.unshift({
            turn: currentTurn,
            type: 'defend',
            message: isEn ? combatResult.logTextEn : combatResult.logTextVi,
            messageVi: combatResult.logTextVi,
            timestamp: Date.now() + 1,
          });
        }

        recordOpponentDamage(defenderState, Math.min(defenderState.hp, combatResult.damage), currentTurn);
        defenderState.hp = Math.max(0, defenderState.hp - combatResult.damage);
        const vfxSequence: VfxEvent[] = [];
        const reaction = (effect: string) => ({ id: crypto.randomUUID(), effect, target: defenderTarget, size: 140 });
        if (newActiveVfx) vfxSequence.push(newActiveVfx);
        if (combatResult.absorbedByRock) vfxSequence.push(reaction('rock_block'));
        else if (combatResult.isImmune) vfxSequence.push(reaction('infinity'));
        else if (combatResult.isDodged) vfxSequence.push(reaction('dodge_attack'));
        else if (!combatResult.isHit) vfxSequence.push(reaction('guard'));
        const rockFollows = attackerState.weapon.id === 'spirit_stone' && (attackerState.petRockHp ?? 0) > 0 && defenderState.hp > 0;
        const petHpBefore = defenderState.petRockHp ?? 0;
        const immuneBefore = defenderState.immuneDamageNext;
        const rockDamage = rockFollows ? applyOpponentDamage(defenderState, 2, currentTurn) : 0;
        if (rockFollows) {
          vfxSequence.push(reaction('rock_roll'));
          if ((defenderState.petRockHp ?? 0) < petHpBefore) vfxSequence.push(reaction('rock_block'));
          else if (immuneBefore && !defenderState.immuneDamageNext) vfxSequence.push(reaction('infinity'));
        }
        if (rockDamage) logsToAdd.unshift({ turn: currentTurn, type: 'damage', timestamp: Date.now() + 2,
          message: 'Pet Rock follows its owner: 2 damage.', messageVi: 'Lượt Pet Rock: tấn công sau chủ nhân, gây 2 sát thương.' });
        setTurnStep('d6_atk');

        setBattleState((prev) => {
          if (!prev) return null;
          const updated: BattleState = {
            ...prev,
            p1D20: !p1IsAttacker ? finalDefD20 : prev.p1D20,
            p2D20: p1IsAttacker ? finalDefD20 : prev.p2D20,
            turnStep: 'd6_atk',
            activeVfx: newActiveVfx, vfxSequence,
            damagePopup: newDamagePopup,
            battleLog: [...logsToAdd, ...prev.battleLog],
            player1: {
              ...(p1IsAttacker ? attackerState : defenderState),
            },
            player2: {
              ...(p1IsAttacker ? defenderState : attackerState),
            },
          };
          syncOnlineBattle(updated);
          return updated;
        });

        addTimer(setTimeout(() => setDamagePopup(null), 1800));
      }, 700)
    );
  };

  // ==========================================
  // DISCRETE ROLL STEP 3: D6 ATTACK (Skill Charge + Passive Skill 1)
  // ==========================================
  const chargePlayer = (attacking: boolean) => {
    if (chargeRollLockRef.current || isRollingD6 || phase === 'game_over' || syncPendingRef.current) return;
    const isP1 = attacking ? p1IsAttacker : !p1IsAttacker;
    const roll = rollD6();
    if (!applyChargeRoll(battleState, isP1, roll)) return;
    chargeRollLockRef.current = true;
    setIsRollingD6(true);
    playDiceRollSound();
    addTimer(setTimeout(() => {
      chargeRollLockRef.current = false;
      setIsRollingD6(false);
      setBattleState(prev => {
        if (!prev || prev.currentTurn !== currentTurn) return prev;
        const updated = applyChargeRoll(prev, isP1, roll);
        if (!updated) return prev;
        const player = isP1 ? updated.player1 : updated.player2;
        updated.battleLog = [{ turn: prev.currentTurn, type: 'system', timestamp: Date.now(),
          message: player.name + ' rolls D6: +' + roll + ' PTS.',
          messageVi: player.name + ' tung D6: +' + roll + ' PTS.' }, ...prev.battleLog];
        syncOnlineBattle(updated);
        return updated;
      });
    }, 600));
  };

  const executeRollD6Atk = () => chargePlayer(true);
  const executeRollD6Def = () => chargePlayer(false);

  // ==========================================
  // MASTER DISPATCHER: ROLL DICE
  // ==========================================
  const handleRollDice = () => {
    if (!canLocalRoll || isRollingD20 || isRollingD6 || phase === 'game_over') return;
    if (turnStep === 'd20_atk') {
      executeRollD20Atk();
    } else if (turnStep === 'd20_def') {
      executeRollD20Def();
    } else if (turnStep === 'd6_atk') {
      executeRollD6Atk();
    } else if (turnStep === 'd6_def') {
      executeRollD6Def();
    }
  };

  const handleCastSkill = (slot: 1 | 2, bot = false) => {
    if (bot && (onlineRoomCode || !isAiOpponent)) return;
    if (castLockRef.current || syncPendingRef.current || phase === 'game_over' || turnStep !== 'd12') return;
    const isP1 = bot ? false : isP1User;
    if (onlineRoomCode && (isP1 ? battleState.p1EndedTurn : battleState.p2EndedTurn)) return;
    const caster = isP1 ? player1 : player2;
    const opponent = isP1 ? player2 : player1;
    const forms = caster.weapon.skill1.triggerNumber;
    const form = slot === 2 && caster.weapon.id === "fire_headband" ? (bot ? ((caster.d12Charge ?? 0) >= 30 ? 30 : 20) : meteorCost) : slot === 2 && caster.weapon.id === "infinity_ring" ? (bot ? 1 : voidForm) : slot === 1 && Array.isArray(forms) ? (bot ? forms[0] : selectedSkillForm != null && forms.includes(selectedSkillForm) ? selectedSkillForm : forms[0]) : undefined;
    const result = castChargedSkill(caster, opponent, slot, currentTurn, form, lockSlot);
    if (!result) return;
    castLockRef.current = true;
    const presentation = skillPresentation(caster, slot, form);
    const casterTarget = isP1 ? 'p1' : 'p2';
    const opponentTarget = isP1 ? 'p2' : 'p1';
    const rolledBack = caster.weapon.id === 'spirit_stone' && slot === 2 && result.caster.hp < caster.hp;
    const vfxTarget = rolledBack || presentation.target === 'caster' ? casterTarget : presentation.target === 'center' ? 'center' : opponentTarget;
    const banner: SkillActivationEvent = { id: crypto.randomUUID(), weaponId: caster.weapon.id,
      skillNameEn: presentation.nameEn, skillNameVi: presentation.nameVi, slot,
      icon: '/assets/vfx/frames/' + presentation.effect + '/1.png', casterName: caster.name, auraColor: presentation.color };
    const vfx: VfxEvent = { id: crypto.randomUUID(), effect: presentation.effect, target: vfxTarget, size: slot === 2 ? 180 : 130 };
    const vfxSequence: VfxEvent[] = skillEffectPlan(caster, slot, form).map(cue => ({
      id: crypto.randomUUID(), effect: cue.effect, size: slot === 2 ? 180 : 130,
      target: cue.target === 'caster' || rolledBack ? casterTarget : cue.target === 'center' ? 'center' : opponentTarget,
    }));
    const reaction = (effect: string) => ({ id: crypto.randomUUID(), effect, target: opponentTarget as 'p1' | 'p2', size: 140 });
    if ((result.opponent.petRockHp ?? 0) < (opponent.petRockHp ?? 0)) vfxSequence.push(reaction('rock_block'));
    if (opponent.immuneDamageNext && !result.opponent.immuneDamageNext) vfxSequence.push(reaction('infinity'));
    if (opponent.dodgeNextSkill && !result.opponent.dodgeNextSkill) vfxSequence.push(reaction('dodge_spell'));
    if ((result.opponent.panicTurns ?? 0) > (opponent.panicTurns ?? 0)) vfxSequence.push(reaction('panic'));
    seenSkillBanners.current.add(banner.id);
    setSkillBannerQueue([banner]);
    if (presentation.target === 'caster') playMagicCastSound(); else playWeaponSound(caster.weapon.id);
    setBattleState(prev => {
      if (!prev) return null;
      const next: BattleState = { ...prev,
        player1: isP1 ? result.caster : result.opponent,
        player2: isP1 ? result.opponent : result.caster,
        activeSkillBanner: banner, activeVfx: vfx, vfxSequence,
        purpleSky: result.purpleSky ? { id: crypto.randomUUID(), startedAt: Date.now() } : prev.purpleSky,
        battleLog: [{ turn: currentTurn, type: 'skill', message: result.logTextEn, messageVi: result.logTextVi, timestamp: Date.now() }, ...prev.battleLog],
      };
      syncOnlineBattle(next);
      return next;
    });
    addTimer(setTimeout(() => { castLockRef.current = false; }, 450));
  };
  const handleRollD12 = () => handleCastSkill(2);

  // Handler: END TURN (With Debounce Protection & Both Players Rolled Gate)
  const handleEndTurn = () => {
    if (!bothPlayersHaveRolled || isEndingTurn || phase === 'game_over') return;

    if (onlineRoomCode) {
      setIsEndingTurn(true);
      const isP1 = isP1User;
      const remoteP1Ended = isP1 ? true : !!battleState.p1EndedTurn;
      const remoteP2Ended = !isP1 ? true : !!battleState.p2EndedTurn;

      if (!remoteP1Ended || !remoteP2Ended) {
        setBattleState((prev) => {
          if (!prev) return null;
          const updated: BattleState = {
            ...prev,
            p1EndedTurn: remoteP1Ended,
            p2EndedTurn: remoteP2Ended,
          };
          syncOnlineBattle(updated);
          return updated;
        });
        setTimeout(() => setIsEndingTurn(false), 500);
        return;
      }
    }

    setIsEndingTurn(true);
    playTurnSound();

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

    // Reset Turn Flags for New Round
    setTurnStep('d20_atk');
    setD20RolledThisTurn(false);
    setD6RolledThisTurn(false);
    setD12RolledThisTurn(false);
    setAtkRoll(null);
    setDefRoll(null);
    setBoxerRolls(null);
    setD6P1Rolls(null);
    setD6P2Rolls(null);
    setD12P1Rolls(null);
    setCombatFormula(null);
    setVfxQueue([]);
    setDamagePopup(null);

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
      const burnedP1 = { ...prev.player1 }, burnedP2 = { ...prev.player2 };
      applyOpponentDamage(burnedP1, p1BurnDmg, currentTurn, false);
      applyOpponentDamage(burnedP2, p2BurnDmg, currentTurn, false);
      const burnVfx: VfxEvent[] = [];
      for (const [before, after, target, amount] of [[prev.player1, burnedP1, 'p1', p1BurnDmg], [prev.player2, burnedP2, 'p2', p2BurnDmg]] as const) {
        if (amount > 0) burnVfx.push({ id: crypto.randomUUID(), target, size: 120,
          effect: before.immuneDamageNext && !after.immuneDamageNext ? 'infinity' : amount === 5 ? 'burn_black' : amount === 2 ? 'burn_blue' : 'burn_orange' });
      }
      const updated: BattleState = {
        ...prev,
        currentTurn: prev.currentTurn + 1,
        attackerId: nextP1IsAttacker ? prev.player1.id : prev.player2.id,
        turnStep: 'd20_atk',
        p1HasRolled: false,
        p2HasRolled: false,
        p1EndedTurn: false,
        p2EndedTurn: false,
        p1D20: null,
        p2D20: null,
        d6Results: null,
        p1D6: null,
        p2D6: null,
        activeVfx: null, vfxSequence: burnVfx,
        activeSkillBanner: null,
        damagePopup: null,
        player1: {
          ...burnedP1,
          isAttacker: nextP1IsAttacker,
          hp: burnedP1.hp,
          burnTicks: p1NewBurnTicks,
          panicTurns: Math.max(0, (prev.player1.panicTurns ?? 0) - 1),
        },
        player2: {
          ...burnedP2,
          isAttacker: !nextP1IsAttacker,
          hp: burnedP2.hp,
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

  const returnToLobby = async () => {
    if (!onlineRoomCode) { setPage('home'); return; }
    if (syncPendingRef.current) { setLobbyError(isEn ? 'Saving result. Try again shortly.' : 'Đang lưu kết quả. Hãy thử lại sau giây lát.'); return; }
    setReturningToLobby(true);
    setLobbyError('');
    try {
      const response = await fetch('/api/rooms/' + onlineRoomCode, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'return_lobby', userId: currentUser?.id }),
      });
      if (response.status === 404) { setOnlineRoomCode(null); setPage('play'); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Please retry');
      setPage('play');
    } catch (err) { setLobbyError(err instanceof Error ? err.message : 'Connection failed'); }
    finally { setReturningToLobby(false); }
  };

  // Forfeit Handler
  const handleConfirmForfeit = () => {
    setForfeitModalOpen(false);
    if (!battleState) return;

    const foeId = isP1User ? player2.id : player1.id;
    setBattleState((prev) => {
      if (!prev) return null;
      const next: BattleState = { ...prev, winnerId: foeId, phase: 'game_over' };
      syncOnlineBattle(next);
      return next;
    });

    addLog({
      turn: currentTurn,
      type: 'system',
      message: isEn ? `${myPlayer.name} has surrendered.` : `${myPlayer.name} đã đầu hàng hủy trận đấu.`,
      messageVi: `${myPlayer.name} đã đầu hàng hủy trận đấu.`,
    });
  };

  const p1Tier = getTierConfig(player1.weapon.tier);

  // Skill 1 trigger glow & vibrate detection (Auto-triggers on matching D6 roll!)

  return (
    <div className="battle-screen relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#07090e] select-none text-slate-100">
      {battleState.purpleSky && <PurpleSkyEffect key={battleState.purpleSky.id} startedAt={battleState.purpleSky.startedAt} />}
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

      {/* Cinematic Fullscreen Skill 2 Banner */}
      <CinematicSkillBanner
        queue={skillBannerQueue}
        onFinishOne={(id) => setSkillBannerQueue((q) => q.filter((e) => e.id !== id))}
      />

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

      {/* Online Waiting for Opponent Banner */}
      {onlineRoomCode && hasLocalPlayerRolled && !bothPlayersHaveRolled && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 bg-blue-950/90 border-2 border-yellow-400 px-4 py-1.5 shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse">
          <span className="text-[9px] font-pixel text-yellow-300 font-bold flex items-center gap-2">
            <span>⏳</span>
            <span>{isEn ? 'YOU ROLLED! WAITING FOR OPPONENT TO ROLL...' : 'BẠN ĐÃ TUNG! ĐANG CHỜ ĐỐI THỦ TUNG XÚC XẮC...'}</span>
          </span>
        </div>
      )}

      {/* 2. Top Combat HUD Header (Clean, unboxed, with ruby filigree divider) */}
      <header className="battle-hud relative z-20 w-full px-3 py-2 bg-black/85 border-b-2 border-yellow-500/60 backdrop-blur-md flex items-center justify-between gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
        {/* Left: Player 1 Health */}
        <div className="flex-1 max-w-[280px] flex flex-col items-center">
          <div className="flex items-center justify-between w-full px-1 text-[9px] font-pixel mb-1">
            <span className="font-bold text-yellow-300 truncate max-w-[140px] flex items-center gap-1">
              <span>{player1.name}</span>
              {p1IsAttacker && (
                <span className="text-[7px] bg-red-600 text-white px-1 py-0.2 rounded-xs font-bold animate-pulse">
                  ATK
                </span>
              )}
            </span>
          </div>
          <HealthBar current={player1.hp} max={player1.maxHp} variant="gold" />
          <RockHealthBar player={player1} />
        </div>

        {/* Center: Turn Counter, Map Badge & Surrender Button */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] sm:text-xs font-pixel font-bold text-yellow-400 drop-shadow">
            ROUND {currentTurn}
          </span>
          <span className="text-[7.5px] font-pixel text-slate-400 truncate max-w-[130px]">
            {isEn ? mapData.name : mapData.nameVi}
          </span>

          {/* Forfeit Match Button */}
          <button
            onClick={() => setForfeitModalOpen(true)}
            className="px-2 py-0.5 text-[6.5px] font-pixel bg-red-950/80 hover:bg-red-800 text-red-200 border border-red-500/70 cursor-pointer transition-colors shadow-sm"
          >
            🏳️ {isEn ? 'SURRENDER' : 'HỦY TRẬN'}
          </button>
        </div>

        {/* Right: Player 2 / AI Health */}
        <div className="flex-1 max-w-[280px] flex flex-col items-center">
          <div className="flex items-center justify-between w-full px-1 text-[9px] font-pixel mb-1 flex-row-reverse">
            <span className="font-bold text-cyan-300 truncate max-w-[140px] flex items-center gap-1 flex-row-reverse">
              <span>{player2.name}</span>
              {!p1IsAttacker && (
                <span className="text-[7px] bg-red-600 text-white px-1 py-0.2 rounded-xs font-bold animate-pulse">
                  ATK
                </span>
              )}
            </span>
          </div>
          <HealthBar current={player2.hp} max={player2.maxHp} variant="red" />
          <RockHealthBar player={player2} />
        </div>
      </header>

      {/* 3. Center Battle Stage (Dice Arena Centered Vertically & Horizontally) */}
      <main className="relative z-10 flex-1 flex flex-col justify-between items-center py-1 px-2 sm:px-6">
        {/* Dice Arena Tray (Symmetrical Dual Trays with Authentic frame_dual_dice_premium.png) */}
        <div className="w-full max-w-4xl mx-auto my-auto py-2">
          <PixelDice
            turnStep={turnStep}
            hasDefSkill={defenderHasDefenseSkill}
            p1Name={player1.name}
            p1IsAttacker={p1IsAttacker}
            p1D20={battleState.p1D20 ?? (p1IsAttacker ? atkRoll : defRoll)}
            p1D6={battleState.p1D6 ?? (d6P1Rolls ? d6P1Rolls[0] : null)}
            p1IsRolling={isRollingD20 || isRollingD6}
            p1IsRollingD20={isRollingD20 && (p1IsAttacker ? turnStep === 'd20_atk' : turnStep === 'd20_def')}
            p1IsRollingD6={isRollingD6 && (p1IsAttacker ? turnStep === 'd6_atk' : turnStep === 'd6_def')}
            p1HasRolled={turnStep === 'd12'}
            p1IsBoxer={p1Class.extraD20Rolls > 0}
            p1BoxerRolls={boxerRolls}
            p1IsMage={p1Class.id === 'mage'}
            p1MageRolls={battleState.d6Results?.player1 ?? null}
            p1Pts={player1.d12Charge || 0}
            p1PtsMax={player1.weapon.skill2.chargeRequired || 20}

            p2Name={player2.name}
            p2D20={battleState.p2D20 ?? (!p1IsAttacker ? atkRoll : defRoll)}
            p2D6={battleState.p2D6 ?? (d6P2Rolls ? d6P2Rolls[0] : null)}
            p2IsRolling={isRollingD20 || isRollingD6}
            p2IsRollingD20={isRollingD20 && (!p1IsAttacker ? turnStep === 'd20_atk' : turnStep === 'd20_def')}
            p2IsRollingD6={isRollingD6 && (!p1IsAttacker ? turnStep === 'd6_atk' : turnStep === 'd6_def')}
            p2HasRolled={turnStep === 'd12'}
            p2IsBoxer={p2Class.extraD20Rolls > 0}
            p2IsMage={p2Class.id === 'mage'}
            p2MageRolls={battleState.d6Results?.player2 ?? null}
            p2Pts={player2.d12Charge || 0}
            p2PtsMax={player2.weapon.skill2.chargeRequired || 20}

            combatFormula={combatFormula}
            currentRound={currentTurn}
            turnTimer={turnTimer}
            isOnline={!!onlineRoomCode}
            isEn={isEn}
          />
        </div>

        {/* Characters Podiums with Equipped Weapon Item Slot underneath & AnimationKit VFX Overlay */}
        <div className="battle-fighters w-full flex items-end justify-between px-2 sm:px-8 mt-auto mb-1">
          {/* LEFT: Player 1 Character + Item Slot */}
          <div className="relative flex flex-col items-center">
            <AnimatePresence>
              {damagePopup?.target === 'p1' && <PixelDamagePopup event={damagePopup} />}
              {damagePopup?.target === 'p1' && <div key={'impact-' + damagePopup.id} aria-hidden="true" className={'combat-impact ' + (damagePopup.type === 'block' ? 'combat-guard' : 'combat-strike')}><i /><i /><i /></div>}
            </AnimatePresence>

            {/* Character Sprite with Direct VFX Overlay */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                {activeVfx?.target === 'p1' && (
                  <VfxAnimationPlayer activeVfx={activeVfx} onFinish={finishVfx} />
                )}
              </div>

              <RockCompanion player={player1} side="right" />
              {player1.immuneDamageNext && <div aria-label="Immune" className="infinity-guard" />}
              <CharacterRenderer
                character={player1.character}
                weapon={['spirit_stone', 'pet_rock'].includes(player1.weapon.id) ? undefined : player1.weapon}
                size="md"
                facing="right"
                showAura={p1IsAttacker}
                auraColor="#facc15"
                showShadow={true}
                isHit={p1IsHit}
              />
            </div>

            {/* EQUIPPED WEAPON ITEM SLOT UNDER PLAYER 1 */}
            <WeaponItemSlot
              player={player1}
              isCurrentTurnAttacker={p1IsAttacker}
              isEn={isEn}
              align="left"
            />
          </div>

          {/* Center Arena VFX Overlay */}
          {activeVfx?.target === 'center' && (
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
              <VfxAnimationPlayer activeVfx={activeVfx} onFinish={finishVfx} />
            </div>
          )}

          {/* RIGHT: Player 2 Character + Item Slot */}
          <div className="relative flex flex-col items-center">
            <AnimatePresence>
              {damagePopup?.target === 'p2' && <PixelDamagePopup event={damagePopup} />}
              {damagePopup?.target === 'p2' && <div key={'impact-' + damagePopup.id} aria-hidden="true" className={'combat-impact ' + (damagePopup.type === 'block' ? 'combat-guard' : 'combat-strike')}><i /><i /><i /></div>}
            </AnimatePresence>

            {/* Character Sprite with Direct VFX Overlay */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                {activeVfx?.target === 'p2' && (
                  <VfxAnimationPlayer activeVfx={activeVfx} onFinish={finishVfx} />
                )}
              </div>

              <RockCompanion player={player2} side="left" />
              {player2.immuneDamageNext && <div aria-label="Immune" className="infinity-guard" />}
              <CharacterRenderer
                character={player2.character}
                weapon={['spirit_stone', 'pet_rock'].includes(player2.weapon.id) ? undefined : player2.weapon}
                size="md"
                facing="left"
                showAura={!p1IsAttacker}
                auraColor="#ef4444"
                showShadow={true}
                isHit={p2IsHit}
              />
            </div>

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
      <footer className="battle-controls relative z-20 w-full px-2 sm:px-4 py-2 bg-black/92 border-t-2 border-yellow-500/70 flex flex-col items-center gap-2">
        <div role="status" aria-live="polite" className="text-center text-xs sm:text-sm font-bold text-yellow-200 py-1">
          {bothPlayersHaveRolled
            ? hasLocalPlayerEndedTurn
              ? (isEn ? 'Waiting for your opponent to finish…' : 'Đang chờ đối thủ kết thúc lượt…')
              : (isEn ? '▼ END TURN / SKILL' : '▼ KẾT THÚC LƯỢT / DÙNG SKILL')
            : canLocalRoll
              ? '▼ ' + rollButtonTitle
              : rollButtonTitle}
        </div>
        {/* ============================================================ */}
        {/* THE 4 CENTERED ADJACENT BUTTONS */}
        {/* Left Pair: ROLL DICE + END TURN | Right Pair: SKILL 1 (Indicator) + SKILL 2 (Action) */}
        {/* ============================================================ */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-2 sm:gap-4 p-2 bg-[#090d19]/95 border-2 border-yellow-500/80 shadow-[0_0_25px_rgba(0,0,0,0.9)] max-w-4xl w-full">
          {/* --- LEFT GROUP: ROLL DICE & END TURN --- */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-start gap-2 flex-1 min-w-0 w-full sm:min-w-[240px]">
            {/* 1. ROLL DICE BUTTON (Sequential Turn Flow) */}
            <div className="w-full">
              <PixelSpriteButton
                sprite="roll_dice"
                disabled={!canLocalRoll || isRollingD20 || isRollingD6 || phase === 'game_over'}
                onClick={handleRollDice}
                className={`w-full ${
                  !canLocalRoll
                    ? 'opacity-40 grayscale pointer-events-none'
                    : 'action-beacon hover:scale-[1.02] ring-2 ring-yellow-400'
                }`}
                title={rollButtonTitle}
              />
            </div>

            {/* 2. END TURN BUTTON (Always darkened until BOTH have rolled!) */}
            <div
              className={`w-full transition-all duration-300 ${
                !bothPlayersHaveRolled || hasLocalPlayerEndedTurn
                  ? 'opacity-30 grayscale pointer-events-none cursor-not-allowed'
                  : 'action-beacon opacity-100 ring-2 ring-yellow-400'
              }`}
            >
              <PixelSpriteButton
                sprite="end_turn"
                disabled={!bothPlayersHaveRolled || hasLocalPlayerEndedTurn || isEndingTurn || phase === 'game_over'}
                onClick={handleEndTurn}
                className="w-full"
                title={
                  hasLocalPlayerEndedTurn
                    ? (isEn ? 'Waiting for opponent...' : 'Chờ đối thủ kết thúc lượt...')
                    : bothPlayersHaveRolled
                    ? (isEn ? 'End Turn' : 'Kết thúc lượt')
                    : (isEn ? 'Waiting for both to roll' : 'Chờ cả hai bên hoàn tất tung')
                }
              />
            </div>
          </div>

          {/* Divider between Left Pair & Right Pair */}
          <div className="hidden sm:block w-[2px] h-12 bg-yellow-500/50" />

          {/* --- RIGHT GROUP: SKILL 1 (Passive Display) & SKILL 2 (Active Button) --- */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-start gap-2 flex-1 min-w-0 w-full sm:min-w-[240px]">
            {([1, 2] as const).map(slot => {
              const skill = slot === 1 ? myPlayer.weapon.skill1 : myPlayer.weapon.skill2;
              const forms = myPlayer.weapon.skill1.triggerNumber;
              const chosenForm = slot === 1 ? (Array.isArray(forms) ? (forms.includes(selectedSkillForm ?? -1) ? selectedSkillForm : forms[0]) : undefined) : myPlayer.weapon.id === 'infinity_ring' ? voidForm : meteorCost;
              const art = skillPresentation(myPlayer, slot, chosenForm);
              const enabled = (slot === 1 ? canCastSkill1 : canCastSkill2) && phase !== 'game_over';
              const needsRock = slot === 2 && myPlayer.weapon.id === 'spirit_stone' && (myPlayer.petRockHp ?? 0) <= 0;
              const used = (slot === 1 ? myPlayer.skill1UsedTurn : myPlayer.skill2UsedTurn) === currentTurn;
              return <div key={slot} tabIndex={0} className="group relative w-full min-w-0" aria-label={(isEn ? skill.name : skill.nameVi) + ": " + (isEn ? skill.description : skill.descriptionVi)}>
                <button onClick={() => handleCastSkill(slot)} disabled={!enabled}
                  className={'battle-skill-button w-full h-[38px] sm:h-[44px] px-2 border-2 font-pixel text-[8px] sm:text-[9px] font-bold transition ' + (enabled ? 'action-beacon border-yellow-300 bg-purple-950 text-yellow-200 cursor-pointer' : 'border-slate-700 bg-slate-950 text-slate-400')}
                  title={isEn ? skill.description : skill.descriptionVi}>
                  <img src={"/assets/sprites/ui/frames/btn_skill_" + slot + ".png"} alt={"Skill " + slot} className="skill-button-art" /><span className="block skill-cost">{skillCost(myPlayer, slot, slot === 2 ? meteorCost : undefined)} PTS</span>
                  <span className="block text-[10px]">{needsRock ? (isEn ? 'Summon first' : 'Triệu hồi trước') : skillIsLocked(myPlayer, slot, currentTurn) ? '🔒' : used ? '✓' : enabled ? '⚡' : myCurrentPts + '/' + skillCost(myPlayer, slot, slot === 2 ? meteorCost : undefined)}</span>
                </button>
                <button type="button" className="skill-info-toggle" aria-expanded={openSkillInfo === slot} aria-controls={'skill-info-' + slot} onClick={() => setOpenSkillInfo(openSkillInfo === slot ? null : slot)}>{isEn ? 'ⓘ Details / Form' : 'ⓘ Chi tiết / Dạng'}</button>
                {openSkillInfo === slot && <button type="button" className="skill-info-backdrop" aria-label={isEn ? 'Close skill details' : 'Đóng thông tin kỹ năng'} onClick={() => setOpenSkillInfo(null)} />}
                <div id={'skill-info-' + slot} role="tooltip" className={'skill-popover absolute bottom-full right-0 mb-2 z-50 hidden group-hover:block group-focus-within:block w-64 max-w-[75vw] p-3 border border-yellow-500/70 bg-slate-950 shadow-xl text-xs text-slate-200 leading-relaxed after:absolute after:top-full after:left-0 after:h-2 after:w-full ' + (openSkillInfo === slot ? 'skill-popover-open' : '')}>
                  <button type="button" className="skill-info-close" onClick={() => setOpenSkillInfo(null)}>{isEn ? 'Close ✕' : 'Đóng ✕'}</button>
                  <img src={"/assets/vfx/frames/" + art.effect + "/1.png"} alt={isEn ? art.nameEn : art.nameVi} width={64} height={64} className="float-left mr-2 object-contain" style={{imageRendering:"pixelated"}} /><strong className="text-yellow-300">{isEn ? art.nameEn : art.nameVi} · {skillCost(myPlayer, slot, slot === 2 ? meteorCost : undefined)} PTS</strong>
                  <p className="mt-1">{isEn ? skill.description : skill.descriptionVi}</p>
                  <p className="mt-1 text-cyan-300">{isEn ? 'Shared PTS · Once per round' : 'Dùng chung PTS · 1 lần/hiệp'}</p>
                {slot === 2 && myPlayer.weapon.id === 'infinity_ring' && <>
                  <select aria-label="Purple form" value={voidForm} onChange={e => setVoidForm(Number(e.target.value))} className="w-full bg-slate-900 p-1 mt-2 text-yellow-200"><option value={1}>Purple · 50 DMG</option><option value={2}>Purple Sky · 30 DMG + Lock</option></select>
                  {voidForm === 2 && <select aria-label="Lock enemy skill" value={lockSlot} onChange={e => setLockSlot(Number(e.target.value) as 1 | 2)} className="w-full bg-slate-900 p-1 mt-2 text-yellow-200"><option value={1}>{isEn ? 'Lock enemy Skill 1' : 'Khóa Skill 1 đối thủ'}</option><option value={2}>{isEn ? 'Lock enemy Skill 2' : 'Khóa Skill 2 đối thủ'}</option></select>}
                </>}
                {slot === 2 && myPlayer.weapon.id === 'fire_headband' && <select aria-label="Meteor cost" value={meteorCost} onChange={e => setMeteorCost(Number(e.target.value))} className="w-full bg-slate-900 p-1 mt-2 text-yellow-200"><option value={20}>20 PTS · 1 ☄ · 10 DMG</option><option value={30}>30 PTS · 2 ☄ · 30 DMG + Panic</option></select>}
                {slot === 1 && Array.isArray(skill.triggerNumber) && <select
                  aria-label={isEn ? 'Choose Skill 1 form' : 'Chọn dạng Skill 1'}
                  value={selectedSkillForm != null && skill.triggerNumber.includes(selectedSkillForm) ? selectedSkillForm : skill.triggerNumber[0]}
                  onChange={e => setSelectedSkillForm(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-900 text-yellow-200 border border-slate-500 text-xs p-1">
                  {skill.triggerNumber.map(form => <option key={form} value={form}>{({ infinity_ring: { 3: 'Aoi · Reflect', 4: 'Akai · 12 DMG', 6: 'Immune' }, dagger: { 1: 'Throw · Burn', 2: 'Multi Slash · Buff' }, chronos_watch: { 2: 'Time Anchor', 4: 'Fate Seal', 6: 'Time Lock' } } as Record<string, Record<number, string>>)[myPlayer.weapon.id]?.[form] || form}</option>)}
                </select>}
                </div>
              </div>;
            })}
          </div>
        </div>

        <p className="battle-points text-xs text-cyan-200 text-center">{player1.name}: {player1.d12Charge ?? 0} PTS · {player2.name}: {player2.d12Charge ?? 0} PTS</p>
        {/* Expandable Compact Battle Log Strip */}
        <div className="battle-log-strip w-full max-w-4xl flex items-center justify-between px-3 py-1 bg-[#060810]/90 border border-slate-700 text-[7px] sm:text-[8px] font-pixel">
          <div className="flex items-center gap-2 truncate">
            <span className="text-yellow-400 font-bold">📜 {isEn ? 'LATEST:' : 'MỚI NHẤT:'}</span>
            <span className="text-slate-300 truncate max-w-[500px]">
              {battleLog.length > 0 ? battleLog[0].message : isEn ? 'Combat begins!' : 'Trận đấu bắt đầu!'}
            </span>
          </div>
          <button
            onClick={() => setLogModalOpen(true)}
            className="text-cyan-400 hover:text-white underline cursor-pointer whitespace-nowrap ml-2 font-bold"
          >
            {isEn ? 'VIEW ALL LOGS' : 'XEM HẾT NHẬT KÝ'}
          </button>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* 5. CENTERED FULLSCREEN COMBAT LOG MODAL */}
      {/* ============================================================ */}
      <AnimatePresence>
        {logModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#090d1a] border-2 border-yellow-500 p-4 sm:p-6 shadow-[0_0_35px_rgba(250,204,21,0.6)] flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-yellow-500/60 font-pixel">
                <div className="flex items-center gap-2">
                  <PixelIcon name="scroll" size={14} color="#facc15" />
                  <h3 className="text-sm sm:text-base font-bold text-yellow-400">
                    {isEn ? 'FULL COMBAT LOG' : 'TOÀN BỘ NHẬT KÝ CHIẾN ĐẤU'}
                  </h3>
                </div>
                <button
                  onClick={() => setLogModalOpen(false)}
                  className="px-2 py-0.5 text-xs font-pixel bg-red-900 hover:bg-red-700 text-white border border-red-400 cursor-pointer"
                >
                  ✕ {isEn ? 'CLOSE' : 'ĐÓNG'}
                </button>
              </div>

              {/* Scrollable Log Entries */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 font-pixel text-[8px] sm:text-[9px]">
                {battleLog.map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-2 border-l-4 rounded-xs ${
                      log.type === 'damage'
                        ? 'border-red-500 bg-red-950/30 text-red-200'
                        : log.type === 'defend'
                        ? 'border-cyan-400 bg-cyan-950/30 text-cyan-200'
                        : log.type === 'skill'
                        ? 'border-yellow-400 bg-yellow-950/30 text-yellow-200'
                        : 'border-slate-500 bg-slate-900/40 text-slate-300'
                    }`}
                  >
                    <span className="text-[7.5px] opacity-75 mr-2">[Turn {log.turn}]</span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* 6. FORFEIT / SURRENDER CONFIRMATION MODAL */}
      {/* ============================================================ */}
      <AnimatePresence>
        {forfeitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#0a0d17] border-2 border-red-500 p-5 text-center shadow-[0_0_35px_rgba(239,68,68,0.7)] font-pixel"
            >
              <h3 className="text-base sm:text-lg font-bold text-red-400 mb-2">
                🏳️ {isEn ? 'SURRENDER MATCH?' : 'HỦY TRẬN ĐẤU / ĐẦU HÀNG?'}
              </h3>
              <p className="text-[8.5px] sm:text-[9.5px] text-slate-300 mb-5 leading-relaxed">
                {isEn
                  ? 'Are you sure you want to surrender? This match will be counted as a defeat.'
                  : 'Bạn có chắc chắn muốn đầu hàng và rời trận đấu không? Trận đấu này sẽ bị tính là một thất bại.'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <PixelButton
                  variant="danger"
                  size="sm"
                  onClick={handleConfirmForfeit}
                  className="font-pixel text-[8px]"
                >
                  {isEn ? 'YES, SURRENDER' : 'XÁC NHẬN ĐẦU HÀNG'}
                </PixelButton>
                <PixelButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setForfeitModalOpen(false)}
                  className="font-pixel text-[8px]"
                >
                  {isEn ? 'CONTINUE FIGHTING' : 'TIẾP TỤC CHIẾN ĐẤU'}
                </PixelButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* 7. VICTORY / DEFEAT MODAL */}
      {/* ============================================================ */}
      <AnimatePresence>
        {phase === 'game_over' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-[#0a0d17] border-2 border-yellow-500 p-6 text-center shadow-[0_0_35px_rgba(250,204,21,0.6)]"
            >
              <h2 className="text-xl sm:text-2xl font-pixel text-yellow-400 drop-shadow mb-2">
                {winnerId === myPlayer.id ? (isEn ? 'VICTORY!' : 'CHIẾN THẮNG!') : (isEn ? 'DEFEAT!' : 'THẤT BẠI!')}
              </h2>
              <p className="text-[10px] font-pixel text-slate-300 mb-6">
                {winnerId === myPlayer.id
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
                onClick={returnToLobby}
                disabled={returningToLobby}
                className="w-full font-pixel action-beacon"
              >
                {onlineRoomCode ? (isEn ? 'RETURN TO ROOM · PLAY AGAIN' : 'VỀ PHÒNG · CHƠI TIẾP') : (isEn ? 'RETURN TO HOME' : 'VỀ TRANG CHỦ')}
              </PixelButton>
              {lobbyError && <p role="alert" className="mt-3 text-sm text-red-300">{lobbyError}</p>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
