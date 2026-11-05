-- Repair SQLSTATE 21000: DELETE requires a WHERE clause.
-- Replaces only the lobby chat function. No account/rank schema or data reset.
-- Existing chat is deleted only when this function later detects an empty lobby.
BEGIN;
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

NOTIFY pgrst, 'reload schema';
COMMIT;
