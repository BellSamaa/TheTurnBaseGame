'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GamePage,
  PlaySubPage,
  GameMode,
  MatchType,
  ClassType,
  CharacterCustomization,
  BattleState,
  RoomState,
  GameSettings,
  PlayerProfile,
} from '@/types/game';
import {
  CLASS_DEFINITIONS,
  WEAPON_DEFINITIONS,
  DEFAULT_CUSTOMIZATION,
  MAP_DEFINITIONS,
} from '@/lib/constants';

interface GameStore {
  // Navigation
  currentPage: GamePage;
  playSubPage: PlaySubPage;
  selectedMode: GameMode | null;
  matchType: MatchType | null;

  // Settings
  settings: GameSettings;

  // Player Profile
  profile: PlayerProfile;

  // Active Battle & Rooms
  battleState: BattleState | null;
  activeRoom: RoomState | null;
  rooms: RoomState[];

  // Actions
  setPage: (page: GamePage) => void;
  setPlaySubPage: (sub: PlaySubPage) => void;
  setGameMode: (mode: GameMode | null, matchType?: MatchType | null) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  updateProfile: (profile: Partial<PlayerProfile>) => void;
  updateCharacter: (custom: Partial<CharacterCustomization>) => void;
  setPlayerClass: (classType: ClassType) => void;
  setPlayerWeapon: (weaponId: string) => void;
  setBattleState: (battle: BattleState | null | ((prev: BattleState | null) => BattleState | null)) => void;
  setActiveRoom: (room: RoomState | null) => void;
  setRooms: (rooms: RoomState[]) => void;
  startNewBattle: (options: {
    mode: 'ranked' | 'casual' | 'pve' | 'local';
    mapId?: string;
    opponentName?: string;
    opponentClass?: ClassType;
    opponentWeapon?: string;
  }) => BattleState;
}

const DEFAULT_PROFILE: PlayerProfile = {
  id: 'player_local_01',
  name: 'DiceHero',
  classType: 'warrior',
  weaponId: 'greatsword',
  character: DEFAULT_CUSTOMIZATION,
  rank: 1000,
  wins: 0,
  losses: 0,
};

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.6,
  sfxVolume: 0.8,
  language: 'vi', // Mặc định Tiếng Việt theo yêu cầu người dùng
  musicMuted: false,
  sfxMuted: false,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      currentPage: 'home',
      playSubPage: 'main',
      selectedMode: null,
      matchType: null,

      settings: DEFAULT_SETTINGS,
      profile: DEFAULT_PROFILE,

      battleState: null,
      activeRoom: null,
      rooms: [],

      setPage: (page) => set({ currentPage: page }),
      setPlaySubPage: (sub) => set({ playSubPage: sub }),
      setGameMode: (mode, matchType) =>
        set({
          selectedMode: mode,
          matchType: matchType !== undefined ? matchType : get().matchType,
        }),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      updateProfile: (newProfile) =>
        set((state) => ({
          profile: { ...state.profile, ...newProfile },
        })),

      updateCharacter: (custom) =>
        set((state) => ({
          profile: {
            ...state.profile,
            character: { ...state.profile.character, ...custom },
          },
        })),

      setPlayerClass: (classType) =>
        set((state) => ({
          profile: { ...state.profile, classType },
        })),

      setPlayerWeapon: (weaponId) =>
        set((state) => ({
          profile: { ...state.profile, weaponId },
        })),

      setBattleState: (battle) =>
        set((state) => ({
          battleState: typeof battle === 'function' ? battle(state.battleState) : battle,
        })),

      setActiveRoom: (room) => set({ activeRoom: room }),
      setRooms: (rooms) => set({ rooms }),

      startNewBattle: (options) => {
        const { profile } = get();
        const p1Class = CLASS_DEFINITIONS[profile.classType] || CLASS_DEFINITIONS.warrior;
        const p1Weapon = WEAPON_DEFINITIONS[profile.weaponId] || WEAPON_DEFINITIONS.greatsword;

        // Opponent configuration
        const oppClassType = options.opponentClass || 'assassin';
        const p2Class = CLASS_DEFINITIONS[oppClassType] || CLASS_DEFINITIONS.assassin;
        const p2Weapon =
          WEAPON_DEFINITIONS[options.opponentWeapon || 'dagger'] || WEAPON_DEFINITIONS.dagger;

        const randomMap =
          options.mapId ||
          MAP_DEFINITIONS[Math.floor(Math.random() * MAP_DEFINITIONS.length)].id;

        const isPve = options.mode === 'pve';

        const newBattle: BattleState = {
          id: 'battle_' + Date.now(),
          currentTurn: 1,
          attackerId: profile.id, // Player 1 starts as attacker
          phase: 'rolling_d20',
          d20Results: null,
          d6Results: null,
          mapId: randomMap,
          winnerId: null,
          isAiOpponent: isPve,
          mode: options.mode,
          player1: {
            id: profile.id,
            name: profile.name,
            hp: p1Class.baseHp,
            maxHp: p1Class.baseHp,
            classType: profile.classType,
            weapon: p1Weapon,
            skillCharge: 0,
            isAttacker: true,
            character: profile.character,
          },
          player2: {
            id: isPve ? 'ai_opponent' : 'player_2',
            name: options.opponentName || (isPve ? 'Shadow Knight (AI)' : 'Player 2'),
            hp: p2Class.baseHp,
            maxHp: p2Class.baseHp,
            classType: oppClassType,
            weapon: p2Weapon,
            skillCharge: 0,
            isAttacker: false,
            character: {
              ...DEFAULT_CUSTOMIZATION,
              baseIndex: 2,
              hairIndex: 3,
              hairColor: '#ff4d4d',
              shirtColor: '#805ad5',
              pantsColor: '#1a202c',
            },
          },
          battleLog: [
            {
              turn: 1,
              type: 'system',
              message: `Trận đấu bắt đầu tại ${
                MAP_DEFINITIONS.find((m) => m.id === randomMap)?.nameVi || 'Đấu Trường'
              }!`,
              messageVi: `Trận đấu bắt đầu tại ${
                MAP_DEFINITIONS.find((m) => m.id === randomMap)?.nameVi || 'Đấu Trường'
              }!`,
              timestamp: Date.now(),
            },
            {
              turn: 1,
              type: 'system',
              message: `${profile.name} là bên TẤN CÔNG lượt này. Cả hai cùng đổ xúc xắc D20!`,
              messageVi: `${profile.name} là bên TẤN CÔNG lượt này. Cả hai cùng đổ xúc xắc D20!`,
              timestamp: Date.now() + 10,
            },
          ],
        };

        set({ battleState: newBattle, currentPage: 'battle' });
        return newBattle;
      },
    }),
    {
      name: 'dice_maniac_game_storage',
      partialize: (state) => ({
        settings: state.settings,
        profile: state.profile,
      }),
    }
  )
);
