-- ======================================================================
-- DICE MANIAC: POSTGRESQL SCHEMA FOR SUPABASE
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ======================================================================

-- 1. Create Users Table (Persistent Heroes & Stats)
create table if not exists public.users (
  id text primary key,
  username text unique not null,
  email text,
  password_hash text,
  avatar_config jsonb default '{}'::jsonb,
  selected_class text default 'warrior',
  selected_weapon text default 'greatsword',
  tier int default 1,
  rank_points int default 1000,
  wins int default 0,
  losses int default 0,
  bio text default 'Challenger ready to roll the D20 in Dice Maniac.',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Index for instant username lookups
create index if not exists idx_users_username on public.users (username);

-- 2. Create Rooms Table (Realtime Multiplayer Turn Sync)
create table if not exists public.rooms (
  code text primary key,
  id text not null,
  host jsonb not null,
  guest jsonb,
  mode text default 'casual',
  map_id text default 'castle',
  status text default 'waiting',
  battle_state jsonb,
  created_at bigint not null,
  last_active bigint not null
);

-- Index for code search
create index if not exists idx_rooms_code on public.rooms (code);

-- 3. Enable Row Level Security (RLS) & Public Access Policies
alter table public.users enable row level security;
alter table public.rooms enable row level security;

-- Allow public read/write for game functions (via Anon key)
drop policy if exists "Allow public select users" on public.users;
create policy "Allow public select users" on public.users for select using (true);

drop policy if exists "Allow public insert users" on public.users;
create policy "Allow public insert users" on public.users for insert with check (true);

drop policy if exists "Allow public update users" on public.users;
create policy "Allow public update users" on public.users for update using (true);

drop policy if exists "Allow public all rooms" on public.rooms;
create policy "Allow public all rooms" on public.rooms for all using (true) with check (true);

-- 4. Enable Realtime Replication for Rooms
alter publication supabase_realtime add table public.rooms;
