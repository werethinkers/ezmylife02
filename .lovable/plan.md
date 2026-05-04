## Add Per-Tool Parameters to Bulk Mode

Right now bulk mode only takes files. Several tools genuinely need extra inputs (e.g. resize dimensions, rotation angle, blur radius, passport size, compression quality, beautify style, startup-analyser focus area, business-card tags). These will be collected once in the dropzone and applied to every file in the batch — keeping the UX truly "drop and go" while respecting each tool's needs.

### 1. Extend the bulk registry (`src/data/bulkTools.ts`)

Add an optional `params` schema per tool:

```ts
type BulkParamField =
  | { key: string; label: string; type: "select"; options: {value: string; label: string}[]; default: string }
  | { key: string; label: string; type: "number"; min?: number; max?: number; step?: number; default: number; suffix?: string }
  | { key: string; label: string; type: "text"; default?: string; placeholder?: string }
  | { key: string; label: string; type: "toggle"; default: boolean };

interface BulkToolConfig {
  // ...existing fields
  params?: BulkParamField[];
}
```

### 2. Per-tool param definitions

| Tool | Params |
|------|--------|
| Image Compressor | Quality (number 10–100, default 70), Format (select: jpg/webp/png) |
| Image Resizer | Max longest edge (number, 320–4096, default 1280), Maintain aspect (toggle, default on) |
| Image Rotator | Angle (select: 90 / 180 / 270) |
| Image Blur | Blur radius px (number 1–40, default 8) |
| Image Grayscale | (none) |
| Metadata Viewer | (none) |
| Background Remover | Output format (select: PNG transparent / White bg / Custom hex), Hex (text, conditional) |
| Passport Photo Maker | Size preset (select: India 35×45 / US 2×2 / Schengen 35×45 / UK 35×45), Background (select: white/blue/red) |
| Image Beautify | Style (select: Natural / Studio / Cinematic / Vivid), Strength (number 1–10, default 6) |
| Startup Analyser | Report focus (select: Investor / Founder / Market), Industry (text, optional), Stage (select: Pre-seed / Seed / Series A+) |
| Business Card Scanner | Auto-add to contacts (toggle, default on), Tag (text, optional) |

### 3. UI changes — `BulkDropzone.tsx`

- Render a "Settings (applied to all files)" section above the Run button when `config.params` is defined.
- Use existing shadcn primitives (Select, Input, Switch, Label) — compact 2-column grid.
- Initialize `params` state from defaults; conditional fields (e.g. hex when "Custom hex" selected) shown via simple `if`.
- Pass `params` in the job-create payload and to `runClientImageBatch` / `bulk-run` invoke body.

### 4. Persist on the job row

Store params in the existing `bulk_jobs.input_manifest` JSON as `{ files: [...], params: {...} }`, OR add a dedicated `params jsonb` column.

**Chosen**: add a `params jsonb default '{}'::jsonb` column via migration — cleaner separation, easier to display on the job-detail page.

### 5. Client processor — `bulkClientImageOps.ts`

- Accept `params` in `RunArgs`.
- Wire each branch to use them:
  - compressor → `canvasToBlob(canvas, mimeFor(format), quality/100)`
  - resizer → use `params.maxEdge`, respect `maintainAspect`
  - rotator → arbitrary angle math
  - blur → `ctx.filter = blur(${radius}px)`

### 6. Edge dispatcher — `supabase/functions/bulk-run/index.ts`

- Accept `params` in the request body, pass it to `processItem`.
- Forward to per-tool edge functions:
  - `scan-business-card` → include `tag`, `auto_add_contact`
  - `startup-analyser` → include `focus`, `industry`, `stage` (the existing function already accepts optional context)
  - background-remover / passport-photo / beautify → include in payload (image generation prompt assembly).

### 7. Job detail page — `BulkJobDetail.tsx`

- Show a small "Settings used" card listing the params (read-only) so users remember what they ran.

### Out of scope

- Per-file overrides (settings are batch-level — keeps drag-and-drop simple).
- Saving param presets.

### Files

- **Edit**: `src/data/bulkTools.ts`, `src/components/bulk/BulkDropzone.tsx`, `src/lib/bulkClientImageOps.ts`, `src/pages/BulkJobDetail.tsx`, `supabase/functions/bulk-run/index.ts`
- **New migration**: add `params jsonb` column to `bulk_jobs`
- **Memory**: update `mem://features/bulk-runner` to note per-tool params support
