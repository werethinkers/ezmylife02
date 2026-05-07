import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_KEYS = [
  Deno.env.get("GEMINI_API_KEY_1"),
  Deno.env.get("GEMINI_API_KEY_2"),
  Deno.env.get("GEMINI_API_KEY_3"),
  Deno.env.get("GEMINI_API_KEY_4"),
].filter((k): k is string => !!k);

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

async function callGemini(key: string, body: unknown) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function callLovable(prompt: string, imageBase64: string, mimeType: string) {
  if (!LOVABLE_API_KEY) return null;
  const url = "https://ai.gateway.lovable.dev/v1/chat/completions";
  return fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      }],
      modalities: ["image", "text"],
    }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mimeType, prompt, angle } = await req.json();
    if (!imageBase64 || !prompt || !angle) {
      return new Response(JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mimeType || "image/png", data: imageBase64 } },
        ],
      }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    };

    let lastError = "No keys configured";

    // Try each Gemini key in rotation
    for (const key of GEMINI_KEYS) {
      try {
        const response = await callGemini(key, requestBody);
        if (response.status === 429 || response.status === 403) {
          lastError = `Key returned ${response.status}, trying next`;
          continue;
        }
        if (!response.ok) {
          lastError = `Gemini API ${response.status}`;
          const errText = await response.text();
          console.error("Gemini error:", response.status, errText);
          continue;
        }
        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts;
        const imagePart = parts?.find((p: any) => p.inlineData);
        if (!imagePart) { lastError = "No image in response"; continue; }
        return new Response(JSON.stringify({
          angle,
          base64: imagePart.inlineData.data,
          mimeType: imagePart.inlineData.mimeType || "image/png",
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        console.error("Gemini key failed:", lastError);
      }
    }

    // Fallback: Lovable AI Gateway
    try {
      const response = await callLovable(prompt, imageBase64, mimeType);
      if (response && response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        // Lovable may return image as data URL in content
        const imageItem = Array.isArray(content) ? content.find((c: any) => c.type === 'image_url' || c.image_url) : null;
        const dataUrl = imageItem?.image_url?.url || (typeof content === 'string' && content.match(/data:image\/[^;]+;base64,([^"\s]+)/)?.[0]);
        if (dataUrl) {
          const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
          if (match) {
            return new Response(JSON.stringify({ angle, base64: match[2], mimeType: match[1] }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        }
        lastError = "Lovable Gateway returned no usable image";
      } else if (response) {
        lastError = `Lovable Gateway ${response.status}`;
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.error("Lovable fallback failed:", lastError);
    }

    return new Response(JSON.stringify({ error: `All providers failed: ${lastError}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
