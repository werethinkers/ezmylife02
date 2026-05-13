// Bulk-generate tool icon + preview images using Gemini 2.5 Flash Image (Nano Banana).
// Admin only. Streams progress as NDJSON.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_KEYS = [1, 2, 3, 4, 5]
  .map((i) => Deno.env.get(`GEMINI_API_KEY_${i}`))
  .filter((v): v is string => !!v);

const MODEL = "gemini-2.5-flash-image";

function iconPrompt(name: string, description: string, category: string) {
  return `Minimalist flat app icon representing "${name}" — ${description}. Category: ${category}. Single bold centered glyph or symbol that intuitively conveys the tool's purpose. Vibrant gradient (deep indigo to violet to electric magenta) on a clean dark navy background. Soft inner glow, subtle depth, rounded square iOS-style composition. Premium, polished, modern SaaS feel. NO text, NO words, NO letters, NO numbers, NO logos. Centered, square 1:1.`;
}

function previewPrompt(name: string, description: string, category: string) {
  return `A premium editorial hero illustration that instantly shows what "${name}" does: ${description}. Category: ${category}. Style: modern flat illustration with depth and dimension, dark glassmorphism background (deep navy + indigo with subtle grid), vibrant violet, electric blue, and magenta gradient accents, soft volumetric lighting, abstract floating UI elements (cards, charts, sparkles, arrows, document fragments) that visually communicate the ${category} workflow. A first-time visitor should understand what this tool does within one second of looking. Premium SaaS hero aesthetic, cinematic, polished. NO text, NO words, NO letters, NO logos, NO readable strings in any UI element. 16:9 widescreen, balanced composition.`;
}

async function callGemini(prompt: string): Promise<{ bytes: Uint8Array; mime: string }> {
  if (GEMINI_KEYS.length === 0) throw new Error("no_gemini_keys_configured");
  let lastErr = "";
  for (let attempt = 0; attempt < GEMINI_KEYS.length * 2; attempt++) {
    const key = GEMINI_KEYS[attempt % GEMINI_KEYS.length];
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      });
      if (resp.status === 429 || resp.status === 503) {
        lastErr = `${resp.status}`;
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      if (!resp.ok) {
        lastErr = `${resp.status}: ${(await resp.text()).slice(0, 200)}`;
        // try next key for 4xx auth/quota
        if (resp.status === 401 || resp.status === 403) continue;
        throw new Error(lastErr);
      }
      const data = await resp.json();
      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      for (const p of parts) {
        const inline = p?.inlineData ?? p?.inline_data;
        if (inline?.data) {
          const mime = inline.mimeType ?? inline.mime_type ?? "image/png";
          const bin = atob(inline.data);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          return { bytes, mime };
        }
      }
      lastErr = "no_image_in_response";
    } catch (e) {
      lastErr = String(e);
    }
  }
  throw new Error(`gemini_failed: ${lastErr}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  // Admin auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "no_auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const { data: ud } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!ud.user) {
    return new Response(JSON.stringify({ error: "auth_failed" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", ud.user.id);
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "admin_only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const body = await req.json().catch(() => ({}));
  const {
    mode = "missing",
    tool_ids = [],
    kinds = ["icon", "preview"],
    force = false,
    limit = 200,
  } = body as { mode?: "missing" | "all" | "selected"; tool_ids?: string[]; kinds?: ("icon" | "preview")[]; force?: boolean; limit?: number };

  // Build target list
  let q = supabase.from("tools_catalog").select("id, name, description, category, icon_url, preview_image_url");
  if (mode === "selected" && tool_ids.length > 0) q = q.in("id", tool_ids);
  const { data: rows, error } = await q.order("name");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const all = rows ?? [];
  const targets = (mode === "missing"
    ? all.filter((t) => (kinds.includes("icon") && !t.icon_url) || (kinds.includes("preview") && !t.preview_image_url))
    : all
  ).slice(0, Math.max(1, Math.min(500, limit)));

  // Stream NDJSON progress
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: unknown) => controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
      send({ type: "start", total: targets.length });

      let done = 0;
      for (const t of targets) {
        for (const kind of kinds) {
          const already = kind === "icon" ? t.icon_url : t.preview_image_url;
          if (already && !force) continue;
          try {
            send({ type: "progress", tool_id: t.id, name: t.name, kind, status: "generating" });
            const prompt = kind === "icon"
              ? iconPrompt(t.name, t.description ?? "", t.category ?? "AI tool")
              : previewPrompt(t.name, t.description ?? "", t.category ?? "AI tool");
            const { bytes, mime } = await callGemini(prompt);
            const ext = mime.includes("jpeg") ? "jpg" : "png";
            const path = `${t.id}/auto-${kind}-${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage.from("tool-media").upload(path, bytes, { contentType: mime, upsert: false });
            if (upErr) throw new Error(`upload: ${upErr.message}`);
            const { data: pub } = supabase.storage.from("tool-media").getPublicUrl(path);
            const patch: Record<string, string> = kind === "icon"
              ? { icon_url: pub.publicUrl }
              : { preview_image_url: pub.publicUrl };
            const { error: updErr } = await supabase.from("tools_catalog").update(patch).eq("id", t.id);
            if (updErr) throw new Error(`db: ${updErr.message}`);
            if (kind === "preview") {
              await supabase.from("tool_media").delete().eq("tool_id", t.id).eq("kind", "image");
              await supabase.from("tool_media").insert({ tool_id: t.id, kind: "image", url: pub.publicUrl, sort_order: 0, alt: t.name });
            }
            send({ type: "progress", tool_id: t.id, name: t.name, kind, status: "ok", url: pub.publicUrl });
          } catch (e) {
            send({ type: "progress", tool_id: t.id, name: t.name, kind, status: "error", error: String(e) });
          }
        }
        done++;
        send({ type: "tick", done, total: targets.length });
      }
      send({ type: "done", total: targets.length });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "application/x-ndjson" },
  });
});
