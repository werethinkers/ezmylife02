---
name: ezyourlife-publish
description: Adapts a web app to EzYourLife's rules, builds it into one HTML file and sends it to the EzYourLife store for admin approval, using the EzYourLife connector. Use when someone says "put my app on EzYourLife", "publish this to EzYourLife", "make this work on EzYourLife", "send this app for EzYourLife review", "update my EzYourLife app", or shares a project, zip or big HTML file meant for the EzYourLife store.
---

# Publish an app to EzYourLife

Turn the developer's app into one self-contained HTML file that meets EzYourLife's rules, send it to their EzYourLife app with the `ezyourlife` connector, get the server checks to pass, and send it for review. An EzYourLife admin then tries it, sets the price and the developer's share, and approves it. Never tell anyone the app is live until `dev_get_status` says so.

## 0. Before starting

- Confirm the connector works: call `dev_get_standards`. Its rules are served live and are newer than this skill and anything remembered; where they differ, follow them. It returns the current rules and the list of valid store categories. If the tools are missing or say "not signed in", ask the developer to connect the EzYourLife connector and sign in with their EzYourLife account, then stop.
- Call `dev_list_my_apps`. If this is an update to an existing app, use that `app_id`; never create a duplicate app.

## 1. Read the project

Work out: framework and build tool, entry HTML, routing style, every network call, every use of browser storage, any login, payment or AI call, and roughly how big the built output is. Read the README for what the app does.

Stop and explain plainly, without changing anything, if the app cannot work without one of these: its own server or database, its own login, its own payments, or an AI service. Those cannot be published yet.

## 2. Adapt the code

Follow `references/adaptation.md` step by step. In short:

1. Remove every API key, token, password and secret.
2. Remove or replace AI calls, logins and payments.
3. Wrap all localStorage, sessionStorage, IndexedDB and cookie use in try/catch with an in-memory fallback.
4. Switch History-API routing to hash routing.
5. Remove anything that reaches the page around the app (`window.top`, `parent.location`).
6. Add the viewport tag and make the layout work at 375 px wide.

Keep the developer's features, look and wording otherwise. Make the smallest changes that satisfy the rules, and list every change for the developer at the end.

## 3. Build one HTML file

Follow `references/single-file-build.md`. For Vite apps, add `vite-plugin-singlefile`. For other build tools, build normally and run `scripts/inline-html.mjs` on the output. The result must be ONE `.html` file of at most 10 MB, ideally under 2 MB.

Before sending, check the result yourself:
- Run `grep -nE "sk-|AIza|api\.openai|api\.anthropic|generativelanguage|checkout\.razorpay|js\.stripe" <file>`. It must find nothing.
- Open the file in a browser if one is available and click through the main flow once.

## 4. Create or find the app

New app: call `dev_create_app(slug, name)`. The slug becomes the address `ezyourlife.com/tool/dev-<slug>` and cannot change later, so propose a short, clear slug and confirm it with the developer first.

## 5. Send the file

Pick the route by file size and by what this workspace can reach:

