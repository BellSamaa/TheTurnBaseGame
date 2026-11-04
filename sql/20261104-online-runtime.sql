BEGIN;
-- Battle state contains private buffs: browser access goes through authenticated API only.
REVOKE ALL ON public.rooms FROM public,anon,authenticated;
GRANT ALL ON public.rooms TO service_role;
CREATE TABLE IF NOT EXISTS public.game_queue(user_id text PRIMARY KEY,payload jsonb NOT NULL,joined_at timestamptz NOT NULL DEFAULT now(),room_code text);
CREATE TABLE IF NOT EXISTS public.game_room_invites(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),room_code text NOT NULL,sender_id text NOT NULL,receiver_id text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(room_code,receiver_id));
CREATE TABLE IF NOT EXISTS public.game_rank_results(battle_id text PRIMARY KEY,room_code text NOT NULL,winner_id text NOT NULL,changes jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.game_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_room_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rank_results ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.game_queue,public.game_room_invites,public.game_rank_results FROM public,anon,authenticated;
GRANT ALL ON public.game_queue,public.game_room_invites,public.game_rank_results TO service_role;
CREATE OR REPLACE FUNCTION public.game_match(p_actor text,p_action text,p_payload jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SET search_path=public AS $$
#variable_conflict use_variable
DECLARE own game_queue; other game_queue; code text; stamp bigint; battle jsonb; h jsonb; g jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(724019);
 DELETE FROM game_queue WHERE joined_at<now()-interval '90 seconds' AND room_code IS NULL;
 SELECT * INTO own FROM game_queue WHERE user_id=p_actor;
 IF p_action='leave' THEN DELETE FROM game_queue WHERE user_id=p_actor AND room_code IS NULL; RETURN '{}'; END IF;
 IF own.room_code IS NOT NULL AND p_action='join' AND NOT EXISTS(SELECT 1 FROM rooms WHERE rooms.code=own.room_code AND status='playing') THEN DELETE FROM game_queue WHERE user_id=p_actor;own.room_code:=NULL;END IF;
 IF own.room_code IS NOT NULL THEN RETURN jsonb_build_object('matched',true,'roomCode',own.room_code); END IF;
 IF p_action='poll' THEN RETURN jsonb_build_object('matched',false,'expired',own.user_id IS NULL); END IF;
 IF NOT EXISTS(SELECT 1 FROM users WHERE id=p_actor) THEN RAISE EXCEPTION 'Account missing'; END IF;
 INSERT INTO game_queue(user_id,payload) VALUES(p_actor,p_payload) ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload;
 SELECT * INTO other FROM game_queue WHERE user_id<>p_actor AND room_code IS NULL ORDER BY joined_at LIMIT 1 FOR UPDATE;
 IF other.user_id IS NULL THEN RETURN jsonb_build_object('matched',false); END IF;
 LOOP
  code:=(1000+floor(random()*9000))::int::text;
  EXIT WHEN NOT EXISTS(SELECT 1 FROM rooms r WHERE r.code=code);
 END LOOP;
 stamp:=(extract(epoch FROM clock_timestamp())*1000)::bigint;
 h:=other.payload->'participant';g:=p_payload->'participant';
 battle:=(p_payload->'battle')||jsonb_build_object('id','rank_'||code||'_'||stamp,'player1',(other.payload->'player')||'{"isAttacker":true}'::jsonb,'player2',(p_payload->'player')||'{"isAttacker":false}'::jsonb,'attackerId',other.user_id,'isAiOpponent',false,'revision',0);
 INSERT INTO rooms(code,id,host,guest,participants,max_players,game_mode,mode,map_id,status,battle_state,created_at,last_active)
 VALUES(code,'room_'||code||'_'||stamp,h,g,jsonb_build_array(h,g),2,'classic','ranked','castle','playing',battle,stamp,stamp);
 UPDATE game_queue SET room_code=code WHERE user_id IN(p_actor,other.user_id);
 RETURN jsonb_build_object('matched',true,'roomCode',code);
END $$;
REVOKE ALL ON FUNCTION public.game_match(text,text,jsonb) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.game_match(text,text,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.game_finish_rank(p_code text) RETURNS jsonb LANGUAGE plpgsql SET search_path=public AS $$
DECLARE r rooms; winner text; ids text[]; uid text; rating integer; winner_rating integer; delta integer; changes jsonb:='{}'; v_battle_id text;
BEGIN
 SELECT * INTO r FROM rooms WHERE code=p_code FOR UPDATE;
 winner:=r.battle_state->>'winnerId';v_battle_id:=r.battle_state->>'id';
 IF winner IS NULL OR r.status<>'finished' OR r.mode<>'ranked' THEN RETURN '{}'; END IF;
 IF EXISTS(SELECT 1 FROM game_rank_results WHERE game_rank_results.battle_id=v_battle_id) THEN RETURN (SELECT game_rank_results.changes FROM game_rank_results WHERE game_rank_results.battle_id=v_battle_id); END IF;
 SELECT array_agg(p->>'id') INTO ids FROM jsonb_array_elements(r.participants) p;
 IF NOT winner=ANY(ids) THEN RAISE EXCEPTION 'Invalid winner'; END IF;
 PERFORM 1 FROM users WHERE id=ANY(ids) ORDER BY id FOR UPDATE;
 SELECT rank_points INTO winner_rating FROM users WHERE id=winner;
 FOREACH uid IN ARRAY ids LOOP
  SELECT rank_points INTO rating FROM users WHERE id=uid;
  IF uid=winner THEN CONTINUE; END IF;
  delta:=greatest(1,round(32*(1-1/(1+power(10.0,(rating-winner_rating)/400.0))))::int);
  changes:=changes||jsonb_build_object(uid,-least(rating,delta));
 END LOOP;
 SELECT coalesce(sum(-(value::text)::int),0) INTO delta FROM jsonb_each(changes);
 changes:=changes||jsonb_build_object(winner,delta);
 FOREACH uid IN ARRAY ids LOOP
  UPDATE users SET rank_points=greatest(0,rank_points+(changes->>uid)::int),wins=coalesce(wins,0)+CASE WHEN uid=winner THEN 1 ELSE 0 END,losses=coalesce(losses,0)+CASE WHEN uid<>winner THEN 1 ELSE 0 END WHERE id=uid;
  UPDATE users SET tier=CASE WHEN rank_points>=2100 THEN 7 WHEN rank_points>=1900 THEN 6 WHEN rank_points>=1700 THEN 5 WHEN rank_points>=1500 THEN 4 WHEN rank_points>=1300 THEN 3 WHEN rank_points>=1100 THEN 2 ELSE 1 END WHERE id=uid;
 END LOOP;
 INSERT INTO game_rank_results(battle_id,room_code,winner_id,changes) VALUES(v_battle_id,p_code,winner,changes);
 UPDATE rooms SET ranked_result_recorded=true WHERE code=p_code;
 RETURN changes;
END $$;
REVOKE ALL ON FUNCTION public.game_finish_rank(text) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.game_finish_rank(text) TO service_role;
COMMIT;

-- Existing-room foreign key compatibility, without assuming a constraint name.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=ANY(i.indkey) WHERE i.indrelid='public.rooms'::regclass AND i.indisunique AND i.indnkeyatts=1 AND a.attname='id') THEN
  ALTER TABLE public.rooms ADD CONSTRAINT rooms_runtime_id_unique UNIQUE(id);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=ANY(i.indkey) WHERE i.indrelid='public.rooms'::regclass AND i.indisunique AND i.indnkeyatts=1 AND a.attname='code') THEN
  ALTER TABLE public.rooms ADD CONSTRAINT rooms_runtime_code_unique UNIQUE(code);
 END IF;
END $$;
