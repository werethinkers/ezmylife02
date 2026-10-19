import { auth, defineMcp } from "@lovable.dev/mcp-js";
import help from "./tools/help";
import getCreditBalance from "./tools/get-credit-balance";
import listTools from "./tools/list-tools";
import getToolLink from "./tools/get-tool-link";
import listShortcuts from "./tools/list-shortcuts";
import saveShortcut from "./tools/save-shortcut";
import deleteShortcut from "./tools/delete-shortcut";
import addMeetNudgeContact from "./tools/add-meet-nudge-contact";
import listMeetNudgeContacts from "./tools/list-meet-nudge-contacts";
import appendNotebook from "./tools/append-notebook";
import analyzePrompt from "./tools/analyze-prompt";
import listMyCreations from "./tools/list-my-creations";
import listBulkJobs from "./tools/list-bulk-jobs";
import submitToolRequest from "./tools/submit-tool-request";
import { devTools } from "./tools/dev-apps";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ezyourlife-mcp",
  title: "EZYOURLIFE",
  version: "0.2.0",
  instructions: `EZYOURLIFE is a pay-as-you-go AI platform (https://ezyourlife.com) with 440+ live AI apps. You are connected as the signed-in EZYOURLIFE user; every tool call runs as that user, deducts from their credit wallet where applicable, and saves to their account.

**Start by calling \`help\` for the full tool guide with examples.**

Quick reference:
- Shortcuts (sync to their browser extension): save_shortcut, list_shortcuts, delete_shortcut
- Notes: append_notebook_entry
- Networking CRM: add_meet_nudge_contact, list_meet_nudge_contacts
- Prompt engineering: analyze_prompt (uses Gemini via PromptMaster, charges credits)
- Catalog & their data: list_tools, get_tool_link, list_my_creations, list_bulk_jobs, get_credit_balance
- Meta: submit_tool_request (ask the team to build a new tool)
- Developers publishing their own web app to the store: dev_get_standards first, then dev_create_app, dev_save_app (small) or dev_import_file / dev_get_upload_link (big, up to 10 MB), dev_run_checks, dev_get_preview_link, dev_submit_for_review, dev_get_status

For long-running tools like Startup Analyser or Video Generator that can't run over MCP, use \`get_tool_link\` and send the user to open it on ezyourlife.com.`,
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    help,
    getCreditBalance,
    listTools,
    getToolLink,
    listShortcuts,
    saveShortcut,
    deleteShortcut,
    appendNotebook,
    addMeetNudgeContact,
    listMeetNudgeContacts,
    analyzePrompt,
    listMyCreations,
    listBulkJobs,
    submitToolRequest,
    ...devTools,
  ],
});
