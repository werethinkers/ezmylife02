// The MCP connector's server: tool definitions, OAuth bearer checks against our Supabase auth server,
// and the streamable-HTTP protocol from the official MCP SDK. One stateless server per request.
//
//   GET  /functions/v1/mcp/.well-known/oauth-protected-resource   RFC 9728 metadata
//   POST /functions/v1/mcp                                         MCP (JSON-RPC over HTTP)
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.28.0/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@1.28.0/server/webStandardStreamableHttp.js";
import { createLocalJWKSet, decodeProtectedHeader, jwtVerify, type JWTPayload, type JSONWebKeySet } from "npm:jose@6.2.2";
import type { ZodRawShape } from "npm:zod@^3.23.8";

type Content = { type: string; [k: string]: unknown };
export interface ToolResult {
  content?: Content[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

interface VerifiedAuth {
  token: string;
  claims: JWTPayload & Record<string, unknown>;
}

/** What every tool handler gets as its second argument. The token is reachable only through getToken(). */
export class ToolContext {
  #auth: VerifiedAuth | undefined;
  constructor(auth: VerifiedAuth | undefined) {
    this.#auth = auth;
  }
  isAuthenticated() {
    return this.#auth !== undefined;
  }
  getToken() {
    return this.#auth?.token;
  }
  getUserId() {
    return this.#auth?.claims.sub;
  }
  getUserEmail() {
    const e = this.#auth?.claims.email;
    return typeof e === "string" ? e : undefined;
  }
  getClaims() {
    return this.#auth?.claims;
  }
}

export interface ToolDefinition {
  name: string;
  title?: string;
  description: string;
  inputSchema?: ZodRawShape;
  outputSchema?: ZodRawShape;
  annotations?: Record<string, unknown>;
  // deno-lint-ignore no-explicit-any
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

const ALGORITHMS = ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "EdDSA"];
const ACCESS_TOKEN_TYPS = ["at+jwt", "JWT"];
const ALLOW_HEADERS = "Authorization, Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID";
const EXPOSE_HEADERS = "WWW-Authenticate, Mcp-Session-Id, Mcp-Protocol-Version";
const METADATA_SUFFIX = "/.well-known/oauth-protected-resource";
const trim = (s: string) => s.replace(/\/+$/, "");

class TokenError extends Error {}

function withCors(res: Response) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Expose-Headers", EXPOSE_HEADERS);
  return res;
}

const preflight = (methods: string) =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": methods,
      "Access-Control-Allow-Headers": ALLOW_HEADERS,
      "Access-Control-Max-Age": "86400",
    },
  });

