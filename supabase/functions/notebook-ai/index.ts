import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function getGeminiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const k = Deno.env.get(`GEMINI_API_KEY_${i}`);
    if (k) keys.push(k);
  }
  return keys;
}

async function callGeminiDirect(apiKey: string, messages: { role: string; content: string }[], model: string, responseFormat?: any): Promise<Response> {
  const geminiContents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body: any = { contents: geminiContents, generationConfig: { temperature: 0.7 } };
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

  try {
    const { action, prompt, config } = await req.json();
    
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    let model = 'google/gemini-2.5-flash';

    const requestBody: Record<string, unknown> = {
      model,
      messages: [{ role: 'user', content: prompt }],
    };

    if (config?.responseMimeType === 'application/json') {
      requestBody.response_format = { type: 'json_object' };
    }

    // Try Lovable AI first
    if (apiKey) {
      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content || '';
          return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.warn(`Lovable AI returned ${response.status}, trying Gemini fallback...`);
      } catch (e) {
        console.warn('Lovable AI error:', e);
      }
    }

    // Fallback to Gemini keys
    const geminiKeys = getGeminiKeys();
    for (let i = 0; i < geminiKeys.length; i++) {
      try {
        const res = await callGeminiDirect(
          geminiKeys[i],
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
        console.warn(`Gemini key ${i + 1} returned ${res.status}`);
      } catch (e) {
        console.warn(`Gemini key ${i + 1} error:`, e);
      }
    }

    throw new Error('All AI keys exhausted. Please try again later.');
  } catch (error) {
    console.error('notebook-ai error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
