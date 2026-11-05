-- Correct win gains to percentages of a fixed 100 RP, preserving all current balances.
CREATE OR REPLACE FUNCTION public.game_rank_win_points(points int) RETURNS int LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT (ARRAY[100,100,90,80,60,50,10,10])[public.game_rank_index(points)+1];
$$;
REVOKE ALL ON FUNCTION public.game_rank_win_points(int) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.game_rank_win_points(int) TO service_role;
