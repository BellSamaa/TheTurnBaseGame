import fs from 'fs';
import path from 'path';
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

function getDbFilePath(): string {
  // In serverless / Vercel, prefer /tmp or local data folder
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
// User Operations
// ----------------------------------------------------------------------
export function getUserByUsername(username: string): DbUserAccount | null {
  const db = loadDatabase();
  const key = username.trim().toLowerCase();
  return db.users[key] || null;
}

export function getUserById(userId: string): DbUserAccount | null {
  const db = loadDatabase();
  return Object.values(db.users).find((u) => u.id === userId) || null;
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

export function listAllUsers(): Omit<DbUserAccount, 'passwordHash'>[] {
  const db = loadDatabase();
  return Object.values(db.users)
    .map(({ passwordHash, ...safeUser }) => safeUser)
    .sort((a, b) => (b.rankPoints || 0) - (a.rankPoints || 0));
}

// ----------------------------------------------------------------------
// Room Operations
// ----------------------------------------------------------------------
export function getRoomByCode(code: string): DbOnlineRoom | null {
  const db = loadDatabase();
  const upper = code.trim().toUpperCase();
  const room = db.rooms[upper];
  if (!room) return null;

  // Auto expire rooms inactive for > 2 hours
  if (Date.now() - room.lastActive > 2 * 60 * 60 * 1000) {
    delete db.rooms[upper];
    saveDatabase();
    return null;
  }
  return room;
}

export function listOpenRooms(): DbOnlineRoom[] {
  const db = loadDatabase();
  const now = Date.now();
  return Object.values(db.rooms)
    .filter((r) => r.status === 'waiting' && now - r.lastActive < 30 * 60 * 1000)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function createRoom(
  hostUser: RoomParticipant,
  mode: 'casual' | 'ranked' = 'casual',
  mapId: string = 'castle'
): DbOnlineRoom {
  const db = loadDatabase();

  // Generate unique 4-digit code e.g. "4921"
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
    mode,
    mapId,
    status: 'waiting',
    battleState: null,
    createdAt: Date.now(),
    lastActive: Date.now(),
  };

  db.rooms[code] = room;
  saveDatabase();
  return room;
}

export function updateRoom(room: DbOnlineRoom): DbOnlineRoom {
  const db = loadDatabase();
  room.lastActive = Date.now();
  db.rooms[room.code.toUpperCase()] = room;
  saveDatabase();
  return room;
}

export function deleteRoom(code: string): void {
  const db = loadDatabase();
  delete db.rooms[code.toUpperCase()];
  saveDatabase();
}
