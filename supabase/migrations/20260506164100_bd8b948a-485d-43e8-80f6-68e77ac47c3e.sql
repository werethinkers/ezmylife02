create table public.tool_favorites (
  user_id uuid not null,
  tool_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, tool_id)
);
alter table public.tool_favorites enable row level security;
create policy "Users view own favorites" on public.tool_favorites for select using (auth.uid() = user_id);
create policy "Users insert own favorites" on public.tool_favorites for insert with check (auth.uid() = user_id);
create policy "Users delete own favorites" on public.tool_favorites for delete using (auth.uid() = user_id);
create index tool_favorites_user_idx on public.tool_favorites(user_id);