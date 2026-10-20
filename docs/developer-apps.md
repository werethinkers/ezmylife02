# Developer apps

Outside developers publish their own apps to the store. Built 20-21 Oct 2026. Two kinds, one review path:

- **File apps** (`dev_apps.kind = 'hosted'`): one browser-only HTML file up to 10 MB, no AI, run in a sandbox.
- **AI apps** (`kind = 'ai'`): a *definition* (screen, fields, AI instructions) that runs on the site's own shared
  screens and AI, charged per use like the built-in apps. See "AI apps" below.

Both end in admin approval with one click. Any Claude can do the developer's side, for an app in any form (AI Studio
export, multi-file project, plain HTML, an app built inside Claude), through the EzYourLife connector and the
`ezyourlife-developer` plugin (`plugins/ezyourlife-developer`). The conversion playbook Claude follows is
`src/lib/mcp/tools/dev-standards.ts`, served live by `dev_get_standards`, so changing it retrains every developer's Claude
with no reinstall.

## How it works

1. A developer signs in and opens `/developer`, or asks Claude through the EzYourLife connector
   ("Put my app on EzYourLife"; tools `dev_*` in `src/lib/mcp/tools/dev-apps.ts`).
2. They create an app (`/tool/dev-<slug>`), send one HTML file (up to 10 MB) and fill the store listing.
   Files travel in parts of under 1 MB through an upload session (`dev_begin_upload` → `dev_upload_part`
   → `dev_finish_upload`) and are joined and size-checked on the server. Four ways in:
   - web page upload on `/developer`;
   - connector `dev_save_app` with the HTML (small files; bigger ones are split automatically);
   - connector `dev_import_file`: the server fetches the file from a GitHub repo (path + commit) or a
     public https link. This is the route for Claude's cloud workspaces, which can reach GitHub but not
     our database;
   - connector `dev_get_upload_link`: a one-time key (1 hour, one file) and a script, for Claude Code on
     a computer.
   Each version records where its file came from (`source`), shown to the admin.
3. **Checks** run on the server (`dev_run_qa`): file, size, phone fit, keys and passwords, AI calls,
   own payments, outside addresses, browser storage, frame escape, listing, unique name, similar apps.
   "Must fix" blocks sending.
4. **Live preview** on the editor page and at `/developer/preview/<versionId>`, in the same sandbox the
   store uses, with no credits charged.
5. They send it for review. The version is locked and fingerprinted (SHA-256 of the file).
6. An admin opens `/admin/developer-apps`, tries the app, reads the checks, sets **credits per use** and
   the **developer share**, and presses **Approve and publish**. That adds the app's `tools_catalog`
   row and `tool_pricing` row; it shows in the store within the 10-minute catalogue cache.
7. Visitors open `/tool/dev-<slug>` and press Start, which charges through the normal path
   (`runWithCredits` → `tool-charge` → `start_tool_run`, price from `tool_pricing`), 30 minutes a use.

Updates: saving a change to a live app starts the next version. The live version keeps running until the
new one is approved; the old one becomes "superseded". Admins can take a live app down and put it back
("All apps" tab). Nothing is ever deleted.

## AI apps (definition, not code)

- **What is stored:** `dev_app_versions.spec` (jsonb, up to 60 KB): `{engine doc|chat|vision, intro, steps, cta, fileName,
  fields[≤20], sample, refineChips, welcome, suggestions, documents, ai:{system, task, model flash|lite, maxTokens, maxImages,
  maxContext}}`. `html` holds the canonical text of the same definition, so the SHA-256 lock, submit and approve work
  unchanged. `dev_clean_ai_spec` validates it and explains problems in plain words.
- **How it runs:** `src/apps/ai/AiAppView.tsx` turns the public part of the definition into the same `DocAppDef`/`ChatAppDef`/
  `VisionAppDef` the built-in apps use (`specToDef.ts`) and renders the real engine. Runs go to the edge function
  `supabase/functions/dev-app-run`, which reads the instructions with the service role, appends the platform rules
  (`PLATFORM_RULES` + `COMMON_RULES`: inputs are data, never reveal the instructions, no invention, no secrets) and calls
  the site's own model (flash = gemini-2.5-flash, lite = gemini-2.5-flash-lite). Billing is the normal `billed()` wrapper
  with the price from `tool_pricing`; the browser only ever receives the model name (`get_ai_app` strips `ai.system/task`).