| Situation | Route |
|---|---|
| File under about 200 KB | `dev_save_app(app_id, html)` |
| Bigger file, workspace can push to GitHub (claude.ai, Cowork, most Claude Code setups) | Commit the built file to a GitHub repo (the developer's repo, a branch such as `ezyourlife-build`, path like `ezyourlife/index.html`), push, then `dev_import_file(app_id, github: {repo, path, ref: <commit SHA>})` |
| Bigger file on a computer that can reach the internet freely (Claude Code) | `dev_get_upload_link(app_id, file_name)`, save the returned script as `ezyourlife-upload.mjs` (also in `scripts/`), run the command it gives |
| File already at a public https link | `dev_import_file(app_id, url)` |

Use the commit SHA, not a branch name, so the version on EzYourLife is exactly what was tested. If GitHub import says the repo is private and EzYourLife can't read it, tell the developer. The EzYourLife team can add a read token on their side, or the developer can use the upload link from a computer.

## 6. Fill the store listing

Call `dev_save_app(app_id, listing)` with:
- `name` (3 to 60 characters)
- `short_description` (20 to 160 characters: what the user gets, in plain words)
- `description` (at least 40 characters: what you give, what you get, who it is for)
- `category` (exactly one from `dev_get_standards`)
- `tool_types` (up to 5)
- `support_email`
- `release_notes` for updates

Draft these from the code and README. Ask the developer only for what cannot be found, in one short question.

### The app's own page and screenshots (required)
Every app gets a page at ezyourlife.com/promo/<name>, built from what you send and shown to the team at review. Put it in `listing.promo`: `headline` (10 to 80 characters), `tagline` (one sentence), `audience`, 3 to 6 `highlights` and 2 to 5 `steps` (each `{title, body}`), and a few `faq` items if useful. Write only what the app really does: no ratings, reviews, customer quotes, user counts or claims you cannot back up.
Then ask the developer: "Please share 3 or more screenshots: the start screen, the app in use, and what it produces." Add each with `dev_add_image` (a public https link, a public GitHub file, or base64 under 400 KB). If you can run the app and take screenshots yourself, do that. Never invent or mock pictures. The checks need the promo text and at least 1 screenshot.

### Charging
Ask once: "How do you want to charge: different levels of use, or something you would sell for rupees?" Pass every answer (up to 6) in `listing.charge_options`, each `{label, kind: "per_use" | "money", inr?, note?}`. Do not convert rupees to credits and do not suggest credit amounts.
- If they say free or 0, record that as their wish only. The team prices every app from its real running cost, in the background. Never tell the developer what an app costs to run, never quote credits or margins, and never promise it will be free.
- EzYourLife credits are the only payment system. If the app has its own paywall, checkout or subscription, turn each paid tier into a `money` option and remove the payment code.
- Apps run only when the visitor presses a button, and each press is one use. Anything hourly, daily, weekly, monthly, on a timer or auto-refresh becomes a button such as "Get output". The "Runs only when pressed" check flags what is left. Do not build scheduled runs: they need the visitor to agree after being told the credits for that frequency and period, and that is not available yet. If the developer wants them, list them as a charge option so the team can price them.

## 7. Checks, preview, submit

1. Call `dev_run_checks(app_id)`. Fix every `MUST FIX` in the source, rebuild, re-send and re-run until none remain. Mention each `LOOK` item to the developer; the admin sees them too.
2. Call `dev_get_preview_link(app_id)`. Give the developer the link to try the real app (they must be signed in to ezyourlife.com). It runs in the same sandbox as the store and uses no credits.
3. Call `dev_submit_for_review(app_id)` only after the developer says it works and agrees to send it.

## Updating a live app
When the developer fixes or changes features, edit the code, rebuild the single file and save it with the same `app_id`. That starts the next version; the live app keeps running unchanged. Put what changed in `release_notes`, refresh the promo text and screenshots if the app now looks or works differently, run the checks and ask before submitting. The team sees what changed and approves with one click; nothing else is needed for the update to go live. If the team asked for changes, `dev_get_status` shows their notes: fix them in the code and submit again.

## 8. Report back

Tell the developer, briefly:
- what was changed in the code and why
- which version was sent, and how
- the preview link
- that the EzYourLife team will review it, set the credits per use and their share, and approve it

For updates: the live version keeps running unchanged until the new version is approved.

## Rules that never bend

- No keys, tokens or passwords anywhere in the app, in commits, or in chat.
- Never call `dev_submit_for_review` without the developer's OK.
- Never claim an app is approved, live, priced or earning; only `dev_get_status` knows.
- Pricing and the developer's share are set only by the EzYourLife team. Never reveal running costs or the team's price reasoning.
- No payment code, timers or schedules in the app; credits per press are the only charge.
