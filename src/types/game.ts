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

export type WeaponTier = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'secret';

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
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  classType: ClassType;
  weapon: WeaponInfo;
  skillCharge: number;
  d12Charge?: number;
  isAttacker: boolean;
  character: CharacterCustomization;
  // Weapon dynamic state mechanics
  bullets?: number; // Revolver cylinder (0-6)
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
