
# Bulk Mode for AI Tools (Drag-and-Drop, Multi-File)

Add a unified **Bulk Runner** that lets premium users drop **multiple files at once** (images, PDFs, pitch decks, business cards, docs) into supported AI tools and get all outputs back together. No CSV, no spreadsheet — just drag, drop, run, download.

## 1. Where Bulk IS available (file/object-based tools)

Bulk mode is enabled only on tools where "many of the same input type" makes sense:

**Image tools** (drop N images → ZIP of N outputs)
- Background Remover, Image Compressor, Image Resizer, Image Cropper, Image Rotator, Image Grayscale, Image Blur, Image Pixelate, Image Beautify, Image Watermark, Image Text Overlay, DPI Converter, Add Logo to Image, Passport Photo Maker, Metadata Viewer, Color Picker, Thumbnail Maker (image variant)

**Document / AI-on-file tools**
- Startup Analyser (drop N pitch decks → N analyses, ZIP of PDFs + combined index)
- Business Card Scanner / Meet Nudge (drop N card photos → N contacts saved + CSV export)
- Contract Drafter (drop N reference docs → N drafted contracts) *(file-input variant)*
- Bibliography Generator (drop N PDFs → combined bibliography)

**Media generation tools** (single text prompt isn't bulk; bulk takes a prompts.txt **file** drop only — kept simple)
- AI Video Maker, AI Thumbnail Maker, Video Script Writer: drop a `.txt` file with one prompt per line → ZIP of outputs.

## 2. Where Bulk is explicitly NOT available

These tools are **interactive workspaces / single-session** by nature — no bulk button rendered:
- Speedy Notebook
- PromptMaster AI
- Virasat (memoir interviewer)
- Personalized Tools / Tools Chat (conversational)
- Meet Nudge dashboards / event pages
- Calculators (Salary, Tax, Profit, Grade, Expense, Invoice, Assignment Tracker, Exam Scheduler, Study Planner, Lesson Planner, Quiz Maker, Flashcard Maker — instant single-input)
- All wrapped 3rd-party iframe tools (Bhugol, Gyan, Shastra, etc.)

## 3. Database (1 migration)

**Table `bulk_jobs`** (RLS: owner CRUD, admins read all)
- `id`, `user_id`, `tool_id`, `tool_name`
- `status` — `queued | running | completed | partial | failed`
- `total_items`, `completed_items`, `failed_items`
- `input_manifest` jsonb — `[{filename, storage_path, size}]`
- `outputs` jsonb — `[{input_filename, output_filename, status, error?}]`
- `output_zip_url` (storage link, signed)
- `error_message`, `created_at`, `updated_at`, `completed_at`

**Storage buckets** (private, owner-read RLS)
- `bulk-inputs` — uploaded files
- `bulk-outputs` — final ZIPs

Realtime enabled on `bulk_jobs` for live progress.

## 4. Backend — One generic edge function

**`supabase/functions/bulk-run/index.ts`**
- Validates premium (`premium_access` check).
- Accepts `{ tool_id, input_paths[] }` (files already uploaded to `bulk-inputs/{user_id}/{job_id}/`).
- Inserts `bulk_jobs` row, returns `job_id` immediately.
- Uses `EdgeRuntime.waitUntil(processJob(...))` for async work.
- Per `tool_id`, dispatches to the right handler:
  - **Pure-browser image ops** (compress, resize, crop, rotate, grayscale, blur, pixelate, watermark, text-overlay, DPI) — actually run **client-side** in a Web Worker, then upload only the final ZIP. Edge function just records the job. (Saves cost; reuses existing canvas logic.)
  - **AI image ops** (Background Remover, Beautify, Passport Photo) — call existing edge handlers per file with concurrency 3.
  - **Startup Analyser** — invokes `startup-analyser` per deck, collects markdown, generates one PDF per deck via existing exporter.
  - **Business Card Scanner** — invokes `scan-business-card` per image, inserts contacts, builds `contacts.csv`.
  - **Prompt-list tools** (Video, Thumbnail, Script) — parses uploaded `.txt`, loops through prompts.
- Uses existing AI fallback (user key → Lovable AI → rotating Gemini keys).
- Builds final ZIP with `jszip` (npm:jszip), uploads to `bulk-outputs/{user_id}/{job_id}.zip`, signs URL, marks job complete/partial.
- ZIP always includes `manifest.csv` mapping input → output → status; failed rows go in `errors.txt`.

## 5. Frontend — Shared Bulk components

**`src/components/bulk/BulkDropzone.tsx`** — reusable drag-and-drop:
- Accepts `accept` (e.g. `image/*`, `.pdf,.pptx,.docx`, `.txt`) and `maxFiles` from caller.
- Visual: large dashed zone, "Drop up to N files" message, file chips with remove, total size, type badges.
- Validates file type + size (per-file 20MB, total 200MB), shows estimated cost preview using existing per-output cost map.
- "Run Bulk Job" → uploads all files to `bulk-inputs/...` then calls `bulk-run`.

**`src/components/bulk/BulkModeToggle.tsx`** — small pill rendered inside supported tool components: **"⚡ Bulk Mode"**. Toggling swaps the tool's single-input UI for `<BulkDropzone />` configured for that tool. One-line drop-in:
```tsx
<BulkModeToggle toolId="background-remover" accept="image/*" maxFiles={50} />
```
Free users see the pill; clicking triggers upgrade prompt.

**`src/pages/BulkJobs.tsx`** — premium-gated history page (`/bulk/jobs`)
- Table: tool, file count, status, progress bar, created, [Download ZIP] / [Re-run] / [Delete].
- Realtime subscription on `bulk_jobs`.

**`src/pages/BulkJobDetail.tsx`** (`/bulk/jobs/:id`)
- Live progress, per-file outcomes, download button.

No standalone `/bulk` runner page — bulk is invoked from inside each supported tool, keeping flow contextual.

## 6. Site-wide promotion

- **Home hero badge**: *"NEW · Drop 50 images at once. AI processes them all. Included free with Premium."*
- **`BulkPromoSection`** on Home: 3 visual cards (drop pitch decks → analyses · drop product photos → bg-removed · drop business cards → contacts) with "Try Bulk Mode" CTAs linking to a representative tool with bulk pre-enabled.
- **Subscription page**: add bullet to all paid tiers — *"✓ Unlimited bulk processing — drop dozens of files, get all outputs at once"*. Add comparison row.
- **Tools page banner**: *"Many tools support Bulk Mode — look for the ⚡ pill"*.
- **Navbar**: `Bulk Jobs` link visible to premium users.
- **Launch banner**: rotating slide *"Bulk Mode is live · 50 images. One drop. One ZIP."*
- **SEO**: Home/Tools/Subscription meta + JSON-LD mention "bulk image processing", "batch pitch deck analysis", "bulk business card scanning". New FAQ entry.

## 7. Pricing copy

On the dropzone empty state and Subscription page show value framing:
*"50 images through Background Remover individually = ₹X. With Premium it's all included — drop, run, download."*

## Technical Notes

- **Per-tool registry** `src/data/bulkTools.ts`: `{ toolId, accept, maxFiles, mode: 'client'|'edge', estCostPerItem }`. Tools not in the registry don't render the bulk pill.
- **Concurrency**: edge dispatch limited to 3 parallel AI calls; client-side image ops run sequentially in a Worker to avoid main-thread freeze.
- **Failure handling**: per-item try/catch → job marked `partial` if any fail; ZIP still delivered with `errors.txt`.
- **Cleanup**: input files in `bulk-inputs` auto-deleted 24h after job completion (scheduled cleanup left as follow-up — initial release just keeps them).

## Out of Scope

- CSV / paste / Google Sheets input (removed per request).
- Bulk for chat/workspace/calculator tools.
- Scheduled or webhook-triggered jobs.

## Files Created / Modified

**Created**
- `supabase/functions/bulk-run/index.ts`
- 1 SQL migration (table + 2 storage buckets + RLS + realtime)
- `src/pages/BulkJobs.tsx`, `src/pages/BulkJobDetail.tsx`
- `src/components/bulk/BulkDropzone.tsx`, `BulkModeToggle.tsx`, `BulkJobProgress.tsx`
- `src/components/home/BulkPromoSection.tsx`
- `src/data/bulkTools.ts` (registry of bulk-enabled tools only)
- `src/hooks/useBulkJobs.ts`
- `src/lib/bulkClientImageOps.ts` (Web Worker entrypoint for browser-side image batches)

**Modified**
- `src/App.tsx` — 2 new routes (`/bulk/jobs`, `/bulk/jobs/:id`)
- `src/components/Navbar.tsx` — Bulk Jobs link (premium)
- `src/pages/Home.tsx` — hero badge + BulkPromoSection
- `src/pages/Tools.tsx` — banner strip
- `src/pages/Subscription.tsx` — feature bullets + comparison row
- `src/components/LaunchOfferBanner.tsx` — new slide
- `index.html` + SEO heads — meta/JSON-LD
- ~25 supported tool components — drop in `<BulkModeToggle .../>` (single line each)
- `mem://index.md` + new memory `mem://features/bulk-runner` — record bulk system rules and exclusion list
