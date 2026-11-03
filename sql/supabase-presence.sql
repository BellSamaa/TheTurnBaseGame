-- Run after social-wardrobe + social-runtime. Tracks each browser tab separately.
begin;
create table if not exists public.player_presence (
 user_id text not null references public.users(id) on delete cascade,
 tab_id uuid not null,
 activity text not null check(activity in ('online','lobby','battle')),
 last_seen timestamptz not null default now(),
 primary key(user_id,tab_id)
);
create index if not exists presence_last_seen on public.player_presence(last_seen);
alter table public.player_presence enable row level security;
revoke all on public.player_presence from public,anon,authenticated;
grant all on public.player_presence to service_role;
create or replace function public.game_presence(p_actor text,p_tab uuid,p_activity text)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if p_activity='offline' then
   delete from public.player_presence where user_id=p_actor and tab_id=p_tab;
 else
   insert into public.player_presence(user_id,tab_id,activity,last_seen) values(p_actor,p_tab,p_activity,now())
   on conflict(user_id,tab_id) do update set activity=excluded.activity,last_seen=excluded.last_seen;
 end if;
 delete from public.player_presence where last_seen<now()-interval '1 day';
end $$;
revoke all on function public.game_presence(text,uuid,text) from public,anon,authenticated;
grant execute on function public.game_presence(text,uuid,text) to service_role;
commit;
