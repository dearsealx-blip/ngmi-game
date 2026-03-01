// Run once to create tournament tables in Supabase
// node create-tournament-tables.js
const https = require('https');
const URL = 'https://rfixnwwzkvkzcfidjzer.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmaXhud3d6a3ZremNmaWRqemVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI0MjgxNiwiZXhwIjoyMDg3ODE4ODE2fQ.bCZJ9FXK8l2T-PikhWIL7tBUjAsV70SPgHhtACJkOl0';

// Use Supabase REST to create tables via SQL editor instead
// Run these in Supabase SQL editor: https://supabase.com/dashboard/project/rfixnwwzkvkzcfidjzer/sql

const SQL = `
-- Tournaments table
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  status text default 'active',
  started_at timestamptz default now(),
  ends_at timestamptz,
  entry_stars int default 5,
  total_stars int default 0,
  winner_username text,
  winner_tg_id text,
  winner_score int,
  winner_paid bool default false
);
alter table public.tournaments enable row level security;
create policy "Public read" on public.tournaments for select using (true);

-- Tournament entries
create table if not exists public.tournament_entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id),
  username text,
  tg_id text,
  score int default 0,
  payment_id text unique,
  entered_at timestamptz default now()
);
alter table public.tournament_entries enable row level security;
create policy "Public read" on public.tournament_entries for select using (true);
create policy "Public insert" on public.tournament_entries for insert with check (true);
create policy "Public update" on public.tournament_entries for update using (true);
`;

console.log('Run this SQL in Supabase dashboard:');
console.log('https://supabase.com/dashboard/project/rfixnwwzkvkzcfidjzer/sql/new');
console.log('\n' + SQL);
