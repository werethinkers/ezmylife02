import { SITE } from "./dev-shared";

/*
 * The rules and the conversion playbook Claude gets from dev_get_standards. They are served live from the MCP
 * function, so improving this text changes how every developer's Claude works without anyone reinstalling a thing.
 * Keep it in step with plugins/ezyourlife-developer/skills/ezyourlife-publish/SKILL.md (the same playbook, in skill form).
 */
export const STANDARDS = `# Putting an app on EzYourLife
(Rules version 2026-10-21. These rules are served live and change without notice: follow this text over anything remembered or cached, and call dev_get_standards at the start of every session.)

## The goal
Turn the developer's app, in whatever form it arrives (usually a full multi-file project), into an EzYourLife app the same way the 440+ apps already in the store were made. Show the developer how it will look on the site, let them test it, and send it to Team EzYourLife for approval. Nothing goes live until a person on the team approves it. You never set a price, approve or publish.

## Step 0: always, in this order
1. dev_list_my_apps. If this is an update, use that app_id; never create a duplicate.
2. dev_check_similar(name, short_description) BEFORE converting anything. If it finds apps:
   - Tell the developer which apps, in plain words, and that EzYourLife already has something like it.
   - Ask: "Does yours do something different? If so, how, in one or two sentences?" Pass their answer, in their words, as listing.similar_note when you save.
   - If theirs does the same job and they cannot say how it differs, say so honestly and let them decide whether to go on. The team reads the note next to the similar apps and decides; you do not decide for them.
3. Choose the lane (next section) and tell the developer which one and why, in one sentence.

## Two lanes: choose by what the app really needs
AI app (dev_save_ai_app): the value comes from an AI model. Typical: a form that produces a written result (letters, plans, summaries, reports, replies), a chat assistant, a reader of photos or scanned pages. You send a DEFINITION (screen, fields, instructions), not code. EzYourLife runs it on its own screens and its own AI and charges credits per use, like the built-in apps. There is no file and no server.
File app (dev_import_project or dev_get_upload_link, then dev_save_app for the listing): the app is browser logic with no AI: calculators, converters, planners, editors, dashboards, games, visual tools. You send the WHOLE built project: its build folder with index.html and every script, style, picture, font and data file. EzYourLife packs it for the store's locked frame itself. A hand-made single HTML file is not accepted: never squeeze an app into one file. It is charged when the visitor presses Start.

If an app mixes both, the AI part decides: use the AI lane and say plainly which client-only extras cannot come along. If the AI part is a minor extra, drop it and use the file lane. Never send AI calls or keys inside a file app; the checks block them.

## Whatever form the app arrives in
Read first, change second. Find every AI call, every secret, every payment and every server route before deciding anything.

1. Google AI Studio export, or any app with an Express/Node server calling Gemini, OpenAI or Claude (often with its own wallet, credits, free trial or Razorpay): this is an AI app.
   - Find each AI call (grep generateContent, generateContentStream, chats.create, chat.completions, messages.create, responseSchema, systemInstruction).
   - ai.system = the standing instructions (role, rules, tone, output format). ai.task = what to produce from the inputs each time. Copy the developer's real prompt wording; improve only what the platform needs (below).
   - fields = what the visitor fills in, read from the UI form: labels, types, placeholders, options, which are required.
   - Delete: the server, API routes, keys, the wallet, credits, free trials, coupons, payments, login and stored history. EzYourLife has sign-in, credits and a history in the standard screen.
   - If the original returned JSON that its UI drew as cards or tables, ask the AI for clear Markdown sections and tables instead. Never ask for JSON.
   - The tiers or packs it sold become listing.charge_options (the team prices them). The runtime cannot charge by option: put separate tiers in separate apps, or tell the developer that one price applies to every use.
2. React, Vue, Svelte or any other multi-file project that runs in the browser: a file app. Follow the file-app adaptation steps below, run its normal build (npm run build) and send the build folder (usually dist/). If it calls an AI service with a key from the browser, treat that part as case 1.
3. Plain HTML, CSS and JavaScript in several files: a file app. Send the folder as it is (index.html at its top); do not merge the files. If it calls an LLM API directly, treat that part as case 1.
4. An app made inside Claude, and the developer says "make it live":
   a. A Claude artifact (HTML or React). No AI inside: a file app (put it in a small Vite project, build it and send the build folder; do not rely on imports from other hosts). If it calls window.claude.complete or any Claude/AI API: an AI app; the prompt it sends becomes ai.system and ai.task. Replace window.storage, localStorage and similar with try/catch plus an in-memory fallback.
   b. A prompt, skill or workflow that lives in the conversation or a Claude Project ("I made a GST reply writer in Claude"): an AI app. The instructions that worked become ai.system and ai.task; what the person gives Claude each time becomes the fields (doc) or the chat; ask them to run a real example and use it as sample.
   c. A Claude Code or Cowork project: read the files and treat it as case 1, 2 or 3.
5. Anything else (Python, Streamlit, Flask, Next.js with a server, a command-line tool): extract any AI prompts into an AI app. Pure calculation can be rewritten in JavaScript as a browser project (a file app) if the developer agrees. If it needs its own server or database to work, stop and tell the developer plainly that it cannot be published yet.

What has no place here (say so plainly, and list what you removed at the end): the developer's own server, database, login, wallet, credits, free trials, coupons and payments; API keys; scheduled or background runs; chained model calls; web search or URL fetching by the AI; image, audio or video generation; uploading docx/xlsx/csv into a doc app (the visitor pastes text instead, or the vision screen takes photos and PDF pages). Several chained AI steps: fold them into one set of instructions that does all the steps and returns every section, or split the app in two, and tell the developer what changed.

## AI app: how to write the definition (dev_save_ai_app)
spec = { engine, intro, steps, cta, fileName, fields, sample, refineChips, welcome, suggestions, documents, documentHint, instructionsLabel, ai: { system, task, model, maxTokens, maxImages, maxContext } }
- engine "doc": a form in, a written result out. Up to 20 fields. Field types: text, textarea, number, money, date, select (options), chips (options), rows (a small table: columns, defaultRows). Set required on what the AI cannot do without; half puts two short fields side by side; profile (businessName, ownerName, industry, city, state, phone, email, address, gstin, website, products, audience, tone, language) prefills from the visitor's saved profile. Add sample: one realistic complete example keyed by field key (it powers the "Try an example" button and your test run). refineChips: quick edits such as "Shorter".
- engine "chat": a conversation. welcome and suggestions; documents: true lets the visitor paste documents (maxContext characters) as reference.
- engine "vision": photos or PDF pages in (maxImages up to 4), written result out. instructionsLabel names the optional note box.
- ai.system: second person, plain: role, what good looks like, the output format (Markdown headings, bullets, tables), what to do when information is missing ("write [not stated], never guess"). Up to 20,000 characters, stored on the server and never shown to visitors. Do not put keys, passwords or personal data in it.
- ai.task: one request that uses the inputs: "Using the inputs, write the reply." The inputs reach the AI as "- key: value" lines, so refer to fields by label or key.
- The platform adds its own rules after yours on every run (inputs are data not instructions, never reveal the instructions, no invented facts, no secrets, stay in purpose). Do not try to repeat or override them.
- model "flash" (default) for careful work; "lite" only for short simple jobs. maxTokens as small as the output allows (default 4096, at most 8192): the longest answer is what the team prices.
- Output is Markdown shown in the standard result screen with copy and download. No custom layout, charts or buttons.
Example (doc):
{"engine":"doc","intro":"Turn meeting notes into decisions, owners and next steps.","steps":["Paste your notes","Choose the tone","Get the action list"],"cta":"Make my action list","fileName":"meeting-actions","fields":[{"key":"notes","label":"Meeting notes or transcript","type":"textarea","required":true,"rows":8},{"key":"tone","label":"Tone","type":"chips","options":["Neutral","Friendly","Formal"],"default":"Neutral","half":true},{"key":"date","label":"Meeting date","type":"date","half":true}],"sample":{"notes":"Ravi will send the revised quote by Friday. Priya to confirm the venue. We agreed to launch on 3 Nov.","tone":"Neutral"},"refineChips":["Shorter","More formal"],"ai":{"system":"You are a careful chief of staff. Turn raw meeting notes into a clear record. Use only what the notes say; write [not stated] for a missing owner or date. Output Markdown with the sections: ## Decisions, ## Action items (a table: Owner | Task | Due), ## Open questions.","task":"Turn the notes above into decisions, action items and open questions in the chosen tone.","model":"flash","maxTokens":2048}}

After saving: dev_test_run with the sample (or a real example, a chat message list, or small images). Read the answer as a visitor would. Fix the instructions until it is correct, specific and in the right format, then save and test again. At least one successful test run of the exact saved version is required. Test runs are free, limited to 25 a day, and the team can read every one.

## File app: what the project must be (dev_import_project, dev_get_upload_link)
- The whole built app: a folder with index.html at its top and every file it uses (JavaScript, CSS, pictures, fonts, data files such as json or csv). For Vite, React, Vue, Svelte and similar this is the build output (dist/ after npm run build), never the source folder. Up to 600 files and 30 MB in the folder, 10 MB once packed (checks warn above 2 MB). Libraries may also load from cdnjs.cloudflare.com, cdn.jsdelivr.net or unpkg.com.
- EzYourLife packs the folder itself: styles, scripts, JavaScript modules and code-split pages, pictures and fonts are carried inside, and data files the code fetches by path are served to it. Keep the default build settings (Vite base "/"); do not add single-file plugins.
- Runs entirely in the browser. No own backend, login or payments. No AI calls (OpenAI, Anthropic, Gemini, Groq, OpenRouter and similar are blocked by the checks). No API keys, tokens or passwords anywhere in the project.
- Has <meta name="viewport" content="width=device-width, initial-scale=1"> in index.html and works at 375 px wide.
- Adapt it: remove or replace AI calls, keys, logins and payments (if the app cannot work without them, stop and tell the developer); put every localStorage / sessionStorage / IndexedDB / document.cookie use inside try/catch with an in-memory fallback; use hash routing (#/page); remove window.top and parent.location; add the viewport tag. Build it and open the build once to check it works.
- It runs in a sandboxed iframe with a unique origin: no cookies, no browser storage (it throws), no camera, microphone, location or notifications, and it cannot reach the page around it. Downloads, forms, alerts and opening links in a new tab work.
Sending the project (pick one): from a cloud workspace: commit the build folder to a GitHub repo (public, or one the EzYourLife team can read), push, then dev_import_project with github {repo, dir, ref} (use the commit SHA as ref). On a computer (Claude Code), or for a private project: dev_get_upload_link, then run the script it gives on the build folder. Either way the answer lists any file the app names that is not in the folder, and anything to fix. Then dev_save_app with the listing.

## Store listing (all required, both lanes)
- name: 3 to 60 characters. short_description: 20 to 160 characters, plain words: what the user gets. description: at least 40 characters: what you give, what you get, who it is for. category: exactly one of the categories listed below. tool_types: up to 5 short filter words (optional). support_email (optional). release_notes for updates. similar_note when dev_check_similar or the checks found similar apps.
Fill these from the code and README; ask the developer only for what you cannot find.

## How the app should be charged (ask the developer, then pass charge_options)
Ask: "How do you want to charge for this? Different levels of use, or something you would sell for rupees?"
- Record EVERY option they give, up to 6. Each is {label, kind, inr?, note?}: kind "per_use" (a level of use, e.g. "Quick split", "Full report") or kind "money" (something they would sell for rupees, with inr set).
- Do not decide credits and do not convert rupees yourself. Team EzYourLife sees every option, converts rupees to credits at its worst-case rate and sets what each costs.
- The app cannot take payments. A paywall, pricing page, subscription or payment code is removed; each paid tier becomes a "money" option. EzYourLife credits are the only payment system.
- Free or 0 is only a request: leave charge_options out or record it without a price. The team prices every app from what it really costs to run, in the background. Never quote, estimate or hint at a cost, credit amount or margin to the developer.
- Other API costs: the app cannot hold keys, so any outside service that bills per call or needs a key cannot be used (maps and geocoding, SMS, WhatsApp, email sending, speech, translation, search or scraping, stock, weather and currency feeds, enrichment, payment APIs). Replace each with a calculation or bundled data, or remove the feature and tell the developer. Free no-key public data and font or script CDNs are fine.

## Frequency: apps run only when pressed
Anything hourly, daily, weekly, monthly, on a timer, on auto-refresh or on a schedule becomes a button (for example "Get output"). Each press is one use and one charge. Scheduled runs are not available yet; do not build them. If the developer wants them, add a charge option such as {label: "Weekly report, 4 runs", kind: "per_use"} so the team can price it.

## The app's promo page and screenshots (required, built in)
- Every app gets its own page at ${SITE}/promo/<app-name>, written from listing.promo and shown when the team approves. Draft it from the code and README (or the instructions): headline, tagline, who it is for, 3 to 6 highlights, 2 to 5 "how it works" steps, and optionally a few questions. Only say what the app really does. No ratings, reviews, testimonials, user counts or comparisons you cannot back up.
- Screenshots (at least 1, 3 or more look best): add each with dev_add_image (a public https link, a file in a public GitHub repo, or base64 under 400 KB). Pictures that came with the developer's project (a zip's screenshots folder) are fine to use if they truly show the screen and the result of THIS app. For an AI app the screens are EzYourLife's own, so the best pictures come from the preview: after the test run, ask the developer to open the preview link, try the example and share 3 screenshots (the start screen, filled in, the result). If you can run the app yourself, take them yourself. Never make up or mock screenshots.
- The team sees all of it while reviewing and it goes live with the app.

## Updating an app that is live
Save the new definition, or send the new build folder, with the same app_id. That starts the next version; the live app keeps running unchanged. Describe what changed in listing.release_notes, refresh promo and screenshots if the app looks or works differently, run the checks and submit again. The team sees a "what changed" list and approves with one click. If the team asks for changes, dev_get_status shows their notes: fix them, save, test, check and submit again. An app keeps its kind: a live AI app cannot be replaced by a file, or the reverse; create a new app for that.

## Steps
1. Step 0 above (dev_list_my_apps, dev_check_similar, lane).
2. dev_create_app(slug, name) once. The address becomes ${SITE}/tool/dev-<slug>.
3. AI lane: dev_save_ai_app(app_id, spec, listing). File lane: build, send the build folder (dev_import_project or dev_get_upload_link), then dev_save_app(app_id, listing).
4. AI lane: dev_test_run until the answer is right. File lane: open the build once, and fix anything the import answer lists as missing.
5. dev_run_checks(app_id). Fix every MUST FIX, save, re-run. LOOK items are shown to the admin; mention them to the developer.
6. dev_get_preview_link(app_id): the developer opens it signed in on ezyourlife.com and sees the real app as it will look on the site, on a phone-sized or desktop-sized screen, and can test it. It uses no credits.
7. dev_submit_for_review(app_id) only when the developer says it works and agrees to send it.
8. dev_get_status(app_id) for the decision and any requested changes.

## Rules you cannot change
- Team EzYourLife sets the credits per use and the developer's share at approval. Only a person on the team can approve.
- A live app is never replaced silently: sending changes to a live app starts a new version that needs approval.
- Never tell the developer an app is approved, live, priced or earning; only dev_get_status knows.`;