const quote = (v: string) => `"${v.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function challenge(metadataUrl: string, error?: string, description?: string) {
  const parts = [`realm=${quote("mcp")}`, `resource_metadata=${quote(metadataUrl)}`];
  if (error) parts.push(`error=${quote(error)}`);
  if (description) parts.push(`error_description=${quote(description)}`);
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "WWW-Authenticate": `Bearer ${parts.join(", ")}` },
  });
}

// One JWKS fetch per isolate every 10 minutes; a key rotation is picked up on the next refresh.
let jwksCache: { at: number; keys: ReturnType<typeof createLocalJWKSet> } | null = null;
async function keySet(issuer: string) {
  if (jwksCache && Date.now() - jwksCache.at < 10 * 60 * 1000) return jwksCache.keys;
  let jwksUri = `${issuer}/.well-known/jwks.json`;
  try {
    const r = await fetch(`${issuer}/.well-known/openid-configuration`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const meta = await r.json();
      if (typeof meta.jwks_uri === "string") jwksUri = meta.jwks_uri;
    }
  } catch {
    /* fall back to the standard Supabase JWKS path */
  }
  const r = await fetch(jwksUri, { signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error(`JWKS fetch failed (${r.status})`);
  const keys = createLocalJWKSet((await r.json()) as JSONWebKeySet);
  jwksCache = { at: Date.now(), keys };
  return keys;
}

async function verify(token: string, cfg: OAuthConfig): Promise<VerifiedAuth> {
  const issuer = trim(cfg.issuer);
  let typ: unknown;
  try {
    typ = decodeProtectedHeader(token).typ;
  } catch {
    throw new TokenError("Malformed JWT header");
  }
  if (typeof typ !== "string" || !ACCESS_TOKEN_TYPS.includes(typ)) throw new TokenError("Access token typ header is not accepted");
  let claims: JWTPayload & Record<string, unknown>;
  try {
    ({ payload: claims } = await jwtVerify(token, await keySet(issuer), {
      issuer: [issuer, `${issuer}/`],
      algorithms: ALGORITHMS,
      requiredClaims: ["sub", "exp"],
      clockTolerance: 30,
    }));
  } catch {
    throw new TokenError("Invalid access token");
  }
  const accepted = Array.isArray(cfg.acceptedAudiences) ? cfg.acceptedAudiences : [cfg.acceptedAudiences];
  const aud = Array.isArray(claims.aud) ? claims.aud : claims.aud ? [claims.aud] : [];
  if (!aud.some((a) => accepted.includes(a))) throw new TokenError("token audience is not accepted");
  if (typeof claims.sub !== "string" || !claims.sub.trim()) throw new TokenError("token subject claim must be a non-empty string");
  // Rejects a copied website session token: connector tokens are issued to an OAuth client.
  if (!claims.client_id && !claims.azp) throw new TokenError("OAuth client claim is required");
  return { token, claims };
}

function toSdkCallback(tool: ToolDefinition, authed: VerifiedAuth | undefined) {
  // deno-lint-ignore no-explicit-any
  return async (args: any) => {
    let result: ToolResult | null | undefined;
    try {
      result = await tool.handler(tool.inputSchema ? (args ?? {}) : {}, new ToolContext(authed));
    } catch (e) {
      console.error(`mcp tool ${tool.name} failed:`, e);
      return { content: [{ type: "text", text: "tool execution failed" }], isError: true };
    }
    if (result == null) return { content: [{ type: "text", text: `tool "${tool.name}" returned no result` }], isError: true };
    return { content: result.content ?? [], structuredContent: result.structuredContent, isError: result.isError };
  };
}

/** The Deno.serve handler for the `mcp` edge function. */
export function createSupabaseHandler(mcp: McpDefinition, { functionName }: { functionName: string }) {
  const resourcePath = `/functions/v1/${functionName}`;
  return async (incoming: Request): Promise<Response> => {
    // Supabase ends TLS at its gateway and forwards over http with X-Forwarded-Proto.
    const url = new URL(incoming.url);
    const proto = incoming.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    if (proto && `${proto}:` !== url.protocol) url.protocol = `${proto}:`;
    const resource = `${url.origin}${resourcePath}`;
    const metadataUrl = `${resource}${METADATA_SUFFIX}`;
    const path = url.pathname.replace(/\/+$/, "");

    if (path.endsWith(METADATA_SUFFIX)) {
      if (incoming.method === "OPTIONS") return preflight("GET, HEAD, OPTIONS");
      if (!mcp.auth) return withCors(new Response(JSON.stringify({ error: "not found" }), { status: 404 }));
      return withCors(
        Response.json(
          { resource, authorization_servers: [trim(mcp.auth.issuer)], bearer_methods_supported: ["header"], resource_name: mcp.title ?? mcp.name },
          { headers: { "Cache-Control": "public, max-age=300", Vary: "Host" } },
        ),
      );
    }

    if (incoming.method === "OPTIONS") return preflight("GET, POST, DELETE, OPTIONS");

    let authed: VerifiedAuth | undefined;
    if (mcp.auth) {
      const header = incoming.headers.get("Authorization") ?? "";
      const token = /^Bearer\s+(.+)$/i.exec(header)?.[1]?.trim();
      if (!token) return withCors(challenge(metadataUrl));
      try {
        authed = await verify(token, mcp.auth);
      } catch (e) {
        if (e instanceof TokenError) return withCors(challenge(metadataUrl, "invalid_token", e.message));
        console.error("mcp auth configuration error:", e);
        return withCors(new Response(JSON.stringify({ error: "oauth configuration error" }), { status: 500, headers: { "Cache-Control": "no-store" } }));
      }
    }

    try {
      const server = new McpServer({ name: mcp.name, version: mcp.version, title: mcp.title }, { instructions: mcp.instructions });
      for (const tool of mcp.tools) {
        server.registerTool(
          tool.name,
          { title: tool.title, description: tool.description, inputSchema: tool.inputSchema, outputSchema: tool.outputSchema, annotations: tool.annotations },
          // deno-lint-ignore no-explicit-any
          toSdkCallback(tool, authed) as any,
        );
      }
      const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await server.connect(transport);
      return withCors(await transport.handleRequest(incoming));
    } catch (e) {
      console.error("mcp transport error:", e);
      return withCors(Response.json({ jsonrpc: "2.0", id: null, error: { code: -32603, message: "internal error" } }, { status: 500 }));
    }
  };
}
