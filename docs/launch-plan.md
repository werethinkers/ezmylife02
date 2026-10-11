# Ezyourlife 2,000-app launch: plan and progress

This is the progress file for taking Ezyourlife from about 150 apps to 2,000.
Read it at the start of every phase and update it at the end.

## Progress

| Phase | What | Target | Status | Apps added | Running total |
|---|---|---|---|---|---|
| 0 | Foundation | 0 | **Done 12 Oct 2026** (two live checks left, see "Open items") | 0 | 154 apps + 104 website and card designs |
| 1 | Pilot: business documents and legal templates | ~100 | Not started | | |
| 2 | New engines: calculator, file converter, photo presets | ~30 | Not started | | |
| 3 | Preset scale-up, one vertical per chat | ~870 | Not started | | |
| 4 | AI verticals, one vertical per chat | ~650 | Not started | | |
| 5 | Invitations and greetings | ~250 | Not started | | |
| 6 | Clean-up | 0 | Not started | | |

Counts: "apps" are live rows in the `tools_catalog` table (154 on 12 Oct 2026, and the code
copy in `src/data/toolsDatabase.ts` matches it row for row). The 104 website, card and
invitation designs are active rows in `ip_products`. Site copy says "150+" (the real count
rounded down to the nearest 5) and "The Future's First AI App Store" everywhere.

## Fixed rules

- Never message the Lovable agent (no `send_message`, no `create_project`). All changes go through this GitHub repo. Read-only Lovable calls are fine.
- Run one phase per chat, and only the phase asked for.
- Apps run on Gemini Flash / Flash-Lite through the shared `ai-app` function. Leave that as it is.
- Facts such as exam photo sizes, tax rates and legal requirements come from an official source, with the source URL kept beside the data. No source, no app.
- No padding: two apps must differ in inputs, rules or output, not only in title.
- Stop and ask before: payment, wallet or credit-charging changes; changing the price, name or existence of a live app; deleting data; loan, credit card or demat referral features.

## How changes go live

Tested on 11–12 Oct 2026 with one harmless push to `main`.

| What | Does a push to `main` update it? | How it goes live |
|---|---|---|
| Lovable project | Yes, within seconds | Nothing to do |
| Website (ezyourlife.com) | **No** (unchanged 20 minutes after the push) | **Publish in Lovable.** Standing manual step for Abhijay unless he says Claude may press it through the connector |
| Server functions (`supabase/functions`) | **No** | Not confirmed yet. Check after the next Publish (see "Open items") |
| Database (`supabase/migrations`) | **No** (the file is not applied) | Run the SQL through the Lovable database connection (read and write tested; no Lovable credits). Keep the file in the repo as the record |

Probes left in place so any later chat can re-check in a minute:

- Website: `/launch-check/` shows `launch-check marker: <value>` (file `public/launch-check/index.html`, not indexed). Change the value, push, and see whether the live page changes.
- Functions: the sitemap function prints `<!-- launch-check: <value> -->` on its second line. Live address: `https://vrsadzjyugbusfazdgyi.supabase.co/functions/v1/sitemap`.
- Database: `supabase/migrations/20261011190000_launch_check.sql` sets a description on `tools_catalog`. If the description appears without anyone running it, migration files are applied automatically.

For catalogue rows the SQL is insert-only (`ON CONFLICT (id) DO NOTHING`), so applying it never changes an app that is already live.

## How an app is made

Each app has the same id in four places. One file per vertical in each, plus one line in the index next to it:

| Piece | Folder | Index |
|---|---|---|
| Catalogue row (name, description, category) | `src/data/catalog/<vertical>.ts` | `src/data/catalog/index.ts` |
| App definition (form, engine) | `src/apps/defs/<vertical>.tsx` | `src/apps/registry.ts` |
| Server instructions and price charged | `supabase/functions/_shared/appSpecs/<vertical>.ts` | `supabase/functions/_shared/appSpecs.ts` |
| Price shown on the page | `src/apps/prices/<vertical>.ts` | `src/apps/prices.ts` |

Steps for a batch:

1. Add or extend the four files for the vertical.
2. A new category must be added to `CATEGORY_INFO` in `src/data/goals.ts`, or its apps fall into "More apps".
3. `npm run check:apps` — must pass. It checks unique ids and names, that every app has all four pieces, that the page price equals the server price, that every category has a goal, and that launch apps have real descriptions that differ from each other.
4. `npm run gen:catalog -- <vertical>` — writes the SQL file for the new rows in `supabase/migrations/`. Never type catalogue SQL by hand. Running it again only adds rows that are not in an earlier file.
5. `npm run build` — also writes one HTML page per app for search engines and adds new apps to the sitemap.
6. Go live as in the table above.

