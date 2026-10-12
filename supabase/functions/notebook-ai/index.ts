import { aiFetch } from "../_shared/ai.ts";
import { serve as stdServe } from "https://deno.land/std@0.168.0/http/server.ts";
import { billed } from "../_shared/billing.ts";

// Every request is signed-in-checked and, for paid actions, charged on the server.
const serve = (handler: (req: Request) => Promise<Response>) =>
  stdServe(billed({ tool: "speedy-notebook" }, (req) => handler(req)));
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

async function fetchDbKeys(): Promise<DbKey[]> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return [];
    const sb = createClient(url, key);
    const { data, error } = await sb
      .from("gemini_api_keys")
      .select("id,key_value,failure_count")
      .eq("is_active", true)
      .order("failure_count", { ascending: true })
      .order("last_used_at", { ascending: true, nullsFirst: true });
    if (error) {
      console.warn("Failed to fetch DB keys:", error.message);
      return [];
    }
    return (data as DbKey[]) ?? [];
  } catch (e) {
    console.warn("DB key fetch error:", e);
    return [];
  }
}

async function recordKeySuccess(id: string) {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    const sb = createClient(url, key);
    await sb.from("gemini_api_keys").update({ last_used_at: new Date().toISOString(), failure_count: 0 }).eq("id", id);
  } catch (e) { console.warn("recordKeySuccess error:", e); }
}

async function recordKeyFailure(id: string, currentCount: number) {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    const sb = createClient(url, key);
    const newCount = currentCount + 1;
    await sb.from("gemini_api_keys").update({
      failure_count: newCount,
      is_active: newCount < 5,
    }).eq("id", id);
  } catch (e) { console.warn("recordKeyFailure error:", e); }
}

async function callGeminiDirect(apiKey: string, messages: { role: string; content: string }[], model: string, responseFormat?: { type: string }): Promise<Response> {
  const geminiContents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body: { contents: unknown; generationConfig: Record<string, unknown> } = {
    contents: geminiContents,
    generationConfig: { temperature: 0.7 },
  };
  if (responseFormat?.type === 'json_object') {
    body.generationConfig.responseMimeType = 'application/json';
  }

  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { action, prompt: rawPrompt, config } = await req.json();
    // One request = one credit, so keep the prompt to a sensible size.
    const prompt = String(rawPrompt ?? "").slice(0, 12000);
    
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    const model = 'google/gemini-2.5-flash';

    const requestBody: Record<string, unknown> = {
      model,
      messages: [{ role: 'user', content: prompt }],
    };

    if (config?.responseMimeType === 'application/json') {
      requestBody.response_format = { type: 'json_object' };
    }

    // 1. Try Lovable AI first
    if (apiKey) {
      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content || '';
          return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.warn(`Lovable AI returned ${response.status}, trying DB Gemini keys...`);
      } catch (e) {
        console.warn('Lovable AI error:', e);
      }
    }

    // 2. Try DB-backed Gemini keys
    const dbKeys = await fetchDbKeys();
    for (const k of dbKeys) {
      try {
        const res = await callGeminiDirect(
          k.key_value,
          [{ role: 'user', content: prompt }],
          'gemini-2.5-flash',
          config?.responseMimeType === 'application/json' ? { type: 'json_object' } : undefined
        );
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          recordKeySuccess(k.id);
          return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        await recordKeyFailure(k.id, k.failure_count);
        console.warn(`DB key ${k.id.slice(0, 8)} returned ${res.status}`);
      } catch (e) {
        await recordKeyFailure(k.id, k.failure_count);
        console.warn(`DB key ${k.id.slice(0, 8)} error:`, e);
      }
    }

    // 3. Final fallback: env GEMINI keys
    const envKeys = getEnvFallbackKeys();
    for (let i = 0; i < envKeys.length; i++) {
      try {
        const res = await callGeminiDirect(
          envKeys[i],
          [{ role: 'user', content: prompt }],
          'gemini-2.5-flash',
          config?.responseMimeType === 'application/json' ? { type: 'json_object' } : undefined
        );
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.warn(`Env Gemini key ${i + 1} returned ${res.status}`);
      } catch (e) {
        console.warn(`Env Gemini key ${i + 1} error:`, e);
      }
    }

    throw new Error('Something went wrong. Please retry — our AI is busy.');
  } catch (error) {
    console.error('notebook-ai error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