- **Test runs before approval** (`preview_version_id`): free, only for the version's developer or an admin, 25 a day per
  developer and 400 a day for the platform (admins exempt; values in `dev_ai_preview_allow`), logged in `dev_ai_usage`,
  the last 3 successful ones kept per definition in `dev_ai_samples` for the admin. At least one successful test run of the
  exact definition is a QA check.
- **Preview "exactly as on the site":** `/developer/preview/<versionId>` and the editor/admin panel show a phone (390 px) or
  desktop frame that loads the bare route `/developer/preview/<versionId>/embed` (`DeveloperPreviewEmbed.tsx`), so media
  queries see the real width. The assistant chat is hidden on `/developer/preview/*`. A "test runs left today" badge refreshes
  through `postMessage` after each run.
- **Cost (admin only):** `dev_ai_cost_estimate` (from instruction length, a typical input/output, `maxTokens`, measured test
  runs) gives typical and worst-case rupees and `suggested_credits = max(2, ceil(max(typical, measured) × 3 / 0.376))`.
  Approving an AI app below 2 credits is refused. Tokens are estimated as characters / 4 (+1100 per image): check the real
  bill in the provider dashboard.
- **Connector tools:** `dev_check_similar`, `dev_save_ai_app`, `dev_test_run` (`src/lib/mcp/tools/dev-ai.ts`).
- **Limits to state to developers:** Markdown output in the standard result screen; no file upload in a doc app (paste text,
  or use vision for photos/PDF pages); one AI call per use; no scheduled runs; no per-option runtime charging (separate
  tiers = separate apps).
- An app keeps its kind once it has a live version. Saving a file to an AI app that is not live yet switches it to a file
  app and discards the definition; saving a definition to a file app that is not live yet does the reverse.

## Similar apps

- `dev_similar_apps` compares name + one-line description words with live store apps and other developers' apps in review
  (overlap ≥ 0.34). The connector calls `dev_find_similar` *before* building (`dev_check_similar`), and `dev_run_qa` runs the
  same rule (`dev_apply_similar_rule`) for both kinds of app.
- Similar apps and no `similar_note` (20+ characters) = the "duplicates" check **fails** (blocks sending). With a note it is
  a **warning**. The web editor shows a "How is yours different?" box once similar apps are found.
