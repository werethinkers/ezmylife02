## Goals

1. `/credits` should be viewable by anyone (no auth wall).
2. Any tool route should open instantly for everyone. After **7 seconds** inside the tool, if the visitor is still not logged in, show an inline `LoginPromptDialog` on the same page (no navigation away). If they log in, they stay on the exact tool page they were on.
3. Make page transitions feel instant — remove the artificial loading delay between routes.

## Changes

### 1. Credits page — public access
**File:** `src/App.tsx`
- Remove `<ProtectedRoute>` wrapper around `/credits`. Keep it on `/credits/history` and `/credits/success` (those need a user).
- `Credits.tsx` already handles the anonymous case (Buy → opens `LoginPromptDialog`), so no page-level changes needed.

### 2. Deferred login prompt inside tools (7s)
**File:** `src/components/ToolAccessGuard.tsx`
- Currently just renders children. Update it to:
  - Always render `children` immediately.
  - If `!user && !loading`, start a 7000 ms timer.
  - When the timer fires (and user is still logged out), render `<LoginPromptDialog open … returnTo={location.pathname + location.search} />` overlaid on the page.
  - If the user logs in (auth state changes) before/after the prompt, dialog closes and they remain on the same tool route.
  - Cleanup timer on unmount / on login.
- `LoginPromptDialog` already accepts `returnTo`, so post-login redirect lands them back on the same `/tool/:toolId`.

### 3. Faster page transitions
**File:** `src/App.tsx`
- `DelayedFallback` waits 180 ms before showing `LoadingScreen`. Reduce to **0** (or simply render `null` as the Suspense fallback) so cached chunks never flash a spinner and uncached ones just appear when ready.
- `pageVariants` durations: shorten `animate` from 0.22s → 0.12s and `exit` from 0.14s → 0.08s for snappier route changes.

### Out of scope
- No DB / RLS / edge-function changes.
- `ProtectedRoute` and other guarded pages (Profile, Admin, Bulk, etc.) untouched.
- No design/theme changes.

## Files touched
- `src/App.tsx` (route wrapper + fallback + transition timings)
- `src/components/ToolAccessGuard.tsx` (7s deferred login prompt)
