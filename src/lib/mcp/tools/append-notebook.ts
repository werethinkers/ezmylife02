import { defineTool } from "@lovable.dev/mcp-js";
import { userClient } from "../env";
import { z } from "zod";


export default defineTool({
  name: "append_notebook_entry",
  title: "Append to Speedy Notebook",
  description:
    "Append a note to the signed-in user's Speedy Notebook on EZYOURLIFE. A timestamped heading is added before the content.",
  inputSchema: {
    content: z.string().trim().min(1).describe("Note content (HTML or plain text). Appended to the notebook."),
    heading: z.string().trim().max(200).optional().describe("Optional short heading for the note."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ content, heading }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = userClient(ctx);
    const uid = ctx.getUserId();
    const { data: existing, error: readErr } = await sb
      .from("notebook_sessions")
      .select("editor_content,session_shortcuts")
      .eq("user_id", uid)
      .maybeSingle();
    if (readErr) return { content: [{ type: "text", text: readErr.message }], isError: true };

    const stamp = new Date().toISOString().replace("T", " ").slice(0, 16);
    const title = heading ? `${heading} — ${stamp}` : stamp;
    const block = `<h3>${title}</h3><p>${content.replace(/\n/g, "<br/>")}</p>`;
    const next = (existing?.editor_content ?? "") + block;
    const { error: upErr } = await sb.from("notebook_sessions").upsert(
      {
        user_id: uid,
        editor_content: next,
        session_shortcuts: existing?.session_shortcuts ?? [],
      },
      { onConflict: "user_id" },
    );
    if (upErr) return { content: [{ type: "text", text: upErr.message }], isError: true };
    return { content: [{ type: "text", text: `Appended to your Speedy Notebook.` }] };
  },
});
