## Goal

Ensure the four home carousels (Hot, Trending, Featured, Most Used) always render above "Explore More Tools", hide all coming-soon tools from the public site, and show only live-tool counts in the admin.

## 1. Carousels always show, with deterministic auto-fill

Update `src/hooks/useHomeSections.ts`:
- For each section, first take admin-pinned live tools (`is_live = true && home_section = <section>`).
- If a section has fewer than 12 entries, fill remaining slots from the live catalog using a deterministic, section-seeded shuffle so each carousel gets a different mix of 12 tools, no duplicates within a carousel.
- A tool already pinned to one section can still appear as filler in others (acceptable since admin hasn't curated yet).
- All filler tools must be `is_live = true`.

`src/pages/Tools.tsx` already renders all four `ToolSection`s; no change needed beyond the hook. `ToolSection` already auto-hides when empty — with auto-fill it will always render.

## 2. Hide coming-soon tools across the public site

Filter `is_live = false` everywhere a public listing is built:
- `src/hooks/useHomeSections.ts` — already enforced for pinned, enforce for filler too.
- `src/components/tools/ExploreMoreTools.tsx` — already filters `is_live`. Confirm.
- `src/pages/Tools.tsx` global search — already filters catalog by `is_live`. Also drop `expandedTools` entries where `isLive === false` from the search merge.
- `src/pages/Home.tsx` — audit any tool grids/featured sections and add `is_live` filter.
- `src/components/CategoryBrowser.tsx` and any other public tool list (e.g. `RequestToolSection` siblings, `BulkPromoSection`, `EnhancedToolCard` consumers) — filter coming-soon out.
- `ToolsHero` / category counts — if they show numbers, base on live count only.
- Sitemap (`supabase/functions/sitemap/index.ts`) — only emit live tools.

Admin UIs (`HomeSectionsManager`, `ToolManagement`, etc.) keep showing all tools so admins can still manage coming-soon entries.

## 3. Admin counts: live-only everywhere

Audit every admin counter and switch the source to `is_live = true`:
- `src/pages/AdminDashboard.tsx` — top stats cards / tab badges showing tool totals.
- `src/components/admin/ToolManagement.tsx` — header count, category counts.
- `src/components/admin/HomeSectionsManager.tsx` — already restricts to `is_live`; keep.
- `src/components/admin/AnalyticsDashboard.tsx` — any "tools" KPI.
- Any other admin component referencing `tools_catalog.length` without an `is_live` filter.

Each location: change the count to `tools.filter(t => t.is_live).length` and label it "Live tools" for clarity. Lists/tables themselves remain unchanged so admins can still see coming-soon tools.

## Out of scope

- No DB schema changes (uses existing `is_live` and `home_section`).
- No changes to auth, billing, native tools, or tool viewer.
- No changes to admin tool management workflows beyond counters.
- "My Tools" / saved areas untouched per prior instruction.
