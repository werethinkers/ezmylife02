// Shared model calls. Order (as chosen by the owner): Lovable AI gateway first, then the
// project's own Gemini keys (DB table gemini_api_keys, then GEMINI_API_KEY_1..10 env vars).
// No remote imports, so it type-checks offline.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI = "https://generativelanguage.googleapis.com/v1beta/models";

export class ModelError extends Error {
  status: number;
  /** Machine-readable reason a caller can switch on (e.g. to show a tool-specific message),
   *  separate from `message`, which is already safe to show the user as-is. */
  code?: "safety_block" | "invalid_request";
  constructor(status: number, message: string, code?: ModelError["code"]) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Part[];
}

async function geminiKeys(): Promise<string[]> {
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

function toGeminiContents(messages: ChatMessage[]) {
  const system = messages.filter((m) => m.role === "system").map((m) => (typeof m.content === "string" ? m.content : "")).join("\n\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const parts = (typeof m.content === "string" ? [{ type: "text", text: m.content } as Part] : m.content).map((p) => {
        if (p.type === "text") return { text: p.text };
        const match = p.image_url.url.match(/^data:([^;]+);base64,(.*)$/);
        return match ? { inline_data: { mime_type: match[1], data: match[2] } } : { text: p.image_url.url };
      });
      return { role: m.role === "assistant" ? "model" : "user", parts };
    });
  return { system, contents };
}

/** Flash and Flash-Lite answer well without "thinking"; Pro and the image models cannot turn it off. */
const canSkipThinking = (model: string) => /flash/.test(model) && !/image/.test(model);
/** Gemini 3.x replaced the numeric thinkingBudget with a thinkingLevel enum ("minimal"|"low"|"medium"|"high");
 * sending the old thinkingBudget field to a 3.x model is a 400 INVALID_ARGUMENT. 2.x and earlier keep thinkingBudget. */
const isGemini3 = (model: string) => /^gemini-3/.test(model);

export interface ChatOptions {
  model?: string; // gateway id, e.g. "google/gemini-2.5-flash-lite"
  maxTokens?: number;
  json?: boolean;
  temperature?: number;
}

/** One non-streaming completion. Returns the text. */
export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const model = opts.model ?? "google/gemini-2.5-flash-lite";
  let lastStatus = 0;
  let lastText = "";

  if (LOVABLE_API_KEY) {
    try {
      const send = (noThinking: boolean) =>
        fetch(GATEWAY, {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: opts.maxTokens,
            temperature: opts.temperature,
            ...(opts.json ? { response_format: { type: "json_object" } } : {}),
            ...(noThinking ? { reasoning_effort: "none" } : {}),
          }),
        });
      // 2.5 Flash "thinks" by default and the hidden reasoning tokens are billed as output, often
      // more than the answer itself. Turn it off as on our own keys below; if the gateway rejects
      // the setting, send the request again without it rather than failing.
      const noThinking = canSkipThinking(model);
      let r = await send(noThinking);
      if (noThinking && r.status === 400) r = await send(false);
      if (r.ok) {
        const data = await r.json();
        const text = data?.choices?.[0]?.message?.content;
        if (typeof text === "string" && text.trim()) return text;
      } else {
        lastStatus = r.status;
        lastText = (await r.text()).slice(0, 200);
      }
    } catch (e) {
      lastText = String(e);
    }
  }

  const { system, contents } = toGeminiContents(messages);
  const geminiModel = model.replace(/^google\//, "");
  // Flash / Flash-Lite answer well without "thinking"; turning it down avoids paying for hidden
  // reasoning tokens on our own keys. (Pro models cannot turn it off.) The exact field changed
  // between generations, so build it once per model rather than per request.
  const thinkingOff = canSkipThinking(geminiModel) ? (isGemini3(geminiModel) ? { thinkingLevel: "low" } : { thinkingBudget: 0 }) : null;
  for (const key of await geminiKeys()) {
    const send = (withThinking: boolean) =>
      fetch(`${GEMINI}/${geminiModel}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          generationConfig: {
            maxOutputTokens: opts.maxTokens,
            temperature: opts.temperature,
            ...(opts.json ? { responseMimeType: "application/json" } : {}),
            ...(withThinking && thinkingOff ? { thinkingConfig: thinkingOff } : {}),
          },
        }),
      });
    try {
      let r = await send(true);
      // This model/API version didn't accept thinkingOff's exact field — retry once without it
      // rather than burning every key on a request that was never going to succeed.
      if (thinkingOff && r.status === 400) r = await send(false);
      if (r.ok) {
        const data = await r.json();
        const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
        if (text.trim()) return text;
      } else {
        lastStatus = r.status;
        lastText = (await r.text()).slice(0, 200);
      }
    } catch (e) {
      lastText = String(e);
    }
  }
  throw new ModelError(lastStatus === 429 ? 429 : 502, `AI request failed${lastStatus ? ` (${lastStatus})` : ""}: ${lastText}`);
}

/** Parses a JSON object out of model text (tolerates code fences / surrounding prose). */
export function parseJson<T = unknown>(text: string): T {
  const cleaned = text.replace(/```(?:json)?/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const m = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        /* unreadable: fall through to the plain message below */
      }
    }
    throw new ModelError(502, "The AI returned an unreadable result. You were not charged.");
  }
}

/** Reads width/height straight out of a PNG's IHDR chunk (bytes 16-23), so a caller asking for a
 *  specific aspect ratio can confirm what actually came back without a decode library. Returns
 *  null for anything that isn't a PNG (nothing here currently requests a non-PNG output). */
