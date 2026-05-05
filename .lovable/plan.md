## Goal
Remove every subscription concept and replace it with a transparent, pay-as-you-go credit wallet. Users get free credits monthly, buy paid credits in fixed packs, and each tool deducts credits only on a successful run.

## 1. Data model (new migration)

New tables:

- `credit_wallets` — one row per user
  - `user_id uuid PK`, `free_balance int default 0`, `paid_balance int default 0`,
    `last_free_reset_at timestamptz`, `signup_bonus_granted bool default false`,
    `first_action_bonus_granted bool default false`, `updated_at`.
- `credit_ledger` — append-only audit
  - `id`, `user_id`, `delta int` (negative = spend, positive = top-up/grant),
    `bucket text check in ('free','paid','mixed')`, `reason text`
    (`signup_bonus`, `first_action_bonus`, `monthly_reset`, `purchase`,
    `tool_run`, `coupon`, `admin_adjust`, `refund`),
    `tool_id text null`, `run_id uuid null`, `cost_inr numeric null`,
    `metadata jsonb`, `created_at`.
- `credit_purchases` — Razorpay orders
  - `id`, `user_id`, `pack_id text`, `inr_amount int`, `credits int`,
    `razorpay_order_id`, `razorpay_payment_id`, `status` (`created|paid|failed`),
    `coupon_code text null`, `created_at`, `paid_at`.
- `tool_pricing` — admin-controlled
  - `tool_id text PK`, `cost_inr numeric not null`, `credit_cost int not null`,
    `updated_by uuid`, `updated_at`.
  - Trigger / app logic: `credit_cost = GREATEST(1, CEIL((cost_inr * 1.5) / 0.45))`.
- `tool_runs` — used to gate the “successful run → deduct + first-action bonus”
  - `id`, `user_id`, `tool_id`, `status` (`started|succeeded|failed`),
    `credits_charged int`, `free_used int`, `paid_used int`,
    `started_at`, `finished_at`, `error text`.

RLS: users read their own wallet/ledger/purchases/runs; only admins write `tool_pricing`. Wallet/ledger writes happen exclusively through SECURITY DEFINER functions:

- `grant_signup_bonus(uid)` — idempotent, +50 free.
- `grant_first_action_bonus(uid)` — idempotent, +50 free, only after first `succeeded` run.
- `monthly_free_reset()` — sets `free_balance = 100`, `last_free_reset_at = now()` for everyone where last reset is in a previous IST month. Scheduled via `pg_cron` at `30 18 * * *` UTC (= 00:00 IST) and gated to only run on day 1 IST.
- `charge_credits(uid, tool_id, run_id, credits)` — debit free first then paid; returns success/failure; writes ledger row.
- `credit_purchase_apply(purchase_id)` — called by verify webhook; adds to `paid_balance`, writes ledger.

Drop / ignore: `premium_access` reads in app code (table can stay but is no longer consulted). Coupons are repurposed to grant **bonus credits** (see §6) rather than premium access.

## 2. Backend / edge functions

- **New `wallet`** — GET returns `{ free, paid, total, last_reset, next_reset_ist }`.
- **New `create-credit-order`** — replaces `create-razorpay-order`. Accepts `pack_id`; creates Razorpay order + `credit_purchases` row.
- **New `verify-credit-payment`** — replaces `verify-razorpay-payment`. Verifies signature, marks purchase paid, calls `credit_purchase_apply`.
- **New `tool-charge`** — RPC-style: `start_run(tool_id)` → returns `run_id` + `quoted_credits` after pre-checking balance (no debit yet). `complete_run(run_id, success: bool, error?)` → on success calls `charge_credits` and, if applicable, `grant_first_action_bonus`.
- **New `admin-tool-pricing`** — admin-only CRUD for `tool_pricing`.
- **Update `redeem-coupon`** — grant credits to wallet instead of premium access.
- **Delete (or stub)**: `check-subscription`, `create-razorpay-order`, `verify-razorpay-payment`'s subscription branches.
- **Wire existing AI tool functions** (`startup-analyser`, `scan-business-card`, `bulk-run`, `content-generator`, `notebook-ai`, `promptmaster-ai`, `video-generator`, `personalized-tools`, `tools-chat`, `virasat-ai`) to call `start_run` before work and `complete_run(success)` after. Bulk: charge per successful item.
- Trigger `handle_new_user` extended (or new trigger) to call `grant_signup_bonus`.

## 3. Frontend — remove subscription, add wallet

Remove / rewrite:

