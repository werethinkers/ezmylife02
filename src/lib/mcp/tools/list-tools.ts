import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function userClient(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_tools",
  title: "List EZYOURLIFE AI apps",
  description: "Search or list AI apps in the EZYOURLIFE catalog. Optional query filters by name/description/category.",
  inputSchema: {
    query: z.string().optional().describe("Free-text search across name, description, category."),
    limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    const sb = userClient(ctx);
    let q = sb
      .from("tools_catalog")
      .select("id,name,description,category,is_premium,is_free,dedicated_route")
      .eq("is_live", true)
      .limit(limit ?? 25);
    if (query && query.trim()) {
      const term = `%${query.trim()}%`;
      q = q.or(`name.ilike.${term},description.ilike.${term},category.ilike.${term}`);
    }
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { tools: data ?? [] },
    };
  },
});
