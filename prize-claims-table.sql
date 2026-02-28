-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/rfixnwwzkvkzcfidjzer/sql

CREATE TABLE IF NOT EXISTS prize_claims (
  id bigserial PRIMARY KEY,
  username text NOT NULL,
  wallet text NOT NULL,
  date text NOT NULL,
  prize text NOT NULL DEFAULT '5 TON',
  claimed_at timestamptz NOT NULL DEFAULT now(),
  paid boolean DEFAULT false,
  paid_at timestamptz,
  tx_hash text,
  UNIQUE(username, date)
);

-- Allow anon inserts (game submits claims without auth)
ALTER TABLE prize_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_insert" ON prize_claims FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_read_own" ON prize_claims FOR SELECT USING (true);
