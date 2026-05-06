## Goals

1. Remove the funnel stepper bar (Sign in → Choose plan → Pick a tool → Use it).
2. Remove the sign-in wall on `/credits` — anyone can browse packs.
3. Only prompt sign-in at the moment of an action that costs credits or generates output.
4. Replace the "For You / Live Tools / Browse / All Tools" toggle and category browser with a clean home: title → description → search bar → 4 section carousels.
5. Each tool card uses a wide "app store" layout (matches the reference screenshot) and the sections auto-scroll horizontally, alternating direction.
6. **Do not touch any existing tool implementations** — only the discovery page, the funnel, and the /credits gating change.

## Out of scope (untouched)

- All native tools (Speedy Notebook, PromptMaster, Startup Analyser, Meet Nudge, Virasat, Bulk Mode, Get Extension)
- Auth flow itself, Razorpay/credits backend, admin dashboard
- Tool Viewer / iframe rendering
- Existing protected routes

## What changes

### 1. Funnel stepper removal

- Delete the `<FunnelStepper />` render from `Tools.tsx` (line 373) and `Auth.tsx` (line 158).
- Keep the `FunnelStepper.tsx` file in case it's needed later, but unused.

### 2. /credits — no login wall

- `Credits.tsx`: keep the page open to anonymous visitors. The "Sign in to top up" card stays as a soft prompt, but the packs grid is already visible — no change needed there.
- The actual sign-in dialog (`LoginPromptDialog`) only fires when the user clicks "Buy" on a pack and isn't authenticated (this already works at `buyPack` — line 57). Confirmed correct.
- Remove the `<Card>` block at lines 186–197 that nags anonymous users to sign in (the wallet card just hides for them).

### 3. Login only at action time

- Audit non-action pages that gate behind login and remove the gating where the user is just browsing:
  - `/tools` — no auth needed (already open).
  - `/credits` — no auth needed to view packs.
  - Tool cards / quick-preview — no auth needed.
- Login still triggers from:
  - Buying a credit pack (existing).
  - Starting a tool that consumes credits via `useCredits` (existing — `LoginPromptDialog` already fires inside `charge()`).
  - Navigating to `/profile`, `/admin`, `/credits/history`, native tools that save user data — these stay protected as before.

### 4. New /tools layout

Replace everything between `<Navbar />` and the chatbot/footer with this structure:

```text
┌─────────────────────────────────────────────┐
│   AI-Powered Apps (pill)                   │
│   Discover AI Apps                            │
│   small description                         │
│   [    search bar    ]                      │
└─────────────────────────────────────────────┘

🔥 Hot Tools         1/12        ‹ ›
[ landscape card ][ landscape card ][ … ]   ← auto-scrolls left

📈 Trending Tools    1/12        ‹ ›
[ landscape card ][ landscape card ][ … ]   ← auto-scrolls right

⭐ Featured Tools    1/12        ‹ ›
[ landscape card ][ landscape card ][ … ]   ← auto-scrolls left

🏆 Most Used Tools   1/12        ‹ ›
[ landscape card ][ landscape card ][ … ]   ← auto-scrolls right
```

Removed: the For You / Live Tools / Browse / All Tools toggle, the stats badges ("200 Live · 2,000 Total"), the `CategoryBrowser`, the `ToolsFilters` (sector / department / tool-type selects), the personalized view, the export button.

Search bar still works — when the user types, the four carousels collapse into a single grid of search results (existing global search logic kept).

### 5. Landscape "app store" tool card

A new component `ToolLandscapeCard` matching the reference screenshot. Each card is wide (≈340 px on mobile, ≈420 px on desktop) and contains:

