import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    // Build live tool catalog snippet
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: tools } = await supabase
      .from("tools_catalog")
      .select("id,name,description,category")
      .eq("is_live", true)
      .limit(250);

    const catalogList = (tools ?? [])
      .map((t) => `- ${t.name} [id:${t.id}] (${t.category}): ${t.description}`)
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

LIVE APP CATALOG (${tools?.length ?? 0} apps):
${catalogList}
`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, ...messages],
        stream: true,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      const status = resp.status === 429 ? 429 : resp.status === 402 ? 402 : 500;
      const msg =
        status === 429
          ? "Too many requests, please slow down."
          : status === 402
          ? "AI credits exhausted. Please top up the workspace."
          : "AI gateway error";
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(resp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("smart-assistant error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
