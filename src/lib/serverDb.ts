import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import type { CharacterCustomization, ClassType, BattleState } from '@/types/game';

export interface DbUserAccount {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatarConfig: CharacterCustomization;
  selectedClass: ClassType;
  selectedWeapon: string;
  tier: number;
  rankPoints: number;
  wins: number;
  losses: number;
  bio: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomParticipant {
  id: string;
  name: string;
  character: CharacterCustomization;
  classType: ClassType;
  weaponId: string;
  isReady: boolean;
}

export interface DbOnlineRoom {
  code: string; // e.g. "4829"
  id: string;
  host: RoomParticipant;
  guest: RoomParticipant | null;
  participants?: RoomParticipant[];
  maxPlayers?: number;
  gameMode?: 'classic' | 'last_man_standing';
  rankedResultRecorded?: boolean;
  mode: 'casual' | 'ranked';
  mapId: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  battleState: BattleState | null;
  createdAt: number;
  lastActive: number;
}

interface DatabaseSchema {
  users: Record<string, DbUserAccount>; // keyed by username.toLowerCase()
  rooms: Record<string, DbOnlineRoom>; // keyed by room code
}

// Global memory cache to survive serverless function warm re-use
const globalForDb = global as unknown as {
  __DICE_MANIAC_DB?: DatabaseSchema;
};

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const hasSupabase = Boolean(supabaseUrl && supabaseKey);

function getSupabaseClient() {
  if (!hasSupabase) return null;
  try {
    return createClient(supabaseUrl, supabaseKey);
  } catch {
    return null;
  }
}

function getDbFilePath(): string {
  const isVercel = process.env.VERCEL === '1';
  if (isVercel) {
    return path.join('/tmp', 'dice_maniac_db.json');
  }
  return path.join(process.cwd(), 'data', 'db.json');
}

function loadDatabase(): DatabaseSchema {
  if (globalForDb.__DICE_MANIAC_DB) {
    return globalForDb.__DICE_MANIAC_DB;
  }

  const filePath = getDbFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      globalForDb.__DICE_MANIAC_DB = {
        users: parsed.users || {},
        rooms: parsed.rooms || {},
      };
      return globalForDb.__DICE_MANIAC_DB;
    }
  } catch (err) {
    console.warn('[ServerDB] Failed to read db file, initializing empty:', err);
  }

  globalForDb.__DICE_MANIAC_DB = {
    users: {},
    rooms: {},
  };
  return globalForDb.__DICE_MANIAC_DB;
}

function saveDatabase(): void {
  const db = globalForDb.__DICE_MANIAC_DB;
  if (!db) return;

  const filePath = getDbFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[ServerDB] Failed to save db file:', err);
  }
}

// ----------------------------------------------------------------------
// User Operations (Synchronous local + Async Supabase)
// ----------------------------------------------------------------------
export function getUserByUsername(username: string): DbUserAccount | null {
  const db = loadDatabase();
  const key = username.trim().toLowerCase();
  return db.users[key] || null;
}

export async function getUserByUsernameAsync(username: string): Promise<DbUserAccount | null> {
  const local = getUserByUsername(username);
  const sb = getSupabaseClient();
  if (!sb) return local;

  try {
    const { data, error } = await sb
      .from('users')
      .select('*')
      .ilike('username', username.trim())
      .maybeSingle();

    if (error || !data) return local;

    const u: DbUserAccount = {
      id: data.id,
      username: data.username,
      email: data.email,
      passwordHash: data.password_hash || data.passwordHash || '',
      avatarConfig: data.avatar_config || data.avatarConfig,
      selectedClass: data.selected_class || data.selectedClass || 'warrior',
      selectedWeapon: data.selected_weapon || data.selectedWeapon || 'greatsword',
      tier: data.tier ?? 1,
      rankPoints: data.rank_points ?? data.rankPoints ?? 1000,
      wins: data.wins ?? 0,
      losses: data.losses ?? 0,
      bio: data.bio || '',
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
    };
    // Sync into local cache
    saveUser(u);
    return u;
  } catch {
    return local;
  }
}

export function getUserById(userId: string): DbUserAccount | null {
  const db = loadDatabase();
  return Object.values(db.users).find((u) => u.id === userId) || null;
}

