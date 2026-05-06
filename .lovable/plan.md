## Goals

1. Add an **admin Home Sections** UI to pin tools to: Hot, Trending, Featured, Most Used (writes `tools_catalog.home_section`).
2. Switch `useHomeSections` to **admin-only**: each carousel shows ONLY tools the admin pinned for that section. No fallbacks/auto-fill. Empty section → carousel hidden.
3. Make every tool card on `/tools` match the reference screenshot exactly (single column "app store" layout, big icon, version, rating, App Preview row, "View more screenshots", "To Start Trying" panel with `(Approx. ₹X.XX value)`, big gradient START USING button, "You have N credits · Buy more" footer for signed-in users).
4. **Remove the "Live" badge** from the card.
5. Add a 5th section after the carousels: **"Explore More Tools"** — gallery grid (not carousel), with filter controls (search-within + category select + sort), showing all live catalog tools in the same card format.

## Files

**New**
- `src/components/admin/HomeSectionsManager.tsx` — table of all live catalog tools with a `<Select>` per row (None / Hot / Trending / Featured / Most Used) bound to `tools_catalog.home_section`. Group view at top showing what's currently pinned per section with drag-free reorder via display_order arrows (optional: only re-use existing display_order field).

**Modified**
- `src/pages/AdminDashboard.tsx` — add new tab `"home-sections"` and render `HomeSectionsManager`.
- `src/hooks/useHomeSections.ts` — return only `home_section`-tagged tools per section. Drop fallbacks. Drop static-tools merging. Sections with 0 items return `[]`.
- `src/components/tools/ToolLandscapeCard.tsx` — restyle to match screenshot:
  - Remove the "Live"/"Coming soon" badge.
  - Title block reorganised: name + `v4.2 · Category` subtitle + description below.
  - Keep rating row (already matches).
  - App Preview becomes a **horizontal row of 3 visible squares** (not 2x2 grid) with a 4th peeking; each is a square `aspect-square` rounded thumb. Centered play icon overlay.
  - "View more screenshots and video demos →" link in primary teal/cyan.
  - "To Start Trying" panel adds `(Approx. ₹{costInr.toFixed(2)} value)` line under the credits text (uses `costInr` already returned by `useToolPricing`).
  - Big gradient pill START USING button (current style fine).
  - Replace "Sign in to start using" with `You have {balance} credits · Buy more` for signed-in users; keep sign-in hint for anon. Use `useWallet` for balance.
- `src/components/tools/ToolSection.tsx` — return null when 0 children (already does); no other change.
- `src/pages/Tools.tsx`:
  - After the 4 carousels, render new `<ExploreMoreTools />` section.
  - Use new card layout for both carousels and gallery (single shared component).
- **New** `src/components/tools/ExploreMoreTools.tsx` — heading "🧭 Explore More Tools", filter bar (search input, Category `<Select>`, Sort `<Select>`: Newest / Name A-Z / Lowest credits / Highest credits), responsive grid `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` of `ToolLandscapeCard`s. Pulls from live `tools_catalog`.

## Data / behavior

- No DB migration needed — `home_section` column already exists.
- Admin UI updates `home_section` via `supabase.from('tools_catalog').update({ home_section }).eq('id', id)` (admin RLS already allows).
- Carousels source = live catalog filtered by `home_section === 'hot' | 'trending' | 'featured' | 'most_used'`.
- Search bar in hero still overrides everything (existing behavior preserved).
- Reference screenshot's "₹ value" comes from `tool_pricing.cost_inr` (already fetched).

## Out of scope
Auth, Razorpay, native tools, admin dashboard layout beyond adding one tab, tool runner/iframe, mobile-shortcut sync.

## Acceptance
- Admin → "Home Sections" tab lets me set/clear `home_section` per tool; change reflects on `/tools` after refresh.
- Without any pins, the 4 carousels are hidden and only "Explore More Tools" gallery is visible.
- Each card visually matches the LuminaClip screenshot (no Live badge, ₹ value shown, credits footer).
- Explore More section shows ALL live catalog tools with working search/category/sort filters.
- No static/expanded tools sneak into carousels — only catalog entries.