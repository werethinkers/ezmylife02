## Plan

### 1. Fix Visitors Tracker

**Symptoms:** Tab loads but shows nothing / errors. Data exists in `page_views` (75 rows last 24h) and the `get_visitor_sessions` RPC is defined, so the failure is at the client layer.

**Likely causes & fixes:**
- `VisitorsTracker.tsx` swallows RPC errors silently (`if (!error && data)`). Surface the error via toast + on-screen message so we can see what's failing.
- The RPC return type isn't in `supabase/types.ts` (custom RPC) → the `.rpc("get_visitor_sessions", ...)` call may be typed as `never`, not blocking runtime but worth a typed cast.
- The `steps` fetch (per-session expand) queries `page_views` filtering by `session_id` only, but anonymous visitors without a session_id are grouped by `ip_hash` in the RPC. Expanding their row returns nothing. Fix: when `session_id` starts with `s_` query by `session_id`, otherwise query by `ip_hash`.
- Add empty/error states ("No visits in this range" vs "Failed to load — <message>").

### 2. Post-login redirect to the tool the user came from

Currently `ToolAccessGuard` does `<Navigate to="/auth" state={{ from: location.pathname }} replace />` but `Auth.tsx` redirects to `/auth/callback` and `AuthCallback.tsx` only checks `localStorage.auth_redirect_to`, ignoring `location.state.from`. So users land on `/tools` or `/subscription` instead of the original tool.

**Changes:**
- `ToolAccessGuard.tsx`: before navigating to `/auth`, also `localStorage.setItem("auth_redirect_to", location.pathname + location.search)`.
- `AuthCallback.tsx`: if `auth_redirect_to` points to `/tool/...`:
  - If user is subscribed → go directly there.
  - If not subscribed and the tool is premium → go to `/subscription` but keep `auth_redirect_to` so after successful checkout they return to the tool. (Already cleared today; we'll only clear once consumed at the tool.)
- `Auth.tsx` email sign-in/up: same — persist `auth_redirect_to` from `location.state.from` if present (so the email flow works too, not just OAuth).
- `Subscription.tsx` (post-payment success path): if `auth_redirect_to` exists, navigate there after the success toast.

### 3. One-click UTM Link Generator (admin)

Replace/extend `UtmLinkBuilder.tsx` with a dedicated **"Campaign Links"** workflow:

**Form fields (one screen):**
- **Scope:** Whole app `/` · Tools page `/tools` · Specific tool (Select pulled from `tools_catalog`).
- **Channel:** Instagram · Twitter/X · LinkedIn · Facebook · YouTube · WhatsApp · Email · Other (free text).
- **Promotion type:** Influencer (asks for handle, e.g. `@john`) · Paid ad · Organic post · Newsletter.
- **Optional campaign tag** (auto-suggested from above, e.g. `insta_influencer_john_promptmaster_may26`).

**Behavior:**
- Auto-fills `utm_source` (channel), `utm_medium` (`influencer` / `paid` / `organic` / `email`), `utm_campaign` (auto-built slug, editable), `target_path` (selected tool/page).
- "Generate" creates the row in `utm_links` and shows: full URL, copy button, QR code (using existing `qrcode` if installed; otherwise a simple SVG via `qrcode.react`-style approach — confirm at build time).
- Recent links list grouped by tool with click counts (already aggregated from `page_views.utm_campaign`).
- Bulk generate option: pick a tool + channel + list of influencer handles → creates one tracked link per handle in one click.

No DB changes required; `utm_links` already supports `label`, `target_path`, `utm_source/medium/campaign`.

### 4. Faster, smoother loading

Two layers cause the long perceived loads:

**a. Initial app load**
- Lazy chunks with `Suspense` fall back to `LoadingScreen` portal which animates a logo for hundreds of ms even when the chunk is already cached. Switch to a delayed fallback: render `null` for the first ~150 ms, then the logo. Avoids "logo flash" on fast navigations.
- Add `<link rel="modulepreload">` for the `Home` chunk in `index.html` so the landing route starts fetching before React mounts.
- The page-transition `AnimatePresence` re-mounts on every route change with a 500 ms enter + 300 ms exit + 4 px blur. Tighten to 200 ms enter / 150 ms exit, drop the blur filter (blur on lazy chunks is the most expensive part). Keeps the polish but cuts perceived delay roughly in half.

**b. Tool/route guards**
- `ToolAccessGuard` waits for `authLoading + catalogLoading + subLoading` before showing anything. For free tools this is wasted time. Reorder: if catalog is loaded and tool `is_free`, render immediately even while subscription resolves.
- `PremiumRoute` always invokes the `check-subscription` edge function on mount. Cache the result for 60 s in `sessionStorage` so back/forward and quick re-entries are instant.
- `useSubscription` similarly: dedupe calls and persist the last result in `sessionStorage` so route changes don't re-spinner.

**c. Loading screen itself**
- Replace logo+dots animation with a slim top progress bar (similar to NProgress) for route-level loads. Keeps the brand logo only for the very first cold boot.

### Files touched

- `src/components/admin/VisitorsTracker.tsx` — error surfacing, ip_hash-aware step fetch, empty states.
- `src/components/ToolAccessGuard.tsx` — store `auth_redirect_to`, render free tools without waiting for subscription.
- `src/pages/AuthCallback.tsx` — honor `/tool/...` redirect, keep redirect across subscription flow.
- `src/pages/Auth.tsx` — capture `location.state.from` into `auth_redirect_to`.
- `src/pages/Subscription.tsx` — consume `auth_redirect_to` after successful upgrade.
- `src/components/admin/UtmLinkBuilder.tsx` — replace with new "Campaign Links" UI (channel + tool + influencer).
- `src/components/PremiumRoute.tsx`, `src/hooks/useSubscription.ts` — sessionStorage cache.
- `src/App.tsx` — tighten page transitions, delayed Suspense fallback.
- `src/components/LoadingScreen.tsx` — add slim progress-bar variant.
- `index.html` — modulepreload hint.

No database migrations required.
