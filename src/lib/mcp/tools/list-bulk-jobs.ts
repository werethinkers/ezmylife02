import { defineTool } from "../sdk";
import { userClient } from "../env";
import { z } from "zod";


export default defineTool({
  name: "list_bulk_jobs",
  title: "List my bulk processing jobs",
  description: "Recent bulk-mode processing jobs run by the signed-in user on EZYOURLIFE.",
  inputSchema: { limit: z.number().int().min(1).max(100).optional() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = userClient(ctx);
    const { data, error } = await sb
      .from("bulk_jobs")
      .select("id,tool_id,tool_name,status,total_items,completed_items,failed_items,total_credits_charged,output_zip_path,created_at,completed_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { jobs: data ?? [] },
    };
  },
});
