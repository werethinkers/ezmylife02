// ProductVision 360 — generates product angles in-house with Gemini image model
// using our rotating GEMINI_API_KEY secrets. Validates the caller's JWT.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { ensurePrice, finishRun, FREE_IMAGE_LIMIT, identify, imageRunsAffordable, priceOf, promoRunsAffordable, startRun, walletBalance } from "../_shared/billing.ts";

// Each generated angle is one AI image (about ₹3.3 at Google's list price), charged per successful
// angle on the server by the 3x cost rule (docs/pricing.md). Failed angles cost nothing.
const ANGLE_TOOL = "productvision-angle";
const DEFAULT_ANGLE_CREDITS = 27;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google's named replacement for 2.5 Flash Image, about 14% cheaper per image. If it is not
// available on a key, the angle is tried once more on the older model.
const IMAGE_MODELS = ["gemini-3.1-flash-lite-image", "gemini-2.5-flash-image"];

const ANGLE_HINTS: Record<string, string> = {
  "Front": "straight-on front view, camera facing the product directly",
  "Front-Right": "three-quarter view from the front-right (45 degrees)",
  "Right": "pure right side profile view (90 degrees)",
  "Back-Right": "three-quarter view from the back-right (135 degrees)",
  "Back": "straight-on rear view (180 degrees)",
  "Back-Left": "three-quarter view from the back-left (225 degrees)",
  "Left": "pure left side profile view (270 degrees)",
  "Front-Left": "three-quarter view from the front-left (315 degrees)",
  "Top": "top-down overhead view looking straight down",
  "Bottom": "view from directly underneath showing the base",
  "Intelligent Detail Close-Up": "macro close-up of the product's most distinctive detail, texture or feature",
};

function anglePrompt(angle: string) {
  return `You are a professional e-commerce product photographer. Using the attached photo, render the SAME exact product (identical shape, colors, materials, logos, text and proportions) from this camera angle: ${ANGLE_HINTS[angle] ?? angle}. Pure white seamless studio background, soft even lighting, subtle natural shadow, product centered and fully in frame, photorealistic catalog quality. Do not add props, text, or watermarks. Output only the image.`;
}

type AngleResult = { ok: true; mimeType: string; base64: string } | { ok: false; error: string; keyError: boolean };

async function generateAngle(key: string, imageBase64: string, mimeType: string, angle: string): Promise<AngleResult> {
  let last: AngleResult = { ok: false, error: "no_model", keyError: false };
  for (const model of IMAGE_MODELS) {
    last = await generateWith(model, key, imageBase64, mimeType, angle);
    // Move to the older model only when this one is missing for the key (404) or rejects the request (400).
    if (last.ok || last.keyError || !/^(400|404):/.test(last.error)) return last;
  }
  return last;
}

async function generateWith(model: string, key: string, imageBase64: string, mimeType: string, angle: string): Promise<AngleResult> {
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: anglePrompt(angle) },
        ] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    });
    const text = await resp.text();
    if (!resp.ok) {
      const keyError = [400, 401, 403, 429].includes(resp.status) && /429|quota|RESOURCE_EXHAUSTED|API key|PERMISSION_DENIED|UNAUTHENTICATED/i.test(text);
      return { ok: false, error: `${resp.status}: ${text.slice(0, 200)}`, keyError: keyError || resp.status === 429 };
    }
    const json = JSON.parse(text);
    const parts = json?.candidates?.[0]?.content?.parts ?? [];
    const img = parts.find((p: any) => p?.inlineData?.data);
    if (!img) return { ok: false, error: "No image returned for this angle.", keyError: false };
    return { ok: true, mimeType: img.inlineData.mimeType || "image/png", base64: img.inlineData.data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), keyError: false };
  }
}

