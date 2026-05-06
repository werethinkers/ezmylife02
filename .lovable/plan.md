## Goals

1. Remove the "Sign in / Choose plan / Pick a tool / Use it" funnel stepper from the top of public pages.
2. Allow guests to **view a tool's detail page** (gallery, description, credit cost) without signing in. Sign-in is only required when they hit the "Start Using" button.
3. Redesign every tool entry into an **App-Store style detail page** matching the reference screenshot, but with our existing dark/glassmorphism color scheme (no purple→pink gradient — use our primary/accent gradient).
4. Make this detail page editable from the **Admin tab**: name, tool ID, description, app icon, and a gallery of up to 4 images + 1 video.

## What changes

### A. Remove funnel stepper
- Delete `<FunnelStepper>` usage from `src/pages/Tools.tsx` and `src/pages/Auth.tsx`.
- Keep the component file for now (unused) so we can revert easily.

### B. New App-Store style Tool Detail page (`/tool/:toolId`)

Currently `/tool/:toolId` goes straight into `ToolViewer` (iframe / native renderer) behind `ToolAccessGuard`. We split this:

- **`/tool/:toolId`** → new `ToolDetail.tsx` (PUBLIC, no auth guard). Shows the app-store style page.
- **`/tool/:toolId/use`** → existing `ToolViewer` wrapped in `ToolAccessGuard` (sign-in required for paid tools, free tools open directly).

`ToolDetail.tsx` layout (mobile-first, matches screenshot):

```text
[← Back]                                    [♥ Favorite]

┌────────┐   Tool Name
│  Icon  │   v1.0 · Category
│ (96px) │
└────────┘   Short description (2-3 lines)
             ★ rating · (reviews)   [optional, from view counts]

App Preview
[ img ][ img ][ img ][ video ]   ← horizontal scroll carousel
View more screenshots →

To Start Using
┌──────────────────────────────────────┐
│ ⚡  Credits per run:                  │
│     {creditCost} CREDITS              │
│     (Approx. ₹{cost_inr} value)       │
└──────────────────────────────────────┘

[  START USING · {creditCost} CREDITS  ]   ← gradient CTA
You have {wallet} credits · Buy more
```

Behavior:
- Anyone (guest or signed-in) can view this page.
- `START USING` button:
  - If guest → open `LoginPromptDialog` with `returnTo=/tool/:toolId/use`.
  - If signed-in & free tool → navigate to `/tool/:toolId/use`.
  - If signed-in & paid tool & enough credits → navigate to `/tool/:toolId/use`.
  - If signed-in but insufficient credits → open existing `BuyCreditsDialog`.
- Pulls data from `tools_catalog` (name, description, category, icon_url), `tool_pricing` (credit cost, INR), `tool_media` (gallery), `useWallet` (balance).

Color scheme: dark glassmorphism card + our `from-primary to-accent` gradient on the CTA button (NOT the reference's purple-pink). `Space Grotesk` headings.

### C. Routing
In `src/App.tsx`:
- `/tool/:toolId`  → `<ToolDetail />` (public)
- `/tool/:toolId/use` → `<ToolAccessGuard><ToolViewer /></ToolAccessGuard>` (guarded)

Update `EnhancedToolCard` "Open" handler to keep navigating to `/tool/:toolId` (now the detail page). No change needed there.

### D. Admin: edit detail-page content

`tool_media` table and `ToolMediaManager` already exist (image/video/gif uploads keyed by tool_id). We extend the admin UX so editing one tool's "App Store page" feels like one screen instead of two:

- In `ToolManagement.tsx`, on each tool row add an **"Edit detail page"** button → opens a `ToolDetailEditor` dialog with two sections:
  1. **Basics** — name, tool ID (read-only), description, category, app icon (uploads to existing `tool-media` bucket as `kind=icon`, persisted to `tools_catalog.icon_url`).
  2. **Gallery** — drag-and-drop up to **4 images + 1 video**. Reuses existing `tool_media` rows; enforces the 4-image / 1-video limit client-side. Drag handles reorder via `sort_order`.
- `ToolMediaManager` stays for power-use bulk admin.

No schema changes needed (`tool_media`, `tools_catalog.icon_url`, `tool_pricing` all already exist).

## Out of scope
- Real ratings / reviews (we'll show view-count-based "popularity" if available, otherwise omit the stars).
- Changing how `ToolViewer` itself renders.

## Files

**New**
- `src/pages/ToolDetail.tsx` — App-store style public detail page
- `src/components/tools/ToolGallery.tsx` — image/video carousel
- `src/components/admin/ToolDetailEditor.tsx` — single-screen editor dialog

**Modified**
- `src/App.tsx` — add `/tool/:toolId/use`, repoint `/tool/:toolId`
- `src/pages/Tools.tsx` — remove `<FunnelStepper>`
- `src/pages/Auth.tsx` — remove `<FunnelStepper>`
- `src/components/admin/ToolManagement.tsx` — add "Edit detail page" action