Apps that run only in the browser (no server instructions) must be listed in `USAGE_GATED` in `src/apps/prices.ts`, or they would run without being charged. The checker enforces this for launch apps.

Cards, websites and invitations live in `src/instant/catalog/`. Follow `docs/design.md` and `docs/instant-products.md` for look and wording.

## Search pages

Every live app has its own address, `/tool/<id>`. At the end of each build, `scripts/prerender-apps.mjs`
writes `dist/tool/<id>/index.html` and `dist/tool/<id>.html`: own title, description, canonical
address, structured data and readable text (what you give, what you get, steps, related apps).
The app loads on top of it in a browser. The title and description rule is in `src/lib/appSeo.ts`
and is shared with the app page, so both say the same thing. No prices are written into these
pages, because live prices can be changed in admin and the static text would go stale.

`/promo/<name>` pages are still marked "do not index" and blocked in `robots.txt`; that was
already so and was left alone.

## Where new verticals sit

| Vertical | Category | Goal |
|---|---|---|
| Exam and ID photo/signature presets | Image Tools | Photos & content |
| PDF and file converters | PDF & Files (new) | Smart helpers |
| Finance calculators | Finance & Accounting | Run your business |
| Business documents | Finance, Legal, HR, Operations | Run your business |
| Legal templates | Legal & Compliance | Run your business |
| Careers | Jobs & Careers (new) | Learn & grow |
| Student tools | For Students | Learn & grow |
| Developer utilities | Developer Tools (new) | Smart helpers |
| Local business packs | Marketing & Sales, plus industry landing pages | Get customers |
| Invitations and greetings | instant catalogue (/cards, /create) | separate from the app grid |

## Phases

App counts are targets, not quotas. Stop short if the remaining ideas would be padding.

- **Phase 1, pilot (~100).** Business documents and legal templates on the existing doc and tracker engines: GST quotation, salary slip, offer letter, experience letter, purchase order variants, delivery challan, rent agreement, NDA, affidavit, legal notice, partnership deed and similar. Legal apps carry the existing "draft for reference, not legal advice" line. Abhijay reviews these live before Phase 2.
- **Phase 2, new engines (~30).** Calculator engine (formula runs in the browser, optional AI explanation). File-converter engine (in the browser where possible; set a credit price per run). Preset layer on the image resizer, passport photo maker and signature tool, so an exam preset is a data row with its source URL. About 10 apps on each.
- **Phase 3, preset scale-up (~870).** One vertical per chat: file converters (300), finance calculators (150), exam and ID photo/signature presets (150), student tools (100), developer utilities (200), less the 30 from Phase 2. Generators and data tables, not hand-typed entries.
- **Phase 4, AI verticals (~650).** One vertical per chat: careers (100), local business packs by industry (300), remaining business and legal documents (250).
- **Phase 5, invitations (~250).** Wedding, festival, birthday and greeting templates in `src/instant/catalog/`.
- **Phase 6, clean-up.** Merge or remove near-duplicates, review prices against real usage from `tool_runs`, refresh counts and sitemap, final list by vertical. Price changes to live apps need Abhijay's yes.

## End of every phase

1. `npm run build`, `npm run lint`, `npm run check:apps`.
2. Open at least 10 new apps in a browser (or all, if fewer) and run each once with its sample values.
3. Merge to `main` and go live as in "How changes go live".
4. Update this file: status, apps added, running total, what was skipped and why.
5. Update the count text to the live number rounded down to the nearest 5: `APP_COUNT_FALLBACK` in `src/lib/appCount.ts`, `index.html`, `public/llms.txt`, and the MCP text in `src/lib/mcp/` and `supabase/functions/mcp/`.

## Open items

- **Publish completed (12 Oct, ~18:50 UTC, verified ~01:00 UTC 13 Oct):** Per-app pages are partially live — `tool-10`, `google-business-kit`, and `remove-background` serve correct per-app titles; `passport-photo-maker` still serves home-page title despite the prerendered file existing in `dist/`. Inconsistent serving suggests deploy may still be rolling out or some files are cached. **Action for Phase 1:** Proceed with app building; if per-app pages are not consistently serving by end of Phase 1, the hosting setup may need attention before going live. Functions and marker page not yet confirmed live.
- `npm run lint` reports 305 problems on `main` that were there before the launch. Phase 0 added none. The rule for later phases is "no new ones".
- `package-lock.json` is out of date (the project is built with bun). Install with `npm install --no-package-lock`.

## Notes for Phase 6

- `ai-face-generator` opens the Beautify screen and `remove-object-photo` opens the background remover. Both are listed as separate apps but do not do what their names say.
- Several resize apps share one screen and differ only in the preset size. Phase 2's preset layer should absorb them.
- The page price in code is only the default. The live price is the `tool_pricing` row, which admin can change (Remove Background shows 4 credits live).
