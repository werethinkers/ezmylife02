

# Comprehensive SEO Overhaul + Admin Activity Archive + Meet Nudge Dashboard

This plan addresses three requests: (1) fix all SEO/canonical URLs to use `ezyourlife.com`, (2) improve admin activity logs UI with an archive-style view, and (3) add a contacts analytics dashboard to Meet Nudge.

---

## Part 1: SEO Domain Fix + Crawlability Improvements

### Problem
All canonical URLs, Open Graph URLs, JSON-LD structured data, sitemap, and robots.txt currently point to `ezmylife02.lovable.app` instead of `ezyourlife.com`.

### Changes

**1. `src/components/SEOHead.tsx`**
- Change `BASE_URL` from `https://ezmylife02.lovable.app` to `https://ezyourlife.com`
- Update publisher URL and logo URL to use new domain

**2. `index.html`**
- Replace ALL 20+ instances of `ezmylife02.lovable.app` with `ezyourlife.com` in:
  - `<link rel="canonical">`
  - All `og:url`, `og:image`, `twitter:image` meta tags
  - All JSON-LD blocks (Organization, SoftwareApplication, FAQPage, BreadcrumbList, ItemList, WebSite/SearchAction)
  - Noscript fallback content

**3. `public/sitemap.xml`**
- Replace all `ezmylife02.lovable.app` URLs with `ezyourlife.com`

**4. `public/robots.txt`**
- Update `Host` directive to `https://ezyourlife.com`
- Update `Sitemap` URL to `https://ezyourlife.com/sitemap.xml`

**5. Add SEOHead to pages missing it**
- `src/pages/MeetNudge.tsx` — add SEOHead with Meet Nudge keywords
- `src/pages/GetExtension.tsx` — add SEOHead with extension keywords
- `src/pages/SpeedyNotebook.tsx` — add SEOHead with notebook keywords
- `src/pages/PromptMaster.tsx` — add SEOHead with prompt keywords
- `src/pages/StartupAnalyser.tsx` — add SEOHead wrapper

**6. Add SEOFooter to pages missing it**
- `src/pages/Subscription.tsx`, `src/pages/MeetNudge.tsx`, `src/pages/GetExtension.tsx`, `src/pages/RefundPolicy.tsx`

**7. `src/components/SEOFooter.tsx`**
- Update copyright year from 2025 to 2026

---

## Part 2: Admin Activity Logs Archive UI Improvement

### Problem
The current activity logs tab shows raw JSON in a cramped table — it's hard to read and ugly.

### Changes

**Create `src/components/admin/ActivityArchive.tsx`**
A proper archive-style component that:
- Groups activity logs by date (Today, Yesterday, Earlier this week, etc.)
- Shows each log as a clean card with:
  - User avatar/initials + name/email
  - Action type as a colored badge
  - Human-readable description of what they did (e.g., "Used Invoice Generator" instead of raw JSON)
  - Relative timestamp ("2 hours ago")
- Filters by action type (tool_usage, login, signup, profile_edit, payment)
- Search by user name/email
- Pagination (load more button)
- Expandable details section for raw data when needed

**Update `src/pages/AdminDashboard.tsx`**
- Replace the current raw table in the "logs" tab with the new `ActivityArchive` component

---

## Part 3: Meet Nudge Contacts Analytics Dashboard

### Problem
No way to see analytics about the people you've met — what industries, locations, companies are most common.

### Changes

**Create `src/components/meet-nudge/ContactsAnalytics.tsx`**
A dashboard component showing:
- **Summary cards**: Total contacts, Total events, Intros sent %, This month's contacts
- **Top Companies**: List of most frequent companies/business names
- **Top Locations**: List of most frequent locations
- **Top Occupations/Roles**: List of most frequent occupations
- **Contacts timeline**: Simple bar showing contacts per event
- **Recent contacts**: Quick list of last 5 contacts added

All computed client-side from existing contacts data (no new DB tables needed).

**Update `src/pages/MeetNudge.tsx`**
- Add a third tab "Insights" with a chart icon alongside Events and Contacts tabs
- Render `ContactsAnalytics` in the new tab, passing contacts data

---

## Files to modify

| File | Change |
|------|--------|
| `src/components/SEOHead.tsx` | Fix BASE_URL to ezyourlife.com |
| `index.html` | Replace all lovable domain references |
| `public/sitemap.xml` | Fix all URLs |
| `public/robots.txt` | Fix Host and Sitemap URLs |
| `src/pages/MeetNudge.tsx` | Add SEOHead, SEOFooter, Insights tab |
| `src/pages/GetExtension.tsx` | Add SEOHead, SEOFooter |
| `src/pages/SpeedyNotebook.tsx` | Add SEOHead |
| `src/pages/PromptMaster.tsx` | Add SEOHead |
| `src/pages/StartupAnalyser.tsx` | Add SEOHead wrapper |
| `src/pages/Subscription.tsx` | Add SEOFooter |
| `src/pages/RefundPolicy.tsx` | Add SEOFooter |
| `src/components/SEOFooter.tsx` | Fix copyright year |
| `src/components/admin/ActivityArchive.tsx` | Create new archive-style logs UI |
| `src/pages/AdminDashboard.tsx` | Use new ActivityArchive component |
| `src/components/meet-nudge/ContactsAnalytics.tsx` | Create contacts insights dashboard |

No database changes needed.

