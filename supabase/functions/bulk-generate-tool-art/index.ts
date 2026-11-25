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
const TEXT_MODEL = "gemini-2.5-flash-lite";

function iconPrompt(name: string, description: string, category: string) {
  return `Minimalist flat app icon representing "${name}" — ${description}. Category: ${category}. Single bold centered glyph or symbol that intuitively conveys the tool's purpose. Vibrant gradient (deep indigo to violet to electric magenta) on a clean dark navy background. Soft inner glow, subtle depth, rounded square iOS-style composition. Premium, polished, modern SaaS feel. NO text, NO words, NO letters, NO numbers, NO logos. Centered, square 1:1.`;
}

// Pick a short, human "input action" label from the tool metadata.
function deriveInputAction(name: string, description: string, category: string): string {
  const t = `${name} ${description} ${category}`.toLowerCase();
  if (/(signature)/.test(t)) return "Write Your Signature";
  if (/(record|voice|audio|podcast|story|narrat)/.test(t)) return "Record Your Voice";
  if (/(prompt|chat|copy|caption|hashtag|script|content|writ|blog|email|generat)/.test(t) && !/image|photo|video/.test(t)) return "Enter Any Prompt";
  if (/(pitch ?deck|slide|presentation|deck)/.test(t)) return "Upload Pitch Deck";
  if (/(resume|cv)/.test(t)) return "Upload Your Resume";
  if (/(invoice|receipt|bill)/.test(t)) return "Enter Your Details";
  if (/(pdf|document|contract|agreement)/.test(t)) return "Upload Document";
  if (/(video)/.test(t)) return "Upload Your Video";
  if (/(image|photo|picture|logo|background|passport|thumbnail|watermark|crop|resize|compress|blur|grayscale|pixel|merge|split|color)/.test(t)) return "Upload Your Image";
  if (/(calculator|calc|estimat|tax|salary|grade|profit|expense)/.test(t)) return "Enter Your Numbers";
  if (/(plan|schedul|tracker|study|exam|assignment|lesson)/.test(t)) return "Enter Your Plan";
  return "Open the Tool";
}

// Ask Gemini text model for ~6 short feature labels for the right grid.
async function deriveFeatures(name: string, description: string, category: string): Promise<string[]> {
  if (GEMINI_KEYS.length === 0) return defaultFeatures(category);
  const prompt = `Tool: "${name}". Purpose: ${description}. Category: ${category}.
Return EXACTLY 6 short labels (1-2 words each, Title Case) that describe either the OUTPUTS the user gets, the FEATURES, or common USE CASES of this tool. They will appear as small icon-card labels in a product explainer image.
Respond as a JSON array of 6 strings ONLY. No prose. Example: ["Industry Analysis","Market Size","SWOT","Competitors","Risks","Use Cases"]`;
  for (let attempt = 0; attempt < Math.min(3, GEMINI_KEYS.length); attempt++) {
    const key = GEMINI_KEYS[attempt % GEMINI_KEYS.length];
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
        }),
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const arr = JSON.parse(txt);
      if (Array.isArray(arr) && arr.length >= 4) {
        return arr.slice(0, 6).map((s: unknown) => String(s).slice(0, 22));
      }
    } catch { /* fallthrough */ }
  }
  return defaultFeatures(category);
}

function defaultFeatures(category: string): string[] {
  return ["Fast Output", "High Quality", "Easy to Use", "Instant Result", "AI Powered", category || "Pro Tool"];
}

function previewPrompt(name: string, description: string, category: string, inputAction: string, features: string[]) {
  const featureList = features.map((f, i) => `  ${i + 1}. "${f}"`).join("\n");
  return `Create a clean, premium product-explainer illustration for an AI tool. The image will be shown to first-time visitors so they instantly understand WHAT they put in and WHAT they get out.

LAYOUT — STRICT, EXACTLY THIS COMPOSITION:
- Pure white / very light gray background (#FAFAFB). Generous whitespace and soft rounded corners (radius ~16px) everywhere.
- LEFT panel (~35% width): ONE single rounded card with a DASHED violet border (color #7C3AED, ~2px). Inside, centered: a 2-line label reading "${inputAction}" (in clean sans-serif, violet #7C3AED, semi-bold), and below it ONE large violet line-icon (~64px, stroke ~2.5px) that visually represents that input action (e.g. upload arrow ⬆, microphone, pencil, image frame, document).
- RIGHT panel (~65% width): A short heading at top in dark gray #1F2937 such as "What You Get" or "Save & Use Anywhere" describing the OUTPUT/value. Below the heading, a clean grid of 6 small white rounded cards (2 rows × 3 columns or 3 rows × 2 columns) with subtle shadow. Each card contains: one violet line-icon at top (centered, ~40px) and one short Title-Case label below (max 2 words, dark gray #1F2937, sans-serif).

USE EXACTLY THESE 6 LABELS for the right-side cards, IN THIS ORDER:
${featureList}

EVERY label MUST be spelled correctly and readable — no gibberish, no random letters, no fake words. Pick an icon for each card that matches its label meaning.

STYLE:
- Flat vector line-icons only. Single accent color violet #7C3AED for ALL icons and dashed border.
- No photographs, no 3D renders, no people, no gradients on icons.
- Clean modern sans-serif typography. Center labels under each icon.
- Soft shadows, lots of whitespace, premium SaaS explainer aesthetic (think Notion / Linear / Stripe explainer cards).

CONTEXT (do not put this text in the image, only use it to choose the icons):
Tool name: "${name}". Purpose: ${description}. Category: ${category}.

STRICT RULES:
- Do NOT include the tool name "${name}" anywhere in the image.
- Do NOT include any company logos, brand marks, or watermarks.
- Do NOT include paragraphs of text or readable mockup screens — ONLY the labels listed above.
- 16:9 aspect ratio, high resolution, sharp edges.`;
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
            let prompt: string;
            if (kind === "icon") {
              prompt = iconPrompt(t.name, t.description ?? "", t.category ?? "AI tool");
            } else {
              const inputAction = deriveInputAction(t.name, t.description ?? "", t.category ?? "");
              const features = await deriveFeatures(t.name, t.description ?? "", t.category ?? "AI tool");
              prompt = previewPrompt(t.name, t.description ?? "", t.category ?? "AI tool", inputAction, features);
            }
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
