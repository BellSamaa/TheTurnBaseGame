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

export function rollD12(): number {
  return rollDice(12);
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
  defenderClass: ClassInfo,
  attackerState?: PlayerState,
  defenderState?: PlayerState
): {
  damage: number;
  rawDiff: number;
  isHit: boolean;
  isDodged?: boolean;
  isImmune?: boolean;
  absorbedByRock?: number;
  logTextVi: string;
  logTextEn: string;
} {
  // Check Dodge from Bow Skill 2
  if (defenderState?.dodgeNextAttack) {
    defenderState.dodgeNextAttack = false;
    return {
      damage: 0,
      rawDiff: 0,
      isHit: false,
      isDodged: true,
      logTextVi: `Né đòn thành công nhờ Lộn Nhào Né Đòn của Cung Săn!`,
      logTextEn: `Evaded the attack completely using Bow's Evasive Roll!`,
    };
  }

  // Check Immunity from Infinity Void (Vô Hạ Hạn)
  if (defenderState?.immuneDamageNext) {
    defenderState.immuneDamageNext = false;
    return {
      damage: 0,
      rawDiff: 0,
      isHit: false,
      isImmune: true,
      logTextVi: `Kích hoạt Vô Hạ Hạn! Miễn nhiễm toàn bộ sát thương đòn đánh!`,
      logTextEn: `Infinity Barrier activated! Completely immune to incoming damage!`,
    };
  }

  // Check Panic debuff (-5 attack)
  let effectiveAtk = attackerD20;
  if (attackerState?.panicAttackDebuff && (attackerState.panicTurns ?? 0) > 0) {
    effectiveAtk = Math.max(1, effectiveAtk - attackerState.panicAttackDebuff);
  }

  const rawDiff = effectiveAtk - defenderD20;

  if (rawDiff <= 0) {
    return {
      damage: 0,
      rawDiff,
      isHit: false,
      logTextVi: `Phòng thủ thành công! (Công ${effectiveAtk} ≤ Thủ ${defenderD20}) - Không nhận sát thương.`,
      logTextEn: `Defended successfully! (Atk ${effectiveAtk} ≤ Def ${defenderD20}) - 0 damage taken.`,
    };
  }

  // Hit! Apply class modifiers
  let modifiedDamage = rawDiff * attackerClass.damageModifier * defenderClass.damageReduction;

  // Bleed bonus (+5 damage from Bow Skill 1)
  if (defenderState?.isBleeding) {
    modifiedDamage += 5;
    defenderState.isBleeding = false; // consume bleed
  }

  // Flame Blade bonus (+5 damage from Dragon Dagger Skill 1 Form 2)
  if (attackerState?.flameBladeBuff) {
    modifiedDamage += 5;
    attackerState.flameBladeBuff = false;
  }

  modifiedDamage = Math.max(1, Math.round(modifiedDamage));

  // The Pet Rock Damage Absorption (Rock absorbs 5 damage)
  let absorbedByRock = 0;
  if (defenderState && (defenderState.petRockHp ?? 0) > 0) {
    absorbedByRock = Math.min(5, modifiedDamage, defenderState.petRockHp ?? 5);
    defenderState.petRockHp = Math.max(0, (defenderState.petRockHp ?? 50) - absorbedByRock);
    defenderState.petRockHits = (defenderState.petRockHits ?? 0) + 1;
    modifiedDamage = Math.max(0, modifiedDamage - absorbedByRock);
    if ((defenderState.petRockHits ?? 0) >= 5) {
      defenderState.petRockEnraged = true;
    }
  }

  let modNotes = '';
  if (attackerClass.id === 'assassin') modNotes += ' [Sát Thủ +50%]';
  if (attackerClass.id === 'juggernaut') modNotes += ' [Khổng Lồ -25%]';
  if (defenderClass.id === 'tanker') modNotes += ' [Đỡ Đòn -30%]';
  if (absorbedByRock > 0) modNotes += ` [Rock Hấp Thụ ${absorbedByRock} DMG]`;

  return {
    damage: modifiedDamage,
    rawDiff,
    isHit: true,
    absorbedByRock,
    logTextVi: `Đòn đánh trúng! (Công ${effectiveAtk} - Thủ ${defenderD20} = ${rawDiff})${modNotes} -> Gây ${modifiedDamage} sát thương!`,
    logTextEn: `Direct Hit! (Atk ${effectiveAtk} - Def ${defenderD20} = ${rawDiff})${modNotes} -> Deals ${modifiedDamage} damage!`,
  };
}

