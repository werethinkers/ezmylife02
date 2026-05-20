import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const { data: ud } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!ud.user) throw new Error("Auth failed");

    const { data: roleRow } = await supabase.from("user_roles")
      .select("role").eq("user_id", ud.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) throw new Error("Admin only");

    const { tool_id } = await req.json();
    if (!tool_id) throw new Error("tool_id required");

    const { data: tool } = await supabase.from("tools_catalog")
      .select("id, name, description, category").eq("id", tool_id).maybeSingle();
    if (!tool) throw new Error("Tool not found");

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const prompt = `You are writing landing-page copy for an AI app called "${tool.name}" in the "${tool.category}" category. Description: ${tool.description}.
Return STRICT JSON with this shape:
{
  "hero_eyebrow": "AI POWERED",
  "hero_title": "Short punchy line.",
  "hero_title_accent": "Gradient highlight line.",
  "hero_subtitle": "2 sentence pitch.",
  "hero_chips": [{"label":"..."}, ...4],
  "cta_label": "Try ${tool.name} Now",
  "rating": 4.93, "reviews_count": 8700, "social_proof": "Loved by ...",
  "features": [{"title":"...","body":"..."}, ...4],
  "how_it_works": [{"title":"Upload","body":"..."},{"title":"Process","body":"..."},{"title":"Get Results","body":"..."}],
  "testimonials": [{"name":"...","role":"...","quote":"...","rating":5}, ...3],
  "stats": {"value":"50,000+","label":"Happy Users"},
  "final_cta_title":"Ready to ...?","final_cta_subtitle":"Join thousands...",
  "seo_title":"${tool.name} — EZYOURLIFE",
  "seo_description":"..."
}
Return only the JSON object.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!aiRes.ok) throw new Error(`AI: ${await aiRes.text()}`);
    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content ?? "{}";
    const draft = JSON.parse(content);

    const slug = slugify(tool.name);
    const payload = {
      tool_id,
      slug,
      is_published: false,
      hero_eyebrow: draft.hero_eyebrow ?? null,
      hero_title: draft.hero_title ?? tool.name,
      hero_title_accent: draft.hero_title_accent ?? null,
      hero_subtitle: draft.hero_subtitle ?? tool.description,
      hero_chips: draft.hero_chips ?? [],
      cta_label: draft.cta_label ?? `Try ${tool.name} Now`,
      cta_sublabel: null,
      rating: draft.rating ?? null,
      reviews_count: draft.reviews_count ?? null,
      social_proof: draft.social_proof ?? null,
      trust_logos: [],
      features: draft.features ?? [],
      how_it_works: draft.how_it_works ?? [],
      testimonials: draft.testimonials ?? [],
      stats: draft.stats ?? {},
      final_cta_title: draft.final_cta_title ?? null,
      final_cta_subtitle: draft.final_cta_subtitle ?? null,
      footer_badges: [
        { icon: "shield", title: "Secure & Private", body: "Your data is safe and encrypted" },
        { icon: "clock", title: "24/7 Support", body: "We're here to help you anytime" },
        { icon: "credit", title: "Credit System", body: "Pay only for what you use" },
        { icon: "x", title: "Cancel Anytime", body: "No subscriptions. No hidden fees." },
      ],
      seo_title: draft.seo_title ?? null,
      seo_description: draft.seo_description ?? null,
    };

    const { data: existing } = await supabase.from("tool_promo_pages")
      .select("id").eq("tool_id", tool_id).maybeSingle();

    if (existing) {
      const { error } = await supabase.from("tool_promo_pages")
        .update(payload).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("tool_promo_pages").insert(payload);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
