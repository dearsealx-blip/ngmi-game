-- NGMI Game: Missing Supabase Tables
-- Run in Supabase SQL Editor

-- 1. STREAKS
create table if not exists public.streaks (
  id bigserial primary key,
  username text not null unique,
  streak_count integer not null default 0,
  last_played date not null default current_date,
  best_streak integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.streaks enable row level security;
create policy "Public read" on public.streaks for select using (true);
create policy "Public upsert" on public.streaks for insert with check (true);
create policy "Public update" on public.streaks for update using (true);

-- 2. ACHIEVEMENTS
create table if not exists public.achievements (
  id bigserial primary key,
  username text not null,
  achievement_id text not null,
  achievement_name text not null,
  unlocked_at timestamptz not null default now(),
  unique(username, achievement_id)
);
alter table public.achievements enable row level security;
create policy "Public read" on public.achievements for select using (true);
create policy "Public insert" on public.achievements for insert with check (true);

-- 3. CLANS
create table if not exists public.clans (
  id bigserial primary key,
  name text not null unique,
  tag text not null unique,
  owner text not null,
  total_score bigint not null default 0,
  member_count integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.clans enable row level security;
create policy "Public read" on public.clans for select using (true);
create policy "Public insert" on public.clans for insert with check (true);
create policy "Public update" on public.clans for update using (true);

-- clan members junction
create table if not exists public.clan_members (
  id bigserial primary key,
  clan_id bigint references public.clans(id),
  username text not null,
  joined_at timestamptz not null default now(),
  unique(username)
);
alter table public.clan_members enable row level security;
create policy "Public read" on public.clan_members for select using (true);
create policy "Public insert" on public.clan_members for insert with check (true);

-- 4. REFERRALS
create table if not exists public.referrals (
  id bigserial primary key,
  referrer text not null,
  referred text not null unique,
  bonus_applied boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.referrals enable row level security;
create policy "Public read" on public.referrals for select using (true);
create policy "Public insert" on public.referrals for insert with check (true);
create policy "Public update" on public.referrals for update using (true);

-- 5. TOURNAMENTS
create table if not exists public.tournaments (
  id bigserial primary key,
  name text not null,
  group_id text,
  group_name text,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.tournaments enable row level security;
create policy "Public read" on public.tournaments for select using (true);
create policy "Public insert" on public.tournaments for insert with check (true);

-- tournament scores
create table if not exists public.tournament_scores (
  id bigserial primary key,
  tournament_id bigint references public.tournaments(id),
  username text not null,
  score integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.tournament_scores enable row level security;
create policy "Public read" on public.tournament_scores for select using (true);
create policy "Public insert" on public.tournament_scores for insert with check (true);

-- 6. SEASONS
create table if not exists public.seasons (
  id bigserial primary key,
  username text not null,
  score integer not null default 0,
  season_month text not null, -- e.g. '2026-02'
  group_id text,
  created_at timestamptz not null default now()
);
alter table public.seasons enable row level security;
create policy "Public read" on public.seasons for select using (true);
create policy "Public insert" on public.seasons for insert with check (true);

-- INDEX for fast leaderboard queries
create index if not exists idx_scores_created_at on public.scores(created_at);
create index if not exists idx_scores_group_id on public.scores(group_id);
create index if not exists idx_streaks_username on public.streaks(username);
create index if not exists idx_achievements_username on public.achievements(username);
create index if not exists idx_seasons_month on public.seasons(season_month);
create index if not exists idx_referrals_referrer on public.referrals(referrer);
