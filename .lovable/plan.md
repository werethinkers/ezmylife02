
# Make Bulk Mode actually work for every supported tool

## Problems found in the current implementation

1. **AI image tools are stubs.** In `supabase/functions/bulk-run/index.ts`, the branch for `background-remover`, `passport-photo-maker`, `image-beautify` literally returns the **original file** with the comment *"Edge processing not yet wired"*. Nothing happens.
2. **Business Card Scanner payload is wrong.** `bulk-run` sends `{ image: dataUrl }`, but `scan-business-card` expects `{ images: [...] }`. Every card fails.
3. **Startup Analyser bulk doesn't work.** `bulk-run` sends `fileBase64` to `startup-analyser`, but that function only accepts `companyName`/`companyWebsite`/`pitchDeckText` (text, not PDF). Also there is no way to pass a per-deck **company name + website**.
4. **`BulkModeToggle` is only mounted on 2 tools** (Background Remover + Image Compressor). The other 7 in the registry (Passport Photo Maker, Image Beautify, Image Resizer/Rotator/Blur/Grayscale, Metadata Viewer, Startup Analyser, Business Card Scanner) never expose the button.
5. **No per-file metadata.** Today only a single set of params is shared across all files. Startup Analyser needs name+website **per deck**.

## What to build

### 1. Per-file fields schema
Extend `BulkToolConfig` in `src/data/bulkTools.ts` with an optional `perFileFields` array (`{key,label,type,required,placeholder}`). Configure for `startup-analyser`:
- `company_name` (text, required)
- `company_website` (text, required)
- `industry` (text, optional, overrides batch param)

### 2. Dropzone UI: per-file inputs
Update `BulkDropzone.tsx` so each file row exposes the configured per-file inputs inline (compact two-column grid for desktop, stacked on mobile). Auto-prefill `company_name` from the filename. Block submit until required per-file fields are filled. Persist them into a new `per_file_meta` array on the job payload (sent with `input_manifest`).

### 3. Database
Add `per_file_meta jsonb default '[]'` to `bulk_jobs` (parallel to `input_manifest`, indexed by file index).

### 4. Wire AI image tools in `bulk-run`
Replace the stub branch with real Gemini image-edit calls (model `google/gemini-3.1-flash-image-preview` via Lovable AI Gateway). One generic helper `editImageWithGemini(blob, prompt) -> Blob` used by:
- **background-remover**: prompt built from `params.background` (transparent / solid white / solid black / custom hex). Output PNG.
- **passport-photo-maker**: prompt built from `params.size_preset` + `params.background` (e.g. "passport photo, white bg, 35x45mm crop, head centered, neutral expression").
- **image-beautify**: prompt from `params.style` + `params.strength` (e.g. "studio portrait enhancement, strength 6/10, preserve identity").

Keep the existing key-rotation/fallback pattern from `startup-analyser/index.ts` — extract that into a shared inline helper inside `bulk-run`.

### 5. Fix Business Card Scanner branch
- Send `{ images: [dataUrl] }` (the array shape the function actually accepts).
- Persist each scanned contact into `meet_nudge_contacts` server-side when `params.auto_save_contacts !== false`, attaching `params.tag` to `event_name`. The current edge function only returns contact JSON; insert directly from `bulk-run` using the user's auth token via PostgREST.

### 6. Startup Analyser bulk path (browser-driven)
Pure edge-side PDF processing is fragile (pdf.js is browser-only). Switch this tool to **`mode: "client"`** in the registry and add a new branch in `src/lib/bulkClientImageOps.ts` (rename file or add `bulkClientStartupAnalyser.ts`):
- For each deck:
  1. Extract PDF text in the browser (`extractPdfText` already exists in `src/startup-analyser/services/geminiService.ts`).
  2. Call `generateComprehensiveAnalysis(name, website, onProgress, pitchDeckText, userApiKey)` — already wired and streaming-tolerant.
  3. Insert a `startup_analyses` row with the result so the user sees it in their Saved Sessions sidebar too.
  4. Add the markdown report to the ZIP as `<safe-company-name>.md`.
- Update `bulk_jobs.completed_items`/`outputs`/`status` after each deck. ZIP is uploaded to `bulk-outputs` exactly like image bulk runs.

This avoids the 150s edge timeout per deck, gives each user real-time progress, and reuses the working analyser pipeline as-is.

### 7. Mount `BulkModeToggle` on every supported tool
Add the toggle to the headers of:
- `PassportPhotoMaker.tsx`
- `ImageBeautify.tsx`
- `ImageResizer.tsx`
- `ImageRotator.tsx`
- `ImageBlur.tsx`
- `ImageGrayscale.tsx`
- `MetadataViewer.tsx`
- `BusinessCardScanner.tsx` (in `src/components/meet-nudge/`)
- Startup Analyser (`StartupAnalyserApp.tsx`, near the input form)

Same pattern as `BackgroundRemover.tsx`:
```tsx
<div className="flex justify-center pt-2">
  <BulkModeToggle toolId="<tool-id>" />
</div>
```

### 8. Job detail UX
In `BulkJobDetail.tsx`, render per-file metadata next to each file when `per_file_meta` is present (e.g., for Startup Analyser show the company name + website per row).

## Out of scope
- New per-tool admin UI for params.
- Concurrent (parallel) processing inside the browser — keep sequential to avoid Gemini rate limits.
- Bulk for Speedy Notebook / PromptMaster / Virasat (still excluded by design).

## Files

**Edit**
- `src/data/bulkTools.ts` — add `perFileFields`; switch `startup-analyser` to `mode: "client"`.
- `src/components/bulk/BulkDropzone.tsx` — per-file inputs, validation, send `per_file_meta`.
- `src/lib/bulkClientImageOps.ts` — add Startup Analyser client branch (or split into a new helper).
- `src/pages/BulkJobDetail.tsx` — show per-file metadata.
- `supabase/functions/bulk-run/index.ts` — real Gemini image edits, fix card scanner payload+save, drop the old startup-analyser branch.
- All 9 tool components above — add `<BulkModeToggle/>`.

**Create**
- New migration: `alter table bulk_jobs add column per_file_meta jsonb not null default '[]'::jsonb`.

**Memory**
- Update `mem://features/bulk-runner` to record the per-file metadata pattern and the client-side Startup Analyser path.

