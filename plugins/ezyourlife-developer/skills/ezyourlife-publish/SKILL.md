---
name: ezyourlife-publish
description: Converts any app (a Google AI Studio export, a React, Vue, Svelte or other multi-file project, or an app built inside Claude) into an EzYourLife app the way the store's existing apps were made, checks for similar apps, tests it, and sends it to the EzYourLife store for admin approval, using the EzYourLife connector. Use when someone says "put my app on EzYourLife", "publish this to EzYourLife", "make this live on EzYourLife", "make this work on EzYourLife", "send this app for EzYourLife review", "build me this app on EzYourLife", "publish this app on that", "update my EzYourLife app", or shares a project, zip or export meant for the EzYourLife store.
---

# Publish an app to EzYourLife

**Do the whole job yourself.** One sentence from the developer ("build me this app over ezyourlife", "publish this on that") is the whole request. Do step 0, then call `dev_next_step(app_id)` after every change: it runs the checks and names the single next action, and lists the few things only the developer can answer. Do what it says and call it again, until it says the app is with the team. Ask the developer only for those listed items (how theirs differs from a similar app, how they want to charge, a support email, screenshots you cannot take, and OK to submit). The preview must really work, including the AI part, before you offer to submit: an app with AI cannot pass the checks until you have run it once with a realistic example (`dev_test_run`) and read the answer.

**Price is not yours or the developer's.** EzYourLife measures what the AI part costs and shows a suggested price to the admin only. Never state, estimate or hint at a price or cost; say the team sets it from the measured cost.

Turn the developer's app, in whatever form it arrives, into an EzYourLife app: either an **AI app** (a definition that runs on EzYourLife's own screens and AI, charged in credits) or a **file app** (a whole built browser project: its build folder with index.html and every file it uses). Send it with the `ezyourlife` connector, test it, get the server checks to pass, show the developer how it will look on the site, and send it for review. An EzYourLife admin then tries it, sets the price and the developer's share, and approves it. Never tell anyone the app is live until `dev_get_status` says so.

## 0. Before starting

- Confirm the connector works: call `dev_get_standards`. Its rules and conversion playbook are served live and are newer than this skill and anything remembered; where they differ, follow them. It also returns the valid store categories. If the tools are missing or say "not signed in", ask the developer to connect the EzYourLife connector and sign in with their EzYourLife account, then stop.
- Call `dev_list_my_apps`. If this is an update to an existing app, use that `app_id`; never create a duplicate app.
- **Check for similar apps before converting anything.** Call `dev_check_similar(name, short_description)`. If it finds apps, tell the developer which ones and ask: "Does yours do something different? How, in a sentence or two?" Pass their answer, in their words, as `listing.similar_note`. The team reads that note next to the similar apps and decides; the checks will not let the app be sent without it. If it really does the same job and they cannot say how it differs, tell them honestly and let them decide whether to continue.

## 1. Read the project, then choose the lane

Work out: where the app came from, framework and build tool, entry point, every network call, every AI call (grep `generateContent`, `chats.create`, `chat.completions`, `messages.create`, `responseSchema`, `systemInstruction`, `window.claude.complete`), every secret, login, wallet or payment, and what the user fills in and gets back. Read the README for what the app does.

| What the app's value is | Lane | Tools |
|---|---|---|
| An AI model: a form that writes a result, a chat assistant, photos or scanned pages read into text | **AI app** | `dev_save_ai_app`, `dev_test_run` |
| An app with its own screens that matter (cards, tables, charts, a designed flow) and AI inside, typically an AI Studio export with a real UI | **File app + AI step** | upload like a file app, then `dev_save_ai_step`, `dev_test_run`; see `references/ai-step.md` |
| Browser logic with no AI: calculators, converters, planners, editors, dashboards, games, visual tools | **File app** | `dev_import_project` or `dev_get_upload_link` (the build folder), `dev_save_app` (listing) |

If the result is plain written text in a standard form, chat or photo reader, use the AI lane. If the developer's own screens are the product and the AI is a step inside it, use the file lane with an AI step (never drop the AI to fit a lane). Never call an AI provider from the page. Tell the developer which lane and why, in one sentence.

Stop and explain plainly, without changing anything, if the app cannot work without its own server or database that is not just serving an AI call, or chained model calls that cannot fold into one prompt. Those cannot be published yet.

### Whatever form it arrives in

