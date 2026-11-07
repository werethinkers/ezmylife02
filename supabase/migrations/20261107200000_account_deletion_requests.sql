-- "Delete my account" on /profile (required by Apple for the iOS app, guideline 5.1.1(v)).
-- A request is recorded here and an admin deletes the account, its pages and its data within 30 days.
-- Nothing is deleted automatically.
create table if not exists public.account_deletion_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  reason text,
  source text not null default 'web',          -- 'web' or 'ios-app'
  status text not null default 'pending',      -- 'pending', 'done' or 'cancelled'
  requested_at timestamptz not null default now(),
  handled_at timestamptz
);

alter table public.account_deletion_requests enable row level security;

drop policy if exists "Users can request deletion of their own account" on public.account_deletion_requests;
create policy "Users can request deletion of their own account"
  on public.account_deletion_requests for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "Users can see their own deletion request" on public.account_deletion_requests;
create policy "Users can see their own deletion request"
  on public.account_deletion_requests for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins manage deletion requests" on public.account_deletion_requests;
create policy "Admins manage deletion requests"
  on public.account_deletion_requests for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
