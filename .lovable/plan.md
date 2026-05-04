## Plan

Two deliverables, run as direct sandbox scripts (not new app features):

### 1. CSV of live tools

- Query `tools_catalog` where `is_live = true`.
- Columns: `name`, `description`, `category`, `dedicated_route`.
- Save to `/mnt/documents/ezyourlife-live-tools.csv`.
- Surface via `<lov-artifact>` so the user can download immediately.

### 2. Media for every live tool (image + animated preview)

For each live tool (~50+ rows):

1. **Hero image** — generate a 16:9 branded poster using `google/gemini-3.1-flash-image-preview` via the Lovable AI gateway. Prompt = stylized scene representing the tool's purpose, on-brand dark glassmorphism aesthetic, no text overlays, vibrant accent gradients. Saved as PNG.
2. **Animated preview** — generate 4 keyframe variations of the same scene (subtle camera-push / color shift), then stitch into a looping ~3s GIF with `ffmpeg` at 12fps. Lightweight, autoplay-friendly, no audio.
3. **Upload** both files to the existing public `tool-media` Supabase storage bucket under `{tool_id}/hero.png` and `{tool_id}/preview.gif`.
4. **Insert** two rows into `tool_media` per tool: one `kind=image` (sort_order 0, used as poster), one `kind=gif` (sort_order 1). Skip tools that already have media to keep the script idempotent.

The existing `ToolMediaCarousel` and `FloatingMediaPreview` components already render whatever is in `tool_media` — no UI changes needed.

### Execution order

1. Pull live tools list via `supabase--read_query`.
2. Write & run `/tmp/export_live_tools_csv.py` → CSV artifact.
3. Write & run `/tmp/generate_tool_media.py`:
   - Loop tools, skip those already in `tool_media`.
   - Generate hero PNG (1 call) + 4 keyframe PNGs → ffmpeg GIF.
   - Upload to storage via REST (service role key).
   - Insert `tool_media` rows via service role.
   - Throttle ~1.5s between tools to respect rate limits; resume on partial failure.
4. Spot-check a few generated assets (download & view) before declaring done.
5. Report counts: tools processed, skipped, failed.

### Notes / tradeoffs

- ~50 tools × 5 image generations ≈ 250 AI calls. Will batch with delays; total run could take 10–20 minutes but runs unattended in the sandbox.
- GIFs (not MP4) chosen so they autoplay everywhere without codec issues and stay small (~300–600KB).
- No new tables, no new edge functions, no schema changes. Purely data + storage population.
- Idempotent: re-running only fills in missing tools.
