-- Run both changes below. For abrupt-disconnect cleanup, enable pg_cron in Supabase Database > Extensions BEFORE running this file.

-- Correct win gains to percentages of a fixed 100 RP, preserving all current balances.
CREATE OR REPLACE FUNCTION public.game_rank_win_points(points int) RETURNS int LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT (ARRAY[100,100,90,80,60,50,10,10])[public.game_rank_index(points)+1];
$$;
REVOKE ALL ON FUNCTION public.game_rank_win_points(int) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.game_rank_win_points(int) TO service_role;

-- Per-tab occupancy lease; never stores movement coordinates.
CREATE TABLE IF NOT EXISTS public.game_lobby_sessions (
 session_id uuid PRIMARY KEY,
 user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '2 minutes'
);
ALTER TABLE public.game_lobby_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.game_lobby_sessions FROM public,anon,authenticated;
GRANT ALL ON public.game_lobby_sessions TO service_role;
CREATE INDEX IF NOT EXISTS game_lobby_sessions_expiry ON public.game_lobby_sessions(expires_at);
CREATE OR REPLACE FUNCTION public.game_lobby_chat_session(p_actor text,p_session uuid,p_action text,p_message text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SET search_path=public AS $$
DECLARE v_empty boolean;v_rows int;
BEGIN
 PERFORM pg_advisory_xact_lock(69231782);
 DELETE FROM game_lobby_sessions WHERE expires_at<=now();
 IF p_action NOT IN ('join','touch','leave','clean','read','send') THEN RAISE EXCEPTION 'Invalid action'; END IF;
 IF p_action IN ('join','touch') THEN
   IF p_actor IS NULL OR p_session IS NULL THEN RAISE EXCEPTION 'Session required';END IF;
   -- Clear a previous conversation before admitting the first participant.
   IF NOT EXISTS(SELECT 1 FROM game_lobby_sessions) THEN DELETE FROM game_lobby_chat WHERE id IS NOT NULL; END IF;
   INSERT INTO game_lobby_sessions(session_id,user_id,expires_at)VALUES(p_session,p_actor,now()+interval '2 minutes')
   ON CONFLICT(session_id) DO UPDATE SET expires_at=excluded.expires_at WHERE game_lobby_sessions.user_id=excluded.user_id;
 ELSIF p_action='leave' THEN
   DELETE FROM game_lobby_sessions WHERE session_id=p_session AND user_id=p_actor;
 END IF;
 SELECT NOT EXISTS(SELECT 1 FROM game_lobby_sessions) INTO v_empty;
 IF v_empty THEN DELETE FROM game_lobby_chat WHERE id IS NOT NULL;END IF;
 IF p_action='send' THEN
  IF NOT EXISTS(SELECT 1 FROM game_lobby_sessions WHERE user_id=p_actor) THEN RAISE EXCEPTION 'Enter lobby before chatting';END IF;
  IF p_message IS NULL OR length(trim(p_message))<1 OR length(p_message)>240 THEN RAISE EXCEPTION '1–240 characters required';END IF;
  IF EXISTS(SELECT 1 FROM game_lobby_chat WHERE user_id=p_actor AND created_at>now()-interval '1 second') THEN RAISE EXCEPTION 'Please wait a second';END IF;
  INSERT INTO game_lobby_chat(user_id,message)VALUES(p_actor,trim(p_message));
 END IF;
 RETURN jsonb_build_object('messages',(SELECT coalesce(jsonb_agg(row_to_json(m)),'[]'::jsonb)FROM(SELECT c.id,c.message,c.created_at,jsonb_build_object('username',u.username)AS users FROM (SELECT * FROM game_lobby_chat ORDER BY id DESC LIMIT 40)c JOIN users u ON u.id=c.user_id ORDER BY c.id)m),'empty',v_empty,'count',(SELECT count(*)FROM game_lobby_sessions));
END $$;
REVOKE ALL ON FUNCTION public.game_lobby_chat_session(text,uuid,text,text) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.game_lobby_chat_session(text,uuid,text,text) TO service_role;
-- Optional periodic cleanup for tabs killed without a leave request.
-- Supabase: enable pg_cron in Database > Extensions if it is not already enabled.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
  IF NOT EXISTS(SELECT 1 FROM cron.job WHERE jobname='dice-lobby-empty-chat') THEN
   PERFORM cron.schedule('dice-lobby-empty-chat','* * * * *',$job$SELECT public.game_lobby_chat_session(NULL,NULL,'clean');$job$);
  END IF;
 END IF;
END $$;
