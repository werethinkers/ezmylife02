import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

/*
 * Server settings for the connector, read the same way on every runtime it can run on.
 *
 * The connector is deployed as the Supabase edge function `mcp` (Deno). Supabase gives edge
 * functions SUPABASE_URL and SUPABASE_ANON_KEY; newer projects also get SUPABASE_PUBLISHABLE_KEYS
 * (a JSON object of keys). SUPABASE_PUBLISHABLE_KEY (singular) is only the name the browser build
 * uses, so reading only that left the key empty on the server, every database tool threw
 * "supabaseKey is required" and the client saw only "tool execution failed".
 */

type Env = { get(name: string): string | undefined };

export function serverEnv(name: string): string {
  const g = globalThis as { process?: { env?: Record<string, string | undefined> }; Deno?: { env?: Env } };
  try {
    const fromProcess = g.process?.env?.[name];
    if (fromProcess) return fromProcess;
  } catch {
    /* no process object here */
  }
  try {
    return g.Deno?.env?.get(name) ?? "";
  } catch {
    return "";
  }
}

export function supabaseUrl(): string {
  const url = serverEnv("SUPABASE_URL").replace(/\/+$/, "");
  if (!url) throw new Error("The connector has no SUPABASE_URL setting.");
  return url;
}

/** The public (anon / publishable) key. Requests still run as the signed-in user through their token. */
export function supabaseKey(): string {
  const single = serverEnv("SUPABASE_PUBLISHABLE_KEY") || serverEnv("SUPABASE_ANON_KEY");
  if (single) return single;
  const many = serverEnv("SUPABASE_PUBLISHABLE_KEYS");
  if (many) {
    try {
      const keys = JSON.parse(many) as Record<string, string>;
      const first = keys.default ?? Object.values(keys)[0];
      if (first) return first;
    } catch {
      /* not JSON */
    }
  }
  throw new Error("The connector has no SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY setting.");
}

/** A database client that runs as the signed-in user, so row-level security applies. */
export function userClient(ctx: ToolContext) {
  return createClient(supabaseUrl(), supabaseKey(), {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
