// Reuses an AI answer when another person sends exactly the same request to the same app
// (most often the "Fill in an example" values), so the model is not called again.
// Table: public.ai_answer_cache (service role only). If the table is missing or the lookup
// fails, the app simply calls the model as before.
// The person who got an answer is never served their own cached copy: pressing the button
// again with the same inputs means they want a fresh version.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const KEEP_DAYS = 30;

const headers = { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, "Content-Type": "application/json" };

export async function cacheKey(...parts: string[]): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(parts.join("\u0000")));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function cachedAnswer(key: string, userId: string | null): Promise<unknown | undefined> {
  if (!SUPABASE_URL || !SERVICE_ROLE) return undefined;
  try {
    const since = new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString();
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/ai_answer_cache?key=eq.${key}&created_at=gte.${encodeURIComponent(since)}&select=output,created_by`,
      { headers },
    );
    if (!r.ok) return undefined;
    const [row] = (await r.json()) as Array<{ output: unknown; created_by: string | null }>;
    if (!row || (userId && row.created_by === userId)) return undefined;
    return row.output;
  } catch {
    return undefined;
  }
}

export async function saveAnswer(key: string, toolId: string, output: unknown, userId: string | null): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_ROLE) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/ai_answer_cache?on_conflict=key`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ key, tool_id: toolId, output, created_by: userId, created_at: new Date().toISOString() }),
    });
  } catch {
    /* caching is best effort */
  }
}
