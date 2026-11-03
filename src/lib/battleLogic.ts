import { reflectedDamage, absorbWithRock } from './combatDamage';
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
  if (attackerState?.isStunned || attackerState?.timeLockActive) {
    attackerState.isStunned = false;
    attackerState.timeLockActive = false;
    return { damage: 0, rawDiff: 0, isHit: false,
      logTextEn: 'Stunned: the next attack is cancelled.', logTextVi: 'Bị choáng: mất đòn tấn công này.' };
  }
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

  // Check Panic debuff (-5 attack)
  let effectiveAtk = attackerD20;
  if (attackerState?.fateSealActive) {
    effectiveAtk = Math.min(effectiveAtk, rollD20());
    attackerState.fateSealActive = false;
  }
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

  const absorbedByRock = defenderState ? absorbWithRock(defenderState, modifiedDamage) : 0;
  modifiedDamage -= absorbedByRock;

  let modNotes = '';
  if (attackerClass.id === 'assassin') modNotes += ' [Sát Thủ +50%]';
  if (attackerClass.id === 'juggernaut') modNotes += ' [Khổng Lồ -25%]';
  if (defenderClass.id === 'tanker') modNotes += ' [Đỡ Đòn -30%]';
  if (absorbedByRock > 0 && defenderState) {
    modNotes += ` [🪨 Rock Đỡ ${absorbedByRock} DMG (Còn ${defenderState.petRockHp}/50 HP)]`;
  }

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
  target: PlayerState,
  turn = 1
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
      // Aoi reflects actual opponent damage from the latest round.
      // Akai deals 12 damage.
      // ra 6: vô hạ hạn - immune dame 1 lần
      if (d6Roll === 3) {
        damage = reflectedDamage(user, turn);
        statusEffect = 'reflection';
        logTextVi = `Aoi phản lại ${damage} sát thương đã nhận từ đối thủ trong lượt gần nhất!`;
        logTextEn = `Aoi reflects ${damage} damage received from the opponent in the latest turn!`;
      } else if (d6Roll === 4) {
        damage = 12;
        logTextVi = `Infinity Void ra mặt 4: Thi triển Thuật Thức Phản Chuyển [Hách - Akai] bộc phá gây 12 sát thương!`;
        logTextEn = `Infinity Void rolled 4: Casts Red (Akai) dealing 12 blast damage!`;
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
      damage = 0;
      recoil = 5;
      user.hp = Math.max(1, user.hp - recoil);
      target.burnTicks = 3;
      target.burnDmgPerTurn = 5;
      statusEffect = 'amaterasu';
      logTextVi = `Băng Đô Lá phóng ngọn lửa đen Amaterasu gây 5 sát thương thiêu đốt x 3 lượt! Hắc hỏa khiến mắt chảy máu (-5 HP)!`;
      logTextEn = `Leaf Headband unleashes Amaterasu dealing 5 burn damage for 3 turns! Eye strain costs 5 HP!`;
      break;

    case 'spirit_stone':
      // The pet rock: triệu hồi rock (50 máu) chặn 5 sát thương cho chủ nhân, dùng D6 gây sát thương
      if ((user.petRockHp ?? 0) <= 0) { user.petRockHp = 50; user.petRockHits = 0; }
      damage = 0;
      logTextVi = `Bạn Đá Cưng Rock (${user.petRockHp}/50 Máu, đỡ tối đa 5 sát thương mỗi đòn) và sẽ tấn công riêng 2 sát thương sau mỗi đòn của chủ nhân!`;
      logTextEn = `Pet Rock (${user.petRockHp}/50 HP, absorbs up to 5 dmg/hit) and follows each owner attack with a separate 2 damage hit!`;
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

  const pts = user.d12Charge ?? 0;
  const cost = weapon.id === "fire_headband" ? (d12Roll === 30 ? 30 : 20) : weapon.skill2.chargeRequired || 20;

  switch (weapon.id) {
    case 'greatsword':
      // Greatsword: Tích đủ 20 PTS D6 gây 5 sát thương lên tất cả kẻ địch
      if (pts >= cost) {
        user.d12Charge = Math.max(0, pts - cost);
        damage = 5;
        burstTriggered = true;
        logTextVi = `💥 ĐẠI KIẾM TRẢM QUÉT TOÀN BỘ KẺ ĐỊCH! Tiêu hao ${cost} PTS D6 gây 5 sát thương càn quét!`;
        logTextEn = `💥 WHIRLWIND CLEAVE! Consumed ${cost} D6 PTS dealing 5 sweeping damage to all foes!`;
      } else {
        logTextVi = `Đại Kiếm cần tích đủ ${cost} PTS D6 để Trảm Quét (Hiện có: ${pts}/${cost} PTS).`;
        logTextEn = `Greatsword requires ${cost} D6 PTS to Cleave (Current: ${pts}/${cost} PTS).`;
      }
      break;

    case 'bow':
      // Bow: Tích đủ 22 PTS D6 (dùng ở lượt thủ) né Công kích kế tiếp
      if (pts >= cost) {
        user.d12Charge = Math.max(0, pts - cost);
        user.dodgeNextAttack = true;
        burstTriggered = true;
        logTextVi = `🏹 CUNG THỦ LỘN NHÀO NÉ ĐÒN! Tiêu hao ${cost} PTS D6: Né hoàn toàn đòn công kích kế tiếp!`;
        logTextEn = `🏹 EVASIVE ROLL! Consumed ${cost} D6 PTS: Dodges next incoming attack completely!`;
      } else {
        logTextVi = `Cung Săn cần tích đủ ${cost} PTS D6 để Lộn Nhào Né Đòn (Hiện có: ${pts}/${cost} PTS).`;
        logTextEn = `Bow requires ${cost} D6 PTS to Evasive Roll (Current: ${pts}/${cost} PTS).`;
      }
      break;

    case 'staff':
      // Trượng gỗ: Tích đủ 22 PTS D6 (dùng ở lượt thủ) né Kĩ năng kế tiếp
      if (pts >= cost) {
        user.d12Charge = Math.max(0, pts - cost);
        user.dodgeNextSkill = true;
        burstTriggered = true;
        logTextVi = `✨ TRƯỢNG GỖ DỰNG KHIÊN PHÉP! Tiêu hao ${cost} PTS D6: Né và hóa giải Kĩ Năng kế tiếp!`;
        logTextEn = `✨ SPELL WARD! Consumed ${cost} D6 PTS: Dodges and dispels next incoming skill!`;
      } else {
        logTextVi = `Trượng Gỗ cần tích đủ ${cost} PTS D6 để Dựng Khiên Phép (Hiện có: ${pts}/${cost} PTS).`;
        logTextEn = `Staff requires ${cost} D6 PTS for Spell Ward (Current: ${pts}/${cost} PTS).`;
      }
      break;

    case 'revolver':
      // Revolver: Tích đủ 28 PTS D6 Bắn ra 1 viên đạn xuyên qua phòng thủ sát thương bằng D20
      if (pts >= cost) {
        user.d12Charge = Math.max(0, pts - cost);
        if ((user.bullets ?? 6) > 0) {
          user.bullets = (user.bullets ?? 6) - 1;
        }
        damage = rollD20();
        burstTriggered = true;
        logTextVi = `🔫 SÚNG LỤC BẮN ĐẠN XUYÊN GIÁP! Tiêu hao ${cost} PTS D6 gây ${damage} sát thương chuẩn (Bằng số D20)! Đạn: ${user.bullets ?? 0}/6.`;
        logTextEn = `🔫 ARMOR-PIERCING BULLET! Consumed ${cost} D6 PTS dealing ${damage} true damage (equal to D20 roll)! Ammo: ${user.bullets ?? 0}/6.`;
      } else {
        logTextVi = `Súng Lục cần tích đủ ${cost} PTS D6 để Bắn Xuyên Giáp (Hiện có: ${pts}/${cost} PTS).`;
        logTextEn = `Revolver requires ${cost} D6 PTS for Armor-Piercing Shot (Current: ${pts}/${cost} PTS).`;
      }
      break;

    case 'infinity_ring':
      // Infinity Void: hollow purple tích đủ 40 PTS bắn hollow purple gây 50 dame
      if (pts >= cost) {
        user.d12Charge = Math.max(0, pts - cost);
        damage = 50;
        burstTriggered = true;
        logTextVi = `💥💥 BÁT TỬ SẮC [HOLLOW PURPLE]! Tích đủ ${cost} PTS D6, hợp nhất Vô Hạ Hạn hủy diệt gây 50 siêu sát thương cực hạn!`;
        logTextEn = `💥💥 HOLLOW PURPLE UNLEASHED! Reached ${cost} D6 PTS, limitless collision obliterates for 50 apocalyptic damage!`;
      } else {
        logTextVi = `Infinity Void cần tích đủ ${cost} PTS D6 để bắn Tử Sắc (Hiện có: ${pts}/${cost} PTS).`;
        logTextEn = `Infinity Void requires ${cost} D6 PTS to fire Hollow Purple (Current: ${pts}/${cost} PTS).`;
      }
      break;

    case 'dagger':
      // Dragon Dagger: ra đủ 35 PTS hóa lửa xanh cho dagger sau đó chém liên tục 20 dame kèm tick 2 dame trong 5 lượt
      if (pts >= cost) {
        user.d12Charge = Math.max(0, pts - cost);
        damage = 20;
        target.burnTicks = 5;
        target.burnDmgPerTurn = 2;
        burstTriggered = true;
        logTextVi = `🔥 BÃO LỬA LAM ĐỒ SÁT! Tích đủ ${cost} PTS D6, Hóa Lửa Xanh chém liên hoàn 20 dame + thiêu đốt 2 dame/lượt trong 5 lượt!`;
        logTextEn = `🔥 AZURE HELLFIRE STORM! Reached ${cost} D6 PTS, blue flame strikes for 20 damage + 2 burn/turn for 5 turns!`;
      } else {
        logTextVi = `Dragon Dagger cần tích đủ ${cost} PTS D6 để Hóa Lửa Lam (Hiện có: ${pts}/${cost} PTS).`;
        logTextEn = `Dragon Dagger requires ${cost} D6 PTS to unleash Azure Flame (Current: ${pts}/${cost} PTS).`;
      }
      break;

    case 'chronos_watch':
      // Chronos: Eraser Time: tích đủ 38 PTS xóa 1 turn đã được lưu / tua ngược thời gian
      if (pts >= cost) {
        user.d12Charge = Math.max(0, pts - cost);
        burstTriggered = true;
        user.hp = Math.min(user.maxHp, user.timeAnchorHp ?? user.maxHp);
        user.timeAnchorHp = null;
        logTextVi = `⏳ ERASER TIME: Tích đủ ${cost} PTS D6! Xóa bỏ 1 turn đã lưu và đảo ngược dòng thời gian!`;
        logTextEn = `⏳ ERASER TIME: Reached ${cost} D6 PTS! Erased 1 recorded turn and rewinded fate!`;
      } else {
        logTextVi = `Chronos cần tích đủ ${cost} PTS D6 để dùng Eraser Time (Hiện có: ${pts}/${cost} PTS).`;
        logTextEn = `Chronos requires ${cost} D6 PTS for Eraser Time (Current: ${pts}/${cost} PTS).`;
      }
      break;

    case 'fire_headband':
      // Leaf headband: tích đủ 32 PTS triệu hồi thiên thạch giáng thế 30 dame + hoảng loạn
      if (pts >= cost) {
        user.d12Charge = Math.max(0, pts - cost);
        damage = cost === 30 ? 30 : 10;
        if (cost === 30) { target.panicAttackDebuff = 5; target.panicTurns = 2; }
        burstTriggered = true;
        logTextVi = cost === 20 ? `☄️ Một thiên thạch: 10 sát thương, 20 PTS.` : `☄️☄️ THIÊN THẠCH GIÁNG THẾ (TENGAI SHINSEI)! Tích đủ ${cost} PTS D6 triệu hồi thiên thạch gây 30 sát thương kèm Hoảng Loạn (-5 Công trong 2 lượt)!`;
        logTextEn = cost === 20 ? `☄️ One meteor: 10 damage, 20 PTS.` : `☄️☄️ TENGAI SHINSEI METEOR STORM! Reached ${cost} D6 PTS summoning meteors for 30 damage & inflicts Panic (-5 attack for 2 turns)!`;
      } else {
        logTextVi = `Leaf Headband cần tích đủ ${cost} PTS D6 để giáng Thiên Thạch (Hiện có: ${pts}/${cost} PTS).`;
        logTextEn = `Leaf Headband requires ${cost} D6 PTS to summon Meteors (Current: ${pts}/${cost} PTS).`;
      }
      break;

    case 'spirit_stone':
      // The pet rock: tích đủ 25 PTS D6 (hoặc sau 5 lần bị đánh): Rock phình to x2 lăn đến kẻ địch gây sát thương bằng D20
      if (pts >= cost) {
        user.d12Charge = Math.max(0, pts - cost);
        const roll = rollD20();
        const rollBack = Math.random() < 0.15; // 15% chance to roll back to summoner
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
        logTextVi = `Bạn Đá Cưng Rock cần tích đủ ${cost} PTS D6 (hoặc bị đánh 5 lần để Cuồng Bạo). Hiện có: ${pts}/${cost} PTS.`;
        logTextEn = `Pet Rock requires ${cost} D6 PTS (or 5 hits taken). Current: ${pts}/${cost} PTS.`;
      }
      break;

    default:
      if (pts >= cost) {
        user.d12Charge = Math.max(0, pts - cost);
        damage = 5;
        burstTriggered = true;
        logTextVi = `${weapon.nameVi} giải phóng kĩ năng tối thượng gây ${damage} sát thương!`;
        logTextEn = `${weapon.name} unleashes ultimate skill dealing ${damage} damage!`;
      } else {
        logTextVi = `${weapon.nameVi} cần tích đủ ${cost} PTS D6 (Hiện có: ${pts}/${cost} PTS).`;
        logTextEn = `${weapon.name} requires ${cost} D6 PTS (Current: ${pts}/${cost} PTS).`;
      }
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