// ------------------------------------------------------------
// Execute Skill 1 (D6) based on exact user weapon specs
// ------------------------------------------------------------
export function executeSkill1D6(
  d6Roll: number,
  user: PlayerState,
  target: PlayerState
): {
  damage: number;
  heal: number;
  recoil: number;
  extraD6Roll?: boolean;
  statusEffect?: string;
  logTextVi: string;
  logTextEn: string;
} {
  const weapon = user.weapon;
  let damage = 0;
  let heal = 0;
  let recoil = 0;
  let extraD6Roll = false;
  let statusEffect = '';
  let logTextVi = '';
  let logTextEn = '';

  switch (weapon.id) {
    case 'greatsword':
      // Greatsword: gây 2 sát thương lên 1 kẻ địch
      damage = 2;
      logTextVi = `Đại Kiếm tung Nhát Chém Đơn gây 2 sát thương!`;
      logTextEn = `Greatsword unleashes Single Slash dealing 2 damage!`;
      break;

    case 'bow':
      // Bow: gây 1 sát thương, khiến đối thủ chảy máu trong 1 turn (+5 dame khi trúng đòn kế)
      damage = 1;
      target.isBleeding = true;
      statusEffect = 'bleed';
      logTextVi = `Cung Săn bắn Mũi Tên Gai gây 1 sát thương, khiến đối thủ Chảy Máu (Đòn kế tiếp trúng sẽ +5 sát thương)!`;
      logTextEn = `Bow fires Barbed Arrow dealing 1 damage & inflicts Bleed (+5 damage on next hit)!`;
      break;

    case 'staff':
      // Trượng gỗ: chưởng ra 1 quả cầu phép gây 2 sát thương lên toàn bộ
      damage = 2;
      logTextVi = `Trượng Gỗ chưởng ra Quả Cầu Phép gây 2 sát thương ma pháp!`;
      logTextEn = `Wooden Staff casts Arcane Sphere dealing 2 magic damage!`;
      break;

    case 'revolver':
      // Revolver: nạp 1 viên đạn, mỗi khi nạp 1 viên, tung D6 thêm 1 lần nữa!
      user.bullets = Math.min(6, (user.bullets ?? 6) + 1);
      extraD6Roll = true;
      logTextVi = `Súng Lục nạp thêm 1 viên đạn (${user.bullets}/6 💥) và nhận thêm 1 lần tung D6!`;
      logTextEn = `Revolver instantly reloads 1 bullet (${user.bullets}/6 💥) and grants an extra D6 roll!`;
      break;

    case 'infinity_ring':
      // Infinity Void: 3 dạng
      // ra 3: aoi - hút làm choáng 1 lượt
      // ra 4: akai - gây 10 dame
      // ra 6: vô hạ hạn - immune dame 1 lần
      if (d6Roll === 3) {
        target.isStunned = true;
        statusEffect = 'stun';
        logTextVi = `Infinity Void ra mặt 3: Thi triển Thuật Thức Thuận Chuyển [Thương - Aoi] làm choáng đối phương 1 lượt!`;
        logTextEn = `Infinity Void rolled 3: Casts Blue (Aoi) stunning opponent for 1 turn!`;
      } else if (d6Roll === 4) {
        damage = 10;
        logTextVi = `Infinity Void ra mặt 4: Thi triển Thuật Thức Phản Chuyển [Hách - Akai] bộc phá gây 10 sát thương!`;
        logTextEn = `Infinity Void rolled 4: Casts Red (Akai) dealing 10 blast damage!`;
      } else if (d6Roll === 6) {
        user.immuneDamageNext = true;
        statusEffect = 'immune';
        logTextVi = `Infinity Void ra mặt 6: Kích hoạt [Vô Hạ Hạn]! Miễn nhiễm hoàn toàn sát thương 1 lần!`;
        logTextEn = `Infinity Void rolled 6: Activated [Infinity Barrier]! Immune to damage 1 time!`;
      } else {
        logTextVi = `Infinity Void tung ra mặt ${d6Roll} (Cần mặt 3, 4 hoặc 6 để kích hoạt thuật thức).`;
        logTextEn = `Infinity Void rolled ${d6Roll} (Requires 3, 4, or 6 to cast Limitless techniques).`;
      }
      break;

    case 'dagger':
      // Dragon Dagger: 2 dạng
      // ra 1: ném dao 5 dame + lửa tick 3 lượt mỗi lượt 1 dame
      // ra 2: multi slash 5 dame + hóa lửa dagger (+5 dame lượt kế)
      if (d6Roll === 1) {
        damage = 5;
        target.burnTicks = 3;
        target.burnDmgPerTurn = 1;
        statusEffect = 'burn';
        logTextVi = `Dragon Dagger ra mặt 1: Ném dao Long Hỏa gây 5 sát thương kèm thiêu đốt 3 lượt (1 dame/lượt)!`;
        logTextEn = `Dragon Dagger rolled 1: Throws fiery dagger dealing 5 damage + Burn 3 turns (1 dmg/turn)!`;
      } else if (d6Roll === 2) {
        damage = 5;
        user.flameBladeBuff = true;
        statusEffect = 'flame_blade';
        logTextVi = `Dragon Dagger ra mặt 2: Lao đến Multi Slash gây 5 sát thương và Hóa Lửa Dagger (+5 dame đòn kế)!`;
        logTextEn = `Dragon Dagger rolled 2: Multi Slash deals 5 damage and enchants dagger (+5 damage next turn)!`;
      } else {
        logTextVi = `Dragon Dagger tung ra mặt ${d6Roll} (Cần mặt 1 hoặc 2 để kích hoạt chiêu).`;
        logTextEn = `Dragon Dagger rolled ${d6Roll} (Requires face 1 or 2 to trigger).`;
      }
      break;

    case 'chronos_watch':
      // Chronos: 3 dạng
      // ra 2: tạo điểm đánh dấu thời gian, kích hoạt lần 2 khôi phục trạng thái lúc đánh dấu
      // ra 4: tạo hiệu ứng đánh dấu người khác khiến khi đối thủ tung xúc xắc có thể bắt tung lại
      // ra 6: tạo hiệu ứng khóa cấm người chơi đó trong 1 lượt
      if (d6Roll === 2) {
        if (user.timeAnchorHp == null) {
          user.timeAnchorHp = user.hp;
          logTextVi = `Chronos ra mặt 2: Tạo điểm đánh dấu thời gian tại mốc ${user.hp} HP! Kích hoạt lần 2 sẽ khôi phục!`;
          logTextEn = `Chronos rolled 2: Bookmarked Time Anchor at ${user.hp} HP! Second trigger will rewind HP!`;
        } else {
          heal = Math.max(0, user.timeAnchorHp - user.hp);
          const saved = user.timeAnchorHp;
          user.hp = saved;
          user.timeAnchorHp = null;
          logTextVi = `Chronos ra mặt 2: Đảo ngược dòng thời gian về mốc đánh dấu! Khôi phục lại ${saved} HP!`;
          logTextEn = `Chronos rolled 2: Rewound time to bookmarked state! Restored HP to ${saved}!`;
        }
      } else if (d6Roll === 4) {
        target.fateSealActive = true;
        statusEffect = 'fate_seal';
        logTextVi = `Chronos ra mặt 4: Đánh dấu Phong Ấn Vận Mệnh lên đối thủ (Bắt đối thủ tung lại xúc xắc)!`;
        logTextEn = `Chronos rolled 4: Placed Fate Seal on opponent (Forces opponent to reroll dice)!`;
      } else if (d6Roll === 6) {
        target.timeLockActive = true;
        statusEffect = 'time_lock';
        logTextVi = `Chronos ra mặt 6: Khóa Thời Gian! Cấm đối thủ hành động trong 1 lượt!`;
        logTextEn = `Chronos rolled 6: Time Lock activated! Opponent is frozen and cannot act for 1 turn!`;
      } else {
        logTextVi = `Chronos tung ra mặt ${d6Roll} (Cần mặt 2, 4 hoặc 6 để thao túng thời không).`;
        logTextEn = `Chronos rolled ${d6Roll} (Requires 2, 4, or 6 to manipulate timeline).`;
      }
      break;

    case 'fire_headband':
      // Leaf headband: phóng ngọn lửa đen từ mắt gây 5 sát thương cháy trong 3 lượt, chảy máu mắt -3 máu người dùng
      damage = 5;
      recoil = 3;
      user.hp = Math.max(1, user.hp - recoil);
      target.burnTicks = 3;
      target.burnDmgPerTurn = 5;
      statusEffect = 'amaterasu';
      logTextVi = `Băng Đô Lá phóng ngọn lửa đen Amaterasu gây 5 sát thương thiêu đốt x 3 lượt! Hắc hỏa khiến mắt chảy máu (-3 HP)!`;
      logTextEn = `Leaf Headband unleashes Amaterasu dealing 5 burn damage for 3 turns! Eye strain costs 3 HP!`;
      break;

    case 'spirit_stone':
      // The pet rock: triệu hồi rock (50 máu) chặn 5 sát thương cho chủ nhân, dùng D6 gây sát thương
      user.petRockHp = 50;
      user.petRockHits = 0;
      damage = d6Roll;
      logTextVi = `Triệu hồi Bạn Đá Cưng Rock (50 Máu, đỡ 5 sát thương mỗi đòn) và húc đối thủ gây ${damage} sát thương!`;
      logTextEn = `Summoned Pet Rock (50 HP, absorbs 5 dmg/hit) and retaliates for ${damage} damage!`;
      break;

    default:
      damage = 2;
      logTextVi = `${weapon.nameVi} kích hoạt chiêu D6 gây ${damage} sát thương!`;
      logTextEn = `${weapon.name} executes D6 skill dealing ${damage} damage!`;
  }

  return {
    damage,
    heal,
    recoil,
    extraD6Roll,
    statusEffect,
    logTextVi,
    logTextEn,
  };
}

