-- DICE MANIAC: social + wardrobe extension. Run in Supabase SQL Editor.
-- Requires existing public.users(id text). Does not delete accounts or change passwords.
-- Current game uses custom user IDs, NOT Supabase Auth UUIDs.
-- New private tables are SERVER ONLY: future APIs must validate a real session,
-- derive the actor ID server-side, and use SUPABASE_SERVICE_ROLE_KEY (never NEXT_PUBLIC).
-- This SQL alone does NOT enable friends/clans in the current UI.
begin;
create table if not exists public.account_settings (
 user_id text primary key references public.users(id) on delete cascade,
 allow_friend_requests boolean not null default true,
 show_presence boolean not null default true,
 updated_at timestamptz not null default now()
);
create table if not exists public.friendships (
 id uuid primary key default gen_random_uuid(),
 requester_id text not null references public.users(id) on delete cascade,
 recipient_id text not null references public.users(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (requester_id <> recipient_id)
);
create unique index if not exists friendships_pair_unique on public.friendships
 (least(requester_id,recipient_id), greatest(requester_id,recipient_id));
create index if not exists friendships_recipient_idx on public.friendships(recipient_id,status);
create index if not exists friendships_requester_idx on public.friendships(requester_id,status);
create table if not exists public.player_blocks (
 blocker_id text references public.users(id) on delete cascade,
 blocked_id text references public.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(blocker_id,blocked_id), check(blocker_id <> blocked_id)
);
create table if not exists public.clans (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(trim(name)) between 3 and 40),
 tag text not null check(tag ~ '^[A-Z0-9]{2,6}$'),
 description text not null default '' check(char_length(description)<=500),
 owner_id text not null references public.users(id) on delete restrict,
 created_at timestamptz not null default now()
);
create unique index if not exists clans_name_unique on public.clans(lower(name));
create unique index if not exists clans_tag_unique on public.clans(tag);
create table if not exists public.clan_members (
 clan_id uuid not null references public.clans(id) on delete cascade,
 user_id text not null references public.users(id) on delete cascade,
 role text not null default 'member' check(role in ('leader','officer','member')),
 joined_at timestamptz not null default now(),
 primary key(clan_id,user_id), unique(user_id)
);
create unique index if not exists clan_one_leader on public.clan_members(clan_id) where role='leader';
create table if not exists public.clan_invites (
 id uuid primary key default gen_random_uuid(),
 clan_id uuid not null references public.clans(id) on delete cascade,
 inviter_id text not null references public.users(id) on delete cascade,
 invitee_id text not null references public.users(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled')),
 expires_at timestamptz not null default now()+interval '7 days',
 created_at timestamptz not null default now(),
 check(inviter_id <> invitee_id)
);
create unique index if not exists clan_pending_invite on public.clan_invites(clan_id,invitee_id) where status='pending';
create index if not exists clan_invite_inbox on public.clan_invites(invitee_id,status);
create table if not exists public.cosmetics (
 id text primary key,
 slot text not null check(slot in ('hair','shirt','pants','accessory','face','body')),
 name text not null,
 asset_path text not null,
 sprite_index integer not null check(sprite_index>=0),
 rarity text not null default 'common' check(rarity in ('common','rare','epic','legendary','mythic','secret')),
 is_starter boolean not null default false,
 unique(id,slot)
);
create table if not exists public.player_cosmetics (
 user_id text references public.users(id) on delete cascade,
 cosmetic_id text references public.cosmetics(id) on delete cascade,
 acquired_at timestamptz not null default now(),
 primary key(user_id,cosmetic_id)
);
create table if not exists public.equipped_cosmetics (
 user_id text references public.users(id) on delete cascade,
 slot text not null,
 cosmetic_id text not null,
 color text check(color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
 primary key(user_id,slot),
 foreign key(user_id,cosmetic_id) references public.player_cosmetics(user_id,cosmetic_id) on delete cascade,
 foreign key(cosmetic_id,slot) references public.cosmetics(id,slot)
);
-- Transactional clan creation: owner and leader membership either both succeed or both fail.
create or replace function public.create_game_clan(p_actor text,p_name text,p_tag text,p_description text default '')
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid;
begin
 perform 1 from public.users where id=p_actor for update;
 if not found then raise exception 'Account not found'; end if;
 if exists(select 1 from public.clan_members where user_id=p_actor) then raise exception 'Already in a clan'; end if;
 insert into public.clans(name,tag,description,owner_id) values(trim(p_name),upper(trim(p_tag)),p_description,p_actor) returning id into v_id;
 insert into public.clan_members(clan_id,user_id,role) values(v_id,p_actor,'leader');
 return v_id;
end $$;
revoke all on function public.create_game_clan(text,text,text,text) from public,anon,authenticated;
grant execute on function public.create_game_clan(text,text,text,text) to service_role;
-- No permissive anonymous policies on private social/inventory data.
do $$ declare t text; begin
 foreach t in array array['account_settings','friendships','player_blocks','clans','clan_members','clan_invites','cosmetics','player_cosmetics','equipped_cosmetics'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on table public.%I from public, anon, authenticated',t);
 execute format('grant all on table public.%I to service_role',t);
 end loop;
end $$;
insert into public.account_settings(user_id) select id from public.users on conflict do nothing;
commit;

-- OPTIONAL ACCOUNT LOCKDOWN (run separately ONLY after setting the server-side
-- SUPABASE_SERVICE_ROLE_KEY in Vercel and verifying login/register with that key).
-- Existing public.users is already the account table: do NOT create a duplicate.
-- The current login stores plaintext and is NOT Supabase Auth. Do not hash existing
-- values with SQL: current login would break. Migrate login verification + sessions
-- first, then force password resets for exposed credentials.
-- begin;
-- revoke all on public.users from public, anon, authenticated;
-- grant all on public.users to service_role;
-- drop policy if exists "Allow public select users" on public.users;
-- drop policy if exists "Allow public insert users" on public.users;
-- drop policy if exists "Allow public update users" on public.users;
-- commit;
