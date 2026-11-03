-- ============================================================
-- SUPABASE REALTIME MULTIPLAYER SCHEMA FOR DICE MANIAC
-- Game Tung Xúc Xắc 20 Mặt (TheTurnBaseGame)
-- ============================================================

-- 1. Bật tính năng Realtime cho các bảng
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Bảng Profiles (Hồ sơ người chơi)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Hero',
  avatar_config JSONB DEFAULT '{
    "baseIndex": 0,
    "hairIndex": 0,
    "hairColor": "#ffe066",
    "skinColor": "#f8d5b8",
    "shirtIndex": 0,
    "shirtColor": "#4d94ff",
    "pantsIndex": 0,
    "pantsColor": "#2d3748",
    "accessoryIndex": 0,
    "faceIndex": 0
  }'::jsonb,
  selected_class TEXT DEFAULT 'warrior',
  selected_weapon TEXT DEFAULT 'greatsword',
  rank_points INTEGER DEFAULT 1000,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Bảng Rooms (Phòng đấu Online Realtime)
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  host_name TEXT NOT NULL DEFAULT 'Host',
  guest_id TEXT,
  guest_name TEXT,
  mode TEXT NOT NULL DEFAULT 'casual' CHECK (mode IN ('ranked', 'casual')),
  game_mode TEXT NOT NULL DEFAULT 'classic' CHECK (game_mode IN ('last_man_standing', 'pve', 'classic')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'playing', 'finished')),
  host_ready BOOLEAN DEFAULT true,
  guest_ready BOOLEAN DEFAULT false,
  host_class TEXT DEFAULT 'warrior',
  guest_class TEXT,
  host_weapon TEXT DEFAULT 'greatsword',
  guest_weapon TEXT,
  map_id TEXT DEFAULT 'castle',
  battle_state JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bảng Battles (Đồng bộ trạng thái trận đấu từng lượt)
CREATE TABLE IF NOT EXISTS public.battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT REFERENCES public.rooms(id) ON DELETE CASCADE,
  player1_id TEXT NOT NULL,
  player2_id TEXT NOT NULL,
  player1_state JSONB NOT NULL,
  player2_state JSONB NOT NULL,
  current_turn INTEGER DEFAULT 1,
  attacker_id TEXT NOT NULL,
  phase TEXT DEFAULT 'rolling_d20',
  d20_results JSONB,
  d6_results JSONB,
  battle_log JSONB DEFAULT '[]'::jsonb,
  winner_id TEXT,
  map_id TEXT DEFAULT 'castle',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Bảng Messages (Trò chuyện trong phòng đấu)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL DEFAULT 'Player',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 7. Row Level Security (RLS) - Cho phép đọc ghi phục vụ game turn-base
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public read rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow public create rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update rooms" ON public.rooms FOR UPDATE USING (true);
CREATE POLICY "Allow public delete rooms" ON public.rooms FOR DELETE USING (true);

CREATE POLICY "Allow public read battles" ON public.battles FOR SELECT USING (true);
CREATE POLICY "Allow public insert battles" ON public.battles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update battles" ON public.battles FOR UPDATE USING (true);

CREATE POLICY "Allow public read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert messages" ON public.messages FOR INSERT WITH CHECK (true);

-- 8. Tự động dọn dẹp phòng cũ không hoạt động quá 2 giờ
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rooms
  WHERE (status = 'finished' AND updated_at < now() - INTERVAL '15 minutes')
     OR (status = 'waiting' AND created_at < now() - INTERVAL '2 hours');
END;
$$ LANGUAGE plpgsql;
