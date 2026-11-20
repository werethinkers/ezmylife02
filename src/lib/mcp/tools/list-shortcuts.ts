import { defineTool } from "../sdk";
import { userClient } from "../env";


export default defineTool({
  name: "list_shortcuts",
  title: "List text-expansion shortcuts",
  description:
    "List the signed-in user's EZYOURLIFE text-expansion shortcuts (key → value). These sync to the browser extension and Speedy Notebook.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = userClient(ctx);
    const { data, error } = await sb
      .from("notebook_sessions")
      .select("session_shortcuts")
      .eq("user_id", ctx.getUserId())
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const shortcuts = Array.isArray(data?.session_shortcuts) ? data!.session_shortcuts : [];
    return {
      content: [{ type: "text", text: JSON.stringify(shortcuts, null, 2) }],
      structuredContent: { shortcuts },
    };
  },
});
