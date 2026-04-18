

# Tools Access Flow Overhaul + Admin Controls + Multi-Key Gemini

This plan covers 5 distinct improvements:

## 1. Restructure Access: View First, Pay Later

**Current problem:** `/tools` is wrapped in `PremiumRoute` which forces login → subscription → tools. Users can't browse before paying.

**New flow:**
- `/tools` → public (anyone can browse all tools)
- Click a tool → if not logged in → `/auth` → after login back to tool
- After login, when launching a tool → check if it's free OR user has subscription
  - If free or subscribed → open tool
  - Else → redirect to `/subscription` with toast "This tool requires premium"

**Changes:**
- `src/App.tsx`: Remove `PremiumRoute` wrapper from `/tools`. Keep on `/tool/:toolId`, `/tool-preview/:toolId` but replace with new `ToolAccessGuard` that allows access if `tools_catalog.is_free = true`.
- New `src/components/ToolAccessGuard.tsx`: checks login → checks `is_free` flag on the tool → checks subscription → routes accordingly.

## 2. Admin: Mark Tools as Free + Drag-Drop Ordering

**DB migration:**
```sql
ALTER TABLE tools_catalog ADD COLUMN is_free boolean NOT NULL DEFAULT false;
ALTER TABLE tools_catalog ADD COLUMN display_order integer NOT NULL DEFAULT 0;
CREATE INDEX idx_tools_catalog_display_order ON tools_catalog(display_order);
```

**Admin UI (`ToolManagement.tsx`):**
- Add "Free" toggle column (per row + in edit dialog)
- Add a new "Live Tool Order" section above the table: shows only `is_live = true` tools as draggable cards using `@dnd-kit/core` (already supported pattern). On drop, batch-update `display_order`.

**Tools page (`Tools.tsx`):**
- Sort `featuredLiveTools` by `display_order` ascending by default
- Show a small "FREE" badge on tool cards where `is_free = true`

## 3. Global Search Across All Tabs

**Current problem:** Search only filters within the active view mode (browse/featured/list/personalized).

**Fix in `Tools.tsx`:**
- When `searchQuery.length > 0`, override view mode and show a unified "Search Results" section that searches:
  - `featuredLiveTools` (live/featured tools)
  - `expandedTools` (all browse tools)
  - `catalogTools` (DB catalog including drafts that are live)
- Dedupe by id/name, render in single grid using `EnhancedToolCard`
- Keep current view mode state but visually switch to search results until query is cleared

## 4. Admin: Unlimited Gemini Keys

**Current:** Hardcoded loop `GEMINI_API_KEY_1` → `_10` in env vars. Only 4 keys currently set.

**New approach (DB-backed key pool):**
```sql
CREATE TABLE gemini_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_value text NOT NULL,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  failure_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE gemini_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage keys" ON gemini_api_keys FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
```

**Edge function update** (`notebook-ai`, `startup-analyser`, `promptmaster-ai`):
- Replace `getGeminiKeys()` env loop with a fetch from `gemini_api_keys` where `is_active = true` (using service role)
- On failure of one key → increment `failure_count`, try next key
- On success → update `last_used_at`
- Auto-disable a key when `failure_count >= 5`

**New admin tab "API Keys"** (`src/components/admin/GeminiKeysManager.tsx`):
- Add/delete/toggle keys
- Show last_used_at, failure_count, status
- Mask key value (show last 4 chars)
- Admin-only (hidden for moderators)

## 5. Frontend Error Toast on AI Failure

**In all AI-using components** (PromptMaster, SpeedyNotebook, StartupAnalyser, etc.):
- When edge function returns non-OK or all keys fail → show toast: **"Something went wrong. Please retry — our AI is busy."**
- Add a "Retry" button on the toast where applicable

## Files Changed/Created

| File | Action |
|------|--------|
| `src/App.tsx` | Remove PremiumRoute from `/tools`; add ToolAccessGuard to `/tool/:toolId` |
| `src/components/ToolAccessGuard.tsx` | **New** — login + free/premium check |
| `src/pages/Tools.tsx` | Global search; sort by display_order; FREE badges |
| `src/components/tools/EnhancedToolCard.tsx` | Add FREE badge support |
| `src/components/admin/ToolManagement.tsx` | Add free toggle + drag-drop ordering section |
| `src/components/admin/GeminiKeysManager.tsx` | **New** — manage keys |
| `src/pages/AdminDashboard.tsx` | Add "API Keys" tab (admin-only) |
| `supabase/functions/notebook-ai/index.ts` | DB-backed key fallback + better error |
| `supabase/functions/startup-analyser/index.ts` | DB-backed key fallback |
| `supabase/functions/promptmaster-ai/index.ts` | DB-backed key fallback |
| Migration SQL | Add `is_free`, `display_order`, `gemini_api_keys` table |
| `package.json` | Add `@dnd-kit/core`, `@dnd-kit/sortable` if missing |

## Limitations

- Existing `GEMINI_API_KEY_1..4` env secrets remain as a final fallback for safety; admin should migrate them into the DB table via the new UI
- Drag-drop order only affects "Featured/Live Tools" grid (not the giant 50K browse catalog which is static data)
- "Free" flag only applies to DB catalog tools (not the 50K static `expandedTools`); static tools remain premium-by-default