| Arrives as | What it is | How to read it |
|---|---|---|
| Google AI Studio export, or an Express/Node app calling Gemini, OpenAI or Claude, often with its own wallet, credits, free trial or Razorpay | File app + AI step when its UI matters, else AI app | Read `references/ai-step.md` for the first, below for the second. Each AI call is an app (or a tier). The prompt becomes `ai.system` and `ai.task`; the UI form becomes `fields`; JSON the UI drew becomes Markdown sections. Delete the server, keys, wallet, credits, free trials, payments, login and stored history. |
| React, Vue, Svelte or other multi-file project that runs in the browser | File app; an AI part becomes an AI step (or an AI app if the screens add nothing) | Adapt, run its normal build, send the build folder (usually `dist/`). |
| Plain HTML, CSS and JS in several files | File app (AI app if it calls an LLM directly) | Send the folder as it is, with `index.html` at its top. Do not merge the files. |
| Claude artifact (HTML or React) | File app, or AI app if it calls `window.claude.complete` or any AI | Put it in a small Vite project and build it; replace `window.storage`/`localStorage` with try/catch plus memory. If it calls Claude, the prompt it sends becomes `ai.system`/`ai.task`. |
| A prompt, skill or workflow that lives in a chat or Claude Project | AI app | The instructions that worked become `ai.system`/`ai.task`; what the person gives each time becomes the fields (doc) or the chat. Ask them to run one real example; use it as `sample`. |
| A Claude Code or Cowork project | Read the files, then one of the rows above | |
| Python, Streamlit, Flask, Next.js with a server, a CLI | Extract the AI prompts into an AI app; pure calculation can be rewritten as a browser project (file app) if the developer agrees | If it needs its own server or database, stop. |

Things with no place on EzYourLife (say so, and list what you removed): the developer's own server, database, login, wallet, credits, free trials, coupons and payments; API keys; scheduled or background runs; chained model calls; web search or URL fetching by the AI; image, audio or video generation; docx/xlsx/csv upload into a doc app (the visitor pastes text, or the vision screen takes photos and PDF pages). If the original sold tiers, they become `listing.charge_options`; the runtime cannot charge by option, so separate tiers go in separate apps, or one price applies to every use. Tell the developer which.

## 2. AI app: write the definition

Follow `references/ai-apps.md` (field types, the three screens, how to write `ai.system` and `ai.task`, worked examples). Then:

1. `dev_create_app(slug, name)` once. The slug becomes `ezyourlife.com/tool/dev-<slug>` and cannot change, so propose a short, clear one and confirm it.
2. `dev_save_ai_app(app_id, spec, listing)`. If the definition is wrong, the answer says exactly what to fix.
3. `dev_test_run(app_id, inputs)` with the `sample` or a real example (chat: `messages`; vision: small `images`). Read the answer as a visitor would. If it is wrong, generic, invents facts or is in the wrong format, improve `ai.system`/`ai.task`, save and run again. Test runs are free, limited to 25 a day, and the team reads them. At least one successful run of the exact saved version is required before the app can be sent.
4. Go to step 3 (listing, promo, screenshots, charging), then step 4.

## 2c. File app with an AI step

Follow `references/ai-step.md`: move the prompt from the server to `dev_save_ai_step`, change the page to call `window.ezyourlife.ai(inputs)` with its own fallback, delete the server and keys, build, upload (step 2b), `dev_save_ai_step`, then `dev_test_run` with the app's own sample until the result is right. The visitor pays per AI result only; opening the app is free.

## 2b. File app: adapt the code (instead of step 2)

Follow `references/adaptation.md` step by step. In short:

1. Remove every API key, token, password and secret.
2. Remove or replace AI calls, logins and payments.
3. Wrap all localStorage, sessionStorage, IndexedDB and cookie use in try/catch with an in-memory fallback.
4. Switch History-API routing to hash routing.
5. Remove anything that reaches the page around the app (`window.top`, `parent.location`).
6. Add the viewport tag and make the layout work at 375 px wide.

Keep the developer's features, look and wording otherwise. Make the smallest changes that satisfy the rules, and list every change for the developer at the end.

### Build the project
Run the project's normal build (`npm run build` or the README's command; `npm install --legacy-peer-deps` first if peer dependencies conflict) with default settings. Vite's base must stay `/`; do not add single-file plugins or merge files by hand. The result is a build folder (usually `dist/`) with `index.html` at its top. EzYourLife takes whole projects only: a folder that holds nothing but one HTML file is refused. EzYourLife packs the folder for its sandbox itself (scripts, JavaScript modules and code-split pages, styles, pictures, fonts and data files the code fetches). Up to 600 files and 30 MB in the folder, 10 MB once packed.

Before sending, check the build yourself:
- Run `grep -rnE "sk-|AIza|api\.openai|api\.anthropic|generativelanguage|checkout\.razorpay|js\.stripe" <build-folder>`. It must find nothing.
- Serve the folder (`npx vite preview` or any static server) if a browser is available and click through the main flow once.

### Create, then send the project
New app: `dev_create_app(slug, name)` (confirm the slug first). Pick the route by what this workspace can reach:

