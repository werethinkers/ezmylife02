import { aiFetch } from "../_shared/ai.ts";
// Edge function: generate a hero image for a tool via Lovable AI Gateway,
// upload it to the tool-media storage bucket, and insert a tool_media row.
// Idempotent per tool_id — skips if media already exists.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { identify, isAdmin } from "../_shared/billing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; contentType: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("invalid data url");
  const contentType = m[1];
  const b64 = m[2];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, contentType };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    // Admins only: this writes catalogue images and spends AI credits.
    const caller = await identify(req);
    if (!caller || (!caller.internal && !(await isAdmin(caller.userId)))) {
      return new Response(JSON.stringify({ error: "admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { tool_id, name, description, category, force } = await req.json();
    if (!tool_id || !name) {
      return new Response(JSON.stringify({ error: "tool_id and name required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    if (!force) {
      const { data: existing } = await supabase
        .from("tool_media").select("id").eq("tool_id", tool_id).limit(1).maybeSingle();
      if (existing) return new Response(JSON.stringify({ skipped: true, tool_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `A premium 16:9 hero illustration for an AI tool called "${name}". ${description ?? ""}. Category: ${category ?? "productivity"}. Style: dark glassmorphism, deep navy and indigo background with vibrant violet, electric blue, and magenta gradient accents, soft volumetric lighting, futuristic abstract shapes, subtle grid lines, high-end tech magazine aesthetic. Cinematic, polished, atmospheric. NO text, NO words, NO letters, NO logos. Centered composition, subtle depth, premium feel.`;

    const aiResp = await aiFetch({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      });
    if (!aiResp.ok) {
      const t = await aiResp.text();
      return new Response(JSON.stringify({ error: "ai_failed", status: aiResp.status, detail: t.slice(0, 500) }), {
        status: aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const aiData = await aiResp.json();
    const imageUrl = aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "no_image", detail: JSON.stringify(aiData).slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { bytes, contentType } = dataUrlToBytes(imageUrl);
    const ext = contentType.includes("png") ? "png" : "jpg";
    const path = `${tool_id}/hero-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from("tool-media").upload(path, bytes, {
      contentType, upsert: false,
    });
    if (upErr) {
      return new Response(JSON.stringify({ error: "upload_failed", detail: upErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: pub } = supabase.storage.from("tool-media").getPublicUrl(path);

    const { error: insErr } = await supabase.from("tool_media").insert({
      tool_id, kind: "image", url: pub.publicUrl, alt: name, sort_order: 0,
    });
    if (insErr) {
      return new Response(JSON.stringify({ error: "insert_failed", detail: insErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, tool_id, url: pub.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