- Top row: rounded-square icon (left, 64 px) · name + `vX.Y · AI Agent` + 2-line description
- Live badge (existing emerald pill) + ⭐ rating (use a deterministic pseudo-rating per tool id so it stays stable)
- "App Preview" mini grid (2×2 of gradient thumbnails using the tool icon as overlay)
- "View more screenshots and video demos →" link → opens existing `ToolQuickPreview`
- "Minimum Credit to Start: N CREDITS for 1 Generation" panel (uses `useToolPricing`)
- Big gradient button "START USING · N CREDITS" → navigates to `/tool/:toolId`
- Anonymous-only sub-line: "Sign in to start using" (just text, not a button — the sign-in dialog opens automatically when the action triggers a paid run)

### 6. Carousels

Use the existing `embla-carousel-react` (already in `src/components/ui/carousel.tsx`).

- Section component `ToolSection` takes `{ title, icon, tools, autoScrollDirection: "ltr" | "rtl" }`.
- Auto-scroll using `embla-carousel-auto-scroll` plugin (need to add). Speed: ~1 px / frame, pauses on hover, resumes on leave.
- Sections alternate direction so the page feels alive: Hot ←, Trending →, Featured ←, Most Used →.
- Manual prev/next arrows + counter "1/12" stay visible.

### 7. Section data source

Approach (no admin UI built right now — just plumbing):

- Tools in each section come from `tools_catalog` filtered by a new optional column `home_section` (text, nullable). Values: `hot`, `trending`, `featured`, `most_used`. A tool can be in only one section at a time; admin can change later from the existing tool-management screen (we'll wire that in a follow-up — out of scope today).
- For now, since no tools are tagged, fall back to picking 12 tools per section automatically:
  - Hot: top 12 by `display_order` from live + featured.
  - Trending: 12 most-recently-added live tools.
  - Featured: 12 with `is_premium` or `source = 'featured'`.
  - Most Used: 12 from `tool_runs` aggregated count (last 30 days). If the table is empty, fall back to the same pool.
- All sections gracefully hide if they end up with <3 tools.

A small migration adds the `home_section` column so the admin can populate it later. No data is written.

## Technical changes (developer-facing)

**Edits**

- `src/pages/Tools.tsx` — gut the body, replace with new `<ToolsHero />` + four `<ToolSection />` blocks; keep global search results and `ToolQuickPreview`/`ToolsChatbot`.
- `src/pages/Auth.tsx` — remove `<FunnelStepper />` import + render.
- `src/pages/Credits.tsx` — drop the anonymous "Sign in to top up" card; rest stays.

**New files**

- `src/components/tools/ToolsHero.tsx` — pill + title + description + search input only.
- `src/components/tools/ToolLandscapeCard.tsx` — the wide app-store card.
- `src/components/tools/ToolSection.tsx` — auto-scrolling embla carousel wrapper + arrows + counter.
- `src/hooks/useHomeSections.ts` — picks 12 tools per section from catalog/`tool_runs`.

**Migration**

- `ALTER TABLE public.tools_catalog ADD COLUMN home_section TEXT;` (nullable, defaults to `NULL` — no policy changes needed; existing policies cover it).

**Dependency**

- Add `embla-carousel-auto-scroll` (~3 KB).

**Removed (left in repo, no longer rendered)**

- `FunnelStepper`, `ToolsHeader`, `ToolsFilters`, `CategoryBrowser`, `PersonalizedTools` — keep files so we can restore later, but delete the imports/renders from `Tools.tsx`.

## Acceptance checklist

- No funnel bar on `/tools` or `/auth`.
- `/credits` packs visible without login; clicking Buy without login opens the sign-in dialog.
- Browsing tool cards / opening preview never asks for login. Login only triggers when the user clicks a tool action that runs/charges.
- `/tools` shows: pill → "Discover Tools" → description → search bar → 4 carousels.
- Each carousel auto-scrolls (alternating direction), pauses on hover.
- Each card matches the reference screenshot layout.
- Search still works and overrides the carousels with a results grid.
- All existing tool pages (`/tool/:id`, native tools, admin, bulk QA) untouched.