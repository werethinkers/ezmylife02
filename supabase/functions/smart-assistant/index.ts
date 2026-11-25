import { aiFetch, getAiKey } from "../_shared/ai.ts";
import { serve as stdServe } from "https://deno.land/std@0.168.0/http/server.ts";
import { billed } from "../_shared/billing.ts";

// Every request is signed-in-checked and, for paid actions, charged on the server.
const serve = (handler: (req: Request) => Promise<Response>) =>
  stdServe(billed({ tool: () => null, allowAnonymous: true }, (req) => handler(req)));
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DbKey { id: string; key_value: string; failure_count: number }

function getEnvFallbackKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const k = Deno.env.get(`GEMINI_API_KEY_${i}`);
    if (k) keys.push(k);
  }
  return keys;
}

async function fetchDbKeys(sb: SupabaseClient): Promise<DbKey[]> {
  try {
    const { data, error } = await sb
      .from("gemini_api_keys")
      .select("id,key_value,failure_count")
      .eq("is_active", true)
      .order("failure_count", { ascending: true })
      .order("last_used_at", { ascending: true, nullsFirst: true });
    if (error) return [];
    return (data as DbKey[]) ?? [];
  } catch {
    return [];
  }
}

type CatalogRow = { id: string; name: string; description: string | null; category: string | null };

const SHORTLIST = 40;
const STOP = new Set("the and for with that this you your are can how what which want need app apps tool tools help make from have into about please something some just like also get any".split(" "));
const words = (s: string) =>
  s.toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/(ies|es|s)$/, ""));

