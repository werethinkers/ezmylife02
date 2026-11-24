import { defineTool } from "../sdk";
import { userClient } from "../env";
import { z } from "zod";


export default defineTool({
  name: "save_shortcut",
  title: "Save a text-expansion shortcut",
  description:
    "Create or update an EZYOURLIFE text-expansion shortcut. The `key` (e.g. 'mtg') will expand to `value` in the browser extension and Speedy Notebook.",
  inputSchema: {
    key: z.string().trim().min(1).max(64).describe("Shortcut trigger, e.g. 'mtg' or 'sig'."),
    value: z.string().trim().min(1).describe("The text this shortcut expands to."),
    category: z.string().trim().max(64).optional().describe("Optional category label."),
    logic: z.string().trim().max(500).optional().describe("Optional note describing when to use this shortcut."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ key, value, category, logic }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = userClient(ctx);
    const uid = ctx.getUserId();
    const { data: existing, error: readErr } = await sb
      .from("notebook_sessions")
      .select("id,session_shortcuts,editor_content")
      .eq("user_id", uid)
      .maybeSingle();
    if (readErr) return { content: [{ type: "text", text: readErr.message }], isError: true };

    const current = Array.isArray(existing?.session_shortcuts) ? [...existing!.session_shortcuts] : [];
    const idx = current.findIndex((s: any) => s?.key === key);
    const entry: any = { key, value };
    if (category) entry.category = category;
    if (logic) entry.logic = logic;
    if (idx >= 0) current[idx] = { ...current[idx], ...entry };
    else current.push(entry);

    const { error: upErr } = await sb.from("notebook_sessions").upsert(
      {
        user_id: uid,
        session_shortcuts: current,
        editor_content: existing?.editor_content ?? "",
      },
      { onConflict: "user_id" },
    );
    if (upErr) return { content: [{ type: "text", text: upErr.message }], isError: true };
    return {
      content: [{ type: "text", text: `Shortcut '${key}' saved. It will sync to your browser extension.` }],
      structuredContent: { saved: entry, total_shortcuts: current.length },
    };
  },
});
