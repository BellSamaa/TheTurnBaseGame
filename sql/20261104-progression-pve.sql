-- Run after sql/20261104-online-runtime.sql. Safe to run again.
BEGIN;
CREATE TABLE IF NOT EXISTS public.game_accounts(user_id text PRIMARY KEY, gems bigint NOT NULL DEFAULT 0 CHECK(gems>=0),rubies bigint NOT NULL DEFAULT 0 CHECK(rubies>=0),exp bigint NOT NULL DEFAULT 0 CHECK(exp>=0),equipped_frame int NOT NULL DEFAULT 0 CHECK(equipped_frame BETWEEN 0 AND 7));
ALTER TABLE public.game_accounts ADD COLUMN IF NOT EXISTS highest_rank int NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS public.game_reward_ledger(event_key text NOT NULL,user_id text NOT NULL,gems bigint NOT NULL,rubies bigint NOT NULL,exp bigint NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(event_key,user_id));
CREATE TABLE IF NOT EXISTS public.game_owned_frames(user_id text NOT NULL,rank_id int NOT NULL CHECK(rank_id BETWEEN 1 AND 7),PRIMARY KEY(user_id,rank_id));
CREATE TABLE IF NOT EXISTS public.game_pve_runs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id text NOT NULL,state jsonb NOT NULL,revision int NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS game_pve_owner ON public.game_pve_runs(user_id,created_at DESC);
ALTER TABLE public.game_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_reward_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_owned_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_pve_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.game_accounts,public.game_reward_ledger,public.game_owned_frames,public.game_pve_runs FROM public,anon,authenticated;
GRANT ALL ON public.game_accounts,public.game_reward_ledger,public.game_owned_frames,public.game_pve_runs TO service_role;
CREATE OR REPLACE FUNCTION public.game_credit(p_user text,p_event text,p_gems bigint,p_rubies bigint,p_exp bigint) RETURNS boolean LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF p_gems<0 OR p_rubies<0 OR p_exp<0 THEN RAISE EXCEPTION 'Invalid reward'; END IF;
 INSERT INTO game_accounts(user_id)VALUES(p_user)ON CONFLICT DO NOTHING;
 INSERT INTO game_reward_ledger(event_key,user_id,gems,rubies,exp)VALUES(p_event,p_user,p_gems,p_rubies,p_exp)ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE game_accounts SET gems=gems+p_gems,rubies=rubies+p_rubies,exp=exp+p_exp WHERE user_id=p_user;
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.game_rank_index(p_points int)RETURNS int LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE remaining int:=greatest(0,p_points-1000);costs int[]:=ARRAY[100,150,220,320,450,650,900,1300];r int:=0;
BEGIN WHILE r<7 AND remaining>=costs[r+1]*5 LOOP remaining:=remaining-costs[r+1]*5;r:=r+1;END LOOP;RETURN r;END $$;
CREATE OR REPLACE FUNCTION public.game_progress(p_actor text,p_action text DEFAULT 'get',p_rank int DEFAULT 0)RETURNS jsonb LANGUAGE plpgsql SET search_path=public AS $$
DECLARE result jsonb;points int;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM users WHERE id=p_actor)THEN RAISE EXCEPTION 'Account missing';END IF;
 INSERT INTO game_accounts(user_id)VALUES(p_actor)ON CONFLICT DO NOTHING;
 PERFORM 1 FROM game_accounts WHERE user_id=p_actor FOR UPDATE;
 SELECT rank_points INTO points FROM users WHERE id=p_actor;
 UPDATE game_accounts SET highest_rank=greatest(highest_rank,game_rank_index(points))WHERE user_id=p_actor;
 IF p_action='claim' THEN
  IF p_rank<0 OR p_rank>7 OR (SELECT highest_rank FROM game_accounts WHERE user_id=p_actor)<p_rank THEN RAISE EXCEPTION 'Chưa đạt rank này';END IF;
  IF game_credit(p_actor,'rank_gift:'||p_rank,100*(p_rank+1)*(p_rank+1),2*(p_rank+1)*(p_rank+1),0) AND p_rank>0 THEN INSERT INTO game_owned_frames VALUES(p_actor,p_rank)ON CONFLICT DO NOTHING;END IF;
 ELSIF p_action='equip' THEN
  IF p_rank<>0 AND NOT EXISTS(SELECT 1 FROM game_owned_frames WHERE user_id=p_actor AND rank_id=p_rank)THEN RAISE EXCEPTION 'Bạn chưa sở hữu khung';END IF;
  UPDATE game_accounts SET equipped_frame=p_rank WHERE user_id=p_actor;
 ELSIF p_action<>'get' THEN RAISE EXCEPTION 'Invalid action'; END IF;
 SELECT to_jsonb(a)||jsonb_build_object('rankPoints',points,'wins',u.wins,'losses',u.losses,'ownedFrames',coalesce((SELECT jsonb_agg(rank_id)FROM game_owned_frames WHERE user_id=p_actor),'[]'),'claimedRanks',coalesce((SELECT jsonb_agg(split_part(event_key,':',2)::int)FROM game_reward_ledger WHERE user_id=p_actor AND event_key LIKE 'rank_gift:%'),'[]')) INTO result FROM game_accounts a JOIN users u ON u.id=a.user_id WHERE a.user_id=p_actor;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.game_credit(text,text,bigint,bigint,bigint),public.game_progress(text,text,int),public.game_rank_index(int) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.game_credit(text,text,bigint,bigint,bigint),public.game_progress(text,text,int),public.game_rank_index(int) TO service_role;
