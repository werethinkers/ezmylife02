# Cleaner & Consistent UI Pass

Four scoped changes — all front-end / presentation only. No business logic, RLS, or pricing changes.

## 1. Consistent app icons & preview images everywhere

**Problem**: `EnhancedToolCard`, `ToolLandscapeCard`, `ToolCard`, the search results in `Home`, `Tools`, and admin lists all derive icon/preview URLs slightly differently. Some pass `iconUrl`, some don't, some fall back to gradient placeholders, some only use `getToolIconUrl`.

**Fix** — single source of truth helper `src/lib/toolMedia.ts`:
```ts
resolveToolMedia(toolId, catalogTool?) → { iconUrl, previewImageUrl, iconFit, previewFit }
```
Order of precedence: catalog `icon_url` / `preview_image_url` → `getToolIconUrl(id, category)` AI map → gradient placeholder. Same call used by:
- `EnhancedToolCard` (Tools page, search results)
- `ToolLandscapeCard` (Home sections, AI Apps sections)
- `ToolCard` (legacy)
- `ToolQuickPreview`
- `Home` Top Picks tile (currently shows only a Sparkles icon — will show the real icon)
- Admin `ToolManagement` row thumbnails

This guarantees the same logo and preview render in Home, AI Apps, Tool Viewer header, Quick Preview modal, and Admin.

## 2. Home search → real card layout

**Problem**: Home's search bar just navigates to `/ai-apps?q=…` with no in-page results, which doesn't match the AI Apps page (which renders `EnhancedToolCard` grid).

**Fix** in `src/pages/Home.tsx`:
- Keep navigating to `/ai-apps?q=…` on submit (Enter / button) so deep-link still works.
- Add a live-results panel under the search bar when `search.length > 0`: same `EnhancedToolCard` grid component used by `Tools.tsx` search, rendered inside Home, with the same empty state.
- Hide the hero / categories / featured sections while a query is active (mirror of Tools.tsx behaviour) so the experience is identical on both pages.

Read `?q=` from URL on AI Apps page (already supported via `searchQuery` state — just initialize from `useSearchParams`) so a Home → AI Apps jump preserves the query.

## 3. Replace "Favourite Apps" with "Recent Apps"

**Data source**: existing `activity_logs` rows with `action_type='tool_usage'` already log `tool_id` + `tool_name` per user (see `ToolViewer.tsx`). No schema change needed.

**New hook** `src/hooks/useRecentTools.ts`:
- For signed-in user, query `activity_logs` filtered by `user_id` and `action_type='tool_usage'`, ordered desc, distinct on `tool_id`, limit 8.
- Join against `useToolsCatalog` to get full card props.
- Returns `[]` for anon users (section hides, like favourites does today).

**UI changes**:
- `src/pages/Tools.tsx`: replace the `favoriteTools` block with `recentTools` and rename section title to "Recent Apps" with 🕒 emoji. Remove `useFavorites` import there.
- Keep the Favourite heart on `ToolLandscapeCard` working (DB table stays — just no dedicated section). If you'd rather fully remove favourites UI, say so and I'll strip the hearts too.

## 4. Declutter Admin tab bar

Currently 18 flat pill-buttons wrap across 3+ rows. Group into 5 logical sections shown as a sidebar (desktop) / accordion (mobile):

```text
Overview        → Analytics, Visitors, Activity Logs
People          → Users, Credits
Tools           → Tool Management, Tool Usage, Tool Media, Home Sections, Tool Requests
Growth          → UTM Links, Coupons, Enterprise Leads
Modules         → Meet Nudge, Virasat, Archived Events
System          → API Keys
```

Implementation in `src/pages/AdminDashboard.tsx`:
- Replace the flat `tabs` array with a grouped structure.
- Use existing `ui/sidebar` (desktop ≥md, sticky left rail with section headers + icon+label items) and a `Select` dropdown on mobile.
- Stat cards stay at the top but trim to 3 most-relevant (Total Users, Credits Sold, Today's Logins) — drop "Activity Logs count" which is just `logs.length` of last 200.
- Remove duplicate icon imports no longer needed.

Result: visible options reduced to one column with clear grouping; no tab is removed, just organized.

## Files touched
- new: `src/lib/toolMedia.ts`, `src/hooks/useRecentTools.ts`
- edit: `src/pages/Home.tsx`, `src/pages/Tools.tsx`, `src/pages/AdminDashboard.tsx`
- edit: `src/components/tools/EnhancedToolCard.tsx`, `src/components/tools/ToolLandscapeCard.tsx`, `src/components/ToolCard.tsx`, `src/components/tools/ToolQuickPreview.tsx`
- edit: `src/components/admin/ToolManagement.tsx` (use shared media helper for thumbnails)

## Out of scope (confirm if you want them)
- Removing the Favourites heart button entirely from cards.
- Changing tool pricing, RLS, or any backend.
- Restyling individual admin sub-pages (only the tab navigation is decluttered).
