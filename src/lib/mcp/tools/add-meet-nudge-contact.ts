import { defineTool } from "@lovable.dev/mcp-js";
import { userClient } from "../env";
import { z } from "zod";


export default defineTool({
  name: "add_meet_nudge_contact",
  title: "Add a Meet Nudge contact",
  description: "Add a networking contact to the signed-in user's Meet Nudge CRM on EZYOURLIFE.",
  inputSchema: {
    name: z.string().trim().min(1),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().optional(),
    occupation: z.string().trim().optional(),
    business_name: z.string().trim().optional(),
    location: z.string().trim().optional(),
    website: z.string().trim().url().optional(),
    linkedin_url: z.string().trim().url().optional(),
    fun_fact: z.string().trim().optional(),
    event_name: z.string().trim().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = userClient(ctx);
    const { data, error } = await sb
      .from("meet_nudge_contacts")
      .insert({ ...input, host_id: ctx.getUserId() })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Added contact ${data.name} to Meet Nudge.` }],
      structuredContent: { contact: data },
    };
  },
});
