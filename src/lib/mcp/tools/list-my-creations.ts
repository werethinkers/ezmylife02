import { defineTool } from "@lovable.dev/mcp-js";
import { userClient } from "../env";
import { z } from "zod";


export default defineTool({
  name: "list_my_creations",
  title: "List my AI creations",
  description: "Recent items the signed-in user has generated on EZYOURLIFE (images, videos, docs, etc.).",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional(),
    tool_type: z.string().optional().describe("Optional filter by tool_type."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, tool_type }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = userClient(ctx);
    let q = sb
      .from("user_creations")
      .select("id,tool_type,title,prompt,result_url,status,created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (tool_type) q = q.eq("tool_type", tool_type);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { creations: data ?? [] },
    };
  },
});
