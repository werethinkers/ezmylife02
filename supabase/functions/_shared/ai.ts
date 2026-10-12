// THE ONE PLACE apps get AI access. Every function (including new ones added through GitHub)
// must call AI through this file (or ./llm.ts) and never read LOVABLE_API_KEY / GEMINI keys itself.
//
//   import { aiFetch, AI } from "../_shared/ai.ts";
//   const res = await aiFetch({ model: AI.TEXT_MODEL, messages, stream: true });
//
// aiFetch takes the same OpenAI-style body as the Lovable AI gateway and returns a normal Response
// (streaming works). It tries the Lovable gateway first; if that fails (no key, out of credits,
// rate-limited, key not registered, server error) it retries on the project's own Gemini keys
// (gemini_api_keys table, then GEMINI_API_KEY_1..10) through Google's OpenAI-compatible endpoint.
import { image as makeImage } from "./llm.ts";

export const AI = {
  GATEWAY: "https://ai.gateway.lovable.dev/v1/chat/completions",
  GEMINI_OPENAI: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  TEXT_MODEL: "google/gemini-2.5-flash",
  IMAGE_MODEL: "google/gemini-2.5-flash-image",
} as const;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/** The Lovable AI key, or "" when it isn't set (aiFetch then uses the Gemini keys). */
export const getAiKey = () => Deno.env.get("LOVABLE_API_KEY") ?? "";

/** True when at least one AI key of any kind is configured. */
export const hasAiKey = async () => !!getAiKey() || (await geminiKeys()).length > 0;

export async function geminiKeys(): Promise<string[]> {
  const keys: string[] = [];
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/gemini_api_keys?is_active=eq.true&select=key_value&order=failure_count.asc,last_used_at.asc.nullsfirst`,
      { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } },
    );
    if (r.ok) for (const row of (await r.json()) as Array<{ key_value: string }>) keys.push(row.key_value);
  } catch {
    /* table unavailable */
  }
  for (let i = 1; i <= 10; i++) {
    const k = Deno.env.get(`GEMINI_API_KEY_${i}`);
    if (k) keys.push(k);
  }
  return Array.from(new Set(keys));
}

const jsonRes = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// deno-lint-ignore no-explicit-any
type Body = Record<string, any>;

/** Drop-in replacement for fetch(AI.GATEWAY, …): pass the request body, get a gateway-shaped Response. */
export async function aiFetch(body: Body): Promise<Response> {
  const key = getAiKey();
  let last: Response | null = null;

  if (key) {
    try {
      const r = await fetch(AI.GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      // 400 = the request itself is wrong; another provider won't fix it.
      if (r.ok || r.status === 400) return r;
      console.error("AI gateway failed, trying own Gemini keys:", r.status);
      last = r;
    } catch (e) {
      console.error("AI gateway unreachable, trying own Gemini keys:", e);
    }
  }

  // Image requests: reuse the image helper (it has its own Gemini fallback).
  if (Array.isArray(body.modalities) && body.modalities.includes("image")) {
    try {
      const msg = body.messages?.[body.messages.length - 1];
      const parts = typeof msg?.content === "string" ? [{ type: "text", text: msg.content }] : (msg?.content ?? []);
      const prompt = parts.filter((p: Body) => p.type === "text").map((p: Body) => p.text).join("\n");
      const imgs = parts.filter((p: Body) => p.type === "image_url").map((p: Body) => p.image_url.url);
      const url = await makeImage(prompt, imgs, body.model ?? AI.IMAGE_MODEL);
      return jsonRes({ choices: [{ message: { role: "assistant", content: "", images: [{ type: "image_url", image_url: { url } }] } }] });
    } catch (e) {
      return last ?? jsonRes({ error: { message: `Image generation failed: ${(e as Error).message}` } }, 502);
    }
  }

  const model = String(body.model ?? AI.TEXT_MODEL).replace(/^google\//, "");
  const { reasoning_effort: _r, ...rest } = body;
  for (const k of await geminiKeys()) {
    try {
      const r = await fetch(AI.GEMINI_OPENAI, {
        method: "POST",
        headers: { Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, model }),
      });
      if (r.ok) return r;
      console.error("Gemini key failed:", r.status);
      last = r;
    } catch (e) {
      console.error("Gemini key error:", e);
    }
  }
  return last ?? jsonRes({ error: { message: "No AI key is configured." } }, 500);
}
