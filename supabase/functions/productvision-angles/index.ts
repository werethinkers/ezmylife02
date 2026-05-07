// ProductVision 360 — server proxy that calls the public-generate-angles API
// using our rotating GEMINI_API_KEY_1..4 secrets. Validates the caller's JWT.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

    // Validate JWT
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("missing_auth");
    const supa = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const { data: ud, error: ue } = await supa.auth.getUser(auth.replace("Bearer ", ""));
    if (ue || !ud.user) throw new Error("auth_failed");

    const body = await req.json().catch(() => ({}));
    const imageBase64 = String(body.imageBase64 || "");
    const mimeType = String(body.mimeType || "image/png");
    const angles = Array.isArray(body.angles) && body.angles.length
      ? body.angles.filter((a: unknown) => typeof a === "string" && VALID_ANGLES.has(a as string))
      : ["Front", "Front-Right", "Right", "Back", "Left", "Front-Left"];
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rotate Gemini keys on auth/rate-limit failures
    const keys = [
      Deno.env.get("GEMINI_API_KEY_1"),
      Deno.env.get("GEMINI_API_KEY_2"),
      Deno.env.get("GEMINI_API_KEY_3"),
      Deno.env.get("GEMINI_API_KEY_4"),
    ].filter((k): k is string => !!k);
    if (!keys.length) throw new Error("no_gemini_keys");

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
      // If upstream rejected the key (401/429), try next key
      if (upstream.status === 401 || upstream.status === 429) {
        lastErr = `${upstream.status}: ${text.slice(0, 200)}`;
        continue;
      }
      // Forward whatever upstream returned (success or otherwise)
      return new Response(text, {
        status: upstream.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "all_keys_failed", detail: lastErr }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
