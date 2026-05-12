## Plan

Four scoped changes — all UI/presentation, no schema or business-logic touchups.

### 1. Bigger Play/Pause (and Repeat) buttons in Virasat

`src/pages/Virasat.tsx` (interview question card, ~lines 556–595):

- Replace the small pill buttons with prominent circular controls: a 64px primary Play/Pause button (filled, brand color, soft glow) flanked by 44px Repeat and Hindi buttons.
- Increase icon sizes (Play/Pause → 28, others → 18).
- Stack the label below the icon on the main button so the action stays readable.
- Keep current handlers (`togglePlayPause`, `repeatNarration`, `toggleHindi`) and loading/disabled states unchanged.

### 2. Speech-to-text on phones

`src/components/virasat/VoiceRecorder.tsx`:

Two real bugs cause STT to silently die on mobile:

a. **Stale `state` in `recognition.onend`** (line 80). `state` is captured at recognition setup and is always `"idle"` there, so the auto-restart never fires on Android Chrome (which ends recognition every ~10s of silence). Fix by tracking recording with a ref (`isRecordingRef`) set in `startRecording`/`stopRecording` and reading it inside `onend`.

b. **Recognition started before MediaRecorder grabs the mic**, plus no graceful fallback when the browser lacks `SpeechRecognition` (iOS Safari). Changes:
- Detect support up front; if missing on a touch device, show a clear message and surface the "Likhne par jaayein" button automatically (no error toast loop).
- Wrap `recognition.start()` in try/catch and re-attempt once after 250 ms if it throws `InvalidStateError` (common on Android when a previous session hasn't fully released).
- On `onend`, only restart while `isRecordingRef.current === true`; clear the ref in `stopRecording` so it stops cleanly.
- Add an `onnomatch`/`audiostart` no-op to keep the engine alive on some Android builds.

c. Audio capture itself already works — only the live transcript was failing. The recorded blob is still uploaded and can be transcribed server-side later if needed (out of scope).

### 3. Remove all Coming Soon apps

Goal: nothing labelled "Coming Soon" appears anywhere in the product.

- **Routing**: remove `/coming-soon` route and the lazy `ComingSoon` import from `src/App.tsx`. Delete `src/pages/ComingSoon.tsx`.
- **Tool lists**: in `src/pages/Tools.tsx`, drop tools where `is_live === false` from the database fetch and from the static `tools` filter (already filtered for cards but still counted — tighten so they don't appear in counts, search, or category groupings).
- **Cards**: in `src/components/ToolCard.tsx`, `src/components/ExpandedToolCard.tsx`, and `src/components/tools/ToolQuickPreview.tsx`, remove the "Coming Soon" badge branch and the disabled state — these components will only ever receive live tools after the filter above.
- **Tool data**: `src/data/tools.tsx` and `src/data/expandedTools.tsx` — leave the data alone (other code still imports the types) but ensure consumers filter by `isLive`/`is_live` everywhere they render.
- **Other refs**: `src/pages/ToolViewer.tsx`, `src/pages/ToolPreview.tsx`, `src/pages/MobileShortcuts.tsx` — replace any "Coming Soon" preview branch with a simple "Not available" or 404 redirect to `/tools` (since the user's intent is to hide them entirely).
- Update memory: revise `mem://features/tool-catalog/coming-soon-page-flow-v2` to reflect that the Coming Soon page has been removed.

### 4. Book-style PDF (no distorted indentation)

Current `src/components/virasat/lib/pdfExport.ts` rasterises the entire scrollable book with `html2canvas` then slices at fixed page heights, which cuts paragraphs mid-line and loses indentation.

Rewrite to a **section-based renderer**:

- Mark book sections in `src/components/virasat/BookView.tsx` by wrapping each `h1`, `h2`, `p`, `hr`, and the media grid in a `data-pdf-section` div via the `ReactMarkdown` `components` map (use a small wrapper component for each).
- In `pdfExport.ts`, iterate every `[data-pdf-section]` element, render it individually with `html2canvas` (scale 2, white book background), and place it onto an A4 jsPDF page with proper margins (15 mm) and a 4 mm gap between sections. If the next section overflows the remaining page height, call `pdf.addPage()` first.
- Pre-render an A4-width offscreen clone (`width: 794px`, padding to mimic book margins, same serif typography, drop-cap on first paragraph) so indentation, drop caps, and chapter headings render exactly like the on-screen book — not the responsive layout that html2canvas was sampling.
- Keep the existing `<video>` → poster substitution, but apply it only inside the cloned offscreen node so the live DOM is untouched.
- Resulting PDF: each chapter starts cleanly, paragraphs keep their first-line drop cap and indent, no mid-line cuts.

### Out of scope
- Server-side STT fallback for iOS Safari.
- Re-transcoding existing webm recordings.
- Reworking the book's typography itself (only the export pipeline changes).
