## Transaction History

Add a unified "Transaction History" view so users can see every credit movement: purchases (and how many credits were added) and tool runs (which tool was used, when, credits charged, and a link to the output where available).

### Where it lives
- New page **`/credits/history`** (component `src/pages/CreditsHistory.tsx`).
- Add a **"Transaction history"** link/button on:
  - `src/pages/Credits.tsx` (near the wallet balance)
  - `src/pages/Profile.tsx` (in the credits/wallet section)
- Add it to the Navbar wallet dropdown if present (otherwise just the two entry points above).

### Data sources (already exist, RLS-protected to the user)
- `credit_ledger` — every credit delta with `reason` (`signup_bonus`, `first_action_bonus`, `monthly_reset`, `purchase`, `tool_run`, `admin_adjust`), `tool_id`, `run_id`, `cost_inr`, `metadata`.
- `credit_purchases` — pack purchases (`pack_id`, `inr_amount`, `credits`, `status`, `paid_at`).
- `tool_runs` — per-run details (`tool_id`, `credits_charged`, `status`, `started_at`, `finished_at`, `metadata`, `error`).
- `tools_catalog` — to resolve `tool_id` → friendly name + `dedicated_route`.

No schema changes needed. No new edge function needed (direct selects via RLS).

### UI

Single page with three tabs (shadcn `Tabs`):

1. **All activity** (default) — merged feed from `credit_ledger`, newest first.
   Each row shows: date/time, icon, title, sub-line, credit delta (+green / −red), running balance.
   - `purchase` → "Bought {credits} credits ({pack_id}) — ₹{inr_amount}" + link to Razorpay receipt id (if stored in metadata).
   - `tool_run` → "{Tool name} · {status}" with link to the tool page; show `cost_inr` and any `metadata.output_url` / output filename if present.
   - `signup_bonus` / `first_action_bonus` / `monthly_reset` → friendly label.
   - `admin_adjust` → "Admin grant" + note from metadata.

2. **Purchases** — table of `credit_purchases` where `status='paid'`: date, pack, ₹, credits added, payment id.

3. **Tool usage** — table of `tool_runs` joined w/ catalog name: date, tool (link), status badge, credits charged, output preview.
   - "Output" column: if `metadata.output_url` exists → "View" link; else if `bulk_jobs` exists for this run via `tool_id` → link to `/bulk-jobs/:id`; otherwise "—".

### Output linking
Most tool runs do not currently persist `output_url`. To make the "what the output was" column meaningful:
- For **bulk runs**, look up `bulk_jobs` for the user (`tool_id`, time window) and link to `/bulk-jobs/:id` which already shows outputs.
- For **AI single-tool runs**, query `user_creations` (already user-scoped) by `tool_type`/`created_at` proximity and surface `result_url` / `title`.
- For runs with neither, show "—" (no fabricated data).

This is best-effort matching done client-side (no DB change). A small helper `src/lib/transactionHistory.ts` will:
- Fetch latest 200 ledger entries.
- Batch-fetch related `bulk_jobs` (by `user_id` + `tool_id` + window) and `user_creations` (by `user_id` + `created_at` window).
- Compute a running balance from current wallet total going backwards.

### Filters & UX
- Date range (Last 7d / 30d / 90d / All) using a `Select`.
- Type filter chips: Purchases, Tool runs, Bonuses, Admin grants.
- CSV export button (client-side, reuses pattern from `ToolsExportButton`).
- Pagination: load 50 at a time, "Load more" button.
- Empty state: "No transactions yet" with link back to Credits page.
- Mobile: switches to card list layout (re-uses Tailwind responsive patterns).

### Files to create
- `src/pages/CreditsHistory.tsx` — page shell, SEO, tabs.
- `src/components/credits/TransactionList.tsx` — merged ledger feed.
- `src/components/credits/PurchasesTable.tsx`
- `src/components/credits/ToolRunsTable.tsx`
- `src/lib/transactionHistory.ts` — fetch + enrichment helpers.

### Files to edit
- `src/App.tsx` — add `/credits/history` route.
- `src/pages/Credits.tsx` — add "Transaction history" link near wallet badge.
- `src/pages/Profile.tsx` — add same link in credits section.

### Out of scope
- Persisting `output_url` on every tool run (would require edge-function changes across many tools). Instead we infer via `bulk_jobs` and `user_creations` where possible.
- Admin-side "user transaction history" (admin already sees ledger via `CreditsAdmin`).
