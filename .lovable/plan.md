## Goal
Bulk-generate a clean **icon** and a descriptive **preview image** for every tool in `tools_catalog` that's missing them (~150 of 165), using your stored Gemini keys (`GEMINI_API_KEY_1..5`) and the cheapest fast image model — `gemini-2.5-flash-image` (Nano Banana). Preview images will follow the Startup Analyser style: a clean illustrated "what this tool does" scene so a first-time visitor instantly understands the tool.

## What gets built

### 1. New edge function: `supabase/functions/bulk-generate-tool-art/index.ts`
- Admin-only (verifies caller via JWT + `has_role admin`).
- Input: `{ tool_ids?: string[], mode: "missing" | "all" | "selected", kinds: ["icon","preview"], force?: boolean, limit?: number }`.
- For each tool:
  1. Reads `tools_catalog` row (name, description, category).
  2. Generates **icon** (1:1, transparent-friendly flat vector style) and **preview** (16:9, illustrated scene depicting the tool's function — like Startup Analyser's preview).
  3. Calls Gemini directly: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent` with rotating `GEMINI_API_KEY_1..5` on 429/quota.
  4. Uploads PNG to `tool-media` bucket at `{tool_id}/auto-icon-*.png` and `{tool_id}/auto-preview-*.png`.
  5. Updates `tools_catalog.icon_url` / `preview_image_url` (skips if already set unless `force=true`).
- Processes in small batches (5 at a time) and streams progress as NDJSON so the admin UI can show live progress without timing out.

### 2. Prompt templates (key to "looking high-end")
- **Icon prompt**: `"Minimalist flat icon for an AI tool called '{name}'. {one-line purpose}. Single centered glyph, bold geometric shapes, vibrant gradient (deep indigo → violet → magenta) on a clean dark navy background, soft glow, rounded corners, app-icon style. NO text, NO letters, NO logos. 1:1, centered."`
- **Preview prompt** (Startup-Analyser style): `"A clean editorial illustration showing what '{name}' does: {description}. Style: modern flat illustration with depth, dark glassmorphism background (deep navy + indigo), vibrant violet/electric blue/magenta accents, soft volumetric lighting, abstract UI elements (cards, charts, sparkles, arrows) that visually represent {category} workflow, premium SaaS hero aesthetic. Composition: subject occupies center-left, breathing room on right. NO text, NO words, NO letters, NO logos, NO UI mockups with readable strings. 16:9."`
- Both forced to PNG output.

### 3. Admin UI: new tab/button in `src/components/admin/ToolMediaManager.tsx`
- "**Auto-generate missing art**" button at top.
- Shows: total tools missing icon, missing preview, and a "Generate all missing" + "Generate selected" + "Force regenerate" controls.
- Live progress: `12 / 150 — Currently: Hashtag Generator (preview) ✓`.
- Errors per tool listed inline; failed tools can be retried.
- Per-row "✨ Auto" buttons next to icon/preview slots in each existing row to regenerate just that one.

### 4. Key rotation + cost guardrails
- Rotates through 5 keys; on `429` / `RESOURCE_EXHAUSTED` retries next key, then backs off 2s.
- Hard cap per request (default 200 tools) to prevent runaway.
- Logs each generation to existing activity log.

## Out of scope
- No change to live tool UI / no auto-generation triggered from end-user pages.
- No change to existing manually-uploaded icons unless `force=true`.
- No subscription/credits charging — admin-only operation.

## Notes
- `gemini-2.5-flash-image` is currently the cheapest + fastest image model that produces clean illustrative output, so it fits "cheapest possible that delivers instantly".
- Existing `bulk-tool-media` function only does hero images via Lovable AI Gateway — kept as-is. The new function uses your direct Gemini keys per your request.
- Output is PNG (better for icons with crisp edges); preview kept as PNG too for consistency.

Ready to implement on approval.