/** Ranks apps by how many of the person's words appear in their name (counted 3x), category (2x) and description. */
function closestApps(rows: CatalogRow[], asked: string, n: number): CatalogRow[] {
  const q = new Set(words(asked));
  if (!q.size) return rows.slice(0, n);
  const score = (t: CatalogRow) => {
    let s = 0;
    const name = new Set(words(t.name)), cat = new Set(words(t.category ?? "")), desc = new Set(words(t.description ?? ""));
    for (const w of q) s += (name.has(w) ? 3 : 0) + (cat.has(w) ? 2 : 0) + (desc.has(w) ? 1 : 0);
    return s;
  };
  return rows
    .map((t, i) => ({ t, i, s: score(t) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, n)
    .map((x) => x.t);
}

async function recordKeySuccess(sb: SupabaseClient, id: string) {
  try {
    await sb.from("gemini_api_keys").update({ last_used_at: new Date().toISOString(), failure_count: 0 }).eq("id", id);
  } catch (_) { /* ignore */ }
}

async function recordKeyFailure(sb: SupabaseClient, id: string, currentCount: number) {
  try {
    const newCount = currentCount + 1;
    await sb.from("gemini_api_keys").update({ failure_count: newCount, is_active: newCount < 5 }).eq("id", id);
  } catch (_) { /* ignore */ }
}

/** Convert Gemini SSE stream into OpenAI-style chat.completions delta SSE. */
function geminiSseToOpenAiSse(geminiBody: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buf = "";

  return new ReadableStream({
    async start(controller) {
      const reader = geminiBody.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, idx);
            buf = buf.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (!json) continue;
            try {
              const parsed = JSON.parse(json);
              const text = parsed?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
              if (text) {
                const chunk = { choices: [{ delta: { content: text } }] };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch {
              // ignore partial
            }
          }
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } catch (e) {
        console.error("gemini stream transform error:", e);
      } finally {
        controller.close();
      }
    },
  });
}

async function streamFromGemini(apiKey: string, system: string, messages: { role: string; content: string }[]): Promise<Response> {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent?alt=sse&key=${apiKey}`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.8, thinkingConfig: { thinkingBudget: 0 } },
    }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages: rawMessages } = await req.json();
    // Cap what one request can send so the free assistant cannot be used for unlimited long prompts.
    const messages = (Array.isArray(rawMessages) ? rawMessages : [])
      .slice(-10)
      .map((m: { role?: string; content?: unknown }) => ({ role: m?.role === "assistant" ? "assistant" : "user", content: String(m?.content ?? "").slice(0, 2000) }));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: tools } = await supabase
      .from("tools_catalog")
      .select("id,name,description,category")
      .eq("is_live", true)
      .limit(5000);

    // Send the model only the apps closest to what the person asked, picked here in code, not
    // the whole catalogue: a fraction of the input cost per message, flat as the catalogue grows,
    // and the model chooses from a short relevant list instead of hunting through hundreds.
    const asked = messages.filter((m) => m.role === "user").slice(-3).map((m) => m.content).join(" ");
    const shortlist = closestApps(tools ?? [], asked, SHORTLIST);
    const catalogList = shortlist
      .map((t) => `- ${t.name} [id:${t.id}] (${t.category}): ${String(t.description ?? "").slice(0, 220)}`)
      .join("\n");

    const system = `You are the EZYOURLIFE Assistant — a friendly, sharp guide on "The Future's First AI App Store".
EZYOURLIFE is pay-as-you-go (no subscriptions). Packs start at ₹10.

YOUR JOB:
1. Listen to the user's problem / use case.
2. Recommend up to 3 LIVE AI apps from the catalog below that solve it. Use this EXACT markdown format for each recommendation:
   **[App Name](/tool-preview/<id>)** — one-line value prop.
3. If NOTHING in the catalog clearly matches, say so honestly and offer to register a custom request — our team will build/update an app within 24-48 hours. Then ask the user to share their **name and email** (phone optional) plus a one-line description. When they provide details, output a single line at the end of your reply EXACTLY like this so the UI can pick it up:
   <<<LEAD>>>{"name":"...","email":"...","phone":"...","description":"..."}<<<END>>>
   (Omit phone if not given. Do not output the LEAD block until you actually have name + email.)
4. For enterprise / custom-built AI apps for companies, point them to the Enterprise contact on the Credits page: [Contact us for Enterprise](/credits#enterprise).

Tone: warm, concise, a bit excited. Use markdown. Never invent app IDs. Never ask the user to sign up — the assistant works without auth.

LIVE APPS CLOSEST TO THIS CONVERSATION (${shortlist.length} of ${tools?.length ?? 0} live apps, best matches first; recommend only from this list):
${catalogList}
`;

    // 1. Try Lovable AI Gateway first
    const LOVABLE_API_KEY = (getAiKey() || "own-gemini-keys");
    if (LOVABLE_API_KEY) {
      const resp = await aiFetch({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: system }, ...messages],
          stream: true,
        });
      if (resp.ok) {
        return new Response(resp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
      }
      console.warn(`Lovable AI returned ${resp.status}, falling back to Gemini keys…`);
    }

    // 2. Try DB-backed Gemini keys
    const dbKeys = await fetchDbKeys(supabase);
    for (const k of dbKeys) {
      const res = await streamFromGemini(k.key_value, system, messages);
      if (res.ok && res.body) {
        recordKeySuccess(supabase, k.id);
        return new Response(geminiSseToOpenAiSse(res.body), {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }
      await recordKeyFailure(supabase, k.id, k.failure_count);
      console.warn(`DB key ${k.id.slice(0, 8)} returned ${res.status}`);
    }

    // 3. Env GEMINI_API_KEY_1..10
    const envKeys = getEnvFallbackKeys();
    for (let i = 0; i < envKeys.length; i++) {
      const res = await streamFromGemini(envKeys[i], system, messages);
      if (res.ok && res.body) {
        return new Response(geminiSseToOpenAiSse(res.body), {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }
      console.warn(`Env Gemini key ${i + 1} returned ${res.status}`);
    }

    return new Response(
      JSON.stringify({ error: "All AI providers are temporarily unavailable. Please try again shortly." }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("smart-assistant error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
