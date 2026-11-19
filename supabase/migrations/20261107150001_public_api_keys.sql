-- Public API (supabase/functions/api): developer and app keys, and a log of runs made with them.
-- Keys are stored only as a SHA-256 hash. Only the api function (service role) creates, uses or revokes them;
-- people can read their own keys' public details and their own run log.

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'API key',
  app text,
  prefix text not null,
  key_hash text not null unique,
  daily_cap integer not null default 500 check (daily_cap between 1 and 100000),
  allowed_tools text[],
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
create index if not exists api_keys_user_idx on public.api_keys (user_id);
alter table public.api_keys enable row level security;
drop policy if exists "api_keys_read_own" on public.api_keys;
create policy "api_keys_read_own" on public.api_keys for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.api_keys from anon, authenticated;
revoke select on public.api_keys from anon, authenticated;
grant select (id, user_id, name, app, prefix, daily_cap, allowed_tools, created_at, last_used_at, revoked_at) on public.api_keys to authenticated;

create table if not exists public.api_key_runs (
  id bigserial primary key,
  key_id uuid references public.api_keys(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_id text not null,
  run_id uuid,
  credits integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists api_key_runs_key_day_idx on public.api_key_runs (key_id, created_at desc);
create index if not exists api_key_runs_user_idx on public.api_key_runs (user_id, created_at desc);
alter table public.api_key_runs enable row level security;
drop policy if exists "api_key_runs_read_own" on public.api_key_runs;
create policy "api_key_runs_read_own" on public.api_key_runs for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.api_key_runs from anon, authenticated;
