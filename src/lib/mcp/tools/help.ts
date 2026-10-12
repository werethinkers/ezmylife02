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
- **list_tools(query?, limit?)** — browse the 240+ EZYOURLIFE AI app catalog.
- **get_tool_link(tool_id)** — get a direct URL to open a tool in the browser (for iframe/UI-only tools that can't run over MCP).
- **list_my_creations(limit?)** — recent items the user generated (images, videos, docs).
- **list_bulk_jobs(limit?)** — the user's bulk-processing jobs.
- **get_credit_balance()** — free + paid credit totals.
- **submit_tool_request(tool_description, name?, email?)** — request a new custom tool (24-48h turnaround).

## Not available over MCP
Startup Analyser and Video Generator are long-running (>60s) and would time out. Suggest the user run them at https://ezyourlife.com directly — use get_tool_link to hand them the URL.

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
