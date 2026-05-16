# Plan: Admin sections, GSC indexing dashboard, internal links hub

Four scopes bundled together. All admin features gated behind the existing `admin` role.

---

## 1. Multi-section assignment (Hot, Trending, etc.)

**Today**: `tools_catalog.home_section` is a single text column — a tool can only live in one section.

**Change**: Replace with a many-to-many join.

New tables:
- `home_sections` — admin-editable list. Fields: `slug`, `title`, `subtitle`, `display_order`, `is_active`.
- `tool_section_assignments` — `(tool_id, section_id, position)`.

Seed `home_sections` with: Hot, Trending, New, Editor's Pick, Most Used, Staff Pick (admin can rename / add / remove / reorder afterwards).

Keep the legacy `home_section` column for one release as a fallback, but new UI reads from the join table.

**Admin UI** — extend `src/components/admin/HomeSectionsManager.tsx`:
- Top half: CRUD list of sections (drag-reorder, rename, toggle active).
- Bottom half: per-section tool picker (search catalog + multi-select chips) so the same tool can be added to as many sections as wanted.
- Inside `ToolManagement.tsx`, add a "Sections" multi-select on the tool edit drawer.

**Public UI** — `useHomeSections.ts` already drives rendering; update it to read assignments and render each active section as its own carousel on the Home page.

---

## 2. GSC indexing admin dashboard

New admin tab "SEO / Indexing" at `/admin` (lazy-loaded `AdminSeoIndexing.tsx`).

**Data model** — new table `gsc_url_status`:
- `url` (PK), `coverage_state`, `last_crawl_time`, `indexing_state`, `page_fetch_state`, `robots_state`, `last_checked_at`, `inspection_result` (jsonb).

**Edge function** — `gsc-inspect-urls`:
- Takes `{ urls: string[] }` (max 50/call).
- For each URL: POST to gateway `/google_search_console/v1/urlInspection/index:inspect` with `{ inspectionUrl, siteUrl: "https://ezyourlife.com/" }`.
- Upserts row into `gsc_url_status`.
- Honors GSC quota: 2,000/day, 600/min — function caps at 600/run, throttles with 100ms between calls.

**Dashboard UI**:
- Top KPIs: total URLs in sitemap, indexed count, not-indexed count, errors, last sync time.
- Filter tabs: All / Indexed / Discovered-not-indexed / Crawled-not-indexed / Errors / Not checked.
- Table: URL, status badge, last crawl, last checked, actions.
- Bulk actions on selected rows:
  - "Re-inspect" (calls edge function).
  - "Open in GSC" — deep-links to `https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2Fezyourlife.com%2F&id={encodedUrl}` (1-click manual indexing workflow per your choice).
- "Sync sitemap → DB" button: parses `public/sitemap.xml`, upserts missing URLs.
- "Inspect 50 oldest" button for daily manual sweeps.

No cron job — admin presses buttons. Keeps within the official "inspection-only + deep-link" model.

---

## 3. Internal links hub page

New route `/explore` (also linked from footer + Home "Popular searches" block).

Renders:
- H1 "Explore AI tools by use case and industry".
- Section 1: 60 top "AI tool for {use case}" links → `/ai-tool-for/{slug}` (from `src/lib/seoData.ts`).
- Section 2: 30 industry pages → `/ai-for/{industry}`.
- Section 3: Top categories (existing).
- Section 4: Featured tools alphabetical.

Pure server-rendered HTML semantics (`<ul>` of `<a>`), `PageSeo` with `CollectionPage` JSON-LD, included in `sitemap.xml`.

Add a compact "Browse by use case →" link block at the bottom of Home and `/ai-apps` for crawl flow.

---

## 4. Sitemap & cross-cutting

- `public/sitemap.xml` regenerated to include `/explore` plus current programmatic URLs.
- "Sync sitemap → DB" in the SEO dashboard parses the live `sitemap.xml` so the indexing tracker never drifts.

---

## Technical details

**Migrations** (one call, schema only):
- `home_sections` table + RLS (admins write, anyone read active).
- `tool_section_assignments` table + RLS.
- `gsc_url_status` table + RLS (admins only).
- Seed 6 default sections via the same migration.

**Edge function** `gsc-inspect-urls`:
- Uses existing `GOOGLE_SEARCH_CONSOLE_API_KEY` + `LOVABLE_API_KEY` via gateway.
- Validates admin role server-side via JWT.
- Returns per-URL outcome for UI.

**New / edited files**:
- New: `src/pages/Explore.tsx`, `src/components/admin/AdminSeoIndexing.tsx`, `supabase/functions/gsc-inspect-urls/index.ts`.
- Edited: `src/App.tsx` (route for `/explore`), `src/pages/AdminDashboard.tsx` (new tab), `src/components/admin/HomeSectionsManager.tsx`, `src/components/admin/ToolManagement.tsx`, `src/hooks/useHomeSections.ts`, `src/pages/Home.tsx`, `public/sitemap.xml`, `src/components/SEOFooter.tsx` (link to `/explore`).

**Out of scope** (per the constraint above): no auto-indexing cron, no Indexing API misuse — only URL Inspection + GSC deep-links.
