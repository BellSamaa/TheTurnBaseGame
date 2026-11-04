-- Shared lobby positions. Run after the existing account migrations.
CREATE TABLE IF NOT EXISTS public.game_lobby_players (
 user_id text PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
 x double precision NOT NULL DEFAULT 0,
 z double precision NOT NULL DEFAULT 5,
 facing text NOT NULL DEFAULT 'right',
 moving boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (x BETWEEN -9.3 AND 9.3 AND z BETWEEN -6.7 AND 6.7),
 CHECK (facing IN ('left','right'))
);
ALTER TABLE public.game_lobby_players ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.game_lobby_players FROM anon,authenticated;
GRANT ALL ON public.game_lobby_players TO service_role;
CREATE INDEX IF NOT EXISTS game_lobby_players_updated ON public.game_lobby_players(updated_at);
