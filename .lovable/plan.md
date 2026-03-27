

# SEO Rendering Fix — Per-Page Metadata & Crawlability

## The Reality

This is a client-side SPA. Every route serves the same `index.html`. That means:
- `curl https://ezyourlife.com/about` will **always** return the same HTML as `/` — this is a fundamental SPA limitation, not a bug
- **Google's crawler DOES execute JavaScript**, so it WILL see the per-page SEOHead metadata. The SEOHead component already updates `<title>`, `<meta>`, `<link rel="canonical">`, and JSON-LD dynamically
- Non-JS crawlers (some AI bots, `curl`) will always see homepage content — the noscript fallback helps here but can't be route-specific in a single `index.html`

Lovable does not support SSR or prerendering, so true server-side per-route HTML is not possible.

## What This Plan WILL Fix

The real gap: many pages lack **page-specific JSON-LD structured data** (breadcrumbs, page type schema). Currently only the homepage JSON-LD exists. Each page's SEOHead should inject its own structured data so Googlebot sees unique schemas per route.

### Changes Per Page

For all 11 major pages, ensure the SEOHead `jsonLd` prop includes:
- **WebPage/AboutPage/ContactPage** schema with correct `@type`, `url`, `name`, `description`
- **BreadcrumbList** specific to that page (e.g., Home > About, Home > Tools)
- Correct canonical URL via `path` prop

| Page | Schema Type | Breadcrumb |
|------|------------|------------|
| `/` | WebSite + SearchAction | (none) |
| `/tools` | CollectionPage | Home > AI Tools |
| `/about` | AboutPage | Home > About |
| `/contact` | ContactPage | Home > Contact |
| `/subscription` | WebPage (Product) | Home > Pricing |
| `/startup-analyser` | SoftwareApplication | Home > Startup Analyser |
| `/notebook` | SoftwareApplication | Home > Speedy Notebook |
| `/promptmaster` | SoftwareApplication | Home > Prompt Master |
| `/meet-nudge` | SoftwareApplication | Home > Meet Nudge |
| `/get-extension` | WebPage | Home > Get Extension |
| `/refund-policy` | WebPage | Home > Refund Policy |

### Files to Modify

1. **`src/pages/Home.tsx`** — add `jsonLd` prop with WebSite schema + SearchAction (move from relying on index.html defaults)
2. **`src/pages/About.tsx`** — add `jsonLd` with AboutPage schema + BreadcrumbList
3. **`src/pages/Tools.tsx`** — add `jsonLd` with CollectionPage + BreadcrumbList
4. **`src/pages/Contact.tsx`** — add `jsonLd` with ContactPage + BreadcrumbList
5. **`src/pages/Subscription.tsx`** — add `jsonLd` with Product/Offer schema + BreadcrumbList
6. **`src/pages/StartupAnalyser.tsx`** — add `jsonLd` with SoftwareApplication + BreadcrumbList
7. **`src/pages/SpeedyNotebook.tsx`** — add `jsonLd` with SoftwareApplication + BreadcrumbList
8. **`src/pages/PromptMaster.tsx`** — add `jsonLd` with SoftwareApplication + BreadcrumbList
9. **`src/pages/MeetNudge.tsx`** — add `jsonLd` with SoftwareApplication + BreadcrumbList
10. **`src/pages/GetExtension.tsx`** — add `jsonLd` with WebPage + BreadcrumbList
11. **`src/pages/RefundPolicy.tsx`** — add `jsonLd` with WebPage + BreadcrumbList
12. **`src/components/SEOHead.tsx`** — update to support array of JSON-LD objects (so both page schema + breadcrumb can be injected together)

### Limitations (Honest)

- `curl` will always return homepage HTML — this cannot change without SSR
- Google **does** execute JS and will see correct per-page metadata from SEOHead
- The noscript block in `index.html` cannot be route-specific — it stays as a general site overview
- No prerendering is available in Lovable

