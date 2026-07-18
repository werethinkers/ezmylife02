// Bulk-generate promo (PDP) pages for tools, including AI copy + Gemini hero image.
// Admin only. Streams NDJSON progress.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_KEYS = [1, 2, 3, 4, 5]
  .map((i) => Deno.env.get(`GEMINI_API_KEY_${i}`))
  .filter((v): v is string => !!v);

const IMAGE_MODEL = "gemini-2.5-flash-image";
const TEXT_MODEL = "gemini-2.5-flash";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function geminiJSON(prompt: string): Promise<any> {
  let lastErr = "";
  for (let attempt = 0; attempt < GEMINI_KEYS.length * 2; attempt++) {
    const key = GEMINI_KEYS[attempt % GEMINI_KEYS.length];
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
        }),
      });
      if (resp.status === 429 || resp.status === 503) { await new Promise(r => setTimeout(r, 1500)); continue; }
      if (!resp.ok) { lastErr = `${resp.status}: ${(await resp.text()).slice(0,200)}`; continue; }
      const data = await resp.json();
      const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
      return JSON.parse(txt);
    } catch (e) { lastErr = String(e); }
  }
  throw new Error(`gemini_text_failed: ${lastErr}`);
}

async function geminiImage(prompt: string): Promise<{ bytes: Uint8Array; mime: string }> {
  if (GEMINI_KEYS.length === 0) throw new Error("no_gemini_keys");
  let lastErr = "";
  for (let attempt = 0; attempt < GEMINI_KEYS.length * 2; attempt++) {
    const key = GEMINI_KEYS[attempt % GEMINI_KEYS.length];
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      });
      if (resp.status === 429 || resp.status === 503) { await new Promise(r => setTimeout(r, 1500)); continue; }
      if (!resp.ok) { lastErr = `${resp.status}: ${(await resp.text()).slice(0,200)}`; if (resp.status === 401 || resp.status === 403) continue; throw new Error(lastErr); }
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
    } catch (e) { lastErr = String(e); }
  }
  throw new Error(`gemini_image_failed: ${lastErr}`);
}

function heroImagePrompt(name: string, description: string, category: string) {
  return `Premium hero illustration for the AI web app "${name}" (${category}). Purpose: ${description}.
Style: modern SaaS product hero, clean dark navy background (#0B0B1A) with vibrant violet-to-magenta gradient glow, soft bokeh, subtle grid, glassmorphism accents. A single stylised floating device / interface mockup or 3D symbolic object representing the tool's purpose, centered slightly right. Volumetric lighting, cinematic, ultra-detailed, sharp focus.
STRICT: NO text, NO letters, NO words, NO numbers, NO logos, NO watermarks, NO UI text. 16:9 aspect ratio.`;
}

function appScreenshotPrompt(name: string, description: string, category: string) {
  return `Ultra-realistic browser app screenshot mockup of the AI web app "${name}" (${category}) — purpose: ${description}.
Show a clean modern dark-mode dashboard UI on a MacBook-style browser window: left sidebar with subtle icons, a main panel with the primary input area (upload zone, prompt box or form) representing this tool's workflow, and a right-side settings panel. Purple/magenta accent color, glassmorphism cards, soft shadows, rounded corners, subtle grid background.
STRICT: use ONLY generic placeholder text and lorem-ipsum-style short labels — NO real brand names, NO readable paragraphs, NO watermarks, NO logos beyond a small abstract mark. 16:9 aspect ratio, sharp focus, product-shot quality.`;
}

function outputWindowPrompt(name: string, description: string, category: string) {
  return `Ultra-realistic screenshot of the RESULT / OUTPUT window of the AI web app "${name}" (${category}) — purpose: ${description}.
Depict the moment AFTER a user has run the tool: a dark-mode results panel showing the generated output relevant to this tool (e.g. generated images grid, chart, structured report, transformed document, code block or exported file preview). Include a small success badge, a download button, and 2–3 result thumbnails or cards. Purple/magenta accents, glassmorphism, soft glow.
STRICT: NO real brand names, NO readable paragraphs, NO watermarks. 16:9 aspect ratio, sharp focus, product-shot quality.`;
}

function beforeAfterPrompt(name: string, description: string, category: string) {
  return `Split before/after comparison visual for the AI web app "${name}" (${category}) — purpose: ${description}.
Left half: dull, grey, low-effort original ("before"). Right half: vibrant, polished, AI-enhanced version ("after"). Thin vertical divider with a subtle glowing handle in the middle. Dark background, purple/magenta accents, cinematic lighting.
STRICT: NO text labels, NO watermarks, NO logos. 16:9 aspect ratio.`;
}


