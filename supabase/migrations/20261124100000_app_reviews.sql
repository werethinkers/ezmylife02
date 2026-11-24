-- User-submitted reviews for apps in the catalogue.
-- One review per user per app; rating 1–5 stars, optional short text.

create table public.app_reviews (
  id          uuid      primary key default gen_random_uuid(),
  tool_id     text      not null,
  user_id     uuid      not null references auth.users(id) on delete cascade,
  display_name text,
  rating      smallint  not null check (rating between 1 and 5),
  body        text      check (char_length(coalesce(body, '')) <= 1000),
  created_at  timestamptz not null default now(),
  unique (tool_id, user_id)
);

alter table public.app_reviews enable row level security;

create policy "read all reviews"
  on public.app_reviews for select
  using (true);

create policy "insert own review"
  on public.app_reviews for insert
  with check (auth.uid() = user_id);

create policy "update own review"
  on public.app_reviews for update
  using (auth.uid() = user_id);

create policy "delete own review"
  on public.app_reviews for delete
  using (auth.uid() = user_id);

-- Fast lookup by app.
create index on public.app_reviews (tool_id, created_at desc);
