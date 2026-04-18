import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DbKey { id: string; key_value: string; failure_count: number }

async function fetchDbKeys(): Promise<DbKey[]> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return [];
    const sb = createClient(url, key);
    const { data } = await sb
      .from("gemini_api_keys")
      .select("id,key_value,failure_count")
      .eq("is_active", true)
      .order("failure_count", { ascending: true })
      .order("last_used_at", { ascending: true, nullsFirst: true });
    return (data as DbKey[]) ?? [];
  } catch { return []; }
}

async function recordKeySuccess(id: string) {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    const sb = createClient(url, key);
    await sb.from("gemini_api_keys").update({ last_used_at: new Date().toISOString(), failure_count: 0 }).eq("id", id);
  } catch { /* noop */ }
}

async function recordKeyFailure(id: string, currentCount: number) {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    const sb = createClient(url, key);
    const newCount = currentCount + 1;
    await sb.from("gemini_api_keys").update({ failure_count: newCount, is_active: newCount < 5 }).eq("id", id);
  } catch { /* noop */ }
}

async function callGemini(apiKey: string, prompt: string, jsonMode: boolean): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body: { contents: unknown; generationConfig: Record<string, unknown> } = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7 },
  };
  if (jsonMode) body.generationConfig.responseMimeType = 'application/json';
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, context, selections, format, keywords } = await req.json();

    const apiKey = Deno.env.get('LOVABLE_API_KEY');

    let prompt = '';

    if (action === 'brainstorm') {
      const isText = format === 'text';
      const goal = isText
        ? "Rewrite or expand this message for different professional or social contexts."
        : "Generate creative variations of an image/video prompt.";

      prompt = `Task: ${goal}
Source Input: "${context}"
Keywords/Style: ${(selections || []).join(', ')}
Target Format: ${format?.toUpperCase() || 'TEXT'}

Generate exactly 5 distinct variations.
If format is TEXT, focus on tone, clarity, and impact.
If format is IMAGE/VIDEO, focus on visual description, lighting, and composition.

Provide a short catchy title for each.

RESPOND WITH ONLY a JSON array of objects with "title" and "prompt" keys. No other text.`;
    } else if (action === 'magic_write') {
      const isText = format === 'text';
      const instruction = isText
        ? "Perform 'Magic Write' on this draft. Expand it into 3 distinct, highly polished versions (e.g., Persuasive, Concise, Creative)."
        : "Perform 'Magic Write' on these keywords. Expand them into 3 distinct, highly descriptive, and artistic visual prompt variations.";

      prompt = `Input: "${keywords}"
Format: ${format?.toUpperCase() || 'TEXT'}
Instruction: ${instruction}

Provide a title for each.

RESPOND WITH ONLY a JSON array of objects with "title" and "prompt" keys. No other text.`;
    } else if (action === 'analyze_image') {
      prompt = "STRICT OUTPUT RULE: Return ONLY keywords. NO introductory phrases. Format: [Visual Keywords] | [Audio Keywords]. No sentences. Raw data only.";
    } else {
      throw new Error('Unknown action: ' + action);
    }

    const jsonMode = action !== 'analyze_image';

    // 1. Try Lovable AI first
    if (apiKey) {
      try {
        const requestBody: Record<string, unknown> = {
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
        };
        if (jsonMode) requestBody.response_format = { type: 'json_object' };

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
        console.warn('Lovable AI failed, trying DB keys...', response.status);
      } catch (e) {
        console.warn('Lovable AI error:', e);
      }
    }

    // 2. DB-backed Gemini keys
    const dbKeys = await fetchDbKeys();
    for (const k of dbKeys) {
      try {
        const text = await callGemini(k.key_value, prompt, jsonMode);
        if (text !== null) {
          recordKeySuccess(k.id);
          return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        await recordKeyFailure(k.id, k.failure_count);
      } catch (e) {
        await recordKeyFailure(k.id, k.failure_count);
        console.warn(`DB key error:`, e);
      }
    }

    // 3. Env fallback
    for (let i = 1; i <= 10; i++) {
      const k = Deno.env.get(`GEMINI_API_KEY_${i}`);
      if (!k) continue;
      try {
        const text = await callGemini(k, prompt, jsonMode);
        if (text !== null) {
          return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        console.warn(`Env key ${i} error:`, e);
      }
    }

    throw new Error('Something went wrong. Please retry — our AI is busy.');
  } catch (error) {
    console.error('promptmaster-ai error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
