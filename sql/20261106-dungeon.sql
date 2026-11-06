BEGIN;
CREATE TABLE IF NOT EXISTS public.game_dungeons(
  code text PRIMARY KEY,
  state jsonb NOT NULL,
  revision bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.game_dungeons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.game_dungeons FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.game_dungeons TO service_role;

CREATE OR REPLACE FUNCTION public.game_save_dungeon(p_code text,p_revision bigint,p_state jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE saved game_dungeons;old_floor int;new_floor int;uid text;
BEGIN
  SELECT * INTO saved FROM game_dungeons WHERE code=p_code FOR UPDATE;
  IF NOT FOUND OR saved.revision<>p_revision THEN RAISE EXCEPTION 'Dungeon changed; synchronize and retry';END IF;
  old_floor:=coalesce((saved.state->>'rewardFloor')::int,0);
  new_floor:=coalesce((p_state->>'rewardFloor')::int,0);
  IF new_floor>old_floor THEN
    FOR uid IN SELECT jsonb_array_elements_text(p_state->'rewardUsers') LOOP
      PERFORM game_credit(uid,'dungeon:'||p_code||':'||(saved.state->>'runId')||':'||new_floor,20*new_floor,
        CASE WHEN new_floor>=5 THEN new_floor/2 ELSE 0 END,50*new_floor);
    END LOOP;
  END IF;
  UPDATE game_dungeons SET state=p_state,revision=revision+1,updated_at=now() WHERE code=p_code RETURNING * INTO saved;
  RETURN to_jsonb(saved);
END $$;
REVOKE ALL ON FUNCTION public.game_save_dungeon(text,bigint,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.game_save_dungeon(text,bigint,jsonb) TO service_role;
COMMIT;
