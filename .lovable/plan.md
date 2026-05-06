
## 1. Favourite AI Apps

**DB (migration):** new table `tool_favorites (user_id uuid, tool_id text, created_at timestamptz default now(), primary key(user_id, tool_id))` with RLS — users can `SELECT/INSERT/DELETE` rows where `auth.uid() = user_id`.

**Hook:** `src/hooks/useFavorites.ts` — React Query: `useFavorites()` returns `Set<toolId>`; `useToggleFavorite()` mutates with optimistic update. Returns empty set when logged out.

**UI:**
- Heart button on `ToolLandscapeCard` (and small variant on `ToolCard` if used). Click toggles; if logged out, opens `LoginPromptDialog` (no redirect).
- New "⭐ Favourite Apps" section at the top of `/ai-apps` (`Tools.tsx`), rendered only when logged in AND user has ≥1 favourite. Uses existing carousel/grid styling.

## 2. Eliminate all up-front login gates

Remove auth gating from browsing, the credits page, and tool entry. Login is requested only when the user clicks a button that produces output or spends credits.

- **`ToolAccessGuard.tsx`**: drop the "Sign in to use this tool" screen for non-free tools — always render `children`. Login prompt fires from inside the tool when the user clicks generate.
- **`/credits` (`Credits.tsx`)**: allow anonymous viewing of packs. The login prompt only appears when "Buy" is clicked (handled by the new in-page checkout flow below).
- **Audit**: replace any remaining `navigate("/auth")` in browse paths (Home hero "Get started", category pills, app cards, ToolPreview) with `LoginPromptDialog` opened in place. `ProtectedRoute` stays for Profile / Credits History / Bulk Jobs / Admin only.
- Remove `LoginPromptDialog` mount from `ToolLandscapeCard`'s "Start using" handler when the tool is free; non-free tools still let the user enter the tool — the prompt fires on generate inside the tool.

## 3. Hero — show signup card to logged-out users

In `ToolsHero.tsx`, the right-side glass card currently shows the wallet ("Your Credits"). When `!user`, swap it for a **"Welcome to EzYourLife 👋 — Log in or sign up and get 100 free credits!"** card matching the uploaded reference: gift-box visual placeholder, primary "Sign Up Free" button, secondary "Log In" button, "No credit card required" footnote. Logged-in users keep the existing credits panel.

## 4. Remove "Happy Users" segment from the home page

Search `src/pages/Home.tsx` and `src/components/home/*` for the "Happy Users" / trust strip stat and delete just that block (keep surrounding sections). Admin dashboard is **not** touched (per clarification).

## 5. "Simple. Credit-Based. Hassle-Free." — real figures

Update the 3-step section on Home to pull from `src/data/creditPacks.ts` (`CREDIT_PACKS`):
- Step 1: "Start from **₹10 → 15 credits**" (smallest pack).
- Step 2: "Most popular: **₹250 → 500 credits**" (the pack flagged `Popular`).
- Step 3: "Best value: **₹1000 → 2200 credits**" (pack flagged `Best value`).
Values are read from the array, not hard-coded, so they auto-update if packs change.

## 6. In-page Razorpay popup (no navigation)

New component `src/components/wallet/BuyCreditsInlineDialog.tsx` (replaces full-page redirect to `/credits` from prompts):
- Shows the 6 credit packs as selectable tiles.
- On "Buy", calls existing `create-razorpay-order` edge function, then opens Razorpay Checkout modal **on top of the current page** (script loaded once via `useRazorpayScript()` hook).
- On payment success, calls `verify-razorpay-payment`, refreshes the wallet, toasts "Credits added", and (if invoked from a tool) automatically retries the original action.
- On dismiss, the user stays exactly where they were.

Wire-up:
- `useCredits.ts`: when `runWithCredits` reports `insufficient_credits`, open `BuyCreditsInlineDialog` instead of the existing `BuyCreditsDialog` redirect.
- `ToolLandscapeCard` "Buy more" link → opens the same inline dialog instead of navigating.
- `Credits.tsx` "Buy" buttons → use the same inline Razorpay flow (no page change).

## 7. Razorpay credentials rotation

After the user confirms, request `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` via `add_secret` (overwrites existing values). The publishable Key ID is also exposed to the frontend through a small `get-razorpay-key` edge function (or returned by `create-razorpay-order`) so we don't hard-code it.

## Out of scope
- No changes to admin dashboard, AI logic, pricing rules, or DB schema beyond `tool_favorites`.
- No theme changes (light + purple already applied).
- "Happy Users" only removed from the home page (not admin).

## Files touched
- New: `supabase/migrations/<ts>_tool_favorites.sql`, `src/hooks/useFavorites.ts`, `src/components/wallet/BuyCreditsInlineDialog.tsx`, `src/hooks/useRazorpayScript.ts`.
- Edited: `src/pages/Tools.tsx`, `src/pages/Home.tsx`, `src/pages/ToolsHero.tsx`, `src/pages/Credits.tsx`, `src/components/tools/ToolLandscapeCard.tsx`, `src/components/ToolAccessGuard.tsx`, `src/hooks/useCredits.ts`, `src/components/auth/LoginPromptDialog.tsx` (no redirect needed), and minor cleanup in pages still calling `navigate("/auth")` for browsing.
