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
  image: string;
  hpModifier: number;
  damageModifier: number;
  damageReduction: number;
  extraD6Rolls: number;
  extraD20Rolls: number;
  baseHp: number;
}

export interface WeaponSkill {
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  chargeRequired?: number;
  triggerNumber?: number;
  effect: string;
}

export interface WeaponInfo {
  id: string;
  name: string;
  nameVi: string;
  image: string;
  description: string;
  descriptionVi: string;
  skill1: WeaponSkill & { chargeRequired: number };
  skill2: WeaponSkill & { triggerNumber: number };
}

export interface CharacterCustomization {
  baseIndex: number;
  hairIndex: number;
  hairColor: string;
  skinColor: string;
  shirtIndex: number;
  shirtColor: string;
  pantsIndex: number;
  pantsColor: string;
  accessoryIndex: number;
  faceIndex: number;
}

export interface PlayerState {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  classType: ClassType;
  weapon: WeaponInfo;
  skillCharge: number;
  isAttacker: boolean;
  character: CharacterCustomization;
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

export type GamePage = 'home' | 'play' | 'character' | 'weapons' | 'friends' | 'settings' | 'battle';
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
  wins: number;
  losses: number;
}