- `src/hooks/useSubscription.ts` → replace with `useWallet()` (React Query, returns `{ free, paid, total, isLoading, refresh }`).
- `src/components/PremiumRoute.tsx` → delete; replace usage with simple `ProtectedRoute` (login required, no premium check). Premium-gated routes (`/get-extension`, `/mobile-shortcuts`, `/startup-analyser`, `/meet-nudge`, `/virasat`, `/bulk/*`) become login-only; their tools deduct credits on use.
- `src/components/ToolAccessGuard.tsx` → drop subscription gate; only require login for non-free tools. Credit checks happen at run time via `useToolPricing`/`start_run`.
- `src/pages/Subscription.tsx` → replaced by **`src/pages/Credits.tsx`** (route stays `/credits`; `/subscription` redirects to `/credits` for backward compat).
- `LaunchOfferBanner`, `BulkPromoSection`, `FunnelStepper`, `Navbar`, `Home`, `SEOFooter`, `AdminDashboard`, `AdminUserDetail`, `BulkModeToggle` — strip “Premium / Subscribe” copy, replace with “Credits / Buy credits”.

New components:

- `src/components/wallet/WalletBadge.tsx` — pill in `Navbar` showing `⚡ {total}` with hover popover breaking down free vs paid and a “Buy credits” button. Visible on all pages when logged in.
- `src/components/wallet/BuyCreditsCard.tsx` — used on `/credits`.
- `src/components/wallet/CouponPopover.tsx` — collapsible/popover coupon UI (kept off the main pricing layout).
- `src/components/tools/CreditCostBadge.tsx` — “This will use **X credits**” shown on every tool before run; reads from `tool_pricing` via `useToolPricing(toolId)`.
- `src/components/tools/PostRunSummary.tsx` — toast/inline panel after each run: “Used X credits · Y remaining · [Try another tool] [Buy more]”.
- `src/pages/CreditsConfirmation.tsx` — post-purchase success page (`/credits/success?order=…`) showing new balance and CTA back to the tool.

Pricing packs (hardcoded in `src/data/creditPacks.ts`):

```ts
[
  { id: "p10",   inr: 10,   credits: 15 },
  { id: "p50",   inr: 50,   credits: 80 },
  { id: "p100",  inr: 100,  credits: 180 },
  { id: "p250",  inr: 250,  credits: 500,  badge: "Popular" },
  { id: "p500",  inr: 500,  credits: 1100, badge: "Better value" },
  { id: "p1000", inr: 1000, credits: 2200, badge: "Best value" },
]
```

Each card shows credits/₹ and highlights savings vs the smallest pack.

## 4. Tool integration pattern

Each tool (`src/components/tools/*`, `src/startup-analyser/*`, etc.) follows:

```text
1. const { credits } = useToolPricing(toolId)            // shows badge
2. onRun: balance check → if insufficient, open BuyCreditsDialog
3. const { runId } = await startRun(toolId)
4. perform work
5. await completeRun(runId, success, error?)            // server debits
6. show PostRunSummary
```

Helper `src/lib/credits.ts` wraps `start_run` / `complete_run` and refreshes `useWallet`.

For **bulk-run** edge function: pre-check `total_credits ≥ N * cost`, then for each item call `complete_run` with success/failure individually (so failed items aren’t charged and trigger no first-action bonus by themselves).

## 5. Admin

In `AdminDashboard`, replace “Subscriptions” tab with **“Credits & Pricing”**:

- Per-tool table (read from `tool_pricing` joined with `tools_catalog`) with editable `cost_inr`. Credit cost is computed live from the formula and saved.
- Aggregates: total credits issued (free vs paid), total ₹ revenue (sum `credit_purchases.inr_amount` where paid), total ₹ cost (sum `credit_ledger.cost_inr` where reason=`tool_run`), profit & margin.
- Per-tool usage: runs, credits spent, est. cost, est. revenue share, margin.
- Per-user wallet view in `AdminUserDetail` with manual adjust (writes via `admin_adjust_credits` SECURITY DEFINER fn).

## 6. Coupons

- `coupon_codes` schema gains `credit_grant int null`. Existing premium-granting coupons are migrated to a sensible credit equivalent (e.g. lifetime → admin chooses; default 500 credits) — surfaced for admin review.
- Redeem flow: enter code in `CouponPopover` on `/credits` → adds credits to free balance.

## 7. Memory & docs

- Update `mem://index.md` Core: drop subscription/Razorpay-subscription rules, add “Credits-first, pay-as-you-go, no subscriptions; 50 signup + 50 first-action + 100/month free reset on day 1 IST; pricing formula `MAX(1, CEIL(cost*1.5/0.45))`”.
- Add `mem://features/credits-system` with packs, formula, monthly reset, ledger semantics.
- Mark superseded memory files (`subscription-system`, `launch-offer-promotion`, `auto-premium-domains`, `premium-status-display`, `promotional-codes`) as deprecated and remove from index.

## 8. Cleanup

- Remove `AUTO_PREMIUM_DOMAINS` shortcut and the `seafund.in` auto-premium logic — replaced with a one-time admin credit grant.
- Remove `LaunchOfferBanner` and `ezyLAUNCH` references, or repurpose banner to advertise the launch credit pack discount.
- Keep `premium_access` table (read-only, hidden) so historical data is preserved; no app code reads it.

## Out of scope

- Refunds or partial credit charge for partially-successful bulk jobs (per-item charge is enough).
- Multi-currency — INR only.
- Migrating existing active subscribers to credits beyond a one-time admin-issued credit grant (admin handles per user).
