# Integrate Product 360 as a native tool

Mounts the source app from project **Remix of product 360 final** as a native tool at `/tools/Product-360` inside EZYOURLIFE — sharing this project's auth, navbar, credits, and Supabase backend. No iframe.

## What the tool does
Upload a product photo → Gemini 2.5 Flash Image generates ~10 catalog-grade angles (front, sides, back, top, bottom, close-up) on a clean white background, removes white bg → transparent, then offers a Background Studio (preset/solid/custom + logo placement) and Downloads (zip / individual / 360 spin frames). Bulk mode supported.

## Pricing
**Flat 50 credits** charged once per generation session (one upload = one charge), regardless of how many angles succeed/fail. Bulk mode charges 50 credits per uploaded product image.

Implementation: insert row in `tool_pricing` with `tool_id = 'product-360'`, `credit_cost = 50`. Wrap the generation entry point with `start_tool_run` (debits on success via `complete_tool_run`). If `start_tool_run` returns `insufficient`, show the existing "Buy credits" dialog and abort.

## Files to copy from project 5 → this project

Namespaced under `src/components/product360/` and `src/pages/Product360.tsx`.

**Pages**
- `src/pages/Index.tsx` → `src/pages/Product360.tsx` (wrap with our `Navbar`, drop project's theme toggle/Header + `ApiKeySelector` flow — server keys handle that)

**Components → `src/components/product360/`**
- `Header.tsx` (stripped of theme toggle), `FileUpload.tsx`, `Dashboard.tsx`, `BulkUpload.tsx`, `BackgroundCompositor.tsx`, `BackgroundSelector.tsx`, `LogoPlacementEditor.tsx`, `PlacementControls.tsx`, `ResultsViewer.tsx`, `NavLink.tsx`, `tabs/AnglesView.tsx`, `tabs/BackgroundStudioView.tsx`, `tabs/DownloadsView.tsx`, `icons/*` (or replace with lucide-react)
- **Skip**: `ApiKeySelector.tsx`

**Services / utils / constants / types → `src/components/product360/`**
- `services/geminiService.ts`, `utils/backgroundRemover.ts`, `utils/frameExtractor.ts`, `utils/logoCompositor.ts`, `constants.ts`, `types.ts`

**Assets**
- `src/assets/backgrounds/*.png` (9 izzhaar presets) → `src/assets/product360-backgrounds/`

**Edge function**
- `supabase/functions/generate-product-angle/index.ts` copied as-is. Update to use our **AI fallback strategy**: rotate through `GEMINI_API_KEY_1/2/3/4` already in secrets, then fall back to `LOVABLE_API_KEY` via the AI Gateway. Validate JWT in code.

## Wiring into EZYOURLIFE

1. **Route** (`src/App.tsx`): lazy import + add
   ```
   <Route path="/tools/Product-360" element={<ProtectedRoute><Product360 /></ProtectedRoute>} />
   ```

2. **Catalog entry** via migration — upsert `tools_catalog`:
   - `id`: `product-360`
   - `name`: "Product 360 Studio"
   - `category`: "AI Image Generation"
   - `dedicated_route`: `/tools/Product-360`
   - `is_live`: true, `is_free`: false

3. **Pricing entry** via migration — insert into `tool_pricing`:
   - `tool_id`: `product-360`, `credit_cost`: 50

4. **Credit charging flow** (in `Product360.tsx`):
   - On "Generate" click → `supabase.rpc('start_tool_run', { _uid, _tool_id: 'product-360' })`
   - If `ok=false, reason='insufficient'` → open `BuyCreditsDialog`, stop.
   - Run the existing angle generation loop.
   - On finish (any angle succeeded) → `complete_tool_run(..., _success: true)` (debits 50).
   - On total failure (zero angles) → `complete_tool_run(..., _success: false)` (no charge).
   - Bulk mode: same flow per product image.

5. **Theme**: drop local dark/light toggle. Replace `bg-gray-100 dark:bg-gray-900` etc. with semantic tokens (`bg-background`, `text-foreground`).

6. **Auth**: existing `@/integrations/supabase/client` works as-is.

## Dependencies
Already present: `jszip`, `file-saver`, `@radix-ui/*`, `lucide-react`, `sonner`, `@supabase/supabase-js`. **No new packages.**

## Out of scope
Existing tools, navbar, design system, credits infra — unchanged. Source project is read-only.
