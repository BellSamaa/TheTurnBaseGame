import type {CombatHit} from '@/lib/combatHits';
import type {WeaponUpdateState} from '@/lib/weaponUpdateState';
import type {DiceTimingState} from '@/lib/diceTiming';
// ============================================================
// Game types for Dice Maniac RPG Turn-Base Game
// ============================================================

export type ClassType = 'assassin' | 'tanker' | 'juggernaut' | 'mage' | 'boxer' | 'warrior';

export interface ClassInfo {
  id: ClassType;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  image: string; // Sliced class banner
  hpModifier: number;
  damageModifier: number;
  damageReduction: number;
  extraD6Rolls: number;
  extraD20Rolls: number;
  baseHp: number;
}

export type WeaponTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'secret';

export interface WeaponSkill {
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  diceType: 'd6' | 'd12';
  chargeRequired?: number;
  triggerNumber?: number | number[];
  effect: string;
}

export interface WeaponInfo {
  family?:'blade';
  id: string;
  name: string;
  nameVi: string;
  tier: WeaponTier;
  image: string; // Sliced weapon sprite
  description: string;
  descriptionVi: string;
  passiveDesc?: string;
  passiveDescVi?: string;
  skill1: WeaponSkill & { chargeRequired?: number };
  skill2: WeaponSkill & { triggerNumber?: number | number[]; chargeRequired?: number };
}

export interface CharacterCustomization {
  baseIndex: number; // 0-7: body_01.png to body_08.png
  hairIndex: number; // 0-19: hair_01.png to hair_20.png
  hairColor: string;
  skinColor: string;
  shirtIndex: number; // 0-19: shirt_01.png to shirt_20.png
  shirtColor: string;
  pantsIndex: number; // 0-19: pants_01.png to pants_20.png
  pantsColor: string;
  accessoryIndex: number; // 0-19: acc_01.png to acc_20.png
  faceIndex: number; // 0-9: face_01.png to face_10.png
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  bio?: string;
  createdAt: string;
  avatarConfig: CharacterCustomization;
  tier?: number;
  rankPoints?: number;
  selectedClass?: ClassType;
  selectedWeapon?: string;
}

export interface PlayerState {
  /** Battle-scoped healing modifier; Dungeon Helena supplies 1.2. */
  healingMultiplier?:number;
  summonDamageBonus?:number;
  diceTiming?: DiceTimingState;
  duelLuck?: { hits: number; misses: number; mode?: "lucky" | "unlucky" };
  weaponUpdate?:WeaponUpdateState;
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  classType: ClassType;
  weapon: WeaponInfo;
  skillCharge: number;
  skill1UsedTurn?: number;
  opponentDamageTurn?: number;
  opponentDamageAmount?: number;
  lockedSkill?: 1 | 2;
  skillLockTurn?: number;
  leafSkillReadyTurn?: number;
  skill2UsedTurn?: number;
  d12Charge?: number;
  isAttacker: boolean;
  character: CharacterCustomization;
  // Weapon dynamic state mechanics
  bullets?: number; // Revolver cylinder (0-6)
  boxerAttackRound?: number;
  boxerAttackRolls?: number[];
  daggerBurnHits?: number;
  petRockEnrageUntilRound?: number;
  mageBonusRound?: number;
  mageBonusD6?: boolean;
  petRockHp?: number; // The Pet Rock HP (0-50)
  petRockHits?: number; // The Pet Rock hits received (0-5)
  petRockEnraged?: boolean;
  isBleeding?: boolean; // Bow bleed debuff
  dodgeNextAttack?: boolean; // Bow skill 2
  dodgeNextSkill?: boolean; // Wooden Staff skill 2
  immuneDamageNext?: boolean; // Infinity Void face 6
  isStunned?: boolean; // Stunned from Aoi / Time Lock
  flameBladeBuff?: boolean; // Dragon dagger +5 damage
  burnTicks?: number; // Fire tick duration
  burnDmgPerTurn?: number;
  timeAnchorHp?: number | null; // Chronos bookmarked HP
  fateSealActive?: boolean; // Chronos reroll mark
  timeLockActive?: boolean; // Chronos turn lock
  panicAttackDebuff?: number; // Leaf headband -5 attack
  panicTurns?: number;
  statusEffects?: {
    poisonTurns?: number;
    poisonDmg?: number;
    shieldActive?: boolean;
    buffAttack?: number;
    buffTurns?: number;
  };
}