COMMIT;

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
  PERFORM game_credit(uid,'match:'||v_battle_id,CASE WHEN r.game_mode='last_man_standing' THEN CASE WHEN uid=winner THEN 60 ELSE 15 END ELSE CASE WHEN uid=winner THEN 100 ELSE 30 END END,CASE WHEN r.game_mode='last_man_standing' THEN CASE WHEN uid=winner THEN 2 ELSE 0 END ELSE CASE WHEN uid=winner THEN 5 ELSE 1 END END,CASE WHEN r.game_mode='last_man_standing' THEN CASE WHEN uid=winner THEN 150 ELSE 50 END ELSE CASE WHEN uid=winner THEN 250 ELSE 80 END END);
  UPDATE users SET rank_points=greatest(0,rank_points+(changes->>uid)::int),wins=coalesce(wins,0)+CASE WHEN uid=winner THEN 1 ELSE 0 END,losses=coalesce(losses,0)+CASE WHEN uid<>winner THEN 1 ELSE 0 END WHERE id=uid;
  UPDATE users SET tier=game_rank_index(rank_points)+1 WHERE id=uid;
  UPDATE game_accounts SET highest_rank=greatest(highest_rank,(SELECT game_rank_index(rank_points)FROM users WHERE id=uid))WHERE user_id=uid;
 END LOOP;
 INSERT INTO game_rank_results(battle_id,room_code,winner_id,changes) VALUES(v_battle_id,p_code,winner,changes);
 UPDATE rooms SET ranked_result_recorded=true WHERE code=p_code;
 RETURN changes;
END $$;
ALTER TABLE public.game_pve_runs ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS game_pve_one_active ON public.game_pve_runs(user_id) WHERE active;
CREATE OR REPLACE FUNCTION public.game_save_pve(p_actor text,p_run uuid,p_revision int,p_state jsonb)RETURNS jsonb LANGUAGE plpgsql SET search_path=public AS $$
DECLARE run game_pve_runs;n int;g bigint;r bigint;x bigint;
BEGIN
 SELECT * INTO run FROM game_pve_runs WHERE id=p_run AND user_id=p_actor FOR UPDATE;
 IF run.id IS NULL OR run.revision<>p_revision THEN RAISE EXCEPTION 'Trận đã cập nhật, hãy thử lại';END IF;
 UPDATE game_pve_runs SET state=p_state,revision=revision+1,updated_at=now(),active=NOT(p_state->'combat'->>'phase'='finished' AND p_state->'combat'->>'winner'<>p_actor) WHERE id=p_run RETURNING * INTO run;
 IF p_state->'combat'->>'winner'=p_actor THEN
  n:=least(100,greatest(1,(p_state->>'stage')::int));g:=floor(12+6*power(n,1.3));r:=CASE WHEN n>=8 THEN 2 WHEN n>=5 THEN 1 ELSE 0 END;x:=floor(20+12*power(n,1.4));
  PERFORM game_credit(p_actor,'pve:'||p_run||':'||(p_state->>'stage'),g,r,x);
 END IF;
 RETURN to_jsonb(run);
END $$;
REVOKE ALL ON FUNCTION public.game_save_pve(text,uuid,int,jsonb)FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.game_save_pve(text,uuid,int,jsonb)TO service_role;
