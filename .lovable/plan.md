## Goal

Give admins a "Visitors" tab that reveals every person who hits the site — registered or anonymous — grouped by IP/session, showing the full click path, entry & exit (bounce) page, device/location, and time spent.

## What's missing today

- `page_views` already logs path, referrer, UTM, country, city, session_id, user_id and user_agent — but **no IP address** is captured (browsers can't read their own IP).
- There is no admin UI that groups views into per-visitor sessions.

## Plan

### 1. Capture IP server-side (migration + edge function)

- Add columns to `page_views`: `ip_address text`, `ip_hash text` (sha256 for grouping), `device_type text`, `browser text`, `os text`, `time_on_page_ms integer`.
- Create edge function `log-pageview` (verify_jwt = false) that:
  - Reads `x-forwarded-for` / `cf-connecting-ip` from the request headers.
  - Looks up geo via `ipapi.co` (server-side, no client cost).
  - Parses the user agent into device/browser/OS.
  - Inserts the row into `page_views` using the service role key.
- Update `src/hooks/usePageTracking.ts` to call this edge function instead of inserting directly. Also send a `beforeunload` beacon with `time_on_page_ms` so we can compute bounces.

### 2. Visitor sessions view (Postgres)

- Create a SECURITY DEFINER function `get_visitor_sessions(_since timestamptz, _limit int)` that returns one row per `(session_id, ip_hash)` with:
  - first_seen, last_seen, duration, page_count
  - entry_path, exit_path (= bounce page)
  - is_bounce (page_count = 1)
  - country, city, device, browser, referrer, utm_*, ip_address (admin only)
  - user_id + email (joined from `profiles`) when known, else null = anonymous
- Restrict execution to admin/moderator via `has_role` check inside the function.

### 3. Admin UI — new "Visitors" tab

New file `src/components/admin/VisitorsTracker.tsx` added to `AdminDashboard.tsx` tab list (icon: `Footprints`). Features:

- **Stat cards**: Total visitors (24h / 7d / 30d), unique IPs, bounce rate, avg pages/session.
- **Sessions table** (default view) — one row per visitor session:
  - Who: email if registered, else "Anonymous · {IP}"
  - Location: city, country (flag)
  - Device / Browser
  - Entered → Exited (with bounce badge if 1-page)
  - Pages, Duration, First seen
  - Referrer / UTM source chips
- **Row expansion**: click a session to reveal the full ordered click path (path, time on page, timestamp) — pulled live from `page_views` filtered by session_id.
- **Filters**: date range, registered vs anonymous, country, bounced only, search by IP/email/path.
- **Auto-refresh** every 30s (same pattern as `AnalyticsDashboard`).

### 4. Privacy / security

- IP only visible to `admin` (moderators see `ip_hash` masked like `1.2.•.•`).
- Existing RLS on `page_views` already restricts SELECT to admin/moderator — keep as is.
- Add note in security memory that storing IPs is intentional for fraud/abuse tracking.

## Technical details

```text
Files created
  supabase/functions/log-pageview/index.ts
  supabase/migrations/<ts>_visitor_tracking.sql
  src/components/admin/VisitorsTracker.tsx

Files edited
  src/hooks/usePageTracking.ts        (call edge fn + beacon)
  src/pages/AdminDashboard.tsx        (add Visitors tab)
  supabase/config.toml                (register log-pageview, verify_jwt = false)
```

```sql
ALTER TABLE page_views
  ADD COLUMN ip_address text,
  ADD COLUMN ip_hash text,
  ADD COLUMN device_type text,
  ADD COLUMN browser text,
  ADD COLUMN os text,
  ADD COLUMN time_on_page_ms integer;
CREATE INDEX page_views_session_idx ON page_views(session_id, created_at);
CREATE INDEX page_views_ip_hash_idx ON page_views(ip_hash);
```

No breaking changes; existing analytics keeps working.
