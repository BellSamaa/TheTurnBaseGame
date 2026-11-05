-- Apply after progression migrations. Keeps accounts, results, gifts and balances.
BEGIN;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '';
-- Display Callsign is the existing users.username column (same name used in game).
CREATE OR REPLACE FUNCTION public.game_rank_win_points(points int) RETURNS int LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT (ARRAY[100,150,198,256,270,325,90,130])[public.game_rank_index(points)+1];
$$;
REVOKE ALL ON FUNCTION public.game_rank_win_points(int) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.game_rank_win_points(int) TO service_role;
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
 delta:=public.game_rank_win_points(winner_rating);
 changes:=changes||jsonb_build_object(winner,delta);
 FOREACH uid IN ARRAY ids LOOP
  PERFORM game_credit(uid,'match:'||v_battle_id,CASE WHEN r.game_mode='last_man_standing' THEN CASE WHEN uid=winner THEN 60 ELSE 15 END ELSE CASE WHEN uid=winner THEN 100 ELSE 30 END END,CASE WHEN r.game_mode='last_man_standing' THEN CASE WHEN uid=winner THEN 2 ELSE 0 END ELSE CASE WHEN uid=winner THEN 5 ELSE 1 END END,CASE WHEN r.game_mode='last_man_standing' THEN CASE WHEN uid=winner THEN 150 ELSE 50 END ELSE CASE WHEN uid=winner THEN 250 ELSE 80 END END);
  UPDATE users SET rank_points=greatest(0,rank_points+(changes->>uid)::int),wins=coalesce(wins,0)+CASE WHEN uid=winner THEN 1 ELSE 0 END,losses=coalesce(losses,0)+CASE WHEN uid<>winner THEN 1 ELSE 0 END WHERE id=uid;
  UPDATE users SET tier=game_rank_index(rank_points)+1 WHERE id=uid;
  UPDATE game_accounts SET highest_rank=greatest(highest_rank,(SELECT game_rank_index(rank_points)FROM users WHERE id=uid))WHERE user_id=uid;
 END LOOP;
 INSERT INTO game_rank_results(battle_id,room_code,winner_id,changes) VALUES(v_battle_id,p_code,winner,changes);
 UPDATE rooms SET ranked_result_recorded=true WHERE code=p_code;
 RETURN changes;
END $$;

COMMIT;