export async function getUserByIdAsync(userId: string): Promise<DbUserAccount | null> {
  const local = getUserById(userId);
  const sb = getSupabaseClient();
  if (!sb) return local;
  const { data, error } = await sb.from('users').select('*').eq('id', userId).maybeSingle();
  if (error || !data) return local;
  return { id: data.id, username: data.username, email: data.email, passwordHash: data.password_hash || '', avatarConfig: data.avatar_config, selectedClass: data.selected_class || 'warrior', selectedWeapon: data.selected_weapon || 'greatsword', tier: data.tier ?? 1, rankPoints: data.rank_points ?? 1000, wins: data.wins ?? 0, losses: data.losses ?? 0, bio: data.bio || '', createdAt: data.created_at, updatedAt: data.updated_at };
}

export function saveUser(user: DbUserAccount): DbUserAccount {
  const db = loadDatabase();
  const key = user.username.trim().toLowerCase();
  db.users[key] = {
    ...user,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase();
  return db.users[key];
}

export async function saveUserAsync(user: DbUserAccount): Promise<DbUserAccount> {
  const saved = saveUser(user);
  const sb = getSupabaseClient();
  if (!sb) return saved;

  try {
    await sb.from('users').upsert({
      id: user.id,
      username: user.username,
      email: user.email,
      password_hash: user.passwordHash,
      avatar_config: user.avatarConfig,
      selected_class: user.selectedClass,
      selected_weapon: user.selectedWeapon,
      tier: user.tier,
      rank_points: user.rankPoints,
      wins: user.wins,
      losses: user.losses,
      bio: user.bio,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    });
  } catch (err) {
    console.warn('[Supabase] Failed to sync user to Supabase:', err);
  }
  return saved;
}

export function listAllUsers(): Omit<DbUserAccount, 'passwordHash'>[] {
  const db = loadDatabase();
  return Object.values(db.users)
    .map(({ passwordHash: _, ...safeUser }) => safeUser)
    .sort((a, b) => (b.rankPoints || 0) - (a.rankPoints || 0));
}

export async function listAllUsersAsync(): Promise<Omit<DbUserAccount, 'passwordHash'>[]> {
  const localList = listAllUsers();
  const sb = getSupabaseClient();
  if (!sb) return localList;

  try {
    const { data, error } = await sb
      .from('users')
      .select('id, username, email, avatar_config, selected_class, selected_weapon, tier, rank_points, wins, losses, bio, created_at, updated_at')
      .order('rank_points', { ascending: false });

    if (error || !data || data.length === 0) return localList;

    return data.map((d: any) => ({
      id: d.id,
      username: d.username,
      email: d.email,
      avatarConfig: d.avatar_config || d.avatarConfig,
      selectedClass: d.selected_class || d.selectedClass || 'warrior',
      selectedWeapon: d.selected_weapon || d.selectedWeapon || 'greatsword',
      tier: d.tier ?? 1,
      rankPoints: d.rank_points ?? 1000,
      wins: d.wins ?? 0,
      losses: d.losses ?? 0,
      bio: d.bio || '',
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  } catch {
    return localList;
  }
}

// ----------------------------------------------------------------------
// Room Operations (Synchronous local + Async Supabase)
// ----------------------------------------------------------------------
export function getRoomByCode(code: string): DbOnlineRoom | null {
  const db = loadDatabase();
  const upper = code.trim().toUpperCase();
  const room = db.rooms[upper];
  if (!room) return null;

  if (Date.now() - room.lastActive > (room.status === 'playing' ? 2 * 60 * 60 * 1000 : 5 * 60 * 1000)) {
    delete db.rooms[upper];
    saveDatabase();
    return null;
  }
  return room;
}

export async function getRoomByCodeAsync(code: string): Promise<DbOnlineRoom | null> {
  globalForDb.__DICE_MANIAC_DB = undefined;
  const local = getRoomByCode(code);
  if (!hasSupabase && process.env.VERCEL === '1') throw new Error('Online rooms require Supabase');
  const sb = getSupabaseClient();
  if (!sb) return local ? structuredClone(local) : null;

  try {
    const { data, error } = await sb
      .from('rooms')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const room: DbOnlineRoom = {
      code: data.code,
      id: data.id,
      host: data.host,
      guest: data.guest,
      participants: data.participants || (data.guest ? [data.host, data.guest] : [data.host]),
      maxPlayers: data.max_players || 2,
      gameMode: data.game_mode || 'classic',
      rankedResultRecorded: data.ranked_result_recorded || false,
      mode: data.mode || 'casual',
      mapId: data.map_id || data.mapId || 'castle',
      status: data.status,
      battleState: data.battle_state || data.battleState,
      createdAt: Number(data.created_at || Date.now()),
      lastActive: Number(data.last_active || Date.now()),
    };
    if (room.status !== 'playing' && Date.now() - room.lastActive > 5 * 60 * 1000) return null;
    return room;
  } catch (err) {
    throw err;
  }
}

export async function listOpenRooms(): Promise<DbOnlineRoom[]> {
  const sb = getSupabaseClient();
  if (sb) {
    const { error: cleanupError } = await sb.from('rooms').delete().neq('status', 'playing').lt('last_active', Date.now() - 5 * 60 * 1000);
    if (cleanupError) throw new Error(cleanupError.message);
    const { data, error } = await sb.from('rooms').select('code').eq('status', 'waiting').gt('last_active', Date.now() - 5 * 60 * 1000);
    if (error) throw new Error(error.message);
    const rooms = await Promise.all((data || []).map(r => getRoomByCodeAsync(r.code)));
    return rooms.filter((r): r is DbOnlineRoom => r !== null);
  }
  globalForDb.__DICE_MANIAC_DB = undefined;
  const db = loadDatabase();
  const now = Date.now();
  return Object.values(db.rooms)
    .filter((r) => r.status === 'waiting' && now - r.lastActive < 5 * 60 * 1000)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function createRoom(
  hostUser: RoomParticipant,
  mode: 'casual' | 'ranked' = 'casual',
  mapId: string = 'castle',
  gameMode: 'classic' | 'last_man_standing' = 'classic'
): Promise<DbOnlineRoom> {
  if (!hasSupabase && process.env.VERCEL === '1') throw new Error('Online rooms require Supabase');
  globalForDb.__DICE_MANIAC_DB = undefined;
  const db = loadDatabase();

  let code = '';
  for (let attempt = 0; attempt < 100; attempt++) {
    const num = Math.floor(1000 + Math.random() * 9000).toString();
    if (!db.rooms[num]) {
      code = num;
      break;
    }
  }
  if (!code) code = 'ROOM' + Math.floor(Math.random() * 99);

  const room: DbOnlineRoom = {
    code,
    id: 'room_' + Date.now().toString(36),
    host: { ...hostUser, isReady: true },
    guest: null,
    participants: [hostUser],
    maxPlayers: gameMode === 'last_man_standing' ? 4 : 2,
    gameMode,
    mode,
    mapId,
    status: 'waiting',
    battleState: null,
    createdAt: Date.now(),
    lastActive: Date.now(),
  };

  db.rooms[code] = room;
  saveDatabase();

  // Async sync to Supabase if available
  const sb = getSupabaseClient();
  if (sb) {
    const { error } = await (
      sb.from('rooms').insert({
        code: room.code,
        id: room.id,
        host: room.host,
        guest: room.guest,
        participants: room.participants,
        max_players: room.maxPlayers,
        game_mode: room.gameMode,
        ranked_result_recorded: false,
        mode: room.mode,
        map_id: room.mapId,
        status: room.status,
        battle_state: room.battleState,
        created_at: room.createdAt,
        last_active: room.lastActive,
      })
    );
    if (error) throw new Error(error.message);
  }

  return room;
}

export async function updateRoom(room: DbOnlineRoom): Promise<DbOnlineRoom> {
  const previousVersion = room.lastActive;
  room.lastActive = Math.max(Date.now(), previousVersion + 1);
  const sb = getSupabaseClient();
  if (sb) {
    const { data, error } = await sb.from('rooms').update({
      host: room.host, guest: room.guest, participants: room.participants,
      status: room.status, game_mode: room.gameMode, max_players: room.maxPlayers,
      ranked_result_recorded: room.rankedResultRecorded || false,
      battle_state: room.battleState, last_active: room.lastActive,
    }).eq('code', room.code).eq('last_active', previousVersion).select('code');
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error('Room changed; retry after synchronization');
  } else {
    globalForDb.__DICE_MANIAC_DB = undefined;
    const db = loadDatabase();
    if (db.rooms[room.code]?.lastActive !== previousVersion) throw new Error('Room changed; retry after synchronization');
    db.rooms[room.code] = room;
    saveDatabase();
  }
  return room;
}

export async function deleteRoom(code: string): Promise<void> {
  const db = loadDatabase();
  const upper = code.toUpperCase();
  delete db.rooms[upper];
  saveDatabase();

  const sb = getSupabaseClient();
  if (sb) {
    const { error } = await (
      sb.from('rooms').delete().eq('code', upper)
    );
    if (error) throw new Error(error.message);
  }
}
