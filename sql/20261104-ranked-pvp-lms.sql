-- Ranked PvP and 3–4 player Last Man Standing migration.
-- Safe to run after supabase-setup.sql or supabase_schema.sql.

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS game_mode text NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS max_players integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS participants jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rooms_game_mode_check') THEN
    ALTER TABLE public.rooms ADD CONSTRAINT rooms_game_mode_check
      CHECK (game_mode IN ('classic', 'last_man_standing'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rooms_max_players_check') THEN
    ALTER TABLE public.rooms ADD CONSTRAINT rooms_max_players_check
      CHECK (max_players BETWEEN 2 AND 4);
  END IF;
END $$;

UPDATE public.rooms
SET max_players = CASE WHEN game_mode = 'last_man_standing' THEN 4 ELSE 2 END
WHERE max_players = 2 AND game_mode = 'last_man_standing';

CREATE INDEX IF NOT EXISTS idx_rooms_matchmaking
  ON public.rooms (mode, game_mode, status, created_at);

CREATE TABLE IF NOT EXISTS public.ranked_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  winner_id text,
  participants jsonb NOT NULL,
  rating_changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  game_mode text NOT NULL DEFAULT 'classic',
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ranked_matches_mode_check CHECK (game_mode IN ('classic', 'last_man_standing'))
);

CREATE INDEX IF NOT EXISTS idx_ranked_matches_finished
  ON public.ranked_matches (finished_at DESC);

ALTER TABLE public.ranked_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read ranked matches" ON public.ranked_matches;
CREATE POLICY "Public can read ranked matches" ON public.ranked_matches
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can record ranked matches" ON public.ranked_matches;
CREATE POLICY "Public can record ranked matches" ON public.ranked_matches
  FOR INSERT WITH CHECK (true);

-- Keep the existing profile/user rating columns usable by the ranked queue.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rank_points integer NOT NULL DEFAULT 1000;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wins integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS losses integer NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rank_points integer NOT NULL DEFAULT 1000;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wins integer NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS losses integer NOT NULL DEFAULT 0;

ALTER PUBLICATION supabase_realtime ADD TABLE public.ranked_matches;
