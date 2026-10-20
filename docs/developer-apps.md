# Developer apps

Outside developers publish their own web apps to the store. Built 20 Oct 2026 (Phase 1 of the
Developer Connector spec): single-file browser apps up to 10 MB, no AI, admin approval with one click.
Any Claude can do the developer's side through the EzYourLife connector and the `ezyourlife-developer`
plugin (`plugins/ezyourlife-developer`).

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

## Safety rules (do not loosen)

- Developer apps run in `HostedFrame`: `srcdoc` iframe sandboxed **without** `allow-same-origin`, so they
  cannot read the ezyourlife.com session, storage or cookies, or reach the page around them.
  Never bundle developer code into the site.
- Developers write only through the database functions; their tables have no write policies.
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
| Tool page hook-up | `src/pages/ToolViewer.tsx` (`isHosted` for ids starting `dev-`) |

## Setup the team does once

- Apply both migrations (`20261020010000_developer_apps.sql`, then `20261020030000_developer_apps_bigger_files.sql`).
- Deploy the `mcp` function so the connector has the developer tools. Whether a push to `main` redeploys
  functions is the open item in `docs/launch-plan.md`; the sitemap probe now reads `devapps-2` in the repo.
  If `https://vrsadzjyugbusfazdgyi.supabase.co/functions/v1/sitemap` still shows `phase0-b` after the push,
  functions need a manual deploy.
- Optional: a read-only GitHub token (fine-grained, Contents: read, on the repos developers use) as the
  `EZYL_GITHUB_TOKEN` secret, so `dev_import_file` can read private repos. Public repos work without it.

## Charging, cost and frequency

- Developers propose charge options (up to 6: levels of use, or rupee prices). The admin sees them with a rupee to credit conversion at the worst case (0.108 rupees a credit) and sets credits for each. Only the Start price is charged at use time today; per-option charging needs a change to the charging code and sign-off.
- Free or 0 is only a request. The admin screen shows a "Hidden costs" panel from `dev_cost_estimate`: our own hosting (database, bandwidth) is deliberately not counted; it lists AI provider calls (do not approve) and outside services that may bill per call (maps, SMS, email and similar; free font and script CDNs are ignored), plus the minimum credits for a 3x margin on the small fixed cost. The Start credits are prefilled with that minimum; the admin adds any outside per-call price. Admin-only (`admin_dev_queue`); developers and the connector never receive it, and the Claude instructions forbid quoting cost.
- EzYourLife credits are the only payment system; own payment code is removed.
- Apps run only when pressed. `dev_run_qa` adds a "Runs only when pressed" warning for timers, auto-refresh, cron code and schedule wording.

## Not built yet (later phases)

- Scheduled or repeat runs: a scheduler plus a quote-and-agree step telling the visitor the credits for that frequency over that period, charging only after they agree.
- Charging per chosen option at use time.

- Developer earnings ledger and payouts (share is recorded per app; needs runs to record free vs paid credits).
- Hosted apps larger than one file, own backends, AI through the gateway.
- Browser-based tests (routes, 375 px screenshots) on a build runner; invite-only developer accounts.
