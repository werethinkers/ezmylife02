import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getCreditBalance from "./tools/get-credit-balance";
import listTools from "./tools/list-tools";
import listShortcuts from "./tools/list-shortcuts";
import saveShortcut from "./tools/save-shortcut";
import deleteShortcut from "./tools/delete-shortcut";
import addMeetNudgeContact from "./tools/add-meet-nudge-contact";
import listMeetNudgeContacts from "./tools/list-meet-nudge-contacts";
import appendNotebook from "./tools/append-notebook";

// The OAuth issuer MUST be the direct Supabase host, not the .lovable.cloud proxy.
// Build it from the project ref (inlined by Vite at build time) so the entry stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ezyourlife-mcp",
  title: "EZYOURLIFE",
  version: "0.1.0",
  instructions:
    "EZYOURLIFE tools for the signed-in user. Use `save_shortcut`, `list_shortcuts`, and `delete_shortcut` to manage text-expansion shortcuts that sync to their browser extension. Use `append_notebook_entry` to add notes to Speedy Notebook. Use `add_meet_nudge_contact` / `list_meet_nudge_contacts` for their networking CRM. Use `list_tools` to browse the AI app catalog and `get_credit_balance` to check their wallet.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getCreditBalance,
    listTools,
    listShortcuts,
    saveShortcut,
    deleteShortcut,
    addMeetNudgeContact,
    listMeetNudgeContacts,
    appendNotebook,
  ],
});
