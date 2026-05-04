# Honest Tool Count Messaging

Remove all inflated "50,000+" and standalone "2000+" claims. Replace with honest, dual-number messaging: **"200+ live tools today, 2,000+ coming within a year"**, so the catalog feels ambitious without false promotion.

## New Standard Phrasings

Use these consistently:

- **Short / badges**: `200+ Live Tools` (fact) or `200+ Live · 2,000+ Coming Soon` (vision)
- **Headlines**: `200+ AI tools live today — 2,000+ launching within a year`
- **SEO meta**: `200+ live AI tools (2,000+ coming) for productivity, content, business & education`
- **Subscription/feature lists**: `Access to all 200+ live AI tools + every new tool as we launch (2,000+ planned)`
- **Footer / About stats**: stat block shows `200+` (Live Now) and `2,000+` (Coming Year 1)

Never say "50,000+" anywhere. Never say a flat "2,000+ tools" without the "coming" qualifier.

## Files to Update

**SEO / metadata**
- `index.html` — meta description, og:title, og:description, twitter:description, JSON-LD `description` fields, FAQ answers (lines ~7, 31, 32, 43, 55, 84, 100, 108, 116, 124, 132, 185, 203, 215, 221)
- `src/pages/Home.tsx` — SEOHead description + JSON-LD (lines 207, 217), hero copy (277, 386), pricing feature (588), problem-solver card (178)
- `src/pages/Tools.tsx` — title + description + JSON-LD (lines 345, 346, 354)
- `src/pages/About.tsx` — SEO description + JSON-LD + stats block "2000+" (lines 12, 20, 168) → split into two stats: `200+ Live Now` and `2,000+ Coming Year 1`
- `src/pages/Subscription.tsx` — feature lists & SEO (lines 301, 307, 315, 343, 351, 356, 424, 738)
- `src/pages/Auth.tsx` — sign-in subtitle (line 171)
- `src/components/SEOFooter.tsx` — tagline (line 12)
- `src/components/LaunchOfferBanner.tsx` — slide 2 headline (line 84)

**Edge functions**
- `supabase/functions/tools-chat/index.ts` — system prompt (lines 8, 10): change to "200+ live AI tools (2,000+ launching within a year)"

**Memory**
- Update `mem://pages/about-us-content` — currently says "2000+ premium tools count". Replace rule with: "Always show 200+ live + 2,000+ coming (within a year). Never claim 50,000+ or a flat 2,000+ live."
- Add core memory line to `mem://index.md`: `Honest counts: "200+ live · 2,000+ coming within a year". Never use "50,000+" or imply 2,000+ are live.`

## Out of Scope

- No changes to actual tool catalog data
- No DB changes
- `public/sitemap.xml` / `robots.txt` not affected (no count claims)

## QA After Implementation

Run `rg "50,000\+|50000\+"` and `rg "2000\+ AI tools|2,000\+ AI tools"` — both should return zero matches in `src/`, `index.html`, and `supabase/functions/`. Only the new dual-phrasing should remain.
