-- ======================================================================
-- DICE MANIAC: MASTER SUPABASE MIGRATION SCRIPT
-- Paste this script into Supabase Dashboard -> SQL Editor and click RUN.
-- Safe to execute repeatedly without losing data or encountering 42830 errors.
-- ======================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE (Accounts, Heroes, Rank Points & Tiers)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  password_hash TEXT,
  avatar_config JSONB DEFAULT '{}'::jsonb,
  selected_class TEXT DEFAULT 'warrior',
  selected_weapon TEXT DEFAULT 'greatsword',
  tier INT DEFAULT 1,
  rank_points INT DEFAULT 1000,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  bio TEXT DEFAULT 'Dice Maniac Hero ready to roll!',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all required user columns exist if created previously
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tier INT DEFAULT 1;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rank_points INT DEFAULT 1000;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wins INT DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS losses INT DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS selected_class TEXT DEFAULT 'warrior';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS selected_weapon TEXT DEFAULT 'greatsword';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_config JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (username);
CREATE INDEX IF NOT EXISTS idx_users_rank ON public.users (rank_points DESC);

-- 3. ROOMS TABLE (Multiplayer Turn-Based Game Rooms & Last Man Standing)
CREATE TABLE IF NOT EXISTS public.rooms (
  code TEXT PRIMARY KEY,
  id TEXT NOT NULL,
  host JSONB NOT NULL,
  guest JSONB,
  participants JSONB DEFAULT '[]'::jsonb,
  max_players INT DEFAULT 2,
  game_mode TEXT DEFAULT 'classic',
  mode TEXT DEFAULT 'casual',
  map_id TEXT DEFAULT 'castle',
  status TEXT DEFAULT 'waiting',
  battle_state JSONB,
  ranked_result_recorded BOOLEAN DEFAULT false,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  last_active BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- Ensure all required room columns exist
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS participants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS max_players INT DEFAULT 2;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS game_mode TEXT DEFAULT 'classic';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'casual';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS map_id TEXT DEFAULT 'castle';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'waiting';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS battle_state JSONB;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS ranked_result_recorded BOOLEAN DEFAULT false;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS last_active BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint;

-- CRITICAL FIX FOR ERROR 42830:
-- Ensure BOTH "code" and "id" have UNIQUE constraints so any foreign key can reference either safely!
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.rooms'::regclass 
      AND (conname = 'rooms_code_unique' OR conname = 'rooms_pkey')
  ) THEN
    ALTER TABLE public.rooms ADD CONSTRAINT rooms_code_unique UNIQUE (code);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.rooms'::regclass 
      AND conname = 'rooms_id_unique'
  ) THEN
    ALTER TABLE public.rooms ADD CONSTRAINT rooms_id_unique UNIQUE (id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms (code);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON public.rooms (status, last_active);

-- 4. MATCHMAKING QUEUE TABLE (Real 1v1 Ranked Matchmaking Pool)
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  rank_points INT NOT NULL DEFAULT 1000,
  tier INT NOT NULL DEFAULT 1,
  class_type TEXT NOT NULL DEFAULT 'warrior',
  weapon_id TEXT NOT NULL DEFAULT 'greatsword',
  avatar_config JSONB DEFAULT '{}'::jsonb,
  matched_room_code TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matchmaking_active ON public.matchmaking_queue (joined_at);

-- 5. RANKED MATCHES HISTORY TABLE (Audit Log of Ladder Clashing)
CREATE TABLE IF NOT EXISTS public.ranked_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT,
  winner_id TEXT,
  participants JSONB NOT NULL,
  rating_changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  game_mode TEXT NOT NULL DEFAULT 'classic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ranked_matches_created ON public.ranked_matches (created_at DESC);

-- 6. ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranked_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public users access" ON public.users;
CREATE POLICY "Allow public users access" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public rooms access" ON public.rooms;
CREATE POLICY "Allow public rooms access" ON public.rooms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public matchmaking access" ON public.matchmaking_queue;
CREATE POLICY "Allow public matchmaking access" ON public.matchmaking_queue FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public ranked_matches access" ON public.ranked_matches;
CREATE POLICY "Allow public ranked_matches access" ON public.ranked_matches FOR ALL USING (true) WITH CHECK (true);

-- 7. ENABLE SUPABASE REALTIME REPLICATION
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'matchmaking_queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;
  END IF;
END $$;
