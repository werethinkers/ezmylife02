import type { ZodRawShape } from "zod";

// Types and helpers for the connector's source copy. The running server is
// supabase/functions/_shared/mcpServer.ts; supabase/functions/mcp/index.ts is the deployed copy of these tools.

export interface ToolContext {
  isAuthenticated(): boolean;
  getToken(): string | undefined;
  getUserId(): string | undefined;
  getUserEmail(): string | undefined;
}

type Content = { type: string; [k: string]: unknown };
export interface ToolResult {
  content?: Content[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export interface ToolDefinition {
  name: string;
  title?: string;
  description: string;
  inputSchema?: ZodRawShape;
  outputSchema?: ZodRawShape;
  annotations?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (input: any, ctx: ToolContext) => Promise<ToolResult> | ToolResult;
}

interface OAuthConfig {
  type: "oauth";
  issuer: string;
  acceptedAudiences: string | string[];
}

export interface McpDefinition {
  name: string;
  title?: string;
  version: string;
  instructions?: string;
  auth?: OAuthConfig;
  tools: ToolDefinition[];
}

export const defineTool = <T extends ToolDefinition>(tool: T): T => tool;
export const defineMcp = <T extends McpDefinition>(mcp: T): T => mcp;
export const auth = {
  oauth: {
    issuer: (o: { issuer: string; acceptedAudiences: string | string[] }): OAuthConfig => ({ type: "oauth", ...o }),
  },
};