function copyPrompt(name: string, description: string, category: string) {
  return `You are writing landing-page copy for an AI app called "${name}" in the "${category}" category. Description: ${description}.
Return STRICT JSON with EXACTLY this shape:
{
  "hero_eyebrow": "AI POWERED",
  "hero_title": "Short punchy line (max 6 words).",
  "hero_title_accent": "Gradient highlight (max 4 words).",
  "hero_subtitle": "2 sentence pitch.",
  "hero_chips": [{"label":"..."},{"label":"..."},{"label":"..."},{"label":"..."}],
  "cta_label": "Try ${name} Now",
  "rating": 4.9, "reviews_count": 8700, "social_proof": "Loved by ...",
  "features": [{"title":"...","body":"..."},{"title":"...","body":"..."},{"title":"...","body":"..."},{"title":"...","body":"..."}],
  "how_it_works": [{"title":"Upload","body":"..."},{"title":"Process","body":"..."},{"title":"Get Results","body":"..."}],
  "testimonials": [{"name":"...","role":"...","quote":"...","rating":5},{"name":"...","role":"...","quote":"...","rating":5},{"name":"...","role":"...","quote":"...","rating":5}],
  "stats": {"value":"50,000+","label":"Happy Users"},
  "final_cta_title":"Ready to ...?","final_cta_subtitle":"Join thousands...",
  "seo_title":"${name} — EZYOURLIFE",
  "seo_description":"..."
}
Return ONLY the JSON object.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "no_auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const { data: ud } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!ud.user) return new Response(JSON.stringify({ error: "auth_failed" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", ud.user.id);
  if (!(roles ?? []).some(r => r.role === "admin")) {
    return new Response(JSON.stringify({ error: "admin_only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const body = await req.json().catch(() => ({}));
  const { mode = "missing", force = false, limit = 500, publish = true, generate_image = true } = body as {
    mode?: "missing" | "all"; force?: boolean; limit?: number; publish?: boolean; generate_image?: boolean;
  };

  const { data: tools } = await supabase.from("tools_catalog").select("id, name, description, category").order("name");
  const { data: existing } = await supabase.from("tool_promo_pages").select("tool_id, slug");
  const existingByTool = new Map<string, string>((existing ?? []).map(p => [p.tool_id, p.slug]));
  const usedSlugs = new Set<string>((existing ?? []).map(p => p.slug));

  const all = tools ?? [];
  const targets = (mode === "missing" ? all.filter(t => !existingByTool.has(t.id)) : all).slice(0, Math.max(1, Math.min(500, limit)));

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: unknown) => controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
      send({ type: "start", total: targets.length });

      let done = 0, ok = 0, failed = 0;
      for (const t of targets) {
        const name = t.name ?? "";
        const desc = t.description ?? "";
        const cat = t.category ?? "AI tool";
        try {
          send({ type: "progress", tool_id: t.id, name, status: "copy" });
          const draft = await geminiJSON(copyPrompt(name, desc, cat));

          let heroUrl: string | null = null;
          const gallery: Array<{ url: string; caption: string; kind: string }> = [];
          const uploadImg = async (bytes: Uint8Array, mime: string, tag: string) => {
            const ext = mime.includes("jpeg") ? "jpg" : "png";
            const path = `promo/${t.id}/${tag}-${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage.from("tool-media").upload(path, bytes, { contentType: mime, upsert: true });
            if (upErr) throw upErr;
            return supabase.storage.from("tool-media").getPublicUrl(path).data.publicUrl;
          };

          if (generate_image) {
            try {
              send({ type: "progress", tool_id: t.id, name, status: "image_hero" });
              const hero = await geminiImage(heroImagePrompt(name, desc, cat));
              heroUrl = await uploadImg(hero.bytes, hero.mime, "hero");
            } catch (e) {
              send({ type: "progress", tool_id: t.id, name, status: "image_failed", error: String(e) });
            }
            // Gallery: app UI screenshot, output window, before/after
            const galleryJobs: Array<[string, string, string]> = [
              ["screenshot", "App interface", appScreenshotPrompt(name, desc, cat)],
              ["output", "Sample output", outputWindowPrompt(name, desc, cat)],
              ["compare", "Before / after", beforeAfterPrompt(name, desc, cat)],
            ];
            for (const [tag, caption, prompt] of galleryJobs) {
              try {
                send({ type: "progress", tool_id: t.id, name, status: `image_${tag}` });
                const img = await geminiImage(prompt);
                const url = await uploadImg(img.bytes, img.mime, tag);
                gallery.push({ url, caption, kind: tag });
              } catch (e) {
                send({ type: "progress", tool_id: t.id, name, status: `image_${tag}_failed`, error: String(e) });
              }
            }
          }


          // slug: prefer existing, else unique from name
          let slug = existingByTool.get(t.id) ?? slugify(name) ?? t.id;
          if (!existingByTool.has(t.id)) {
            let s = slug, n = 1;
            while (usedSlugs.has(s)) { n++; s = `${slug}-${n}`; }
            slug = s; usedSlugs.add(slug);
          }

          const payload: any = {
            tool_id: t.id,
            slug,
            is_published: publish,
            hero_eyebrow: draft.hero_eyebrow ?? "AI POWERED",
            hero_title: draft.hero_title ?? name,
            hero_title_accent: draft.hero_title_accent ?? null,
            hero_subtitle: draft.hero_subtitle ?? desc,
            hero_chips: draft.hero_chips ?? [],
            cta_label: draft.cta_label ?? `Try ${name} Now`,
            cta_sublabel: null,
            rating: draft.rating ?? 4.9,
            reviews_count: draft.reviews_count ?? 5000,
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
            seo_title: draft.seo_title ?? `${name} — EZYOURLIFE`,
            seo_description: draft.seo_description ?? desc,
          };
          if (heroUrl) { payload.hero_image_url = heroUrl; payload.og_image_url = heroUrl; }
          else if (force) { /* keep existing images */ }

          if (existingByTool.has(t.id)) {
            const { error } = await supabase.from("tool_promo_pages").update(payload).eq("tool_id", t.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("tool_promo_pages").insert(payload);
            if (error) throw error;
          }

          ok++;
          send({ type: "progress", tool_id: t.id, name, status: "ok", slug, hero: heroUrl });
        } catch (e) {
          failed++;
          send({ type: "progress", tool_id: t.id, name, status: "error", error: String(e) });
        }
        done++;
        send({ type: "tick", done, total: targets.length, ok, failed });
      }
      send({ type: "done", total: targets.length, ok, failed });
      controller.close();
    },
  });

  return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "application/x-ndjson" } });
});
