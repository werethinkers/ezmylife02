import { defineTool } from "../sdk";
import { userClient } from "../env";
import { z } from "zod";


export default defineTool({
  name: "get_tool_link",
  title: "Get a direct link to an EZYOURLIFE tool",
  description:
    "Returns a direct URL to open a specific EZYOURLIFE AI app in the browser. Use for iframe/UI-only tools that can't run over MCP (e.g. Startup Analyser, Video Generator, Notebook).",
  inputSchema: { tool_id: z.string().trim().min(1).describe("Tool ID (from list_tools) or slug.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ tool_id }, ctx) => {
    const sb = userClient(ctx);
    const { data, error } = await sb
      .from("tools_catalog")
      .select("id,name,description,dedicated_route,is_premium,is_free")
      .eq("id", tool_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `Tool '${tool_id}' not found. Use list_tools to search.` }], isError: true };
    const path = data.dedicated_route ?? `/tool/${data.id}`;
    const url = `https://ezyourlife.com${path}`;
    return {
      content: [{ type: "text", text: `${data.name}: ${url}\n\n${data.description ?? ""}` }],
      structuredContent: { url, tool: data },
    };
  },
});
