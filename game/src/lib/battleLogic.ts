import type {
  BattleState,
  PlayerState,
  BattleLogEntry,
  ClassInfo,
  WeaponInfo,
} from '@/types/game';
import { CLASS_DEFINITIONS } from './constants';

// Roll standard dice (1 to sides)
export function rollDice(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollD20(): number {
  return rollDice(20);
}

export function rollD6(): number {
  return rollDice(6);
}

// Calculate D20 combat result according to the exact rules:
// If Attack <= Defense: Missed / Successfully defended -> 0 damage.
// If Attack > Defense: Base Damage = Attack - Defense.
// Modifiers applied:
// Attacker's damageModifier (e.g. Assassin 1.5x, Juggernaut 0.75x)
// Defender's damageReduction (e.g. Tanker 0.7x)
export function calculateD20Combat(
  attackerD20: number,
  defenderD20: number,
  attackerClass: ClassInfo,
  defenderClass: ClassInfo
): {
  damage: number;
  rawDiff: number;
  isHit: boolean;
  logTextVi: string;
  logTextEn: string;
} {
  const rawDiff = attackerD20 - defenderD20;

  if (rawDiff <= 0) {
    return {
      damage: 0,
      rawDiff,
      isHit: false,
      logTextVi: `Phòng thủ thành công! (Công ${attackerD20} ≤ Thủ ${defenderD20}) - Không nhận sát thương.`,
      logTextEn: `Defended successfully! (Atk ${attackerD20} ≤ Def ${defenderD20}) - 0 damage taken.`,
    };
  }

  // Hit! Apply class modifiers
  let modifiedDamage = rawDiff * attackerClass.damageModifier * defenderClass.damageReduction;
  modifiedDamage = Math.max(1, Math.round(modifiedDamage));

  let modNotes = '';
  if (attackerClass.id === 'assassin') modNotes += ' [Sát Thủ +50% Công]';
  if (attackerClass.id === 'juggernaut') modNotes += ' [Khổng Lồ -25% Công]';
  if (defenderClass.id === 'tanker') modNotes += ' [Đỡ Đòn -30% Hấp Thụ]';

  return {
    damage: modifiedDamage,
    rawDiff,
    isHit: true,
    logTextVi: `Đòn đánh trúng! (Công ${attackerD20} - Thủ ${defenderD20} = ${rawDiff})${modNotes} -> Gây ${modifiedDamage} sát thương!`,
    logTextEn: `Direct Hit! (Atk ${attackerD20} - Def ${defenderD20} = ${rawDiff}) -> Deals ${modifiedDamage} damage!`,
  };
}

// Apply Weapon Skill 1 (Point threshold activation)
export function activateSkill1(
  user: PlayerState,
  target: PlayerState
): {
  damage: number;
  heal: number;
  cost: number;
  success: boolean;
  logTextVi: string;
  logTextEn: string;
} {
  const weapon = user.weapon;
  const cost = weapon.skill1.chargeRequired;

  if (user.skillCharge < cost) {
    return {
      damage: 0,
      heal: 0,
      cost: 0,
      success: false,
      logTextVi: `Chưa đủ điểm sạc (${user.skillCharge}/${cost}) để kích hoạt ${weapon.skill1.nameVi}!`,
      logTextEn: `Not enough charge (${user.skillCharge}/${cost}) for ${weapon.skill1.name}!`,
    };
  }

  let damage = 0;
  let heal = 0;

  // Effects parsing based on weapon effect key
  switch (weapon.skill1.effect) {
    case 'cleave_18':
      damage = 18;
      break;
    case 'arrow_rain_15':
      damage = 15;
      break;
    case 'dragon_rush_20':
      damage = 20;
      break;
    case 'fan_hammer_26':
      damage = 26;
      break;
    case 'arcane_nova_22':
      damage = 22;
      heal = 8;
      break;
    case 'void_surge_24':
      damage = 24;
      target.skillCharge = Math.max(0, target.skillCharge - 5);
      break;
    case 'beast_21':
      damage = 21;
      break;
    case 'time_stop_20':
      damage = 20;
      heal = 20;
      break;
    case 'hellfire_21':
      damage = 21;
      break;
    default:
      damage = 15;
  }

  return {
    damage,
    heal,
    cost,
    success: true,
    logTextVi: `🔥 KÍCH HOẠT TUYỆT KỸ: ${weapon.skill1.nameVi}! Gây ${damage} sát thương${
      heal > 0 ? ` và hồi ${heal} HP` : ''
    }!`,
    logTextEn: `🔥 CAST ULTIMATE: ${weapon.skill1.name}! Dealt ${damage} damage${
      heal > 0 ? ` and restored ${heal} HP` : ''
    }!`,
  };
}

// Check Weapon Skill 2 (Special trigger on D6 roll matching required face)
export function checkSkill2Trigger(
  d6Value: number,
  user: PlayerState,
  target: PlayerState
): {
  triggered: boolean;
  damage: number;
  heal: number;
  logTextVi: string;
  logTextEn: string;
} {
  const weapon = user.weapon;
  if (d6Value !== weapon.skill2.triggerNumber) {
    return {
      triggered: false,
      damage: 0,
      heal: 0,
      logTextVi: '',
      logTextEn: '',
    };
  }

  let damage = 0;
  let heal = 0;

  switch (weapon.skill2.effect) {
    case 'strike_12':
      damage = 12;
      break;
    case 'piercing_10':
      damage = 10;
      break;
    case 'burn_11':
      damage = 11;
      break;
    case 'roulette_16':
      damage = 16;
      break;
    case 'heal_12':
      heal = 12;
      break;
    case 'warp_13':
      damage = 13;
      break;
    case 'roar_9':
      damage = 9;
      user.skillCharge += 5;
      break;
    case 'rewind_15':
      heal = 15;
      break;
    case 'blaze_14':
      damage = 14;
      break;
    default:
      damage = 10;
  }

  return {
    triggered: true,
    damage,
    heal,
    logTextVi: `⚡ MAY MẮN! Tung trúng mặt ${d6Value}: Kích hoạt ${weapon.skill2.nameVi}! ${
      damage > 0 ? `Gây ${damage} sát thương!` : ''
    }${heal > 0 ? `Hồi ${heal} HP!` : ''}`,
    logTextEn: `⚡ LUCKY TRIGGER! Rolled face ${d6Value}: Activated ${weapon.skill2.name}! ${
      damage > 0 ? `Dealt ${damage} damage!` : ''
    }${heal > 0 ? `Restored ${heal} HP!` : ''}`,
  };
}

// AI Turn Logic for PvE mode
export function executeAiDecisions(
  battle: BattleState
): {
  wantsToUseSkill1: boolean;
} {
  const ai = battle.player2;
  const cost = ai.weapon.skill1.chargeRequired;
  // If AI has enough charge and enemy HP is relevant, AI uses skill 1
  const wantsToUseSkill1 = ai.skillCharge >= cost && Math.random() > 0.3;
  return { wantsToUseSkill1 };
}