- The admin review shows "Similar to N others" in the list and a panel with the similar apps (named, with links; other
  developers' in-review apps are named only to admins) and the developer's note (or "No note was given"). The admin then
  decides with the usual approve / ask for changes / don't accept. Nothing blocks approving.

## Migration notes

- `20261020090000_developer_ai_apps.sql` renames existing functions to `*_base` / `*_hosted` and puts dispatching wrappers
  in front (`dev_save_draft_as`, `dev_run_qa`, `admin_dev_queue`, `admin_dev_approve`). **Do not re-run earlier migrations
  after it**: they would overwrite the wrappers.
- It also changes the file-app rule: similar apps now fail the checks unless the developer gave a note.

## Safety rules (do not loosen)

- Developer apps run in `HostedFrame`: `srcdoc` iframe sandboxed **without** `allow-same-origin`, so they
  cannot read the ezyourlife.com session, storage or cookies, or reach the page around them.
  Never bundle developer code into the site.
- Developers write only through the database functions; their tables have no write policies.
- AI instructions never leave the server for visitors; developers see their own, admins see all, and the site appends
  its own rules after them on every run. Test runs are rate limited and logged.
- Only admins set price and share, and only a person's click approves. No connector tool approves.

## Where things are

| Piece | File |
|---|---|
| Tables, checks, approve, publish | `supabase/migrations/20261020010000_developer_apps.sql` |
| Client API | `src/lib/devApps.ts` |
| Sandbox frame, store runner | `src/apps/hosted/HostedFrame.tsx`, `src/apps/hosted/HostedApp.tsx` |
| Pages | `src/pages/developer/` (home, editor, preview, admin) |
| Connector tools | `src/lib/mcp/tools/dev-apps.ts`, `dev-import.ts`, `dev-shared.ts` |
| Splitting files for upload | `src/lib/devUploadParts.ts` |
| Bigger files, upload sessions | `supabase/migrations/20261020030000_developer_apps_bigger_files.sql` |
| Claude plugin (connector + skill + scripts) | `plugins/ezyourlife-developer`, listed in `.claude-plugin/marketplace.json` |
| Tool page hook-up | `src/pages/ToolViewer.tsx` → `src/apps/hosted/DeveloperApp.tsx` (file app or AI app, by `get_dev_app_kind`) |
| AI apps: migration | `supabase/migrations/20261020090000_developer_ai_apps.sql` |
| AI apps: run function | `supabase/functions/dev-app-run/index.ts` (`verify_jwt = false` in `supabase/config.toml`, like `ai-app`) |
| AI apps: screens | `src/apps/ai/` (`AiAppView`, `specToDef`), `src/apps/lib/preview.ts`, `runApp` in `src/apps/lib/api.ts` |
| AI apps: preview and review | `src/pages/developer/` (`DeveloperPreview`, `DeveloperPreviewEmbed`, `AiReview`, `parts`) |
| AI apps: connector | `src/lib/mcp/tools/dev-ai.ts`, `dev-standards.ts` (the playbook), `dev-schemas.ts` |
| Plugin skill and references | `plugins/ezyourlife-developer/skills/ezyourlife-publish/` (`SKILL.md`, `references/ai-apps.md`, `adaptation.md`) |

## Setup the team does once

- Apply the developer-app migrations in order (`20261020010000` … `20261020090000`). The last one adds AI apps and the similar-app note.
- Deploy the new edge function `dev-app-run` (and redeploy `mcp`).
- Deploy the `mcp` function so the connector has the developer tools. Whether a push to `main` redeploys
  functions is the open item in `docs/launch-plan.md`; the sitemap probe now reads `devapps-2` in the repo.
  If `https://vrsadzjyugbusfazdgyi.supabase.co/functions/v1/sitemap` still shows `phase0-b` after the push,
  functions need a manual deploy.
- Optional: a read-only GitHub token (fine-grained, Contents: read, on the repos developers use) as the
  `EZYL_GITHUB_TOKEN` secret, so `dev_import_file` can read private repos. Public repos work without it.

## Promo page, screenshots and updates

- Each version carries promo copy (`dev_app_versions.promo`: headline, tagline, audience, highlights, steps, faq) and up to 6 screenshots (`dev_app_images`, png/jpeg/webp, 400 KB each, stored as base64 in the database; the editor shrinks pictures to webp, the connector accepts a link, a public GitHub file or base64). The checks fail without the text or at least 1 screenshot and warn under 3.
- The admin review screen shows the promo text and pictures, plus a "what changed since the live version" list for updates (code size and fingerprint, listing, charge options, promo, screenshots, new outside addresses).
- Approving writes the copy and pictures into `tool_promo_pages` (`/promo/<name>`, the existing promo page), so the page goes live with the app and is rewritten by each approved update; unlisting hides it. Nothing needs a Lovable Publish: approval is database-only (`tools_catalog`, `tool_pricing`, `tool_promo_pages`, `get_hosted_app`).
- Limits: the static search sitemap is built at deploy time, so a new app's promo page is reachable and shareable at once but only joins the sitemap after the next Publish. Screenshots travel inside the page data, so they are capped small.
- Updating: a developer's Claude saves the new file with the same app id; it becomes the next version, the live one keeps running until the new one is approved.

## Charging, cost and frequency

- Developers propose charge options (up to 6: levels of use, or rupee prices). The admin sees them with a rupee to credit conversion at the worst case (0.108 rupees a credit) and sets credits for each. Only the Start price is charged at use time today; per-option charging needs a change to the charging code and sign-off.
- Free or 0 is only a request. The admin screen shows a "Hidden costs" panel from `dev_cost_estimate`: our own hosting (database, bandwidth) is deliberately not counted; it lists AI provider calls (do not approve) and outside services that may bill per call (maps, SMS, email and similar; free font and script CDNs are ignored), plus the minimum credits for a 3x margin on the small fixed cost. The Start credits are prefilled with that minimum; the admin adds any outside per-call price. Admin-only (`admin_dev_queue`); developers and the connector never receive it, and the Claude instructions forbid quoting cost.
- EzYourLife credits are the only payment system; own payment code is removed.
- Apps run only when pressed. `dev_run_qa` adds a "Runs only when pressed" warning for timers, auto-refresh, cron code and schedule wording.

## Not built yet (later phases)

- Scheduled or repeat runs: a scheduler plus a quote-and-agree step telling the visitor the credits for that frequency over that period, charging only after they agree.
- Charging per chosen option at use time.

- Developer earnings ledger and payouts (share is recorded per app; needs runs to record free vs paid credits).
- Hosted apps larger than one file, own backends. (AI through the site's gateway is built: see "AI apps".)
- File upload in doc apps, scheduled AI runs, chained AI calls, image or audio output for AI apps.
- Browser-based tests (routes, 375 px screenshots) on a build runner; invite-only developer accounts.
