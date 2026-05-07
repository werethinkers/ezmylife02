# ProductVision 360 — Native Tool

A full Product Studio that generates ~6 catalog-grade product angles from a single uploaded image, then offers a background studio (presets / solid / custom + logo placement) and ZIP/individual downloads.

## Route & access
- Path: `/tools/productvision-360` (under `<ProtectedRoute>`)
- Lazy-loaded page `src/pages/ProductVision360.tsx`
- Wrapped in our `<Navbar>` and themed with semantic tokens (no dark/light toggle)

## Pricing
- Catalog id: `productvision-360`
- `tool_pricing.credit_cost = 50` (flat, per run, regardless of angle count)
- Charging via existing `start_tool_run` / `complete_tool_run` flow:
  - On "Generate" → `startRun("productvision-360")`. If `insufficient` → open `BuyCreditsDialog`, abort.
  - Run angle generation loop.
  - If ≥1 angle succeeds → `completeRun(runId, true)` (debits 50).
  - If 0 angles → `completeRun(runId, false)` (no charge).

## Backend (edge function)
New edge function `supabase/functions/productvision-angles/index.ts`:
- Validates JWT in code (`verify_jwt = false` default).
- Body: `{ imageBase64, mimeType, angles[] }`.
- Calls the documented public endpoint:
  `POST https://vmhyxhvxgiuwrskfvlsr.supabase.co/functions/v1/public-generate-angles`
  with headers:
  - `apikey`: hard-coded public anon key from `PUBLIC_API.md`
  - `x-gemini-key`: rotates through `GEMINI_API_KEY_1..4` from secrets (existing AI fallback strategy). On 401/429/upstream failure, tries the next key.
- Returns the upstream JSON `{ success, count, images[], failed[] }` to the client.
- CORS headers on every response.

No new secrets required (Gemini keys already exist).

## Frontend page (`src/pages/ProductVision360.tsx`)
States: `START → GENERATING → STUDIO`.

Components under `src/components/productvision360/`:
- `FileUpload.tsx` — drag/drop + click, single product image, client-side resize if >5 MB to stay under the 6 MB edge function payload cap, JPEG/PNG.
- `AnglesView.tsx` — grid of generated angles with status (pending/done/failed), "Regenerate failed" button (re-invokes only failed angles, free — no extra credit charge inside the same run).
- `BackgroundStudioView.tsx` + `BackgroundSelector.tsx` + `BackgroundCompositor.tsx`:
  - Presets: 9 izzhaar PNGs in `src/assets/productvision360-backgrounds/` (re-add as imports).
  - Solid color picker.
  - Custom upload.
  - Optional logo upload + drag-to-position via `PlacementControls.tsx` and `utils/logoCompositor.ts`.
  - Background removal of the white BG via `utils/backgroundRemover.ts` (luminance threshold → transparent PNG, runs client-side in canvas).
- `DownloadsView.tsx`:
  - Download single angle as PNG.
  - Download all as ZIP (uses already-installed `jszip` + `file-saver`).
  - "360 spin frames" pack (just bundles angles in spin order).
- `ResultsViewer.tsx` — tabbed switcher (Angles / Background Studio / Downloads).

Default angle preset: `["Front", "Front-Right", "Right", "Back", "Left", "Front-Left"]`. User can toggle additional angles (`Top`, `Bottom`, `Intelligent Detail Close-Up`) via checkboxes before generation.

## Catalog entry
Insert into `tools_catalog` (data insert, not migration):
- `id`: `productvision-360`
- `name`: "ProductVision 360"
- `description`: "Generate catalog-ready product angles, swap backgrounds, and download a 360° spin pack — all from a single product photo."
- `category`: "AI Image Generation"
- `dedicated_route`: `/tools/productvision-360`
- `is_live`: true, `is_free`: false, `source`: "featured"

Insert into `tool_pricing`:
- `tool_id`: `productvision-360`, `credit_cost`: 50, `cost_inr`: 22 (matches doc estimate, not used for credit math since credit_cost set explicitly).

## Routing
Edit `src/App.tsx`:
- Add `const ProductVision360 = lazy(() => import("./pages/ProductVision360"))`.
- Add route:
  ```tsx
  <Route path="/tools/productvision-360" element={
    <ProtectedRoute><ProductVision360 /></ProtectedRoute>
  } />
  ```

## Theming
Use semantic tokens only (`bg-background`, `text-foreground`, `border-border`, `bg-card`, etc.). Match dark glassmorphism aesthetic (Space Grotesk already global). Framer Motion transitions on tab switches and grid items.

## Out of scope
- Bulk mode (can be added later — same edge function, looped per file with one charge per file).
- Persistent project save/load (results stay in component state for the session).
- No changes to other tools, navbar, or design system.

## Files added/edited
- **New**: `src/pages/ProductVision360.tsx`, `src/components/productvision360/*` (~10 files), `src/assets/productvision360-backgrounds/*.png` (9), `supabase/functions/productvision-angles/index.ts`
- **Edited**: `src/App.tsx`
- **Data**: insert rows into `tools_catalog` and `tool_pricing`