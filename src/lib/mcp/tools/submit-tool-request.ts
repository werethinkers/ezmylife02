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
  name: "submit_tool_request",
  title: "Request a new EZYOURLIFE tool",
  description:
    "Submits a request for EZYOURLIFE to build a new custom AI tool (typical turnaround 24-48h).",
  inputSchema: {
    tool_description: z.string().trim().min(10).describe("Describe the tool you want built."),
    name: z.string().trim().optional(),
    email: z.string().trim().email().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ tool_description, name, email }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = userClient(ctx);
    const { data, error } = await sb
      .from("tool_requests")
      .insert({
        tool_description,
        name: name ?? ctx.getUserEmail() ?? "MCP user",
        email: email ?? ctx.getUserEmail() ?? "",
        status: "pending",
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Tool request submitted (id: ${data.id}). The EZYOURLIFE team will follow up within 24-48h.` }],
      structuredContent: { request: data },
    };
  },
});
