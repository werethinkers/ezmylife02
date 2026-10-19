# Developer apps

Outside developers publish their own web apps to the store. Built 20 Oct 2026 (Phase 1 of the
Developer Connector spec): single-file browser apps, no AI, admin approval with one click.

## How it works

1. A developer signs in and opens `/developer`, or asks Claude through the EzYourLife connector
   ("Put my app on EzYourLife"; tools `dev_*` in `src/lib/mcp/tools/dev-apps.ts`).
2. They create an app (`/tool/dev-<slug>`), upload one HTML file and fill the store listing.
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
| Connector tools | `src/lib/mcp/tools/dev-apps.ts`, `dev-shared.ts` |
| Tool page hook-up | `src/pages/ToolViewer.tsx` (`isHosted` for ids starting `dev-`) |

## Not built yet (later phases)

- Developer earnings ledger and payouts (share is recorded per app; needs runs to record free vs paid credits).
- Hosted apps larger than one file, own backends, AI through the gateway.
- Browser-based tests (routes, 375 px screenshots) on a build runner; invite-only developer accounts.