| Situation | Route |
|---|---|
| Workspace can push to GitHub (claude.ai, Cowork, most Claude Code setups) | Commit the build folder to a GitHub repo (the developer's repo, a branch such as `ezyourlife-build`, folder like `dist`), push, then `dev_import_project(app_id, github: {repo, dir: "dist", ref: <commit SHA>})` |
| Claude Code on a computer, or a private project EzYourLife cannot read | `dev_get_upload_link(app_id, folder)`, save the returned script as `ezyourlife-upload.mjs` (also in `scripts/`), run the command it gives on the build folder |
| Cloud workspace that cannot reach EzYourLife or GitHub (uploads fail on the network) | Zip the build folder (`cd dist && zip -r ../app.zip .`), send the zip to the developer, and tell them: open the app's page (the editor link from `dev_get_preview_link`), choose "Upload a built app", drop the zip. Then `dev_next_step` continues. |

Use the commit SHA, not a branch name, so the version on EzYourLife is exactly what was tested. The answer lists any file the app names that is not in the folder, and anything else to fix: fix it, rebuild and send again. If GitHub import says the repo is private and EzYourLife can't read it, use the upload link from a computer, or the EzYourLife team can add a read token on their side.

## 3. Fill the store listing

Call `dev_save_ai_app(app_id, listing)` (AI apps) or `dev_save_app(app_id, listing)` (file apps) with:
- `name` (3 to 60 characters)
- `short_description` (20 to 160 characters: what the user gets, in plain words)
- `description` (at least 40 characters: what you give, what you get, who it is for)
- `category` (exactly one from `dev_get_standards`)
- `tool_types` (up to 5)
- `support_email`
- `release_notes` for updates
- `similar_note` when similar apps were found (the developer's words on how theirs is different)

Draft these from the code and README. Ask the developer only for what cannot be found, in one short question.

### The app's own page and screenshots (required)
Every app gets a page at ezyourlife.com/promo/<name>, built from what you send and shown to the team at review. Put it in `listing.promo`: `headline` (10 to 80 characters), `tagline` (one sentence), `audience`, 3 to 6 `highlights` and 2 to 5 `steps` (each `{title, body}`), and a few `faq` items if useful. Write only what the app really does: no ratings, reviews, customer quotes, user counts or claims you cannot back up.
Then ask the developer: "Please share 3 or more screenshots: the start screen, the app in use, and what it produces." Add each with `dev_add_image` (a public https link, a public GitHub file, or base64 under 400 KB). Pictures that came with the developer's project are fine if they truly show the screen and result of this app. For an AI app the screens are EzYourLife's own: after the test run, ask the developer to open the preview link, try the example and share 3 screenshots. If you can run the app and take screenshots yourself, do that. Never invent or mock pictures. The checks need the promo text and at least 1 screenshot.

### Charging
Ask once: "How do you want to charge: different levels of use, or something you would sell for rupees?" Pass every answer (up to 6) in `listing.charge_options`, each `{label, kind: "per_use" | "money", inr?, note?}`. Do not convert rupees to credits and do not suggest credit amounts.
- If they say free or 0, record that as their wish only. The team prices every app from its real running cost, in the background. Never tell the developer what an app costs to run, never quote credits or margins, and never promise it will be free.
- EzYourLife credits are the only payment system. If the app has its own paywall, checkout or subscription, turn each paid tier into a `money` option and remove the payment code.
- Apps run only when the visitor presses a button, and each press is one use. Anything hourly, daily, weekly, monthly, on a timer or auto-refresh becomes a button such as "Get output". The "Runs only when pressed" check flags what is left. Do not build scheduled runs: they need the visitor to agree after being told the credits for that frequency and period, and that is not available yet. If the developer wants them, list them as a charge option so the team can price them.

## 4. Checks, preview, submit

1. Call `dev_run_checks(app_id)`. Fix every `MUST FIX` (in the source and rebuild for a file app; in the definition for an AI app), re-send and re-run until none remain. Similar apps without a `similar_note` are a `MUST FIX`; with one they are a `LOOK` that the admin reads. Mention each `LOOK` item to the developer; the admin sees them too.
2. Call `dev_get_preview_link(app_id)`. Give the developer the link: it shows the real app as it will look on the site, on a phone-sized or desktop-sized screen, and they can test it (they must be signed in to ezyourlife.com). It uses no credits; the AI part works there for real, with a limited number of free test runs a day.
3. Call `dev_submit_for_review(app_id)` only after the developer says it works and agrees to send it.

## Updating a live app
When the developer fixes or changes features, edit the code, rebuild and send the build folder again (file app) or update the definition (AI app), with the same `app_id`. An app keeps its kind: a live AI app cannot be replaced by a file or the reverse; create a new app for that. That starts the next version; the live app keeps running unchanged. Put what changed in `release_notes`, refresh the promo text and screenshots if the app now looks or works differently, run the checks and ask before submitting. The team sees what changed and approves with one click; nothing else is needed for the update to go live. If the team asked for changes, `dev_get_status` shows their notes: fix them in the code and submit again.

## 5. Report back

Tell the developer, briefly:
- which lane (AI app or file app) and why
- what was removed or changed in the original and why (server, keys, wallet, payments, storage, routing, layout)
- anything that now behaves differently, and any feature that could not come along
- whether similar apps were found and what note was passed to the team
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
- Never hide a similar app from the developer, and never write the `similar_note` yourself: it is the developer's own answer.
