import { defineTool } from "@lovable.dev/mcp-js";
import { userClient } from "../env";
import { z } from "zod";


export default defineTool({
  name: "list_meet_nudge_contacts",
  title: "List Meet Nudge contacts",
  description: "List the signed-in user's Meet Nudge networking contacts. Optional search by name/business/email.",
  inputSchema: {
    query: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = userClient(ctx);
    let q = sb
      .from("meet_nudge_contacts")
      .select("id,name,email,phone,occupation,business_name,location,event_name,linkedin_url,website,fun_fact,created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (query && query.trim()) {
      const t = `%${query.trim()}%`;
      q = q.or(`name.ilike.${t},business_name.ilike.${t},email.ilike.${t},occupation.ilike.${t}`);
    }
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { contacts: data ?? [] },
    };
  },
});
