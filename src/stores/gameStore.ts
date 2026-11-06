'use client';

import { saveProfilePatch } from '@/lib/profileSync';
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
  PVP_BASE_HP, CLASS_DEFINITIONS,
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
  authModal: 'none' | 'login' | 'signup' | 'profile' | 'global';
  setAuthModal: (m: 'none' | 'login' | 'signup' | 'profile' | 'global') => void;
  loginUser: (username: string, pass?: string) => Promise<{ success: boolean; error?: string }>;
  signupUser: (username: string, email: string, pass?: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => void;
  updateUserBio: (bio: string) => void;

  // Player Profile
  profile: PlayerProfile;

  // Active Battle & Rooms
  battleState: BattleState | null;
  activeRoom: RoomState | null;
  onlineRoomCode: string | null;
  setOnlineRoomCode: (code: string | null) => void;
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

      // Real User Auth Database (No fake bots)
      currentUser: null,
      accounts: [],
      authModal: 'none',

      setAuthModal: (m) => set({ authModal: m }),

      loginUser: async (username, pass) => {
        const trimmedUser = username.trim();
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: trimmedUser, password: pass }),
          });
          const data = await res.json();
          if (res.ok && data.success && data.user) {
            const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin' });
            const session = await sessionResponse.json();
            if (!sessionResponse.ok || session.userId !== data.user.id) {
              return { success: false, error: get().settings.language === 'vi' ? 'Trình duyệt chưa lưu được phiên đăng nhập. Hãy cho phép cookie và thử lại trên cùng địa chỉ game.' : 'Session cookie was not saved. Allow cookies and retry on the same game URL.' };
            }
            const u = data.user;
            set({
              currentUser: u,
              profile: {
                ...get().profile,
                id: u.id,
                name: u.username,
                character: u.avatarConfig || get().profile.character,
                classType: u.selectedClass || get().profile.classType,
                weaponId: u.selectedWeapon || get().profile.weaponId,
                tier: u.tier || 1,
                rank: u.rankPoints || 1000,
                wins: u.wins || 0,
                losses: u.losses || 0,
              },
              authModal: 'none',
            });
            return { success: true };
          } else {
            return {
              success: false,
              error: data.error || (get().settings.language === 'vi' ? 'Đăng nhập không thành công' : 'Login failed'),
            };
          }
        } catch {
          return { success: false, error: get().settings.language === 'vi' ? 'Không thể xác nhận đăng nhập với máy chủ. Vui lòng thử lại.' : 'Could not verify server sign-in. Please retry.' };
        }
      },

      signupUser: async (username, email, pass) => {
        const trimmedUser = username.trim();
        const trimmedEmail = email.trim();

        if (trimmedUser.length < 3) {
          return {
            success: false,
            error: get().settings.language === 'vi'
              ? 'Tên người dùng phải có ít nhất 3 ký tự.'
              : 'Username must be at least 3 characters.',
          };
        }

        if (pass && pass.length < 4) {
          return {
            success: false,
            error: get().settings.language === 'vi'
              ? 'Mật khẩu phải có ít nhất 4 ký tự.'
              : 'Password must be at least 4 characters.',
          };
        }

        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: trimmedUser,
              email: trimmedEmail || `${trimmedUser.toLowerCase()}@dicemaniac.rpg`,
              password: pass,
              avatarConfig: get().profile.character,
              selectedClass: get().profile.classType,
              selectedWeapon: get().profile.weaponId,
            }),
          });
          const data = await res.json();
          if (res.ok && data.success && data.user) {
            const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin' });
            const session = await sessionResponse.json();
            if (!sessionResponse.ok || session.userId !== data.user.id) {
              return { success: false, error: get().settings.language === 'vi' ? 'Trình duyệt chưa lưu được phiên đăng nhập. Hãy cho phép cookie và thử lại trên cùng địa chỉ game.' : 'Session cookie was not saved. Allow cookies and retry on the same game URL.' };
            }
            const u = data.user;
            set({
              currentUser: u,
              accounts: [...get().accounts.filter((a) => a.username.toLowerCase() !== u.username.toLowerCase()), u],
              profile: {
                ...get().profile,
                id: u.id,
                name: u.username,
                character: u.avatarConfig || get().profile.character,
                classType: u.selectedClass || get().profile.classType,
                weaponId: u.selectedWeapon || get().profile.weaponId,
              },
              authModal: 'none',
            });
            return { success: true };
          } else {
            return {
              success: false,
              error: data.error || (get().settings.language === 'vi' ? 'Tên tài khoản này đã được sử dụng.' : 'Username already taken.'),
            };
          }
        } catch {
          return { success: false, error: get().settings.language === 'vi' ? 'Không thể tạo tài khoản trên máy chủ. Vui lòng thử lại.' : 'Could not create server account. Please retry.' };
        }
      },

      logoutUser: () => { fetch('/api/auth/logout', { method: 'POST' }).catch(() => {}); set({ currentUser: null }); },

      updateUserBio: (bio) =>
        set((state) => {
          if (!state.currentUser) return state;
          const updated = { ...state.currentUser, bio };
          saveProfilePatch({bio});
          return {
            currentUser: updated,
            accounts: state.accounts.map((a) =>
              a.id === updated.id ? updated : a
            ),
          };
        }),

      battleState: null,
      activeRoom: null,
      onlineRoomCode: null,
      setOnlineRoomCode: (code) => set({ onlineRoomCode: code }),
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

      updateProfile: (newProfile) => {
        const state = get(), updated = { ...state.profile, ...newProfile };
        const user = state.currentUser ? {...state.currentUser,
          ...(newProfile.name ? {username:newProfile.name} : {}),
          ...(newProfile.character ? {avatarConfig:newProfile.character} : {}),
          ...(newProfile.classType ? {selectedClass:newProfile.classType} : {}),
          ...(newProfile.weaponId ? {selectedWeapon:newProfile.weaponId} : {})} : null;
        set({profile:updated,currentUser:user});
        if(user) saveProfilePatch({
          ...(newProfile.name ? {username:newProfile.name} : {}),
          ...(newProfile.character ? {avatarConfig:newProfile.character} : {}),
          ...(newProfile.classType ? {selectedClass:newProfile.classType} : {}),
          ...(newProfile.weaponId ? {selectedWeapon:newProfile.weaponId} : {})});
      },
      updateCharacter: (custom) => get().updateProfile({character:{...get().profile.character,...custom}}),
      setPlayerClass: (classType) => get().updateProfile({classType}),
      setPlayerWeapon: (weaponId) => get().updateProfile({weaponId}),

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
          turnStep: 'd20_atk',
          d20Results: null,
          d6Results: null,
          mapId: randomMap,
          winnerId: null,
          isAiOpponent: isPve,
          mode: options.mode,
          player1: {
            id: profile.id,
            name: profile.name,
            hp: isPve ? p1Class.baseHp : Math.round(PVP_BASE_HP * p1Class.hpModifier),
            maxHp: isPve ? p1Class.baseHp : Math.round(PVP_BASE_HP * p1Class.hpModifier),
            classType: profile.classType,
            weapon: p1Weapon,
            skillCharge: 0,
            isAttacker: true,
            bullets: p1Weapon.id === 'revolver' ? 6 : undefined,
            petRockHp: (p1Weapon.id === 'spirit_stone' || p1Weapon.id === 'pet_rock') ? 50 : undefined,
            petRockHits: 0,
            petRockEnraged: false,
            character: profile.character,
          },
          player2: {
            id: isPve ? 'ai_opponent' : 'player_2',
            name: options.opponentName || (isPve ? 'Shadow Knight (AI)' : 'Player 2'),
            hp: isPve ? p2Class.baseHp : Math.round(PVP_BASE_HP * p2Class.hpModifier),
            maxHp: isPve ? p2Class.baseHp : Math.round(PVP_BASE_HP * p2Class.hpModifier),
            classType: oppClassType,
            weapon: p2Weapon,
            skillCharge: 0,
            isAttacker: false,
            bullets: p2Weapon.id === 'revolver' ? 6 : undefined,
            petRockHp: (p2Weapon.id === 'spirit_stone' || p2Weapon.id === 'pet_rock') ? 50 : undefined,
            petRockHits: 0,
            petRockEnraged: false,
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