function pngDimensions(base64: string): { width: number; height: number } | null {
  try {
    const bytes = Uint8Array.from(atob(base64.slice(0, 40)), (c) => c.charCodeAt(0));
    if (bytes.length < 24 || bytes[12] !== 0x49 || bytes[13] !== 0x48 || bytes[14] !== 0x44 || bytes[15] !== 0x52) return null; // not "IHDR"
    const view = new DataView(bytes.buffer);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  } catch {
    return null;
  }
}

/** Generates (or edits, when images are given) one image. Returns a data: URL.
 *  aspectRatio (e.g. "16:9", "9:16", "4:3", "3:4", "1:1") is sent as generationConfig.imageConfig.
 *  aspectRatio on the direct Gemini call — confirmed against Google's own Gemini API reference
 *  (ai.google.dev/api/generate-content), not the Vertex AI docs, which is a related but separate
 *  API — on the chance that path is reachable. In practice this project's own Gemini keys have no
 *  image-generation quota (free tier, limit 0), so the gateway below is the path that actually
 *  works, and its own aspect-ratio passthrough is undocumented either way — a requested ratio is
 *  not currently guaranteed; see the note where ai-app/index.ts calls this. */
export async function image(prompt: string, inputImages: string[] = [], model = "google/gemini-2.5-flash-image", aspectRatio?: string): Promise<string> {
  const content: Part[] = [{ type: "text", text: prompt }, ...inputImages.map((url) => ({ type: "image_url", image_url: { url } }) as Part)];
  let lastStatus = 0;

  if (LOVABLE_API_KEY) {
    try {
      const r = await fetch(GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, modalities: ["image", "text"], messages: [{ role: "user", content }] }),
      });
      if (r.ok) {
        const data = await r.json();
        const url = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (typeof url === "string" && url.startsWith("data:")) return url;
      } else lastStatus = r.status;
    } catch {
      /* fall through */
    }
  }

  // Gemini reports a refusal two ways: the whole prompt is blocked before any candidate is made
  // (promptFeedback.blockReason) or one candidate is made but stops short of an image
  // (candidates[0].finishReason). Either way it is a content decision, not a flaky key or a
  // transient outage, so it's thrown immediately instead of being retried on every other key.
  // IMAGE_OTHER/OTHER are left out on purpose — forum reports describe those as a flaky upstream
  // bug on Google's side, not a safety verdict, so mislabelling them as a content block would be
  // actively wrong.
  const SAFETY_REASONS = new Set(["SAFETY", "PROHIBITED_CONTENT", "IMAGE_PROHIBITED_CONTENT", "IMAGE_SAFETY", "RECITATION", "IMAGE_RECITATION", "SPII", "BLOCKLIST"]);

  const { contents } = toGeminiContents([{ role: "user", content }]);
  const geminiModel = model.replace(/^google\//, "");
  for (const key of await geminiKeys()) {
    let data: Record<string, unknown>;
    try {
      const r = await fetch(`${GEMINI}/${geminiModel}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents, generationConfig: { responseModalities: ["IMAGE", "TEXT"], ...(aspectRatio ? { imageConfig: { aspectRatio } } : {}) } }),
      });
      if (!r.ok) {
        const errBody = await r.text().catch(() => "");
        console.error(`[image] Gemini request failed (${r.status}): ${errBody.slice(0, 1000)}`);
        lastStatus = r.status;
        // An invalid aspect ratio, a malformed/too-large reference image, etc.: another key
        // would get the exact same 400, so this is surfaced straight away instead of retried.
        if (r.status === 400) throw new ModelError(400, "That request wasn't valid — check the prompt, reference image or aspect ratio and try again. You were not charged.", "invalid_request");
        continue;
      }
      data = await r.json();
    } catch (e) {
      if (e instanceof ModelError) throw e;
      continue; // network error etc. on this key: try the next one
    }
    const candidate = (data.candidates as Record<string, unknown>[] | undefined)?.[0];
    const candContent = candidate?.content as { parts?: Record<string, unknown>[] } | undefined;
    for (const p of candContent?.parts ?? []) {
      const inline = (p.inline_data ?? p.inlineData) as { data?: string; mime_type?: string; mimeType?: string } | undefined;
      if (inline?.data) {
        const mime = inline.mime_type ?? inline.mimeType ?? "image/png";
        if (aspectRatio && mime === "image/png") {
          const dims = pngDimensions(inline.data);
          console.log(`[image] requested aspect ${aspectRatio}; returned ${dims ? `${dims.width}x${dims.height}` : "unknown"} px`);
        }
        return `data:${mime};base64,${inline.data}`;
      }
    }
    const promptFeedback = data.promptFeedback as Record<string, unknown> | undefined;
    const blockReason = promptFeedback?.blockReason as string | undefined;
    const finishReason = candidate?.finishReason as string | undefined;
    const reason = blockReason ?? finishReason;
    console.error("[image] Gemini returned no image:", JSON.stringify({ blockReason, finishReason, safetyRatings: candidate?.safetyRatings ?? promptFeedback?.safetyRatings }).slice(0, 1000));
    if (reason && SAFETY_REASONS.has(reason)) {
      throw new ModelError(422, "That image couldn't be generated because of the AI's safety filters. Try describing it differently.", "safety_block");
    }
    lastStatus = 502;
  }
  throw new ModelError(lastStatus === 429 ? 429 : 502, "Image generation failed. You were not charged.");
}
