## Goal
Stop loading any tool from `image.pi7.org` / `vision.pi7.org` / `bulkresizer.pi7.org`. Replace each Pi7 iframe with a native in-house tool that runs in the browser (Canvas) or via a Lovable AI edge function. Every replaced tool gets a Bulk Mode entry so users can process many files at once.

## Inventory: the 67 Pi7 tools, grouped by implementation strategy

### A. Pure-browser Canvas tools — no AI, free, instant (~45 tools)
Built with one shared `src/lib/imageOps/` library (Canvas 2D + a few small WASM-free helpers). Each gets a single-file React page under `src/components/native-tools/image/` and a `BULK_TOOLS` entry.

| Group | Tools |
|---|---|
| Resize / crop | resize-image-pixel, resize-image-cm, resize-image-mm, resize-image-inch, resize-a4, resize-2x2-inch, resize-3x4-inch, resize-4x6-inch, resize-600x600, resize-image-3.5x4.5, resize-35x45mm, resize-sign-6x2, resize-signature-50x20, resize-signature, ssc-photo-resize, pan-card-resize, upsc-photo-resize, psc-photo-resize, instagram-resize, whatsapp-dp, youtube-banner, freehand-crop, circle-crop, square-crop, instagram-grid, split-image, join-images, bulk-image-resizer |
| Compress / file size | reduce-image-size-kb, increase-image-size-kb |
| Rotate / flip | rotate-image, flip-image |
| Blur / pixelate / effects | blur-image, motion-blur, pixelate-image, grayscale-image, black-white, picture-pixel-art, beautify-image (curves preset), zoom-out-image |
| Annotate | watermark-images, add-text-image, add-logo-image, add-name-dob-photo, generate-signature, merge-photo-signature |
| Color / metadata | image-color-picker, view-metadata, edit-metadata, remove-metadata |
| DPI | convert-dpi, check-dpi |

### B. AI tools — Lovable AI edge functions, charge credits (~17 tools)
One shared `pi7-image-ai` edge function with an `op` parameter, using `google/gemini-3.1-flash-image-preview` (Nano Banana 2). Each tool calls it with a tailored prompt and shows the result.

| Op | Tools | Model prompt |
|---|---|---|
| `remove-bg` | remove-background, blur-background | "Return only the subject on transparent background" |
| `enhance` | ai-photo-enhancer, increase-image-quality, super-resolution, upscale-image-ai, unblur-image, unblur-face, retouch-image | "Restore + upscale + sharpen" |
| `remove-object` | remove-object-photo (with mask), blemish-remover | mask + inpaint prompt |
| `passport` | passport-photo-maker (already in BULK_TOOLS — wire to native page), ai-id-photo-generator | passport prompt + Canvas crop |
| `face-anonymize` | blur-face, pixelate-face, censor-photo | face-detection (BlazeFace via tfjs CDN) + Canvas blur/pixel/box |
| `generate-face` | ai-face-generator | text-to-image |

## Architecture

```text
src/
├─ lib/imageOps/
│   ├─ canvas.ts        load/decode/encode helpers, EXIF read/write
│   ├─ resize.ts        pixel/cm/mm/inch/preset resizers
│   ├─ compress.ts      target-KB binary search on JPEG quality
│   ├─ effects.ts       blur, pixelate, grayscale, motion-blur, pixel-art
│   ├─ overlay.ts       text, logo, watermark, signature merge
│   ├─ crop.ts          rect, circle, freehand path, splitter, joiner
│   ├─ metadata.ts      EXIF view/edit/strip (piexifjs CDN)
│   └─ faces.ts         BlazeFace detection wrapper
├─ components/native-tools/image/
│   ├─ ImageToolShell.tsx  shared layout: dropzone, params, preview, download, "Bulk Mode" toggle
│   └─ <ToolName>.tsx      ~40 thin wrappers, each ~30 LOC over ImageToolShell
├─ components/native-tools/ai-image/
│   └─ AiImageShell.tsx    same shell, calls pi7-image-ai edge function, shows credit cost, charges via start_tool_run
└─ pages/ToolViewer.tsx    routes Pi7 toolIds to the new native components instead of the iframe
```

## Bulk Mode integration
Extend `src/data/bulkTools.ts` with `BulkToolConfig` entries for every replaced tool:
- Client-mode for all browser tools (mode: "client", estCostPerItemInr: 0).
- Edge-mode for AI tools (mode: "edge", estCostPerItemInr from current `tool_pricing`).
- Add `client` ops to `src/lib/bulkClientImageOps.ts` so the existing `BulkDropzone` can dispatch them.
- AI bulk runs go through the new edge function (one call per file, ZIP'd by the existing `bulk-run` worker).

## Routing changes
- `src/pages/ToolViewer.tsx`: build a `NATIVE_TOOL_COMPONENT: Record<string, React.LazyExoticComponent>` map keyed by toolId. If a toolId resolves to a native component, render it full-screen instead of the iframe block. The iframe path stays only for non-Pi7 wrapped tools (currently just `ai-id-photo-generator` from ToolFK — also being replaced).
- `src/data/tools.tsx`: delete the entire `toolUrls` map for Pi7 entries (lines 23–105). Keep only the ToolFK entry until that's also migrated. `getToolUrl()` returns `null` for migrated tools.

## Pricing & credits
- Pure-browser tools: `tool_pricing.cost_inr = 0`, `credit_cost = 0` → run for free, no auth required to try.
- AI tools: keep existing pricing rows. Login dialog already triggers via `useCredits` when a guest clicks Generate — no new work.

## Edge function: `pi7-image-ai`
Single function, JWT-required, validates body with Zod, dispatches by `op`, calls Lovable AI Gateway `google/gemini-3.1-flash-image-preview`, returns base64 PNG. Surfaces 402/429 to client. Charges via the existing `start_tool_run` / `complete_tool_run` flow keyed by the toolId so credit deduction stays consistent.

## Removed/replaced
- Delete every Pi7 URL in `src/data/tools.tsx` `toolUrls`.
- Update memory `mem://features/tool-viewer/native-and-wrapped-display-v3` to note that Pi7 tools are now native.

## Out of scope
- Admin "grant free credits" UI — already exists in `CreditsAdmin` from the previous loop, no changes.
- Coupon/launch banners — already removed.
- Toolfk `ai-id-photo-generator` iframe stays for now (covered by the new `passport` AI op once shipped, can be flipped later).

## Phased delivery (one PR each, but all in this loop)
1. Build `lib/imageOps/` + `ImageToolShell.tsx` + 5 representative Canvas tools (resize-pixel, reduce-kb, rotate, grayscale, watermark) and wire them into ToolViewer + BulkRunner. Confirm the pattern works.
2. Generate the remaining ~40 Canvas tool components from the shared shell (mostly preset configs).
3. Build `pi7-image-ai` edge function + `AiImageShell.tsx` + the 17 AI tools. Wire credits.
4. Remove all Pi7 URLs from `tools.tsx`. Smoke-test ToolViewer for each toolId.
5. Update memory.

## Risks / heads-up
- Face-detection models (BlazeFace) add ~2 MB on first load for the few face tools — lazy-loaded only on those pages.
- `super-resolution` / `unblur` quality from Gemini image preview is best-effort, not equal to dedicated upscalers; we'll set expectations in the UI copy.
- This is a large change set (~60 new files). Expect the build to take longer than usual.