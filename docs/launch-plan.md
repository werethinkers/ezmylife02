# Ezyourlife 2,000-app launch: plan and progress

This is the progress file for taking Ezyourlife from about 150 apps to 2,000.
Read it at the start of every phase and update it at the end.

## Progress

| Phase | What | Target | Status | Apps added | Running total |
|---|---|---|---|---|---|
| 0 | Foundation | 0 | **Done 12 Oct 2026** (two live checks left, see "Open items") | 0 | 154 apps + 104 website and card designs |
| 1 | Pilot: business documents and legal templates | ~100 | **Live 12 Oct 2026** (Published, SQL applied; first real AI run of each kind still to be checked) | 64 | 218 apps |
| 2 | New engines: calculator, file converter, photo presets | ~30 | **Built 12 Oct 2026**, waiting for Publish, then the SQL (see "Phase 2 notes") | 25 | 243 apps |
| 3 | Preset scale-up, one vertical per chat | ~870 | Not started | | |
| 4 | AI verticals, one vertical per chat | ~650 | Not started | | |
| 5 | Invitations and greetings | ~250 | Not started | | |
| 6 | Clean-up | 0 | Not started | | |

Counts: "apps" are live rows in the `tools_catalog` table: 218 on 12 Oct 2026 (154 before Phase 1, plus 64; the
Phase 1 SQL was applied that day through the Lovable database connection). The code copies in `src/data/catalog/` and `src/data/toolsDatabase.ts` hold all 218.
The 104 website, card and invitation designs are active rows in `ip_products`. Site copy says "240+"
from Phase 2 (243 once its SQL is applied, rounded down to the nearest 5) and "The Future's First AI App Store" everywhere.

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
- Functions: the sitemap function prints `<!-- launch-check: <value> -->` on its second line. Live address: `https://cmwnjexfpcfpoeyemxhb.supabase.co/functions/v1/sitemap`.
- Database: `supabase/migrations/20261011190000_launch_check.sql` sets a description on `tools_catalog`. If the description appears without anyone running it, migration files are applied automatically.

For catalogue rows the SQL is insert-only (`ON CONFLICT (id) DO NOTHING`), so applying it never changes an app that is already live.

## How an app is made

