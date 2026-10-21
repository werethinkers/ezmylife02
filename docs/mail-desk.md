# Mail Desk

`/mail-desk` (signed-in only). A person's Gmail mails are brought in, sorted, and read by the AI into a summary, tasks, reminders and a reply draft. Nothing is ever sent for them. The Gmail they signed up with is their default account; they can add more Gmail accounts, each with its own settings (name, sign-off, reply language, "also read Updates").

## What costs credits

- **Free:** opening the page, reading mails/tasks/drafts, and "Check Gmail" (bringing mails in).
- **Charged:** only when the person presses **Fetch**. They see the quote first (mails and credits, balance before and after). The page never shows how many mails are promotions.
- **Price:** 0.08 credits per mail that goes through our sorting (with or without AI), total rounded up to whole credits, at least 1. 30 mails = 3, 100 = 8, 1,000 = 80.
- **Margin:** this assumes 2x on a credit worth Rs 0.333 (the lowest pack rate the owner gave). The repo's own worst case in `docs/pricing.md` is Rs 0.376, and the developer kit is lower (Rs 0.108); check the real rate if you change the price. AI cost is about Rs 0.01 a mail with Gemini 2.5 Flash-Lite, and mails from promotions, social, forums and bulk senders skip the AI entirely.

## How it uses the existing wallet (no wallet or SQL changes)

The wallet charges one fixed price per run, so a fetch is cut into runs of up to 25 mails, each charged through `start_tool_run` / `complete_tool_run`:

| Mails in the run | Tool id | Credits |
|---|---|---|
| 1 to 12 | `mail-desk-12` | 1 |
| 13 to 25 | `mail-desk-25` | 2 |

Added up this equals `ceil(mails x 0.08)` for every count (tested, 1 to 5000). `ensurePrice` creates the two price rows on the first charge. A failed run is `complete_tool_run(success=false)`, which charges 0, and its mails stay waiting. Stop ends the loop; the person pays only for the runs that finished. It uses `startRun`/`finishRun` and not `billed()`, so there is no WhatsApp/email notice per chunk.

## Files

- `supabase/migrations/20261021120000_mail_desk.sql` — tables and RLS. **Run it manually** (see "How changes go live" in `docs/launch-plan.md`).
- `supabase/functions/mail-desk/index.ts` — actions `init`, `connect`, `sync`, `quote`, `process`, plus the Google redirect (GET). `verify_jwt = false` in `supabase/config.toml` because Google's redirect has no sign-in token; every other action checks the user itself.
- `supabase/functions/_shared/mailDesk.ts` (+ `mailDesk_test.mjs`) — pricing, free sorting, prompt, parsing. Run: `node --experimental-strip-types --test supabase/functions/_shared/mailDesk_test.mjs`.
- `src/pages/MailDesk.tsx`, the route in `src/featureRoutes.tsx`, and the Mail Desk / Subscription links in the account menu in `src/components/Navbar.tsx`.

## Setup before it works

1. Run the migration.
2. Add Supabase secrets: `MAIL_DESK_GOOGLE_CLIENT_ID`, `MAIL_DESK_GOOGLE_CLIENT_SECRET`, `MAIL_DESK_TOKEN_KEY` (64 hex characters: `openssl rand -hex 32`; it encrypts Gmail tokens, so do not lose it), and optionally `SITE_URL`.
3. In Google Cloud: an OAuth client of type Web, with the redirect URI `https://<project>.supabase.co/functions/v1/mail-desk`, the `gmail.readonly` scope, and the consent screen set up. `gmail.readonly` is a restricted scope, so Google's app verification (and a security assessment) is needed before anyone outside the test users can connect.
4. Deploy the function, then Publish in Lovable for the website.

## Not verified yet

The function has not run against a live Supabase project, Google, or Gemini; only the pure logic is tested and the TypeScript is type-checked. Try it with a test Gmail before announcing it.
