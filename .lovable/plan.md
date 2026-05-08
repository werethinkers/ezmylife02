## Goal
Make the credit cost shown on every tool card match exactly what admins set, drop the rupee estimate from the card, and floor every tool's credit cost to a minimum of 1.

## Changes

### 1. Backfill: bump all 0-credit tools to 1 credit (DB migration)
A query confirmed 53 of 117 rows in `tool_pricing` are at `credit_cost = 0`. One-time SQL update:
```sql
UPDATE public.tool_pricing
SET credit_cost = 1, cost_inr = 0.30, updated_at = now()
WHERE credit_cost < 1;
```

### 2. Enforce minimum-of-1 going forward
- **`supabase/functions/admin-tool-pricing/index.ts`** — in the `set_credits` action, replace `Math.max(0, ...)` with `Math.max(1, ...)` so admins can never save 0.
- **`src/components/admin/CreditsAdmin.tsx`** — set `<Input min={1}>` and block save if value < 1, so the admin UI matches.
- **`src/hooks/useToolPricing.ts`** — clamp the returned `creditCost` to `Math.max(1, value)` as a defensive client-side floor (covers cached rows or any tool with no pricing row).

### 3. Remove rupee estimate from tool cards
- **`src/components/tools/ToolLandscapeCard.tsx`** — delete the `(Approx. ₹{inrValue} value)` line (line 187) and the now-unused `inrValue` / `costInr` calculation. The credit count stays.
- Quick scan for any other component showing `costInr`/`₹` next to credits — none found in tool cards (only `CreditsAdmin` admin panel and `BulkDropzone` which is a separate flow; leave those alone unless asked).

### 4. Verify "same as admin sets"
The card already pulls live from `tool_pricing` via `useToolPricing` — same source the admin writes to. After the floor + cache invalidation (5 min `staleTime`), the displayed credits will exactly match the admin tab. No legacy hard-coded numbers remain in tool cards.

## Out of scope
- The "Approx ₹ value" line in admin pricing tables and bulk uploader (admin tooling, not the user-facing tool cards).
- Tools that have no `tool_pricing` row at all — these already default to 1 credit via the hook, so they're fine after the clamp.
