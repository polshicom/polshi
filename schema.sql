-- Polshi Database Schema
-- Run this in the Supabase SQL Editor

-- ── NextAuth tables ───────────────────────────────

create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  name text,
  email text unique,
  "emailVerified" timestamptz,
  image text,
  password_hash text
);

create table if not exists accounts (
  id uuid default gen_random_uuid() primary key,
  "userId" uuid not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  unique (provider, "providerAccountId")
);

create table if not exists sessions (
  id uuid default gen_random_uuid() primary key,
  "sessionToken" text unique not null,
  "userId" uuid not null references users(id) on delete cascade,
  expires timestamptz not null
);

create table if not exists verification_tokens (
  identifier text not null,
  token text unique not null,
  expires timestamptz not null,
  primary key (identifier, token)
);

-- ── Subscriptions ─────────────────────────────────

create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid unique not null references users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan text not null default 'free',
  billing_interval text check (billing_interval in ('monthly', 'yearly')),
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Watchlists ────────────────────────────────────

create table if not exists watchlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references users(id) on delete cascade,
  market_question text not null,
  alert_threshold integer default 5,
  created_at timestamptz default now()
);

-- ── User Settings ─────────────────────────────────

create table if not exists user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid unique not null references users(id) on delete cascade,
  discord_webhook_url text,
  default_alert_threshold integer default 5,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Indexes ───────────────────────────────────────

create index if not exists idx_accounts_user on accounts("userId");
create index if not exists idx_sessions_user on sessions("userId");
create index if not exists idx_subscriptions_user on subscriptions(user_id);
create index if not exists idx_subscriptions_stripe_sub on subscriptions(stripe_subscription_id);
create index if not exists idx_watchlists_user on watchlists(user_id);
create index if not exists idx_user_settings_user on user_settings(user_id);
