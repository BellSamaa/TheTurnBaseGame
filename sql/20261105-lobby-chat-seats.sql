ALTER TABLE public.game_lobby_players ADD COLUMN IF NOT EXISTS seat_id text;
CREATE UNIQUE INDEX IF NOT EXISTS game_lobby_seat_unique ON public.game_lobby_players(seat_id) WHERE seat_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.game_lobby_chat (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 message text NOT NULL CHECK(char_length(message) BETWEEN 1 AND 240),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS game_lobby_chat_recent ON public.game_lobby_chat(created_at DESC);
ALTER TABLE public.game_lobby_chat ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.game_lobby_chat FROM anon,authenticated;
GRANT ALL ON public.game_lobby_chat TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.game_lobby_chat_id_seq TO service_role;