export interface BattleLogEntry {
  turn: number;
  message: string;
  messageVi?: string;
  type: 'attack' | 'defend' | 'skill' | 'damage' | 'system' | 'heal';
  timestamp: number;
}

export type BattlePhase =
  | 'waiting'
  | 'rolling_d20'
  | 'rolling_d6'
  | 'skill_activation'
  | 'damage_calc'
  | 'turn_end'
  | 'game_over';

export interface BattleState {
  animationUntil?:number;
  hitEvents?:CombatHit[];
  duelClash?: import("@/lib/duelRules").DuelClash;
  duelNotice?: import("@/lib/duelRules").DuelNotice;
  lms?: import('@/lib/lms').LmsState;
  revision?: number;
  purpleSky?: { id: string; startedAt: number };
  id: string;
  player1: PlayerState;
  player2: PlayerState;
  currentTurn: number;
  attackerId: string;
  phase: BattlePhase;
  d20Results: { attacker: number; defender: number; boxerExtra?: number } | null;
  d6Results: { player1: number[]; player2: number[] } | null;
  d12Results?: { player1: number[]; player2: number[] } | null;
  battleLog: BattleLogEntry[];
  winnerId: string | null;
  mapId: string;
  isAiOpponent: boolean;
  mode: 'ranked' | 'casual' | 'pve' | 'local';
  p1HasRolled?: boolean;
  p2HasRolled?: boolean;
  p1D20?: number | null;
  p2D20?: number | null;
  p1D6?: number | null;
  p2D6?: number | null;
  turnStep?: 'd20_atk' | 'd20_def' | 'clash' | 'd6_atk' | 'd6_def' | 'd12';
  p1EndedTurn?: boolean;
  p2EndedTurn?: boolean;
  activeVfx?: {
    caster?:'p1'|'p2';
    damage?:number;
    id: string;
    effect: string;
    target: 'p1' | 'p2' | 'center';
    size?: number;
  } | null;
  vfxSequence?: NonNullable<BattleState['activeVfx']>[];
  activeSkillBanner?: {
    id: string;
    weaponId: string;
    skillNameEn: string;
    icon?: string;
    skillNameVi?: string;
    slot?: 1 | 2;
    casterName: string;
    auraColor: string;
  } | null;
  damagePopup?: {
    id: string;
    target: 'p1' | 'p2';
    text: string;
    type: 'damage' | 'crit' | 'block' | 'heal';
    subtext?: string;
  } | null;
}

export type GameMode = 'last_man_standing' | 'pve' | 'classic';
export type MatchType = 'ranked' | 'casual';

export interface RoomState {
  id: string;
  hostId: string;
  hostName: string;
  guestId: string | null;
  guestName: string | null;
  mode: MatchType;
  gameMode: GameMode;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  hostReady: boolean;
  guestReady: boolean;
  hostClass: ClassType;
  guestClass?: ClassType;
  hostWeapon: string;
  guestWeapon?: string;
  mapId: string;
  battleState: BattleState | null;
}

export type GamePage =
  | 'dungeon'
  | 'pve'
  | 'home'
  | 'play'
  | 'character'
  | 'weapons'
  | 'friends'
  | 'settings'
  | 'battle'
  | 'preview';

export type PlaySubPage = 'main' | 'rewards' | 'quests' | 'ranked' | 'casual' | 'create_room';
export type Language = 'en' | 'vi';

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  language: Language;
  musicMuted: boolean;
  sfxMuted: boolean;
}

export interface MapInfo {
  id: string;
  name: string;
  nameVi: string;
  image: string;
  ambient: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  classType: ClassType;
  weaponId: string;
  character: CharacterCustomization;
  rank: number;
  tier: number; // 1-7 (tier_01 to tier_07)
  wins: number;
  losses: number;
  highestD20: number;
}
