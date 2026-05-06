## Continue: Polish, Rename, Theme & Auth Audit

Four parallel tracks to finalize the redesign.

### 1. Finish "Tools" → "AI Apps" rename (UI copy)

- Sweep `src/pages/**` and `src/components/**` for user-facing strings: "Tool", "Tools", "AI Tool(s)", "Find Tools", "My Tools", "Tool Catalog", "Browse Tools", "Request a Tool", "Top Tools", etc.
- Replace with "AI App", "AI Apps", "My AI Apps", "AI App Catalog", "Browse AI Apps", "Request an AI App", "Top AI Apps" — case preserving.
- Files in scope: `Home.tsx` (placeholder, "AI Tools" category, RequestToolSection labels), `Tools.tsx` (hero/title), `ToolsHero.tsx`, `ToolLandscapeCard.tsx`, `RequestToolSection.tsx`, `Navbar.tsx` mobile labels, `SEOFooter.tsx`, `ComingSoon.tsx`, `MeetNudge.tsx`, `PromptMaster.tsx`, `SpeedyNotebook.tsx`, `BulkModeToggle.tsx`, `BulkDropzone.tsx`, `LoginPromptDialog.tsx`, page `<title>`/meta on every page.
- Update SEO: `index.html` meta, JSON-LD strings, sitemap titles.
- **Untouched**: code identifiers (`Tool`, `ToolViewer`, `tool_id`, `useToolsCatalog`), DB tables, edge function names, admin internals, route variable names.
- Delete leftover `src/pages/Contact.tsx` (already merged into About; route already redirects).

### 2. Polish the new Home page

Tighten the redesigned Home to feel closer to the screenshot reference while keeping our dark-glass + teal/purple gradient tokens.

- Hero row: tighter vertical rhythm, larger H1, cleaner search-bar shadow, credits card with subtle gradient border + balance, free-credits, "Buy credits" link.
- Categories row: 8 pills with consistent icon + label, hover glow, equal sizing on mobile (2-col grid <md).
- Featured AI Apps: keep static carousel, ensure 3-up at md and 1-up at sm, add "View all →" link.
- How It Works (4 steps) + Popular Credit Packs panel: align to 2-col grid on lg, stack on mobile. Show real packs from credits config, mark "Most popular".
- Top Picks for You: pull from `useHomeSections` "personalized" or recently added when signed-out.
- Trust strip: 3 stat cards (Active users, AI Apps live, Avg rating) styled as glass chips.
- Remove leftover RequestToolSection placement if it duplicates the new "Request an AI App" CTA; keep one final CTA above footer.
- Audit spacing tokens, ensure all colors come from semantic tokens (no raw hex in JSX).

### 3. Apply light + purple theme site-wide

- Update `src/index.css` `:root` tokens to a light base: `--background` near-white, `--foreground` deep ink, `--primary` purple (e.g. `262 83% 58%`), `--primary-glow` lighter lavender, `--accent` soft lilac, surfaces with subtle lavender tint, borders softened.
- Keep `.dark` class for opt-in dark mode but make light the default.
- Refresh gradient tokens (`--gradient-primary`, `--gradient-hero`) to purple/lavender blend.
- Update shadow tokens for a lighter elevation.
- Sweep components that hardcoded dark assumptions (e.g., `bg-black/40`, `text-white`) and switch to semantic tokens (`bg-card`, `text-foreground`).
- Verify Navbar, Footer, ToolLandscapeCard, Hero, Tool Viewer chrome, Admin pages, Auth pages all read correctly on light bg.
- Tool Viewer iframes remain untouched (no overlay/branding on external tools).

### 4. Audit deferred-auth coverage

Walk every CTA and ensure anonymous users can browse; only paid actions prompt login via `LoginPromptDialog`.

- **Allow anonymous**: Home hero CTAs, category pills, Featured/Top Picks cards, `/ai-apps` listing, Tool Viewer for free apps, Coming Soon, About, Credits info page (view only), Get Extension marketing, search.
- **Require login (prompt, don't redirect)**: running a paid tool (credits > 0), buying credits, redeeming coupons, opening Bulk Mode, downloading the extension ZIP, saving notebook/prompts, Profile/Credits History/Bulk Jobs/Admin routes (keep `ProtectedRoute`).
- Replace lingering `navigate("/auth")` in browse paths with `LoginPromptDialog` open. Files to check: `ToolViewer.tsx`, `ToolPreview.tsx`, `MeetNudge.tsx`, `SpeedyNotebook.tsx`, `PromptMaster.tsx`, `Credits.tsx`, `BulkModeToggle.tsx`, `BulkDropzone.tsx`.
- Final test pass: log out, click through Home → category → app card → viewer → Run (prompt) → Buy credits (prompt). Confirm no premature redirects.

### Memory updates

- `mem://navigation/navbar-links` — confirm Contact/Bulk Jobs removed, "Tools"→"AI Apps".
- `mem://design/visual-aesthetic-animations` — switch to light + purple palette.
- `mem://project/brand-identity` — note "AI Apps" terminology.
- New `mem://design/theme-tokens` — list new HSL primary/accent/background values.
- New `mem://features/auth/deferred-login` — rule that browsing is anonymous; only paid actions prompt.

### Out of scope

No DB schema changes, no AI/billing changes, no admin tab restructuring, no new images, no tool catalog data edits.
