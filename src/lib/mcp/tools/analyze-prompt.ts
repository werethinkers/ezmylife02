import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "analyze_prompt",
  title: "Analyze & improve a prompt (PromptMaster)",
  description:
    "Rewrites a user's prompt using EZYOURLIFE PromptMaster (Gemini). Returns an improved version plus rationale. Charges the user's credits per catalog pricing.",
  inputSchema: {
    prompt: z.string().trim().min(1).describe("The prompt to analyze and improve."),
    goal: z.string().trim().optional().describe("Optional: what the user wants the improved prompt to achieve."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  handler: async ({ prompt, goal }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const url = `${process.env.SUPABASE_URL}/functions/v1/promptmaster-ai`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ctx.getToken()}`,
          apikey: process.env.SUPABASE_PUBLISHABLE_KEY!,
        },
        body: JSON.stringify({ prompt, goal, mode: "improve" }),
      });
      const text = await res.text();
      if (!res.ok) return { content: [{ type: "text", text: `PromptMaster error (${res.status}): ${text}` }], isError: true };
      return { content: [{ type: "text", text }] };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Request failed: ${e?.message ?? e}` }], isError: true };
    }
  },
});
