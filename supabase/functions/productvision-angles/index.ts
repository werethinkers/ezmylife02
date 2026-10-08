// ProductVision 360 — server proxy that calls the public-generate-angles API
// using our rotating GEMINI_API_KEY_1..4 secrets. Validates the caller's JWT.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { ensurePrice, finishRun, identify, priceOf, startRun, walletBalance } from "../_shared/billing.ts";

// Each generated angle is one AI image (~₹3.4 at list price), so it is charged per successful
// angle on the server. Failed angles cost nothing.
const ANGLE_TOOL = "productvision-angle";
const DEFAULT_ANGLE_CREDITS = 12;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PUBLIC_ENDPOINT =
  "https://vmhyxhvxgiuwrskfvlsr.supabase.co/functions/v1/public-generate-angles";
const PUBLIC_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtaHl4aHZ4Z2l1d3Jza2Z2bHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDYzNDEsImV4cCI6MjA5MzE4MjM0MX0.fFwKYAh0rMVqO-0SBKYBsZN8kxsnWFvxkovqGdxN2ao";

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
    if (!caller?.userId) {
      return new Response(JSON.stringify({ error: "sign_in_required", message: "Please sign in to use this app." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const ud = { user: { id: caller.userId } };

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
    await ensurePrice(ANGLE_TOOL, DEFAULT_ANGLE_CREDITS);
    const perAngle = (await priceOf(ANGLE_TOOL)) ?? DEFAULT_ANGLE_CREDITS;
    const balance = await walletBalance(ud.user.id);
    if (balance < perAngle * angles.length) {
      return new Response(JSON.stringify({
        error: "insufficient_credits",
        credits_required: perAngle * angles.length,
        balance,
        message: `${angles.length} angles need ${perAngle * angles.length} credits (${perAngle} each). You have ${balance}.`,
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

    let lastBody = "";
    let lastErr = "no_attempts";
    for (const k of keys) {
      const upstream = await fetch(PUBLIC_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": PUBLIC_ANON,
          "x-gemini-key": k,
        },
        body: JSON.stringify({ imageBase64, mimeType, angles }),
      });
      const text = await upstream.text();
      lastBody = text;

      if (upstream.status === 401 || upstream.status === 429) {
        lastErr = `${upstream.status}: ${text.slice(0, 200)}`;
        continue;
      }

      // Upstream returns 200 with success=false even when Gemini rate-limits / rejects the key.
      // Detect that case and rotate to the next key.
      try {
        const parsed = JSON.parse(text);
        const failed = Array.isArray(parsed?.failed) ? parsed.failed : [];
        const hasSuccess = Array.isArray(parsed?.images) && parsed.images.length > 0;
        const allKeyErr = failed.length > 0 && failed.every((f: { error?: string }) => {
          const e = String(f?.error ?? "");
          return /429|quota|RESOURCE_EXHAUSTED|API key|invalid|401|PERMISSION_DENIED/i.test(e);
        });
        if (!hasSuccess && allKeyErr) {
          lastErr = `key_rejected: ${String(failed[0]?.error ?? "").slice(0, 200)}`;
          continue;
        }
      } catch { /* fall through and forward as-is */ }

      // Charge only for the angles that actually came back.
      let payload = text;
      try {
        const parsed = JSON.parse(text);
        const made = Math.min(angles.length, Array.isArray(parsed?.images) ? parsed.images.length : 0);
        if (upstream.ok && made > 0) {
          parsed.credits_charged = await chargeForImages(made);
          parsed.credits_per_angle = perAngle;
          payload = JSON.stringify(parsed);
        }
      } catch { /* forward as-is */ }
      return new Response(payload, {
        status: upstream.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // All keys exhausted — forward the last body so client sees the actual Gemini error
    return new Response(
      lastBody || JSON.stringify({ success: false, images: [], failed: [{ error: lastErr }] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
