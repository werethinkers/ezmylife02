import { defineTool } from "@lovable.dev/mcp-js";

const GUIDE = `# EZYOURLIFE MCP — Available Tools

You are connected to EZYOURLIFE (https://ezyourlife.com) as a signed-in user. Every action runs as that user: RLS applies, credits deduct from their wallet, and results save to their account.

## Shortcuts (browser extension sync)
- **save_shortcut(key, value, category?, logic?)** — create/update a text-expansion shortcut. Auto-syncs to the user's browser extension and Speedy Notebook.
- **list_shortcuts()** — list all shortcuts.
- **delete_shortcut(key)** — remove a shortcut by key.

Example: user says *"save shortcut sig -> Best, Abhijay"* → call save_shortcut({ key: "sig", value: "Best, Abhijay" }).

## Speedy Notebook
- **append_notebook_entry(content, heading?)** — append a timestamped note to the user's notebook.

## Meet Nudge (networking CRM)
- **add_meet_nudge_contact(name, email?, phone?, occupation?, business_name?, location?, website?, linkedin_url?, fun_fact?, event_name?)** — save a person met at an event.
- **list_meet_nudge_contacts(query?, limit?)** — search/list saved contacts.

## PromptMaster (AI prompt engineering)
- **analyze_prompt(prompt, goal?)** — rewrites/improves a prompt using Gemini. Returns an optimized version with rationale.

## Catalog & user data
- **list_tools(query?, limit?)** — browse the 440+ EZYOURLIFE AI app catalog.
- **get_tool_link(tool_id)** — get a direct URL to open a tool in the browser (for iframe/UI-only tools that can't run over MCP).
- **list_my_creations(limit?)** — recent items the user generated (images, videos, docs).
- **list_bulk_jobs(limit?)** — the user's bulk-processing jobs.
- **get_credit_balance()** — free + paid credit totals.
- **submit_tool_request(tool_description, name?, email?)** — request a new custom tool (24-48h turnaround).

## Not available over MCP
Startup Analyser and Video Generator are long-running (>60s) and would time out. Suggest the user run them at https://ezyourlife.com directly — use get_tool_link to hand them the URL.

## Developers: publish your own web app
- **dev_get_standards()** — the rules (one HTML file, no AI calls, no keys), the steps and the valid categories. Call first.
- **dev_create_app(slug, name)** · **dev_save_app(app_id, html?, listing?)** · **dev_import_file(app_id, github|url)** for files up to 10 MB · **dev_get_upload_link(app_id)** for Claude Code · **dev_add_image(app_id, url|github|base64, caption?)** and **dev_remove_image(image_id)** for the app's screenshots · **dev_run_checks(app_id)** · **dev_get_preview_link(app_id)** · **dev_submit_for_review(app_id)** · **dev_get_status(app_id)** · **dev_list_my_apps()**
- Charging: ask the developer how they want to charge and pass every option in listing.charge_options (levels of use, or rupee prices for things they would sell). The team converts rupees to credits and sets each price.
- Free or 0 is only a request; the team prices every app from its real running cost and the developer is never told the cost. EzYourLife credits are the only payment system. Anything hourly, daily or monthly becomes a button the visitor presses.
- Every app needs its own promo page (listing.promo: headline, tagline, highlights, steps) and at least 1 real screenshot; ask the developer for pictures. It goes live at /promo/<name> when the team approves.
- To change a live app, save the new file with the same app_id: it becomes the next version, the live one keeps running, and the team approves the update with one click.
- The EzYourLife team approves on ezyourlife.com and sets the price and share; these tools cannot approve or publish.

## Tips
- Always call tools rather than guessing data. Shortcuts, contacts, and creations are per-user.
- If a tool needs credits, the user's wallet is charged automatically — surface the balance from get_credit_balance if they ask.
`;

export default defineTool({
  name: "help",
  title: "EZYOURLIFE help & tool guide",
  description:
    "Returns a full guide to every EZYOURLIFE MCP tool with example usage. Call this first if unsure what's available.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({ content: [{ type: "text", text: GUIDE }] }),
});
