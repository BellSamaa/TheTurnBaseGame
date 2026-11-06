'use client';
import {recordCombatHit} from '@/lib/combatHits';
import {rollTimedD20} from '@/lib/diceTiming';
import {rollDuelDefense,resolveDuelClash,timeDuelRoll} from '@/lib/pvpDuel';
import {rollLuckyAttack} from '@/lib/duelRules';
import {effectFrame} from '@/lib/weaponUpdateAssets';
import {weaponD20,tickWeaponRound,outgoingDamage} from '@/lib/weaponUpdateHooks';
import {syncWeather,advanceWeather} from '@/lib/weaponUpdateState';
import {d6Allowance,recordAttackRoll,decideMageBonus} from '@/lib/classMechanics';
import {canUsePvpSkill} from '@/lib/skillPriority';
import {tx} from '@/lib/uiLocale';
import CombatArena from './CombatArena';
import CombatSkills from './CombatSkills';
import type {LmsState} from '@/lib/lms';
import RankResult from './RankResult';

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
} from '@/lib/battleLogic';
import type { BattleLogEntry, BattleState, PlayerState } from '@/types/game';
import { skillPresentation, skillEffectPlan } from '@/lib/skillPresentation';
import { castChargedSkill, skillCost } from '@/lib/chargedSkills';
import WeaponStand from './WeaponStand';
import { RockHealthBar, RockCompanion } from './RockCompanion';
import HealthBar from '@/components/ui/HealthBar';
import PixelButton from '@/components/ui/PixelButton';
import PixelSpriteButton from '@/components/ui/PixelSpriteButton';
import PixelFrame from '@/components/ui/PixelFrame';
import PixelIcon from '@/components/ui/PixelIcon';
import { applyOpponentDamage, skillIsLocked } from '@/lib/combatDamage';
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
      playMagicCastSound();
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
  const [roomParticipants, setRoomParticipants] = useState<Array<{ id: string; name: string; isReady: boolean }>>([]);

  // LMS rooms expose all fighters even though the turn engine still uses the
  // active 1v1 pair. Keep the arena roster live so spectators see the full
  // circle while the current duel remains rendered normally.
  useEffect(() => {
    if (!onlineRoomCode) { setRoomParticipants([]); return; }
    let cancelled = false;
    const loadRoster = async () => {
      try {
        const response = await fetch(`/api/rooms/${onlineRoomCode}`, { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        const participants = data.room?.participants ?? data.participants ?? [];
        if (!cancelled) setRoomParticipants(participants.map((p: { id: string; name: string; isReady?: boolean }) => ({ id: p.id, name: p.name, isReady: Boolean(p.isReady) })));
      } catch { /* roster is decorative; keep the battle playable offline */ }
    };
    void loadRoster();
    const timer = window.setInterval(loadRoster, 3000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [onlineRoomCode]);
  const [meteorCost, setMeteorCost] = useState(20);
  const [selectedSkillForm, setSelectedSkillForm] = useState<number | undefined>();
  const castLockRef = useRef(false);
  const chargeRollLockRef = useRef(false);
  const [lobbyError, setLobbyError] = useState('');
  const [returningToLobby, setReturningToLobby] = useState(false);

  // Rolling states
  const [turnStep, setTurnStep] = useState<NonNullable<BattleState['turnStep']>>(
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

  // Every active roll step allows 20 seconds.
  const [turnTimer, setTurnTimer] = useState<number>(20);

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
                  const dmg = remote.damagePopup?.type === 'damage' ? Number(remote.damagePopup.text.match(/\d+/)?.[0]||0) : hit ? 15 + atk - def : 0;
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

  useEffect(() => {
    if (!battleState?.winnerId || battleState.mode !== 'ranked' || !onlineRoomCode) return;
    let active=true;
    const refresh=async()=>{const response=await fetch('/api/auth/profile',{cache:'no-store'});const body=await response.json();if(active&&body.user)useGameStore.setState(state=>({currentUser:body.user,profile:{...state.profile,rank:body.user.rankPoints,tier:body.user.tier,wins:body.user.wins,losses:body.user.losses}}));};
    refresh().catch(()=>{});const timer=setTimeout(()=>refresh().catch(()=>{}),2000);
    return()=>{active=false;clearTimeout(timer);};
  },[battleState?.winnerId,battleState?.mode,onlineRoomCode]);

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
  const circleRoster = roomParticipants.length >= 3
    ? roomParticipants.slice(0, 4)
    : [{ id: player1.id, name: player1.name, isReady: true }, { id: player2.id, name: player2.name, isReady: true }];

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
  } else if (turnStep === 'clash') {
    rollButtonTitle = isEn ? 'Clashing · Both sides can wager' : 'Va chạm · Hai bên có thể cược';
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
    const count = d6Allowance(rollingPlayer,currentTurn);
    const completed = battleState.d6Results?.[isP1User ? 'player1' : 'player2']?.length ?? 0;
    rollButtonTitle += ' · ' + Math.min(count, completed + 1) + '/' + count;
  }

  const chargeBlocked=['d6_atk','d6_def'].includes(turnStep)&&(isP1User?player1:player2).weaponUpdate?.slowChargeRound===currentTurn&&!!(isP1User?player1:player2).weaponUpdate?.slowChargeBlocked;
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

  // Sync profile rank/tier immediately after ranked match concludes
  useEffect(() => {
    if (phase === 'game_over' && mode === 'ranked') {
      const fetchUpdatedProfile = async () => {
        try {
          const res = await fetch('/api/auth/profile');
          const data = await res.json();
          if (data.user) {
            useGameStore.setState((prev) => ({
              currentUser: data.user,
              profile: {
                ...prev.profile,
                rank: data.user.rankPoints || 1000,
                tier: data.user.tier || 1,
                wins: data.user.wins || 0,
                losses: data.user.losses || 0,
              },
            }));
          }
        } catch {
          // Retry on return
        }
      };
      const t = setTimeout(fetchUpdatedProfile, 800);
      return () => clearTimeout(t);
    }
  }, [phase, mode]);

  // Turn Countdown Timer & Auto-Roll Handler
  // Resets to 20 seconds on each active roll step.
  useEffect(() => {
    setTurnTimer(20);
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

    const attackingPlayer = structuredClone(isP1Attacking ? player1 : player2);
    const defendingPlayer=structuredClone(isP1Attacking?player2:player1);
    const emptyRevolver = attackingPlayer.weapon.id === 'revolver' && (attackingPlayer.bullets ?? 6) <= 0;
    const attackRoll=recordAttackRoll(attackingPlayer,currentTurn,emptyRevolver?0:weaponD20(attackingPlayer,rollLuckyAttack(attackingPlayer,()=>rollTimedD20(attackingPlayer,currentTurn,'attack',rollD20)),'attack',currentTurn,defendingPlayer));
    const finalD20=attackRoll.value;
    const nextAttackStep=attackRoll.done?'d20_def':'d20_atk';

    addTimer(
      setTimeout(() => {
        setIsRollingD20(false);
        setAtkRoll(finalD20);
        setTurnStep(nextAttackStep);

        const atkName = isP1Attacking ? player1.name : player2.name;
        const newLogEntry: BattleLogEntry = {
          turn: currentTurn,
          type: 'attack',
          message: isEn
            ? `${atkName} rolled D20 Attack: ${attackRoll.rolls.join(" / ")} → ${finalD20}`
            : `${atkName} tung D20 Tấn Công: ${attackRoll.rolls.join(" / ")} → ${finalD20}`,
          messageVi: `${atkName} tung D20 Tấn Công: ${finalD20}`,
          timestamp: Date.now(),
        };

        setBattleState((prev) => {
          if (!prev) return null;
          const updated: BattleState = {
            ...prev,
            p1D20: isP1Attacking ? finalD20 : prev.p1D20,
            p2D20: !isP1Attacking ? finalD20 : prev.p2D20,
            player1: isP1Attacking ? (attackRoll.done?spendAttackBullet(attackRoll.player):attackRoll.player) : defendingPlayer,
            player2: !isP1Attacking ? (attackRoll.done?spendAttackBullet(attackRoll.player):attackRoll.player) : defendingPlayer,
            turnStep: nextAttackStep,
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
  async function duelAction(action: 'duel_defend' | 'duel_wager' | 'duel_resolve' | 'duel_timing', stake = 0, actor = myPlayer.id, elapsedMs?:number) {
    if (syncPendingRef.current) return;
    syncPendingRef.current = true;
    try {
      const latest = useGameStore.getState().battleState;
      if (!latest) return;
      if (onlineRoomCode) {
        let state = latest;
        for (let attempt = 0; ; attempt++) {
          const response = await fetch('/api/rooms/' + onlineRoomCode, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({action, stake, elapsedMs, expectedRevision:state.revision ?? 0}),
          });
          const result = await response.json();
          const fresh: BattleState | undefined = result.room?.battleState;
          if (fresh) setBattleState(fresh);
          if (response.ok) break;
          if (response.status === 409 && action === 'duel_wager' && fresh) {
            if (fresh.duelClash?.deadline !== latest.duelClash?.deadline) break;
            if (attempt < 2) {
              state = fresh;
              continue;
            }
          }
          throw Error(result.error || 'Duel action failed');
        }
      } else {
        const next = action === 'duel_timing' ? timeDuelRoll(latest,actor,Date.now(),elapsedMs) : action === 'duel_defend' ? rollDuelDefense(latest, actor) : resolveDuelClash(latest, Date.now(), action === 'duel_wager' ? {actor, stake} : undefined);
        setBattleState(next);
      }
    } catch (error) {
      setTurnBannerText(error instanceof Error ? error.message : 'Duel action failed');
      addTimer(setTimeout(() => setTurnBannerText(null), 2200));
    } finally {
      syncPendingRef.current = false;
    }
  }

  const executeRollD20Def = () => {
    if (isRollingD20 || phase === 'game_over' || syncPendingRef.current) return;
    setIsRollingD20(true);
    playDiceRollSound();
    const defenderId = p1IsAttacker ? player2.id : player1.id;
    addTimer(setTimeout(async () => {
      await duelAction('duel_defend', 0, defenderId);
      setIsRollingD20(false);
    }, 700));
  };

  const localClash = battleState.duelClash;
  useEffect(() => {
    if (onlineRoomCode || !localClash) return;
    const botStake = localClash.defenderId === player2.id ? localClash.defenseStake : localClash.attackStake;
    const botTimer = isAiOpponent && botStake === undefined ? setTimeout(() => void duelAction('duel_wager', 0, player2.id), 0) : undefined;
    const timer = setTimeout(() => void duelAction('duel_resolve'), Math.max(0, localClash.deadline - Date.now()));
    return () => { clearTimeout(timer); clearTimeout(botTimer); };
  }, [onlineRoomCode, localClash?.deadline, localClash?.defenderId, localClash?.attackStake, localClash?.defenseStake, isAiOpponent, player2.id]);

  // ==========================================
  // DISCRETE ROLL STEP 3: D6 ATTACK (Skill Charge + Passive Skill 1)
  // ==========================================
  const chargePlayer = (attacking: boolean) => {
    if (chargeRollLockRef.current || isRollingD6 || phase === 'game_over' || syncPendingRef.current) return;
    const isP1 = attacking ? p1IsAttacker : !p1IsAttacker;
    const roll = rollD6();
    const chargeDecision=decideMageBonus(isP1?battleState.player1:battleState.player2,currentTurn);
    chargeRollLockRef.current = true;
    setIsRollingD6(true);
    playDiceRollSound();
    addTimer(setTimeout(() => {
      chargeRollLockRef.current = false;
      setIsRollingD6(false);
      setBattleState(prev => {
        if (!prev || prev.currentTurn !== currentTurn) return prev;
        const decided=chargeDecision;
        const stable={...prev,[isP1?"player1":"player2"]:{...(isP1?prev.player1:prev.player2),mageBonusRound:decided.mageBonusRound,mageBonusD6:decided.mageBonusD6}};
        const updated = applyChargeRoll(stable, isP1, roll);
        if (!updated) return prev;
        const player = isP1 ? updated.player1 : updated.player2;
        updated.battleLog = [{ turn: prev.currentTurn, type: 'system', timestamp: Date.now(),
          message: player.name + ' rolls D6: +' + (player.weaponUpdate?.lastChargeValue??roll) + ' PTS.',
          messageVi: player.name + ' tung D6: +' + (player.weaponUpdate?.lastChargeValue??roll) + ' PTS.' }, ...prev.battleLog];
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

  const handleCastSkill = async (slot: 1 | 2, bot = false, choice?:{form?:number;lockSlot?:1|2}) => {
    if (bot && (onlineRoomCode || !isAiOpponent)) return;
    if (castLockRef.current || syncPendingRef.current || phase === 'game_over' || turnStep !== 'd12') return;
    const isP1 = bot ? false : isP1User;
    if (onlineRoomCode && (isP1 ? battleState.p1EndedTurn : battleState.p2EndedTurn)) return;
    if(!canUsePvpSkill(battleState,isP1?player1.id:player2.id))return;
    const caster = isP1 ? player1 : player2;
    const opponent = isP1 ? player2 : player1;
    const forms = caster.weapon.skill1.triggerNumber;
    const form = choice?.form ?? (slot === 2 && caster.weapon.id === "fire_headband" ? (bot ? ((caster.d12Charge ?? 0) >= 30 ? 30 : 20) : meteorCost) : slot === 2 && caster.weapon.id === "infinity_ring" ? (bot ? 1 : voidForm) : slot === 1 && Array.isArray(forms) ? (bot ? forms[0] : selectedSkillForm != null && forms.includes(selectedSkillForm) ? selectedSkillForm : forms[0]) : undefined);
    if(onlineRoomCode){
      castLockRef.current=true;syncPendingRef.current=true;
      try{
        const response=await fetch('/api/rooms/'+onlineRoomCode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'cast_skill',slot,form,lockSlot:choice?.lockSlot??lockSlot,expectedRevision:battleState.revision??0})});
        const data=await response.json();
        if(data.room?.battleState)setBattleState(data.room.battleState);
        if(!response.ok){setTurnBannerText(data.error||'Please synchronize and try again');addTimer(setTimeout(()=>setTurnBannerText(null),2200));}
      }catch{setTurnBannerText(isEn?'Connection lost. Please try again.':'Mất kết nối. Hãy thử lại.');}
      finally{syncPendingRef.current=false;castLockRef.current=false;}
      return;
    }
    const result = castChargedSkill(caster, opponent, slot, currentTurn, form, choice?.lockSlot??lockSlot);
    if (!result) return;
    castLockRef.current = true;
    const presentation = skillPresentation(caster, slot, form);
    const casterTarget = isP1 ? 'p1' : 'p2';
    const opponentTarget = isP1 ? 'p2' : 'p1';
    const rolledBack = caster.weapon.id === 'spirit_stone' && slot === 2 && result.caster.hp < caster.hp;
    const vfxTarget = rolledBack || presentation.target === 'caster' ? casterTarget : presentation.target === 'center' ? 'center' : opponentTarget;
    const banner: SkillActivationEvent = { id: crypto.randomUUID(), weaponId: caster.weapon.id,
      skillNameEn: presentation.nameEn, skillNameVi: presentation.nameVi, slot,
      icon: effectFrame(result.effect||presentation.effect,1), casterName: caster.name, auraColor: presentation.color };
    const vfx: VfxEvent = { id: crypto.randomUUID(), effect: result.effect||presentation.effect, target: vfxTarget, size: slot === 2 ? 180 : 130 };
    const vfxSequence: VfxEvent[] = skillEffectPlan(caster, slot, form).map(cue => ({
      id: crypto.randomUUID(), effect: result.effect||cue.effect, size: slot === 2 ? 180 : 130,
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
    syncWeather([result.caster,result.opponent]);
    setBattleState(prev => {
      if (!prev) return null;
      const next: BattleState = { ...prev,
        player1: isP1 ? result.caster : result.opponent,
        player2: isP1 ? result.opponent : result.caster,
        activeSkillBanner: banner, activeVfx: vfx, vfxSequence,
        purpleSky: result.purpleSky ? { id: crypto.randomUUID(), startedAt: Date.now() } : prev.purpleSky,
        battleLog: [{ turn: currentTurn, type: 'skill', message: result.logTextEn, messageVi: result.logTextVi, timestamp: Date.now() }, ...prev.battleLog],
      };
      recordCombatHit(next,result.damage,caster.id,opponent.id);
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

    const keepAttack=((p1IsAttacker?player1:player2).weaponUpdate?.extraAttacks??0)>0;
    const nextP1IsAttacker=keepAttack?p1IsAttacker:!p1IsAttacker;
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
      const burnedP1 = structuredClone(prev.player1), burnedP2 = structuredClone(prev.player2);
      if(keepAttack){const owner=p1IsAttacker?burnedP1:burnedP2;if(owner.weaponUpdate)owner.weaponUpdate.extraAttacks=Math.max(0,(owner.weaponUpdate.extraAttacks||0)-1);}
      advanceWeather([burnedP1,burnedP2],currentTurn);
      const weaponEvents=tickWeaponRound([burnedP1,burnedP2],currentTurn+1);
      for(const p of [burnedP1,burnedP2])if(currentTurn+1>(p.petRockEnrageUntilRound??Infinity))p.petRockEnraged=false;
      applyOpponentDamage(burnedP1,burnedP1.weaponUpdate?.burnOwner===burnedP2.id?outgoingDamage(burnedP2,p1BurnDmg,currentTurn):p1BurnDmg,currentTurn,false,burnedP2);
      applyOpponentDamage(burnedP2,burnedP2.weaponUpdate?.burnOwner===burnedP1.id?outgoingDamage(burnedP1,p2BurnDmg,currentTurn):p2BurnDmg,currentTurn,false,burnedP1);
      const burnVfx: VfxEvent[] = [];
      for (const [before, after, target, amount] of [[prev.player1, burnedP1, 'p1', p1BurnDmg], [prev.player2, burnedP2, 'p2', p2BurnDmg]] as const) {
        if (amount > 0) burnVfx.push({ id: crypto.randomUUID(), target, size: 120,
          effect: before.immuneDamageNext && !after.immuneDamageNext ? 'infinity' : amount === 5 ? 'burn_black' : amount === 2 ? 'burn_blue' : 'burn_orange' });
      }
      const updated: BattleState = {
        ...prev,
        currentTurn: prev.currentTurn + 1,
        duelClash:undefined,duelNotice:undefined,
        battleLog:[...weaponEvents.map(e=>({turn:currentTurn+1,type:'system' as const,message:e.text,messageVi:e.textVi,timestamp:Date.now()})),...prev.battleLog],
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
          boxerAttackRolls:[],boxerAttackRound:undefined,
          isAttacker: nextP1IsAttacker,
          hp: burnedP1.hp,
          burnTicks: p1NewBurnTicks,
          panicTurns: Math.max(0, (prev.player1.panicTurns ?? 0) - 1),
        },
        player2: {
          ...burnedP2,
          boxerAttackRolls:[],boxerAttackRound:undefined,
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

  const arenaState:LmsState={hitEvents:battleState.hitEvents,duelClash:battleState.duelClash,duelNotice:battleState.duelNotice,players:[player1,player2],order:[player1.id,player2.id],active:p1IsAttacker?0:1,round:currentTurn,phase:phase==='game_over'?'finished':turnStep==='d12'?'skills':turnStep==='d6_def'?'charge_defense':turnStep==='d6_atk'?'charge':turnStep==='clash'?'clash':turnStep==='d20_def'?'defense':'attack',target:p1IsAttacker?player2.id:player1.id,attack:(p1IsAttacker?battleState.p1D20:battleState.p2D20)??undefined,defense:(p1IsAttacker?battleState.p2D20:battleState.p1D20)??undefined,rolls:(p1IsAttacker?battleState.d6Results?.player1:battleState.d6Results?.player2)||[],defenderRolls:(p1IsAttacker?battleState.d6Results?.player2:battleState.d6Results?.player1)||[],log:battleLog.map(l=>isEn?l.message:l.messageVi||l.message),winner:winnerId||undefined,revision:battleState.revision??0};
  const sharedEffects=battleState.vfxSequence?.length?battleState.vfxSequence:battleState.activeVfx?[battleState.activeVfx]:[];
  const sharedBanner=battleState.activeSkillBanner;
  if(sharedEffects.length||sharedBanner){const v=sharedEffects[0];const targetId=(target:string)=>target==='p1'?player1.id:target==='p2'?player2.id:'center';arenaState.lastEvent={id:sharedBanner?.id||v.id,announcementId:sharedBanner?.id,effect:v?.effect||'impact_physical',caster:[player1,player2].find(p=>p.name===sharedBanner?.casterName)?.id||myPlayer.id,target:v?targetId(v.target):'center',cues:sharedEffects.map(c=>({effect:c.effect,target:targetId(c.target)})),nameEn:sharedBanner?.skillNameEn,nameVi:sharedBanner?.skillNameVi,slot:sharedBanner?.slot};}

  return <div className="battle-screen revised-battle">{battleState.purpleSky&&<PurpleSkyEffect key={battleState.purpleSky.id} startedAt={battleState.purpleSky.startedAt}/>} <RankResult battleId={battleState.id} winner={winnerId} mode={mode}/><CombatArena stageSequence={['attack','defense','charge','charge_defense','skills']} state={arenaState} viewer={myPlayer.id} onTiming={elapsed=>void duelAction('duel_timing',0,myPlayer.id,elapsed)} onDuelWager={stake=>void duelAction('duel_wager',stake)} title={isEn?mapData.name:mapData.nameVi} onSurrender={()=>{if(window.confirm(isEn?'Surrender?':'Đầu hàng?'))handleConfirmForfeit();}}>
    <div className="combat-status">{turnStep==='d12'&&!canUsePvpSkill(battleState,myPlayer.id)?(isEn?'Waiting for attacker’s skill or End Turn':'Chờ bên Công dùng skill hoặc End Turn'):turnBannerText||rollButtonTitle}</div>
    <div className="four-commands"><PixelSpriteButton sprite="roll_dice" disabled={chargeBlocked||!canLocalRoll||isRollingD20||isRollingD6||phase==='game_over'} onClick={handleRollDice} title={rollButtonTitle}/><PixelSpriteButton sprite="end_turn" disabled={(!bothPlayersHaveRolled&&!(chargeBlocked&&canLocalRoll))||hasLocalPlayerEndedTurn||isEndingTurn||phase==='game_over'} onClick={()=>chargeBlocked?chargePlayer(isAttacker):handleEndTurn()}/><CombatSkills player={myPlayer} round={currentTurn} enabled={canUsePvpSkill(battleState,myPlayer.id)&&turnStep==='d12'&&!hasLocalPlayerEndedTurn&&phase!=='game_over'} busy={syncPendingRef.current} onCast={args=>handleCastSkill(args.slot as 1|2,false,args as {form?:number;lockSlot?:1|2})}/></div>
    {winnerId&&<div className="battle-result"><h2>{winnerId===myPlayer.id?(isEn?'VICTORY':'CHIẾN THẮNG'):(isEn?'DEFEAT':'THẤT BẠI')}</h2><button className="primary-action" onClick={returnToLobby} disabled={returningToLobby}>{isEn?'RETURN TO LOBBY':'VỀ PHÒNG'}</button>{lobbyError&&<p>{lobbyError}</p>}</div>}
  </CombatArena></div>;
}
