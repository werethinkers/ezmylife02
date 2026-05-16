import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_KEYS = [1, 2, 3, 4, 5]
  .map((i) => Deno.env.get(`GEMINI_API_KEY_${i}`))
  .filter(Boolean) as string[];

async function callGemini(prompt: string): Promise<string> {
  let lastErr = "";
  for (const key of GEMINI_KEYS) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
          }),
        },
      );
      if (!r.ok) { lastErr = `${r.status} ${await r.text()}`; continue; }
      const j = await r.json();
      const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) { lastErr = String(e); }
  }
  throw new Error(`All Gemini keys failed: ${lastErr}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { tool_id, save } = await req.json();
    if (!tool_id) return new Response(JSON.stringify({ error: "tool_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: tool, error } = await admin.from("tools_catalog").select("id, name, description").eq("id", tool_id).single();
    if (error || !tool) return new Response(JSON.stringify({ error: "tool not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const prompt = `You are showing a realistic example for an AI web app.
App name: ${tool.name}
App description: ${tool.description}

Return strict JSON: {"input": "...", "output": "..."}
- input: a short, believable user request (one or two sentences).
- output: the kind of answer this app would produce. Use clean markdown. 80-250 words.
Do NOT include any other keys or commentary.`;

    const raw = await callGemini(prompt);
    let parsed: { input: string; output: string };
    try { parsed = JSON.parse(raw); } catch { return new Response(JSON.stringify({ error: "bad model output", raw }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

    if (save) {
      await admin.from("tools_catalog").update({ demo_input: parsed.input, demo_output: parsed.output }).eq("id", tool_id);
    }

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
