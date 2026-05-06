## Goal

All tool cards on `/ai-apps` should be visually identical in size, and preview images must display fully (no cropping) regardless of source aspect ratio. Achieve this by standardizing image output at the admin end and adjusting card layout.

## Approach

### 1. Fixed image dimensions enforced at admin upload

In `src/components/admin/ImageCropDialog.tsx` and `ToolMediaManager.tsx`:

- **Preview image**: always export at exactly **1200 × 900 px** (4:3), JPEG quality 0.92, with the cropped content **letterboxed** onto a generated background (blurred copy of the same image + soft gradient) so the entire user-selected area is visible without cropping the canvas.
- **Icon**: always export at exactly **512 × 512 px** (1:1), same letterbox treatment when "Fit" is chosen, edge-to-edge when "Fill".
- Update the cropper so the selected region is *rendered into* the fixed canvas at the chosen zoom/position. This guarantees every uploaded asset arrives at identical dimensions.
- Keep the existing "Fill / Fit" toggle but make it a hint baked into the export (Fit = padded; Fill = cover). The frontend then never has to choose — it always shows the image edge-to-edge.

### 2. Uniform card container

In `src/components/tools/ToolLandscapeCard.tsx`:

- Lock the card to a fixed structure with consistent fixed heights for each section:
  - Header (icon + title): fixed `h-24`
  - Description: fixed `h-10` (clamp 2 lines, reserved space even if 1 line)
  - Preview image box: fixed `aspect-[4/3]` (matches the 1200×900 export)
  - Credits panel: fixed `h-24`
  - CTA button: fixed `h-14`
  - Helper text: fixed `h-5`
- Wrap the whole card with `h-full flex flex-col` so the parent grid in `Tools.tsx` enforces equal-height rows.
- Inside the preview box, render the image with `object-cover w-full h-full` — since admin now guarantees 4:3 letterboxed output, this displays the full image with no crop and no empty bars at the card level.

### 3. Grid alignment

In `src/pages/Tools.tsx`:

- Ensure the grid uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch` and each child wrapper passes `h-full` so cards stretch uniformly.

### 4. Migration of existing images

- Existing uploads remain as-is; admin can click **Adjust** on any tool to re-export at the new fixed dimensions. No DB schema change required.
- The `preview_image_fit` / `icon_fit` columns become legacy hints (kept for backward compatibility, ignored once an image is re-exported because it's already canvas-perfect).

## Technical Details

```
ImageCropDialog
  ├─ Cropper (react-easy-crop) — user selects region, zoom 0.1–4
  └─ getCroppedBlob(targetW, targetH, mode):
       1. Create offscreen canvas at targetW × targetH
       2. If mode === "fit": draw blurred fullsize image as background,
          then draw user-selected region centered, scaled to fit
          inside canvas without cropping (letterbox)
       3. If mode === "fill": draw user-selected region scaled to cover
       4. Export as JPEG 0.92

ToolLandscapeCard structure (fixed heights):
  <div class="h-full flex flex-col rounded-3xl ...">
    <header class="h-24 ...">icon + title</header>
    <p class="h-10 line-clamp-2">description</p>
    <div class="aspect-[4/3] ..."><img class="w-full h-full object-cover"/></div>
    <div class="mt-auto">
      <div class="h-24">credits panel</div>
      <button class="h-14">CTA</button>
      <p class="h-5">helper</p>
    </div>
  </div>
```

## Files to change

- `src/components/admin/ImageCropDialog.tsx` — fixed-canvas export with letterbox option
- `src/components/admin/ToolMediaManager.tsx` — pass target dimensions + fit mode to dialog
- `src/components/tools/ToolLandscapeCard.tsx` — fixed section heights, simplified image rendering
- `src/pages/Tools.tsx` — verify `items-stretch` + `h-full` on grid items

No database or backend changes needed.
