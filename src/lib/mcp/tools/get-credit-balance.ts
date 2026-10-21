import { defineTool } from "@lovable.dev/mcp-js";
import { userClient } from "../env";


export default defineTool({
  name: "get_credit_balance",
  title: "Get EZYOURLIFE credit balance",
  description: "Returns the signed-in user's free + paid credit balance on EZYOURLIFE.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = userClient(ctx);
    const { data, error } = await sb
      .from("credit_wallets")
      .select("free_balance,paid_balance")
      .eq("user_id", ctx.getUserId())
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const free = data?.free_balance ?? 0;
    const paid = data?.paid_balance ?? 0;
    return {
      content: [{ type: "text", text: `Free: ${free}, Paid: ${paid}, Total: ${free + paid}` }],
      structuredContent: { free_balance: free, paid_balance: paid, total: free + paid },
    };
  },
});
