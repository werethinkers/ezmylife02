

The user wants several admin/SEO/perf improvements. Let me consolidate and plan.

Requests:
1. Fix drag & drop in admin tool ordering (not working)
2. Live analytics: page views, visitor count, geo source on admin
3. UTM link builder + tracking dashboard
4. Admin can edit tool icon + description (already has description, need icon)
5. SEO boost (now that browsing is public — leverage it)
6. Faster loading/access checks (ToolAccessGuard is slow)
7. Admin coupon code management

# Admin Analytics, UTM Tracking, Coupons, Drag-Drop Fix & Perf

## 1. Fix Drag & Drop (ToolManagement.tsx)
The current `@dnd-kit` setup likely missing `SortableContext` items array or sensors. Will rebuild with proper `DndContext` + `SortableContext` (verticalListSortingStrategy) + `useSortable` per row, persisting `display_order` via batch update on drop end.

## 2. Live Analytics (Admin Dashboard)
**New table `page_views`:**
```sql
- id, path, referrer, utm_source, utm_medium, utm_campaign,
  country, city, user_agent, session_id, user_id (nullable),
  created_at
```
- Public INSERT policy (anyone can log a view)
- Admin/moderator SELECT only

**Tracking:** New `src/hooks/usePageTracking.ts` mounted in `App.tsx` — fires on every route change, captures URL, referrer, UTM params, and uses a free IP geolocation API (`ipapi.co/json`) for country/city.

**Admin tab "Analytics":** new `AnalyticsDashboard.tsx`
- Total views (today / 7d / 30d)
- Unique visitors (by session_id)
- Top pages
- Top referrers
- Geo breakdown (country list with counts)
- Top UTM sources/campaigns
- Live counter: views in last 5 min (via realtime subscription)

## 3. UTM Builder (Admin)
**New table `utm_links`:** id, label, target_path, utm_source, utm_medium, utm_campaign, short_code (unique), click_count, created_at, created_by.

**New admin component `UtmLinkBuilder.tsx`:**
- Form: target path + source/medium/campaign + label
- Generates: `https://ezyourlife.com/{path}?utm_source=...&utm_medium=...&utm_campaign=...`
- List of all created links with click counts (joined from page_views by utm_campaign match)
- Copy button per link

## 4. Tool Icon + Description Editing
`tools_catalog` already has `description`. Add `icon_url` column. Update `ToolManagement.tsx` edit dialog with:
- Description textarea (already present, verify)
- Icon URL input + image preview
- Optional: file upload to existing `tool-uploads` storage bucket → store public URL

Render `icon_url` in `EnhancedToolCard.tsx` (fallback to current icon mapping).

## 5. SEO Boost (public browsing now possible)
- Update `SEOHead.tsx` props on `/tools` to richer description: "Browse 2000+ AI tools free — no signup needed"
- Add JSON-LD `ItemList` schema on `/tools` listing top featured tools (helps Google sitelinks)
- Update `public/sitemap.xml` to include all live tool routes (`/tool-preview/{id}` for each catalog tool — generated client-side via a simple build hint, or a static expanded list)
- Add `<meta name="robots" content="index, follow">` explicitly on tool pages
- Update homepage hero copy to mention "Browse free, no signup"

## 6. Performance Fix — ToolAccessGuard (currently slow)
**Problem:** Every tool launch makes 2 sequential awaits: catalog fetch + edge function `check-subscription` call (~1-3s).

**Fix:**
- Cache subscription status in `AuthContext` on login (single check, refreshed every 5 min via React Query)
- Cache `is_free` flag locally via the existing `useToolsCatalog` hook (already cached 5 min)
- Guard becomes synchronous: `tool.is_free || isSubscribed → render` instantly
- Show loader only if catalog/auth still loading (rare)

Add `useSubscription()` hook returning `{ isSubscribed, loading }` cached globally.

## 7. Admin Coupon Codes Management
**New table `coupon_codes`:**
```sql
- id, code (unique), description, access_type (trial|monthly|yearly|lifetime|complimentary),
  duration_days (nullable), max_uses (nullable), use_count, is_active,
  expires_at (nullable), created_at, created_by
```

**New admin tab "Coupons"** → `CouponManager.tsx`:
- Create/edit/delete codes
- Toggle active
- See use count vs max
- See list of redemptions (join `coupon_redemptions`)

Update `redeem-coupon` edge function to look up codes from this table (instead of hardcoded list), enforce max_uses + expiry, and grant correct `access_type`/duration.

## Files Changed/Created

| File | Action |
|------|--------|
| Migration | Add `page_views`, `utm_links`, `coupon_codes` tables + `tools_catalog.icon_url` |
| `src/hooks/usePageTracking.ts` | **New** |
| `src/hooks/useSubscription.ts` | **New** — cached sub status |
| `src/components/ToolAccessGuard.tsx` | Modify — use cached hooks, instant decision |
| `src/App.tsx` | Mount page tracking |
| `src/components/admin/AnalyticsDashboard.tsx` | **New** |
| `src/components/admin/UtmLinkBuilder.tsx` | **New** |
| `src/components/admin/CouponManager.tsx` | **New** |
| `src/components/admin/ToolManagement.tsx` | Fix drag-drop, add icon URL field |
| `src/components/tools/EnhancedToolCard.tsx` | Render custom icon_url |
| `src/pages/AdminDashboard.tsx` | Add 3 new tabs (Analytics, UTM, Coupons) |
| `src/components/SEOHead.tsx` + `src/pages/Tools.tsx` | Boost meta + JSON-LD ItemList |
| `public/sitemap.xml` | Expand with tool routes |
| `supabase/functions/redeem-coupon/index.ts` | Use DB-backed coupons |

## Limitations
- Geo lookup uses free `ipapi.co` (rate-limited to ~1k/day) — fine for current traffic; can swap if needed
- "Live" counter polls every 30s (not true websocket) to avoid realtime channel cost
- Sitemap is static — won't auto-update for new catalog tools without rebuild; we'll include the top live tools

