## Plan

### 1. Replace 3-square preview with one big image (in `ToolLandscapeCard.tsx`)
- Remove the 3 gradient `App Preview` squares.
- Render a single 16:9 preview image in the same vertical space (approx the height the 3 squares occupied — keeps card height unchanged).
- Image source: `tool_media` first row for that `tool_id` (`kind=image`). If none, fall back to a single gradient placeholder with `PlayCircle`.
- Click opens existing `onPreview` (full carousel).
- Caption "View more screenshots and video demos →" stays.

### 2. Mobile carousel = one card centered
- In `ToolSection.tsx`, change slide width on mobile from `w-[88%]` to `w-[92%]` and add `justify-center` / center alignment via embla `align: "center"` only on mobile (use a mobile breakpoint check via existing `useIsMobile`).
- Result on phones: exactly one card visible, horizontally centered; desktop unchanged.

### 3. Admin Tool Media manager — table per tool
Rebuild `src/components/admin/ToolMediaManager.tsx` as a single table listing every tool from `tools_catalog` (name + id). Each row has:
- **Icon** column: small thumbnail + "Upload icon" button (writes to `tools_catalog.icon_url` after uploading to `tool-media` bucket).
- **Big preview image** column: thumbnail + "Upload image" button (writes to `tool_media` table, replacing existing first image for that tool).
- **Rating** column: numeric input (0–5) saved to new `tools_catalog.rating` column.
- **Reviews** column: integer input (e.g. 8700) saved to new `tools_catalog.review_count` column.
- Save button per row (or auto-save on blur).

### 4. Card displays admin-set rating/reviews
- `ToolLandscapeCard` reads `rating` and `review_count` from catalog (passed via props from `Tools.tsx`); falls back to current hash-based defaults when null.
- Format reviews as e.g. `8.7k` when ≥ 1000, else raw count.

### 5. Schema additions
Add columns to `tools_catalog`:
- `rating numeric(3,2)` nullable
- `review_count integer` nullable
- `preview_image_url text` nullable (denormalized convenience copy of the big image, also kept in `tool_media`)

No RLS changes (existing admin-update policy on `tools_catalog` already allows admins to write).

### Files touched
- `supabase/migrations/...` — add 3 columns
- `src/components/admin/ToolMediaManager.tsx` — full rewrite (table layout)
- `src/components/tools/ToolLandscapeCard.tsx` — single preview image, use rating/review props
- `src/components/tools/ToolSection.tsx` — mobile-centered single-card carousel
- `src/pages/Tools.tsx` — pass `rating`, `reviewCount`, `previewImageUrl` from catalog to card
- `src/hooks/useToolsCatalog.ts` — include new columns in select
- `src/integrations/supabase/types.ts` — auto-regen after migration