// ------------------------------------------------------------
// Execute Skill 2 (D12) based on exact user weapon specs
// ------------------------------------------------------------
export function executeSkill2D12(
  d12Roll: number,
  user: PlayerState,
  target: PlayerState,
  isAttacker: boolean
): {
  damage: number;
  heal: number;
  burstTriggered?: boolean;
  logTextVi: string;
  logTextEn: string;
} {
  const weapon = user.weapon;
  let damage = 0;
  let heal = 0;
  let burstTriggered = false;
  let logTextVi = '';
  let logTextEn = '';

  switch (weapon.id) {
    case 'greatsword':
      // Greatsword: gây 5 sát thương lên tất cả kẻ địch
      damage = 5;
      burstTriggered = true;
      logTextVi = `Đại Kiếm tung Trảm Quét Toàn Kẻ Địch gây 5 sát thương dữ dội!`;
      logTextEn = `Greatsword executes Whirlwind Cleave dealing 5 damage to all foes!`;
      break;

    case 'bow':
      // Bow: (dùng ở lượt thủ) né Công kích kế tiếp
      user.dodgeNextAttack = true;
      burstTriggered = true;
      logTextVi = `Cung Thủ Lộn Nhào Né Đòn! Sẵn sàng né hoàn toàn đòn công kích kế tiếp!`;
      logTextEn = `Bow Archer rolls into evasive stance! Dodges next incoming attack completely!`;
      break;

    case 'staff':
      // Trượng gỗ: (dùng ở lượt thủ) né Kĩ năng kế tiếp
      user.dodgeNextSkill = true;
      burstTriggered = true;
      logTextVi = `Trượng Gỗ dựng Khiên Phép Hóa Giải! Miễn nhiễm và né hoàn toàn Kĩ Năng kế tiếp!`;
      logTextEn = `Wooden Staff invokes Spell Ward! Dodges next incoming skill completely!`;
      break;

    case 'revolver':
      // Revolver: Bắn ra 1 viên đạn xuyên qua phòng thủ nhưng có thể né, sát thương bằng số D20
      // Consume 1 bullet if available
      if ((user.bullets ?? 6) > 0) {
        user.bullets = (user.bullets ?? 6) - 1;
      }
      damage = rollD20();
      burstTriggered = true;
      logTextVi = `Súng Lục bắn Đạn Bạc Xuyên Phòng Thủ gây ${damage} sát thương chuẩn (Bằng số D20)! Còn ${user.bullets ?? 0}/6 viên đạn.`;
      logTextEn = `Revolver fires Armor-Piercing Bullet dealing ${damage} damage (equal to D20 roll)! Ammo: ${user.bullets ?? 0}/6.`;
      break;

    case 'infinity_ring':
      // Infinity Void: hollow purple ra tổng điểm 30 bắn hollow purple gây 50 dame
      user.d12Charge = (user.d12Charge ?? 0) + d12Roll;
      if (user.d12Charge >= 30) {
        damage = 50;
        burstTriggered = true;
        user.d12Charge = 0; // reset
        logTextVi = `💥 BÁT TỬ SẮC [HOLLOW PURPLE]! Tích đủ 30 điểm D12, dung hợp Lam và Đỏ hủy diệt gây 50 siêu sát thương!`;
        logTextEn = `💥 HOLLOW PURPLE UNLEASHED! Reached 30 D12 points, colliding Blue and Red for 50 apocalyptic damage!`;
      } else {
        logTextVi = `Tung D12 nhận +${d12Roll} điểm năng lượng Tử Sắc (${user.d12Charge}/30 điểm).`;
        logTextEn = `Rolled D12 for +${d12Roll} Purple Energy (${user.d12Charge}/30 points).`;
      }
      break;

    case 'dagger':
      // Dragon Dagger: ra đủ 30 điểm hóa lửa xanh cho dagger sau đó chém đòn liên tục 20 dame kèm tick 2 dame trong 5 lượt
      user.d12Charge = (user.d12Charge ?? 0) + d12Roll;
      if (user.d12Charge >= 30) {
        damage = 20;
        target.burnTicks = 5;
        target.burnDmgPerTurn = 2;
        burstTriggered = true;
        user.d12Charge = 0;
        logTextVi = `🔥 BÃO LỬA LAM ĐỒ SÁT! Tích đủ 30 điểm D12, Hóa Lửa Xanh chém liên hoàn 20 dame + thiêu đốt 2 dame/lượt trong 5 lượt!`;
        logTextEn = `🔥 AZURE HELLFIRE STORM! Reached 30 D12 points, blue flame unleashed for 20 damage + 2 burn/turn for 5 turns!`;
      } else {
        logTextVi = `Tung D12 tích lũy +${d12Roll} điểm Lửa Lam (${user.d12Charge}/30 điểm).`;
        logTextEn = `Rolled D12 accumulating +${d12Roll} Blue Flame (${user.d12Charge}/30 points).`;
      }
      break;

    case 'chronos_watch':
      // Chronos: Eraser Time: xóa 1 turn đã được lưu / tua ngược thời gian
      burstTriggered = true;
      logTextVi = `⏳ ERASER TIME: Xóa bỏ dòng thời gian! Dừng lượt và tái thiết lại vận mệnh!`;
      logTextEn = `⏳ ERASER TIME: Erased timeline branch! Time distorted to summoner's favor!`;
      break;

    case 'fire_headband':
      // Leaf headband: tích đủ 20 điểm triệu hồi 1 thiên thạch 10 dame; tích đủ 30 điểm triệu hồi 2 thiên thạch 30 dame + hoảng loạn giảm 5 công trong 2 lượt
      user.d12Charge = (user.d12Charge ?? 0) + d12Roll;
      if (user.d12Charge >= 30) {
        damage = 30;
        target.panicAttackDebuff = 5;
        target.panicTurns = 2;
        burstTriggered = true;
        user.d12Charge = 0;
        logTextVi = `☄️☄️ SONG THIÊN THẠCH TENGAI SHINSEI! Tích đủ 30 điểm D12 triệu hồi 2 thiên thạch giáng xuống gây 30 sát thương kèm Hoảng Loạn (-5 Công trong 2 lượt)!`;
        logTextEn = `☄️☄️ DUAL METEORS (TENGAI SHINSEI)! Reached 30 D12 points, 2 meteors obliterate foe for 30 damage & inflict Panic (-5 attack for 2 turns)!`;
      } else if (user.d12Charge >= 20) {
        damage = 10;
        burstTriggered = true;
        logTextVi = `☄️ THIÊN THẠCH RƠI! Tích đủ 20 điểm D12 triệu hồi 1 thiên thạch giáng xuống gây 10 sát thương! (Tích tiếp đến 30 điểm để triệu hồi 2 thiên thạch!)`;
        logTextEn = `☄️ METEOR STRIKE! Reached 20 D12 points summoning a meteor for 10 damage! (Reach 30 for Dual Meteors!)`;
      } else {
        logTextVi = `Tung D12 tích lũy +${d12Roll} điểm Thiên Thạch (${user.d12Charge}/30 điểm).`;
        logTextEn = `Rolled D12 accumulating +${d12Roll} Meteor Energy (${user.d12Charge}/30 points).`;
      }
      break;

    case 'spirit_stone':
      // The pet rock: sau khi bị tấn công 5 lần, Rock tiến vào cuồng bạo phình to x2 lăn đến kẻ địch gây sát thương bằng D20 (có khả năng lăn ngược)
      if (user.petRockEnraged || (user.petRockHits ?? 0) >= 5) {
        const roll = rollD20();
        const rollBack = Math.random() < 0.2; // 20% chance to roll back to summoner
        burstTriggered = true;
        if (rollBack) {
          damage = Math.round(roll / 2);
          user.hp = Math.max(1, user.hp - damage);
          logTextVi = `🪨 HÒN ĐÁ CUỒNG BẠO LĂN NGƯỢC! Mất đà lăn va vào chủ nhân gây ${damage} sát thương!`;
          logTextEn = `🪨 ENRAGED ROCK ROLLED BACK! Lost momentum and rolled into summoner for ${damage} damage!`;
        } else {
          damage = roll;
          logTextVi = `🪨 HÒN ĐÁ CUỒNG BẠO PHÌNH TO GẤP ĐÔI! Nghiền nát kẻ địch gây ${damage} sát thương (Bằng số D20)!`;
          logTextEn = `🪨 ENRAGED GIANT BOULDER CRUSH! Enlarged 2x and crushed foe for ${damage} damage (equal to D20 roll)!`;
        }
        user.petRockEnraged = false;
        user.petRockHits = 0;
      } else {
        logTextVi = `Bạn Đá Cưng Rock đang tích lũy nộ (${user.petRockHits ?? 0}/5 lần bị đánh để Cuồng Bạo). Tung D12 nhận +${d12Roll} phòng ngự!`;
        logTextEn = `Pet Rock building rage (${user.petRockHits ?? 0}/5 hits taken to Enrage). Rolled D12 for +${d12Roll} stone resilience!`;
      }
      break;

    default:
      damage = 5;
      logTextVi = `${weapon.nameVi} kích hoạt chiêu D12 gây ${damage} sát thương!`;
      logTextEn = `${weapon.name} executes D12 skill dealing ${damage} damage!`;
  }

  return {
    damage,
    heal,
    burstTriggered,
    logTextVi,
    logTextEn,
  };
}

// AI Turn Logic for PvE mode
export function executeAiDecisions(
  battle: BattleState
): {
  wantsToUseD6: boolean;
  wantsToUseD12: boolean;
} {
  return {
    wantsToUseD6: Math.random() > 0.2,
    wantsToUseD12: Math.random() > 0.3,
  };
}
