# Search (SEO)

The site is a single-page app: without help, every address returns the same home-page HTML to
Google. So the build writes a real HTML page for every public address, with its own title,
description, canonical address, structured data and readable text. The app loads on top of it in
a browser, and sets the same title and description again.

| Pages | Written by | Text comes from |
|---|---|---|
| `/tool/<id>`, one per live app | `scripts/prerender-apps.mjs` | the catalogue, app definitions, `src/lib/appSeo.ts` |
| Fixed pages (home, about, prices, websites, cards, kit, the signed-in apps) | `scripts/prerender-pages.mjs` | `src/lib/seo/pages.ts` |
| `/ai-tool-for/<job>`, `/ai-for/<business type>` | `scripts/prerender-pages.mjs` | seeds and rules in `src/lib/seoData.ts` |
| `/promo/<name>`, one per live app ("see what it does") | `scripts/prerender-pages.mjs` | the catalogue and app definitions |
| `/make/<id>`, websites, cards and invites | `scripts/prerender-pages.mjs` | `src/instant/catalog`, `promoSeo` in `src/instant/promo.ts` |
| `sitemap.xml` | `scripts/prerender-pages.mjs` | all of the above, indexable pages only |

`public/sitemap.xml` is only a fallback copy. The build overwrites it in `dist/`; refresh the copy
with `node scripts/prerender-pages.mjs --check --sitemap` at release, not in feature branches.

## Adding things

- **A new app**: nothing to do. It gets its page and its sitemap entry at the next build.
- **A new public page**: add its route as usual, add one entry to `SITE_PAGES` in
  `src/lib/seo/pages.ts`, and set the page's head with `<SEOHead {...seoFor("/path", countLabel)} />`
  or `<PageSeo {...seoFor("/path", "")} />`.
- **A signed-in-only page**: give it an entry with `signedIn: true`. Signed-out visitors (and Google)
  then see what it does and a sign-up button, instead of being sent to `/auth`.
- **A private page**: no entry. Add it to `Disallow` in `public/robots.txt` if it has its own address.

## Rules the check enforces

`npm run check:seo` (also run by the merge train) fails when:
- two indexable pages have the same title, or a page has no title or description;
- any public title, description or page text uses an internal label: "flagship", "complex" or
  "hero" (`INTERNAL_WORDS`). These words are for the team only (Abhi, 12 Oct 2026).

It warns when a title is over 70 characters or a description is outside 70 to 170.

"AI tool for" and "AI for" pages with fewer than 3 matching apps (`MIN_LANDING_APPS`) are marked
`noindex` and left out of the sitemap, because a page with one or no apps reads as empty to Google.
They still work for visitors, and they come back into search on their own as matching apps are added.

## robots.txt

One `User-agent: *` group for every crawler. Do not add a group for one bot (for example Googlebot):
a bot with its own group ignores every rule in the `*` group, which is how Google was allowed into
`/admin` before.

## Only Abhi can do

1. **Google Search Console** (https://search.google.com/search-console), signed in with the Google
   account that owns the site. The site is already verified by the meta tag in `index.html`; if the
   property is missing, add `https://ezyourlife.com` as a URL-prefix property and choose "HTML tag".
2. **Sitemaps** → submit `https://ezyourlife.com/sitemap.xml`. Remove the old Supabase sitemap
   address if it is listed there.
3. **URL inspection** → paste `https://ezyourlife.com/` and a few app pages → "Request indexing".
4. **Bing Webmaster Tools** (https://www.bing.com/webmasters) → "Import from Google Search Console".
5. **Google Business Profile** for EZYOURLIFE with the website link, and links to the site from its
   Instagram, LinkedIn and YouTube profiles. Add those profile addresses to `sameAs` in `index.html`.
