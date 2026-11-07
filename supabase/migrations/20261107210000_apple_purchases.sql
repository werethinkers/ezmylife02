-- Credits bought with Apple in-app purchase in the iOS app (docs/ios-app.md).
-- One row per App Store transaction. The apple-iap-verify function checks Apple's signature, then calls
-- apply_apple_purchase, which adds the credits once. Kept apart from credit_purchases so the Razorpay
-- receipts, refunds and influencer commissions are untouched (Apple refunds go through Apple).
create table if not exists public.apple_purchases (
  transaction_id text primary key,
  original_transaction_id text,
  user_id uuid not null,
  product_id text not null,
  pack_id text not null,
  credits int not null,
  environment text not null,              -- 'Production' or 'Sandbox' (TestFlight and App Review)
  created_at timestamptz not null default now()
);
create index if not exists apple_purchases_user_idx on public.apple_purchases (user_id, created_at desc);

alter table public.apple_purchases enable row level security;

drop policy if exists "Users view own apple purchases" on public.apple_purchases;
create policy "Users view own apple purchases" on public.apple_purchases
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Admins view all apple purchases" on public.apple_purchases;
create policy "Admins view all apple purchases" on public.apple_purchases
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::app_role));

create or replace function public.apply_apple_purchase(
  _user_id uuid, _transaction_id text, _original_transaction_id text,
  _product_id text, _pack_id text, _credits int, _environment text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  _owner uuid;
begin
  if _user_id is null or coalesce(_transaction_id, '') = '' or _credits is null or _credits <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'missing_fields');
  end if;

  insert into public.apple_purchases (transaction_id, original_transaction_id, user_id, product_id, pack_id, credits, environment)
  values (_transaction_id, _original_transaction_id, _user_id, _product_id, _pack_id, _credits, _environment)
  on conflict (transaction_id) do nothing;

  if not found then
    select user_id into _owner from public.apple_purchases where transaction_id = _transaction_id;
    if _owner = _user_id then
      return jsonb_build_object('ok', true, 'noop', true);   -- already credited; safe to finish the transaction
    end if;
    return jsonb_build_object('ok', false, 'reason', 'transaction_belongs_to_another_account');
  end if;

  perform public.ensure_wallet(_user_id);
  update public.credit_wallets
    set paid_balance = paid_balance + _credits, updated_at = now()
    where user_id = _user_id;

  insert into public.credit_ledger (user_id, delta, paid_delta, reason, metadata)
  values (_user_id, _credits, _credits, 'purchase',
          jsonb_build_object('source', 'apple', 'transaction_id', _transaction_id, 'product_id', _product_id,
                             'pack_id', _pack_id, 'environment', _environment));

  return jsonb_build_object('ok', true, 'credits', _credits);
end;
$$;

revoke execute on function public.apply_apple_purchase(uuid, text, text, text, text, int, text) from public, anon, authenticated;
grant execute on function public.apply_apple_purchase(uuid, text, text, text, text, int, text) to service_role;
