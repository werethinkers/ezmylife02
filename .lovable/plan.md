## Goal

Tighten the credit-only model: hide every Premium reference and ₹ amount from end-users, let admins grant free credits and set credit costs directly per tool, open the Credits page to logged-out visitors, and replace mid-flow auth redirects with a friendly login dialog.

---

## 1. Hide all "Premium" branding

- **`src/components/Navbar.tsx`** — remove the `premiumLinks` block entirely; merge "Get Extension" and "Bulk Jobs" into the main `navLinks` (only shown when `user` exists), styled like the rest.
- **`src/components/PremiumRoute.tsx`** — delete the file.
- **`src/App.tsx`** — replace every `<PremiumRoute>` wrapper with `<ProtectedRoute>` (already exists), drop the `PremiumRoute` import.
- **`src/components/ToolAccessGuard.tsx`** — drop the comment language; rename behavior comment, no premium wording.
- **`src/pages/AdminDashboard.tsx`** — remove the "Premium" tab, its `Crown` icon usage in tabs, the `premiumUsers` state/query, and the "Premium Users" stat card. Replace that stat card with **"Total Credits Sold"** (sum from `credit_purchases` where status='paid') and add a **Credits** tab (see §3).
- **`src/pages/Home.tsx`, `src/pages/About.tsx`, `src/pages/Contact.tsx`, `src/components/SEOFooter.tsx`** — replace any user-visible "Premium" copy with "Pro tools" / generic descriptors. Remove the `Premium Access` block on Home.tsx (~line 564). Update SEO keywords/footer link text (the `/subscription` link stays for legacy redirects but renamed to "Pricing — Credits").

Net result: no "Premium" string anywhere users see.

---

## 2. Show credits, not ₹, on every tool

- **`src/components/tools/CreditCostBadge.tsx`** — already credit-only ✅. No change.
- **`src/hooks/useToolPricing.ts`** — keep `cost_inr` available for admin only; stop exporting `costInr` for end-user components (only `creditCost`).
- Audit any tool component that prints ₹ alongside credits — none currently do, so nothing else to change.

---

## 3. Admin: grant free credits + set credit cost directly

### 3a. Edge function `admin-tool-pricing` (extend)

Add two new actions:
- `set_credits` — `{ tool_id, credit_cost }`: directly upsert `credit_cost` (bypasses the `tool_pricing_set_credits` trigger by also passing `cost_inr` derived as `credit_cost * 0.30` so the trigger keeps the row consistent — or drop the trigger; see §3c).
- `grant_credits` — `{ user_id, credits, note }`: server-side calls `admin_adjust_credits(user_id, credits, 'free', note)`.

### 3b. New admin UI: `src/components/admin/CreditsAdmin.tsx`

Two sections inside one tab:

1. **Tool pricing table** — list all rows from `tool_pricing` joined with `tools_catalog.name`. Each row has an editable input for **Credit cost** (integer) with a Save button. Shows the implied ₹ purely for admin context.
2. **Grant credits to user** — search field that queries `profiles` by email/name, picks a user, integer input + reason + Grant button. Calls `admin-tool-pricing` `grant_credits`.
3. **Recent activity** — last 20 rows from `credit_ledger` where `reason='admin_adjust'`.

Wire it into AdminDashboard as a new tab labeled **"Credits"** (icon `Zap`), admin-only (hidden in view-only/moderator mode).

### 3c. Migration

- Modify `public.tool_pricing_set_credits` trigger so it ONLY recomputes `credit_cost` from `cost_inr` when `credit_cost` was not explicitly provided (i.e. when `NEW.credit_cost IS DISTINCT FROM OLD.credit_cost` is false on update). Easiest: change the trigger to fire only when `cost_inr` changes (`WHEN (OLD.cost_inr IS DISTINCT FROM NEW.cost_inr)`), so admin can update `credit_cost` independently.

---

## 4. Public Credits page (no forced auth)

- **`src/pages/Credits.tsx`** — remove the `if (!user) navigate("/auth")` redirect. Logged-out users see packs, pricing breakdown, and FAQ. The wallet snapshot card only renders if `user` exists; otherwise show a "Sign in to top up" CTA in its place.
- Clicking **Buy** while logged out opens the same login dialog as §5 (with a return-to `/credits?pack=<id>`).
- **Replace the "credits per ₹" line** with a **"For ₹1 you get N credits"** label and the savings % vs the smallest pack.
- **`src/components/wallet/BuyCreditsDialog.tsx`** — already routes to `/credits?pack=…`, no change needed.

---

## 5. Login-required popup for generation actions

Today, `useCredits.charge()` calls `navigate("/auth")` for guests, and `ToolAccessGuard` redirects on tool pages. Instead:

- **New component `src/components/auth/LoginPromptDialog.tsx`** — small Dialog with two buttons: "Sign in" / "Create account", both linking to `/auth` with the current path stored in `localStorage.auth_redirect_to`.
- **`src/hooks/useCredits.ts`** — when `!user`, instead of navigating, set `loginOpen=true` and return null. Expose `loginDialogProps` alongside `dialogProps`.
- Tool components already render `<BuyCreditsDialog {...dialogProps} />` — they will additionally render `<LoginPromptDialog {...loginDialogProps} />` (one-line addition per tool — list below).
- **`src/components/ToolAccessGuard.tsx`** — for non-free tools when logged out, render the page with the dialog auto-open instead of redirecting. Implementation: render children + dialog in a wrapper component; if user dismisses, send them home.

Tools to update (add `<LoginPromptDialog />`): CaptionGenerator, HashtagGenerator, ContentIdeaGenerator, SocialPostGenerator, VideoScriptWriter, VideoMaker, BusinessCardScanner, StartupAnalyserApp.

---

## 6. Memory updates

- Update `mem://features/credits-system` to reflect: credits-only display, public Credits page, admin direct credit-cost editing, admin grant-credits flow, login dialog pattern.
- Update `mem://index.md` Core: add "Never display ₹ cost on tool UI — credits only. Never use the word 'Premium' in user-facing copy."

---

## Technical notes

- `admin_adjust_credits` RPC already exists and enforces admin role — reuse via edge function.
- `BuyCreditsDialog` doesn't require auth to render, so it's safe to show before login.
- Keep `Subscription.tsx` as a redirect-to-`/credits` page (already done) for backward links.
- Touched files (~15 edits, 2 new, 1 delete, 1 SQL migration). No breaking schema changes.
