import { defineTool } from "@lovable.dev/mcp-js";
import { userClient } from "../env";
import { z } from "zod";


export default defineTool({
  name: "delete_shortcut",
  title: "Delete a text-expansion shortcut",
  description: "Remove an EZYOURLIFE text-expansion shortcut by its key.",
  inputSchema: { key: z.string().trim().min(1).describe("Shortcut trigger to delete.") },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ key }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = userClient(ctx);
    const uid = ctx.getUserId();
    const { data: existing, error: readErr } = await sb
      .from("notebook_sessions")
      .select("session_shortcuts,editor_content")
      .eq("user_id", uid)
      .maybeSingle();
    if (readErr) return { content: [{ type: "text", text: readErr.message }], isError: true };
    const current = Array.isArray(existing?.session_shortcuts) ? existing!.session_shortcuts : [];
    const next = current.filter((s: any) => s?.key !== key);
    if (next.length === current.length) {
      return { content: [{ type: "text", text: `No shortcut found with key '${key}'.` }] };
    }
    const { error: upErr } = await sb.from("notebook_sessions").upsert(
      { user_id: uid, session_shortcuts: next, editor_content: existing?.editor_content ?? "" },
      { onConflict: "user_id" },
    );
    if (upErr) return { content: [{ type: "text", text: upErr.message }], isError: true };
    return { content: [{ type: "text", text: `Deleted shortcut '${key}'.` }] };
  },
});
