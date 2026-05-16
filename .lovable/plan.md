## Plan: Resolve remaining SEO findings

Address the three failing findings: Google Search Console setup, Lighthouse performance (LCP), and accessibility contrast.

### 1. Google Search Console connection
- Trigger the connector flow via `standard_connectors--connect` for `google_search_console` so you authorize OAuth inline.
- After connection, request a META verification token for `https://ezyourlife.com/` and add the `<meta name="google-site-verification" content="...">` tag in `index.html` `<head>`.
- Republish, then call the verify endpoint and register the site (`PUT /webmasters/v3/sites/...`).
- Submit `https://ezyourlife.com/sitemap.xml`.

### 2. Lighthouse performance (LCP)
- Inspect the homepage hero (`src/pages/Index.tsx` / hero component) to find the LCP element.
- If it's an image: add explicit `width`/`height`, remove `loading="lazy"`, add `fetchpriority="high"`, and add `<link rel="preload" as="image" href="..." fetchpriority="high">` to `index.html`.
- If the LCP is text: ensure any custom `@font-face` rules use `font-display: swap` (and verify Google Fonts links use `&display=swap`).

### 3. Accessibility contrast
- Replace low-contrast `text-gray-400` / `text-muted-foreground/50` usages in light-background contexts with design-system tokens (`text-muted-foreground`, `text-foreground`).
- Target files identified by ripgrep:
  - `src/pages/ToolViewer.tsx` — `text-muted-foreground/50` separator → `text-muted-foreground`
  - `src/startup-analyser/components/PromptSelector.tsx`, `FileUploader.tsx`, `EditableContent.tsx`, `StartupAnalyserApp.tsx` — swap `text-gray-400`/`text-gray-500` for `text-muted-foreground`
  - `src/components/CategoryBrowser.tsx`, `src/data/toolTypes.tsx` — Developer Tools `text-gray-400` → `text-muted-foreground`
- Skip strictly dark-mode contexts where contrast is already adequate.

### 4. Mark findings fixed + publish
- After edits land, call `seo_chat--update_findings` to mark all three findings fixed.
- Surface the publish dialog so Lighthouse-based findings re-measure against the new published build.

### Notes
- GSC verification requires a republish *between* injecting the meta tag and calling verify — Google fetches the live HTML.
- No backend/schema changes; frontend + `index.html` + connector only.
