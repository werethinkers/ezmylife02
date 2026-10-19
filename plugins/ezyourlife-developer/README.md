# EzYourLife Developer

Lets any of your Claudes put a web app on the EzYourLife store. Give Claude a project, a zip or a big HTML file and say "put my app on EzYourLife". Claude:

1. Adapts the code to EzYourLife's rules: no keys, no AI calls, no own login or payments, storage that survives the sandbox, hash routing, fits phones.
2. Builds it into one HTML file, up to 10 MB.
3. Sends it to your EzYourLife app:
   - small files go directly
   - big files go through GitHub (works from claude.ai, Cowork and Claude Code)
   - or through a one-time upload link (Claude Code on a computer)
4. Fills in the store listing and runs EzYourLife's server checks until they pass.
5. Gives you a live preview link, and sends the app for review only when you say so.

An EzYourLife admin then tries the app, sets the credits per use and your share, and approves it. Nothing goes live without that approval. A live app is never replaced silently: changes go in as a new version that also needs approval.

## What's inside

| Part | What it does |
|---|---|
| `ezyourlife` connector | EzYourLife's own MCP server (sign in with your EzYourLife account). Tools: `dev_get_standards`, `dev_create_app`, `dev_list_my_apps`, `dev_save_app`, `dev_import_file`, `dev_get_upload_link`, `dev_run_checks`, `dev_get_preview_link`, `dev_submit_for_review`, `dev_get_status` |
| `ezyourlife-publish` skill | The step-by-step workflow, the adaptation checklist and the single-file build recipes |
| `scripts/inline-html.mjs` | Turns any built app folder into one HTML file (no dependencies) |
| `scripts/ezyourlife-upload.mjs` | Sends a local file with a one-time upload key (no dependencies) |

## Setup

- **Claude Code (with access to the EzYourLife repo):** `/plugin install ezyourlife-developer --marketplace werethinkers/ezmylife02`
- **Each Claude account:** add this plugin. Plugins need a paid plan; on Team and Enterprise an owner can publish it to the organization library once.
- **Connector only (any plan, including Free):** in Claude's connector settings, add a custom connector named EzYourLife with the URL `https://vrsadzjyugbusfazdgyi.supabase.co/functions/v1/mcp`. You get the tools without the skill; `dev_get_standards` carries the rules.
- **First use:** Claude asks you to sign in to EzYourLife. Use the account that should own the apps.
- **Private GitHub repos:** the EzYourLife server needs a read-only GitHub token to import from them. An EzYourLife admin sets it as the `EZYL_GITHUB_TOKEN` secret. Without it, use a public repo or the upload link.
