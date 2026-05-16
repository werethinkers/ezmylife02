## Plan: Maximize indexing coverage + broad "AI tool for X" SEO

### Part A — Google Search Console indexing
Google's public Indexing API only accepts JobPosting/BroadcastEvent — for regular HTML pages, **sitemap submission is the official path** (already done with 179 URLs). On top of that:

1. **Resubmit sitemap** via the GSC API to force a refresh now that the file is republished.
2. **List submitted sitemaps + index coverage** to confirm Google picked it up, surface counts (submitted vs indexed) back to you.
3. **Add an HTML sitemap page** at `/sitemap` (linked from the footer) so crawlers and users have a second discovery path — pure internal links beat sitemap-only for crawl priority.
4. Note honestly: per-URL "Request Indexing" is rate-limited to ~10/day and only exists in the GSC UI, not the API. Sitemap + internal links is the scalable path.

### Part B — Programmatic SEO so any "AI tool for X" search lands here

Goal: when anyone in the world searches "AI tool for {accounting / wedding planning / podcast editing / anything}", a relevant EZYOURLIFE page ranks.

1. **Install `react-helmet-async`** and wrap the app once in `src/main.tsx`. Remove the static `<link rel="canonical">` from `index.html` (each route owns its own).

2. **Per-tool SEO** on `ToolViewer` (`/ai-apps/:slug`): emit `<Helmet>` with
   - `<title>{tool.title} — AI tool for {tool.short_use_case} | EZYOURLIFE</title>`
   - `<meta name="description">` built from tool description + "Free AI {category} tool. Try {tool.title} online, no signup required."
   - `<meta name="keywords">` including "ai tool for {use_case}", "{category} ai", "free {category} tool", "online {use_case} generator"
   - Canonical + OG + Twitter tags
   - `SoftwareApplication` JSON-LD per tool with name, applicationCategory, description, offers, aggregateRating placeholder

3. **Use-case landing pages** at a new route `/ai-tool-for/:query`:
   - Accepts any free-text slug (e.g. `/ai-tool-for/wedding-planning`, `/ai-tool-for/tax-filing`).
   - Renders an H1 "AI tools for {humanized query}", H2 "Free {query} AI apps on EZYOURLIFE", plus a filtered grid of matching catalog tools (fuzzy match across `title`, `description`, `category`, `tags`).
   - When no exact matches: still render meaningful copy (use-case explanation + recommended adjacent tools + Request-a-Tool CTA) so the page is never empty for crawlers.
   - Helmet emits title/description/canonical/keywords targeting that exact phrase.

4. **Industry/sector hub pages** at `/ai-for/:industry` covering high-volume verticals (healthcare, real-estate, education, finance, marketing, legal, ecommerce, hr, sales, design, etc.) — each renders curated tool sets + JSON-LD `CollectionPage` + FAQ.

5. **Sitemap update**: extend `scripts/generate-sitemap.ts` (or `public/sitemap.xml`) to include
   - every `/ai-tool-for/{seed}` for a seeded list of ~200 high-intent phrases ("invoice generator", "study planner", "logo maker", "video script writer", etc.)
   - every `/ai-for/{industry}` page

6. **Internal linking** — on the homepage and `/ai-apps` add a "Popular searches" footer block linking to the most valuable `/ai-tool-for/...` and `/ai-for/...` pages. This gives Google a crawl path and distributes PageRank.

7. **index.html** keyword + description widen-out to include "AI tool for any task", "AI app for any industry", "find an AI tool for…" without dropping the existing keyword set.

### Part C — Mark fixed + republish
- Run a final GSC `sitemaps GET` to confirm submission status and report counts.
- Tell you to publish so the new routes go live; Google will discover them via the updated sitemap on its next crawl.

### Technical notes
- New files: `src/pages/UseCaseLanding.tsx`, `src/pages/IndustryLanding.tsx`, `src/pages/HtmlSitemap.tsx`, `src/components/seo/PageSeo.tsx` (shared Helmet wrapper).
- Routing: add three `<Route>`s in `src/App.tsx`.
- Sitemap: regenerate `public/sitemap.xml` to ~600+ URLs (179 tools + ~200 use-cases + ~30 industries + statics).
- No DB schema changes. Catalog reads from existing `tools_catalog`.
- Helmet is client-side, so Googlebot (JS-executing) sees per-route tags. LinkedIn/Slack still see the static `index.html` head — acceptable for non-share-critical landing pages.
