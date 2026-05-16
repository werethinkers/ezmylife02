## Goal

Add a "**See an example**" panel **below** each app on the Tool Viewer page, showing one demo input and the kind of output the app produces — so the user understands what to expect without disrupting the actual app flow.

## Placement (updated per your feedback)

The demo sits **under** the tool, not above. Page structure:

```
┌────────────────────────────────────────────┐
│ Navbar + Back / Fullscreen header          │
├────────────────────────────────────────────┤
│                                            │
│        THE ACTUAL APP (iframe / native)    │ ← unchanged, full flow
│                                            │
├────────────────────────────────────────────┤
│ ✨ See an example                    [▾]   │ ← collapsed by default
│  IF YOU ENTER → "…"                        │
│  YOU'LL GET   → "…"                        │
└────────────────────────────────────────────┘
```

- Page becomes scrollable below the app (today it's `h-screen`, no scroll). The app still fills the viewport on first paint; the demo is revealed by scrolling.
- Collapsed by default (the user has to expand it), so it never blocks anyone mid-task.
- Fullscreen mode hides the demo entirely.

## Where the demo content comes from

Per-app `demo_input` + `demo_output` stored in `tools_catalog`. You can provide inputs in **two ways** — both supported:

1. **You give me a list** for any app(s) you care about most → I paste them straight into the DB. Best for the 10–20 flagship apps.
2. **For the rest (~150 apps)**, I batch-generate one example each using your Gemini key. Result is reviewable + editable in the admin tool manager.

Either path writes to the same two columns; you can mix and match.

## Build plan (3 parts)

### Part 1 — Database + display + viewer layout
1. Migration: add `demo_input text` and `demo_output text` to `tools_catalog`.
2. New `src/components/tools/ToolDemoPreview.tsx` — collapsible card; renders the output as markdown; hides itself if either field is empty.
3. Update `src/pages/ToolViewer.tsx`:
   - Change root from `h-screen` to `min-h-screen` and remove `overflow-hidden` so the page can scroll.
   - Keep the app at viewport height (`h-[calc(100vh-Xpx)]`) so it still feels app-like on load.
   - Render `<ToolDemoPreview demoInput=… demoOutput=… />` directly below the app container.
   - Fetch the two new columns in the existing `checkCatalog()` query.

After this, every app page can show demos — they just appear empty until Part 2 fills them.

### Part 2 — Populate demos

**Track A (your inputs):** You send me a list like
```
tool-3 (Profit Calculator): input="Revenue ₹2L, COGS ₹80k, opex ₹40k"
tool-25 (…): input="…"
```
I run a one-shot script that calls Gemini once per provided input to produce the realistic output, then writes both fields to the DB.

**Track B (auto for the rest):** A Node script `scripts/generate-tool-demos.ts`:
- Pulls remaining live tools where `demo_input IS NULL`.
- For each, calls Gemini 2.5 Flash with a structured-output prompt:
  > "App: `<name>` — `<description>`. Return JSON `{input, output}`. Input = a short, believable user query. Output = the kind of answer this app would produce (markdown, 80–250 words)."
- Rotates across `GEMINI_API_KEY_1..5`, ~1 req/sec, idempotent (skips already-filled rows), local JSON checkpoint so reruns are safe.
- Writes results back to `tools_catalog`.

Cost: ~$0.10 of Gemini usage for all 165 tools. Zero runtime cost — users see static text.

### Part 3 — Admin edit + regenerate
In the existing admin tool manager, add a small editor per tool:
- Two textareas: Demo Input / Demo Output
- "Regenerate with AI" button → calls a new edge function `regenerate-tool-demo` that runs the same Gemini prompt for one tool and returns the result for you to accept.

Lets you fix or rewrite any auto-generated demo without touching the script.

## Technical notes

- **No change to credit pricing, run logic, or the no-overlay tool-viewer constraint.** The demo lives in our chrome below the app frame — never inside it.
- **Markdown rendering**: use the existing `react-markdown` setup; lightweight fallback if not present.
- **Types**: `src/integrations/supabase/types.ts` auto-regenerates after migration; no manual edit.
- **Performance**: demo fields are tiny text, fetched in the same query that already loads catalog info — no extra round-trip.

## What I'll do once you say go

1. Ship Part 1 (migration + component + viewer scroll layout) — visible immediately, demos empty.
2. Run Part 2 Track B to auto-fill all 165 — wait ~5 min.
3. Ship Part 3 admin editor.
4. Whenever you send me curated inputs (Track A), I'll plug them in and overwrite the auto-generated ones for those apps.

Confirm and I'll begin.
