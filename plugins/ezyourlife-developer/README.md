# EzYourLife Developer

Lets any of your Claudes put an app on the EzYourLife store, whatever form it is in: a Google AI Studio export, a React, Vue, Svelte or other multi-file project, or an app you built inside Claude. Say "put my app on EzYourLife" (or "make this live on EzYourLife"). Claude:

1. Checks the store for **similar apps** first. If there are some, it tells you and asks how yours is different; your answer goes to the team with your app.
2. Converts the app to EzYourLife's rules, the way the store's existing apps were made:
   - **AI apps** (a form that writes a result, a chat assistant, photos read into text): Claude sends a definition (screen, fields, AI instructions) that runs on EzYourLife's own screens and AI, charged in credits. Your own server, keys, wallet and payments are removed.
   - **File apps** (calculators, converters, editors, tools with no AI): Claude adapts your project (no keys, no own login or payments, storage that survives the sandbox, hash routing, fits phones), builds it and sends the whole build folder. EzYourLife packs it for its sandbox; you never squeeze an app into one file.
3. Sends it to your EzYourLife app (the build folder through GitHub, or a one-time upload link from your computer).
4. Test-runs an AI app on the real AI, fills in the store listing, the app's own promo page and screenshots, and runs EzYourLife's server checks until they pass.
5. Gives you a preview link that shows the real app as it will look on the site, on a phone-sized or desktop-sized screen, and sends it for review only when you say so.

An EzYourLife admin then tries the app, sets the credits per use and your share, and approves it. Nothing goes live without that approval. A live app is never replaced silently: changes go in as a new version that also needs approval.

## What's inside

| Part | What it does |
|---|---|
| `ezyourlife` connector | EzYourLife's own MCP server (sign in with your EzYourLife account). Tools: `dev_get_standards`, `dev_next_step`, `dev_list_my_apps`, `dev_check_similar`, `dev_create_app`, `dev_save_ai_app`, `dev_save_ai_step`, `dev_test_run`, `dev_import_project`, `dev_get_upload_link`, `dev_save_app`, `dev_add_image`, `dev_remove_image`, `dev_run_checks`, `dev_get_preview_link`, `dev_submit_for_review`, `dev_get_status` |
| `ezyourlife-publish` skill | The step-by-step workflow, how to convert each kind of app, the AI app definition guide (`references/ai-apps.md`), and the file-app adaptation checklist |
| `scripts/ezyourlife-upload.mjs` | Packs a local build folder and sends it with a one-time upload key (no dependencies) |

## Setup

- **Claude Code (with access to the EzYourLife repo):** `/plugin install ezyourlife-developer --marketplace werethinkers/ezmylife02`
- **Each Claude account:** add this plugin. Plugins need a paid plan; on Team and Enterprise an owner can publish it to the organization library once.
- **Connector only (any plan, including Free):** in Claude's connector settings, add a custom connector named EzYourLife with the URL `https://vrsadzjyugbusfazdgyi.supabase.co/functions/v1/mcp`. You get the tools without the skill; `dev_get_standards` carries the rules.
- **First use:** Claude asks you to sign in to EzYourLife. Use the account that should own the apps.
- **Private GitHub repos:** the EzYourLife server needs a read-only GitHub token to import from them. An EzYourLife admin sets it as the `EZYL_GITHUB_TOKEN` secret. Without it, use a public repo or the upload link.