const VALID_ANGLES = new Set([
  "Front", "Front-Right", "Right", "Back-Right", "Back", "Back-Left",
  "Left", "Front-Left", "Top", "Bottom", "Intelligent Detail Close-Up",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "method_not_allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Signed-in users only (the public anon key is rejected).
    const caller = await identify(req);
    // The public API (api function, used by the iPhone keyboard) runs this for a person with the service
    // key and names them; the per-angle charge below then comes from that person's wallet as usual.
    const peek = await req.clone().json().catch(() => ({}));
    const userId = caller?.internal && typeof peek?.user_id === "string" ? peek.user_id : caller?.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: "sign_in_required", message: "Please sign in to use this app." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const ud = { user: { id: userId } };

    const body = await req.json().catch(() => ({}));
    const imageBase64 = String(body.imageBase64 || "");
    const mimeType = String(body.mimeType || "image/png");
    const requested: string[] = Array.isArray(body.angles) && body.angles.length
      ? body.angles.filter((a: unknown) => typeof a === "string" && VALID_ANGLES.has(a as string))
      : ["Front", "Front-Right", "Right", "Back", "Left", "Front-Left"];
    const angles = Array.from(new Set(requested));
    if (!imageBase64 || imageBase64.length > 14_000_000) {
      return new Response(JSON.stringify({ error: "Upload one product photo under 10 MB." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!angles.length) {
      return new Response(JSON.stringify({ error: "Pick at least one angle." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Make sure the caller can afford every requested angle before spending anything.
    await ensurePrice(ANGLE_TOOL, DEFAULT_ANGLE_CREDITS, true);
    const perAngle = (await priceOf(ANGLE_TOOL)) ?? DEFAULT_ANGLE_CREDITS;
    // Free credits pay for at most a few AI images per person (image_runs_affordable in the database),
    // so count the angles this wallet can really pay for before any image is made.
    const balance = await walletBalance(ud.user.id);
    // Card-promo credits pay for a few angles on top (limited uses per app).
    const promoRuns = await promoRunsAffordable(ud.user.id, ANGLE_TOOL, perAngle);
    const affordable = (await imageRunsAffordable(ud.user.id, perAngle)) + promoRuns;
    if (affordable < angles.length) {
      const freeCapped = affordable < Math.floor(balance / perAngle) + promoRuns;
      return new Response(JSON.stringify({
        error: "insufficient_credits",
        credits_required: perAngle * angles.length,
        balance,
        message: freeCapped
          ? `Free credits cover ${FREE_IMAGE_LIMIT} AI images per person. ${angles.length} angles need ${perAngle * angles.length} bought credits (${perAngle} each); you can make ${affordable} now.`
          : `${angles.length} angles need ${perAngle * angles.length} credits (${perAngle} each). You have ${balance}.`,
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const chargeForImages = async (count: number): Promise<number> => {
      let charged = 0;
      for (let i = 0; i < count; i++) {
        const start = await startRun(ud.user.id, ANGLE_TOOL);
        if (!start.ok || !start.run_id) break;
        const done = await finishRun(ud.user.id, start.run_id, true);
        charged += done?.charged ?? 0;
      }
      return charged;
    };

    // Rotate Gemini keys on auth/rate-limit failures
    const keys = [
      Deno.env.get("GEMINI_API_KEY_5"),
      Deno.env.get("GEMINI_API_KEY_1"),
      Deno.env.get("GEMINI_API_KEY_2"),
      Deno.env.get("GEMINI_API_KEY_3"),
      Deno.env.get("GEMINI_API_KEY_4"),
    ].filter((k): k is string => !!k);
    if (!keys.length) throw new Error("no_gemini_keys");

    // Generate each angle in-house, rotating keys when one is rate-limited or rejected.
    let keyIdx = 0;
    const runAngle = async (angle: string) => {
      let last: AngleResult = { ok: false, error: "no_attempts", keyError: false };
      for (let tries = 0; tries < keys.length; tries++) {
        const k = keys[(keyIdx + tries) % keys.length];
        last = await generateAngle(k, imageBase64, mimeType, angle);
        if (last.ok || !last.keyError) return last;
      }
      keyIdx = (keyIdx + 1) % keys.length;
      return last;
    };

    const images: Array<{ angle: string; mimeType: string; base64: string }> = [];
    const failed: Array<{ angle: string; error: string }> = [];
    const CONCURRENCY = 3;
    for (let i = 0; i < angles.length; i += CONCURRENCY) {
      const batch = angles.slice(i, i + CONCURRENCY);
      const out = await Promise.all(batch.map(runAngle));
      out.forEach((r, j) => {
        if (r.ok) images.push({ angle: batch[j], mimeType: r.mimeType, base64: r.base64 });
        else failed.push({ angle: batch[j], error: r.error });
      });
    }

    const credits_charged = images.length ? await chargeForImages(images.length) : 0;
    return new Response(JSON.stringify({
      success: images.length > 0, images, failed, credits_charged, credits_per_angle: perAngle,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