Each app has the same id in four places. One file per vertical in each, plus one import line and one entry line in the index next to it (these index files merge with git's union driver; see `docs/branching.md`):

| Piece | Folder | Index |
|---|---|---|
| Catalogue row (name, description, category) | `src/data/catalog/<vertical>.ts` | `src/data/catalog/index.ts` |
| App definition (form, engine) | `src/apps/defs/<vertical>.tsx` | `src/apps/defs/groups.ts` |
| Server instructions and price charged | `supabase/functions/_shared/appSpecs/<vertical>.ts` | `supabase/functions/_shared/appSpecs/groups.ts` |
| Price shown on the page | `src/apps/prices/<vertical>.ts` | `src/apps/prices/groups.ts` |

Steps for a batch:

1. Add or extend the four files for the vertical.
2. Pick the app's main `category` and, if it belongs in more than one place, `alsoIn: [...]` in its catalogue entry (the checker verifies the names). A brand-new category goes in `CATEGORY_INFO` in `src/data/goals.ts`; `gen:catalog` then also writes it into the `catalog_categories` table. Categories can also be made in admin (see Groupings).
3. `npm run check:apps` — must pass. It checks unique ids and names, that every app has all four pieces, that the page price equals the server price, that every category has a goal, and that launch apps have real descriptions that differ from each other.
4. `npm run gen:catalog -- <vertical>` — writes the SQL file for the new rows in `supabase/migrations/`. Never type catalogue SQL by hand. Running it again only adds rows that are not in an earlier file.
5. `npm run build` — also writes one HTML page per app for search engines and adds new apps to the sitemap.
6. Go live as in the table above.

Apps that run only in the browser (no server instructions) must be listed in `USAGE_GATED` in `src/apps/prices.ts`, or they would run without being charged. The checker enforces this for launch apps.

Cards, websites and invitations live in `src/instant/catalog/`. Follow `docs/design.md` and `docs/instant-products.md` for look and wording.

## Groupings and filters

- Goal → Category → App. An app has one main `category`, optional `extra_categories` ("also shown under") and `tool_types` (the "Type" filter chips on /ai-apps).
- Categories live in the `catalog_categories` table (seeded from `CATEGORY_INFO`). The site loads them at runtime, so a category made in admin shows everywhere without a code change.
- Admin: Tool Management → add/edit app uses the Grouping picker (main category, also-show-under, filter types, New category). Admin → "Groupings & Filters" lists categories with counts and a "Needs a look" queue of new apps.
- Filter types are merged case-insensitively; a type needs 3+ apps to show as a chip; /ai-apps shows 8 and "Show N more".
- Visitors see changes after the 10-minute cache. Static SEO pages (built by `prerender-apps.mjs`) use the built-in category wording only.
- Migration `20261012044000_catalog_groupings.sql` is applied to the live DB (19 categories, 12 apps with extra categories).

## Category split and the home directory (12 Oct 2026)

- Image Tools (75 apps) and Research were split: new categories **ID & Exam Photos**, **Photo Enhance & Retouch**, **Blur & Privacy**, **Social Media Sizes** (also in Content Creation) and **Writing & Editors**. 47 apps moved; names, prices and pages unchanged.
- SQL: `supabase/migrations/20261012070000_catalog_split_categories.sql` (written by `scripts/gen-recategorise-migration.mjs`). Apply it **after** the Phase 2 catalogue SQL, so the exam presets exist before they are moved. It only moves an app still in its old category.
- New photo apps for passports, visas, exams and signatures go in ID & Exam Photos, not Image Tools.
- Home page: "Apps by what you need" is now "Everything in the store" (`src/components/home/AppDirectory.tsx`): every app and every website and card design, goal → category, five per category with "Show all", a goal picker and a search box. It reads the live catalogue, so new apps and categories appear there with no code change.

## Search pages

Every live app has its own address, `/tool/<id>`. At the end of each build, `scripts/prerender-apps.mjs`
writes `dist/tool/<id>/index.html` and `dist/tool/<id>.html`: own title, description, canonical
address, structured data and readable text (what you give, what you get, steps, related apps).
The app loads on top of it in a browser. The title and description rule is in `src/lib/appSeo.ts`
and is shared with the app page, so both say the same thing. No prices are written into these
pages, because live prices can be changed in admin and the static text would go stale.

`/promo/<name>` pages ("see what it does", one per live app) are indexable since 12 Oct 2026 (Abhi's call): own
prerendered page, in the sitemap, no longer blocked in `robots.txt`. Each has its own title and text, different from `/tool/<id>`.

Every other public page gets the same treatment from `scripts/prerender-pages.mjs`, which runs
right after it in the build and also writes `dist/sitemap.xml`. How it works and what to do when
adding a page: `docs/seo.md`.

## Where new verticals sit

| Vertical | Category | Goal |
|---|---|---|
| Exam and ID photo/signature presets | ID & Exam Photos (also For Students for exams) | Photos & content |
| PDF and file converters | PDF & Files (new in Phase 2; image converters also in Image Tools) | Smart helpers |
| Finance calculators | Calculators (new in Phase 2; some also in Finance & Accounting) | Run your business |
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

## Phase 1 notes

**64 apps, tool-40 to tool-104** (no tool-78), all on the doc engine, in `src/apps/defs/business-docs.tsx`.

Every app has: a filled "Fill in an example", 3–4 plain steps, placeholders, refine chips for its kind
(bills, HR letters, agreements, printable forms), apps to go to next, and live sums where there are
numbers (quotation and invoice totals with GST, salary net pay, EMI, rent and deposit, partner shares,
milestone billing, appraisal average, time-sheet hours and amount, receipt balance). The worked-out figures
are sent to the model, which is told to use them as given and not recalculate.

Every engine app already gets these from the shared shell: history saved on every run (synced to the
account), Bulk mode from a CSV (item tables fit in one cell as `col=value | col=value ; next row`),
copy, Word, Markdown, print/PDF, WhatsApp, and Email (new: to the saved client, in the body, or as a Word
attachment). `npm run check:apps` now fails a launch app that has no example value for a required field,
fewer than 2 steps or fewer than 2 related apps.

Grouping: document apps in HR and Operations no longer say "a sheet that adds up for you"; the give/get
line follows what the app produces (`giveGetFor` in `src/data/goals.ts`). Quotation Comparison moved to
Operations, Bill of Sale to Legal, Non-Compete also tagged Legal.

Left out or changed, and why:
- **tool-78 Invoice Template removed**: the same job as the live Invoice Generator (tool-1).
- **NDA split**: tool-62 is the one-way NDA; tool-73 is now "Joint Project NDA" (both sides share, with no-poaching).
- **tool-84 Non-Compete & Non-Solicitation**: Section 27 of the Indian Contract Act makes an agreement restraining
  anyone from a lawful profession, trade or business void to that extent
  ([India Code](https://indiacode.nic.in/bitstream/123456789/2187/2/A187209.pdf)). So competing is barred only
  while employed; after exit only poaching customers or staff and using company data.
- Eviction notice and legal notice no longer state notice periods "the law requires"; they use the period the user picks.
- LLP Agreement step "File it with the MCA within 30 days" is from
  [MCA LLP e-filing](https://www.mca.gov.in/MinistryV2/llpefiling.html) (eForm 3 within 30 days of incorporation).

Tested in a browser on 16 apps (tool-40, 45, 50, 53, 55, 60, 61, 62, 65, 69, 73, 77, 84, 92, 98 and 104
): example fills, totals compute, Bulk mode opens with a filled example row. The AI call itself could not
run from the test machine (no outside network), so the first live run of each kind is still to be seen.

**How Phase 1 went live (done 12 Oct 2026):** 1) Abhijay presses Publish in Lovable (site and app definitions); 2) apply
`supabase/migrations/20261012042353_catalog_businessdocs.sql` through the Lovable database connection
(insert-only). Applying the SQL first would list apps the live site cannot open yet. 3) Check that the
`ai-app` function has the new server instructions (see "Open items": not yet confirmed that Publish deploys functions).

## Phase 2 notes

**25 apps on three new engines** (all run in the browser; files never leave the device). The preset
engine is new rather than a layer on the old passport and signature screens, because those screens
take no app id and so cannot know which exam they are for.

| Engine | File | Apps |
|---|---|---|
| Calculator (`engine: "calc"`, `src/apps/engines/CalcApp.tsx`) | `src/apps/defs/calculators.ts` | EMI, Loan Prepayment, SIP, FD, RD, CAGR, Break-Even, Percentage, Age (9) |
| File converter (`engine: "convert"`, `ConvertApp.tsx`, converters in `src/apps/lib/convert.ts`) | `src/apps/defs/converters.ts` | JPG to PDF, PDF to JPG, Merge PDF, Split PDF, Rotate PDF, PDF to Text, HEIC to JPG, WebP to JPG, PNG to JPG, Image to WebP (10) |
| Exam/ID preset (`engine: "preset"`, `PresetApp.tsx`, image work in `src/apps/lib/presetImage.ts`) | `src/apps/defs/exam-presets.ts` | NEET/JEE/CUET (NTA), SBI Clerk 2026, GATE 2027, US visa, OCI card, India e-Visa (6) |

How each engine works:
- **Calculator**: the formula runs on every keystroke; the example is filled in on open so the answer shows straight away. Results, a split bar, a year-wise table (Show all), Copy, WhatsApp, CSV for Excel. Each calculation is saved to history by itself. "Explain in plain words" is the only AI step (1 credit, Flash-Lite, `appSpecs/calculators.ts`); the model is told to use the worked-out figures as given and give no investment, tax or legal advice.
- **Converter**: add files (drag, tap, several at once), reorder for Merge and JPG to PDF, pick settings, download one file or a ZIP. History keeps file names only. pdf-lib builds and edits PDFs; pdf.js (already on the site) reads them; heic2any reads iPhone photos. Both new packages were added to `package.json` and `bun.lock` (checked with `bun install --frozen-lockfile`).
- **Preset**: a preset is a data row per exam: exact pixel size, or a pixel range and shape, KB range, background and the official rules, with the source page and the date it was read. One card per upload (photo, signature, thumb, declaration). The app crops, cleans paper to white for ink items, sets the exact size, and finds the best JPG quality inside the KB range; too-small files are padded with a JPEG comment block (the picture is unchanged). KB limits are met for both 1 KB = 1000 and 1 KB = 1024 bytes. Ticks show each rule passing; Download all gives a ZIP. Where the official page sets no pixel size, the app says so and uses our own size.
- Price: 1 credit per use (30 minutes) for all 25, through `USAGE_GATED`. The calculator explanation is a separate 1-credit AI run.
- New categories: **Calculators** (Run your business) and **PDF & Files** (Smart helpers), with a new kind `file` ("Opens a file converter"). `npm run check:apps` now checks the new engines: browser engines must be in `USAGE_GATED`, presets must have an https source with a date, and size and KB rules must be complete.

Sources used (read 12 Oct 2026): NTA bulletins for NEET (UG) 2026, JEE (Main) 2026 and CUET (UG) 2026; SBI Junior Associates 2026 advertisement CRPD/CR/2026-27/17; GATE 2027 photograph and signature page (IIT Madras); US State Department digital image requirements; Embassy of India Asunción OCI page; Indian e-Visa page. Links are in `src/apps/defs/exam-presets.ts` and on each app page.

Left out, and why:
- **GST, PPF and gratuity calculators**: no official page could be read for the current figures (NSI and UPSC block automated reading; the CBIC page only links elsewhere; gratuity moved under the Code on Social Security from 21 Nov 2025 and the ceiling under it was not confirmed). Add them in Phase 3 with a source.
- **UPSC, SSC, IBPS, CAT, RRB, PAN presets**: the official notices could not be opened (robots blocks, script-only sites or no link found). PAN's Protean article gives conflicting KB limits.
- **UK passport and Canada photos**: both say the photo must not be altered by software, which a resizing tool cannot honour.
- **NEET finger and thumb impressions**: the 2026 bulletin gives two different KB ranges.
- NEET and JEE Main share one app with CUET: their photo rules are the same and one signature file (10–50 KB) passes all three, so separate apps would be padding.
- Existing live apps **SSC, UPSC, PSC and PAN Photo Resize** still open the general passport tool with generic sizes, not exam rules. They should move to the preset engine once their official notices are sourced (Phase 3).

Tested in a browser: all 9 calculators (example result, answer changes with input, auto-history), all 10 converters on real files (page counts and rotations checked in the output PDFs; HEIC with a real HEIC file), all 6 presets with a photo and a signature on grey paper (every tick green, ZIP download). The AI explanation could not be run from the test machine.

**How Phase 2 goes live:** 1) Abhijay presses Publish in Lovable. 2) Apply, in this order, through the Lovable database connection: `20261012060000_category_kind_file.sql` (allows the new kind), then `20261012060124_catalog_calculators.sql`, `20261012060125_catalog_converters.sql`, `20261012060126_catalog_exampresets.sql` (insert-only). 3) Run one "Explain in plain words" to confirm the `ai-app` function has the new instructions.

## Open items

- **Publish completed (12 Oct, ~18:50 UTC, verified ~01:00 UTC 13 Oct):** Per-app pages are partially live — `tool-10`, `google-business-kit`, and `remove-background` serve correct per-app titles; `passport-photo-maker` still serves home-page title despite the prerendered file existing in `dist/`. Inconsistent serving suggests deploy may still be rolling out or some files are cached. **Action for Phase 1:** Proceed with app building; if per-app pages are not consistently serving by end of Phase 1, the hosting setup may need attention before going live. Functions and marker page not yet confirmed live.
- `npm run lint` reports 305 problems on `main` that were there before the launch. Phase 0 added none. The rule for later phases is "no new ones".
- `package-lock.json` is out of date (the project is built with bun). Install with `npm install --no-package-lock`.

## Notes for Phase 6

- `ai-face-generator` opens the Beautify screen and `remove-object-photo` opens the background remover. Both are listed as separate apps but do not do what their names say.
- Several resize apps share one screen and differ only in the preset size. Phase 2's preset layer should absorb them.
- The page price in code is only the default. The live price is the `tool_pricing` row, which admin can change (Remove Background shows 4 credits live).
