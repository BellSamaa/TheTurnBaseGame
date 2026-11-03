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
  UserAccount,
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

  // Settings (DEFAULT TO ENGLISH)
  settings: GameSettings;

  // User Auth & Accounts Database
  currentUser: UserAccount | null;
  accounts: UserAccount[];
  authModal: 'none' | 'login' | 'signup' | 'profile';
  setAuthModal: (m: 'none' | 'login' | 'signup' | 'profile') => void;
  loginUser: (username: string, pass?: string) => boolean;
  signupUser: (username: string, email: string, pass?: string) => boolean;
  logoutUser: () => void;
  updateUserBio: (bio: string) => void;

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
  rank: 1200,
  tier: 3, // Tier 3 (Gold)
  wins: 12,
  losses: 4,
  highestD20: 20,
};

// DEFAULT IS ENGLISH as requested!
const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.6,
  sfxVolume: 0.8,
  language: 'en', // DEFAULT ENGLISH!
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

      // Auth Database
      currentUser: {
        id: 'user_master',
        username: 'DiceHero',
        email: 'hero@dicemaniac.rpg',
        bio: 'Legendary D20 roller, slayer of dragons and master of dice.',
        createdAt: '2026-01-01',
        avatarConfig: DEFAULT_CUSTOMIZATION,
      },
      accounts: [
        {
          id: 'user_master',
          username: 'DiceHero',
          email: 'hero@dicemaniac.rpg',
          bio: 'Legendary D20 roller, slayer of dragons and master of dice.',
          createdAt: '2026-01-01',
          avatarConfig: DEFAULT_CUSTOMIZATION,
        },
      ],
      authModal: 'none',

      setAuthModal: (m) => set({ authModal: m }),

      loginUser: (username) => {
        const acc = get().accounts.find(
          (a) => a.username.toLowerCase() === username.trim().toLowerCase()
        );
        if (acc) {
          set({
            currentUser: acc,
            profile: {
              ...get().profile,
              name: acc.username,
              character: acc.avatarConfig,
            },
            authModal: 'none',
          });
          return true;
        }
        // Auto-create if not exists for frictionless gameplay
        const newAcc: UserAccount = {
          id: 'user_' + Date.now(),
          username: username.trim(),
          email: `${username.trim().toLowerCase()}@dicemaniac.rpg`,
          bio: 'New dice warrior embarking on the quest.',
          createdAt: new Date().toISOString().split('T')[0],
          avatarConfig: get().profile.character,
        };
        set({
          accounts: [...get().accounts, newAcc],
          currentUser: newAcc,
          profile: { ...get().profile, name: newAcc.username },
          authModal: 'none',
        });
        return true;
      },

      signupUser: (username, email) => {
        const existing = get().accounts.find(
          (a) => a.username.toLowerCase() === username.trim().toLowerCase()
        );
        if (existing) return false;

        const newAcc: UserAccount = {
          id: 'user_' + Date.now(),
          username: username.trim(),
          email: email.trim(),
          bio: 'New challenger enters the arena.',
          createdAt: new Date().toISOString().split('T')[0],
          avatarConfig: get().profile.character,
        };
        set({
          accounts: [...get().accounts, newAcc],
          currentUser: newAcc,
          profile: { ...get().profile, name: newAcc.username },
          authModal: 'none',
        });
        return true;
      },

      logoutUser: () => set({ currentUser: null }),

      updateUserBio: (bio) =>
        set((state) => {
          if (!state.currentUser) return state;
          const updated = { ...state.currentUser, bio };
          return {
            currentUser: updated,
            accounts: state.accounts.map((a) =>
              a.id === updated.id ? updated : a
            ),
          };
        }),

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
        set((state) => {
          const updated = { ...state.profile, ...newProfile };
          if (state.currentUser && newProfile.name) {
            state.currentUser.username = newProfile.name;
          }
          if (state.currentUser && newProfile.character) {
            state.currentUser.avatarConfig = newProfile.character;
          }
          return { profile: updated };
        }),

      updateCharacter: (custom) =>
        set((state) => {
          const newCustom = { ...state.profile.character, ...custom };
          if (state.currentUser) {
            state.currentUser.avatarConfig = newCustom;
          }
          return {
            profile: {
              ...state.profile,
              character: newCustom,
            },
          };
        }),

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

        const oppClassType = options.opponentClass || 'assassin';
        const p2Class = CLASS_DEFINITIONS[oppClassType] || CLASS_DEFINITIONS.assassin;
        const p2Weapon =
          WEAPON_DEFINITIONS[options.opponentWeapon || 'dagger'] || WEAPON_DEFINITIONS.dagger;

        const randomMap =
          options.mapId ||
          MAP_DEFINITIONS[Math.floor(Math.random() * MAP_DEFINITIONS.length)].id;

        const isPve = options.mode === 'pve';
        const isEnglish = get().settings.language === 'en';

        const newBattle: BattleState = {
          id: 'battle_' + Date.now(),
          currentTurn: 1,
          attackerId: profile.id,
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
              baseIndex: 1,
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
              message: isEnglish
                ? `Battle begins at ${MAP_DEFINITIONS.find((m) => m.id === randomMap)?.name}!`
                : `Trận đấu bắt đầu tại ${MAP_DEFINITIONS.find((m) => m.id === randomMap)?.nameVi}!`,
              messageVi: `Trận đấu bắt đầu tại ${MAP_DEFINITIONS.find((m) => m.id === randomMap)?.nameVi}!`,
              timestamp: Date.now(),
            },
            {
              turn: 1,
              type: 'system',
              message: isEnglish
                ? `${profile.name} is the ATTACKER this turn. Both players roll D20!`
                : `${profile.name} là bên TẤN CÔNG lượt này. Cả hai cùng đổ xúc xắc D20!`,
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
        currentUser: state.currentUser,
        accounts: state.accounts,
      }),
    }
  )
);
