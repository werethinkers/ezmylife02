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
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
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

export interface ChatOptions {
  model?: string; // gateway id, e.g. "google/gemini-2.5-flash"
  maxTokens?: number;
  json?: boolean;
  temperature?: number;
}

/** One non-streaming completion. Returns the text. */
export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const model = opts.model ?? "google/gemini-2.5-flash";
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
  for (const key of await geminiKeys()) {
    try {
      const r = await fetch(`${GEMINI}/${geminiModel}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          generationConfig: {
            maxOutputTokens: opts.maxTokens,
            temperature: opts.temperature,
            ...(opts.json ? { responseMimeType: "application/json" } : {}),
            // Flash / Flash-Lite answer well without "thinking"; turning it off avoids paying for
            // hidden reasoning tokens on our own keys. (2.5 Pro cannot turn it off.)
            ...(canSkipThinking(geminiModel) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          },
        }),
      });
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
    if (m) return JSON.parse(m[0]) as T;
    throw new ModelError(502, "The AI returned an unreadable result. You were not charged.");
  }
}

/** Generates (or edits, when images are given) one image. Returns a data: URL. */
export async function image(prompt: string, inputImages: string[] = [], model = "google/gemini-2.5-flash-image"): Promise<string> {
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

  const { contents } = toGeminiContents([{ role: "user", content }]);
  const geminiModel = model.replace(/^google\//, "");
  for (const key of await geminiKeys()) {
    try {
      const r = await fetch(`${GEMINI}/${geminiModel}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents, generationConfig: { responseModalities: ["IMAGE", "TEXT"] } }),
      });
      if (r.ok) {
        const data = await r.json();
        for (const p of data?.candidates?.[0]?.content?.parts ?? []) {
          const inline = p.inline_data ?? p.inlineData;
          if (inline?.data) return `data:${inline.mime_type ?? inline.mimeType ?? "image/png"};base64,${inline.data}`;
        }
      } else lastStatus = r.status;
    } catch {
      /* next key */
    }
  }
  throw new ModelError(lastStatus === 429 ? 429 : 502, "Image generation failed. You were not charged.");
}
