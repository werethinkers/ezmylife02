// One function for every app built on the shared app engines (documents, trackers' AI
// insights, chat, document/image reading and image generation). Signed-in users only;
// credits are checked and deducted on the server (see _shared/billing.ts).
import { billed } from "../_shared/billing.ts";
import { json } from "../_shared/http.ts";
import { chat, image, parseJson, ModelError, type ChatMessage, type Part } from "../_shared/llm.ts";
import { APP_SPECS, COMMON_RULES } from "../_shared/appSpecs.ts";

const FLASH_DEFAULT = "google/gemini-2.5-flash";
const MAX_FIELD = 6000;
const MAX_INPUTS = 40_000;
const MAX_CONTEXT = 30_000;
const MAX_IMAGES = 6;
const MAX_IMAGE_CHARS = 9_000_000; // ~6.5 MB per data URL

interface Body {
  tool_id?: string;
  inputs?: Record<string, unknown>;
  action?: "generate" | "refine";
  previous?: string;
  instruction?: string;
  messages?: Array<{ role: string; content: string }>;
  context?: string;
  images?: string[];
  prompt?: string;
  style?: string;
  aspect?: string;
}

function renderInputs(inputs: Record<string, unknown> | undefined): string {
  if (!inputs) return "";
  let out = "";
  for (const [k, v] of Object.entries(inputs)) {
    if (v === null || v === undefined || v === "") continue;
    const value = typeof v === "string" ? v : JSON.stringify(v);
    out += `- ${k}: ${value.slice(0, MAX_FIELD)}\n`;
    if (out.length > MAX_INPUTS) break;
  }
  return out.slice(0, MAX_INPUTS);
}

function cleanImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((s): s is string => typeof s === "string" && s.startsWith("data:image/") && s.length < MAX_IMAGE_CHARS)
    .slice(0, MAX_IMAGES);
}

const toolOf = (body: Body | null) => {
  const id = body?.tool_id;
  return id && APP_SPECS[id] ? id : null;
};

Deno.serve(
  billed({
    tool: (b: Body | null) => {
      const id = toolOf(b);
      return id ? APP_SPECS[id].chargeId ?? id : null;
    },
    defaultCredits: (chargeId) => Object.entries(APP_SPECS).find(([id, s]) => (s.chargeId ?? id) === chargeId)?.[1].credits,
  }, async (_req, ctx) => {
    const body = (ctx.body ?? {}) as Body;
    const toolId = toolOf(body);
    if (!toolId) return json({ error: "unknown_app" }, 400);
    const spec = APP_SPECS[toolId];


    try {
      if (spec.kind === "image") {
        const prompt = String(body.prompt ?? "").trim().slice(0, 2000);
        if (!prompt) return json({ error: "Describe the image you want." }, 400);
        const style = body.style ? ` Style: ${String(body.style).slice(0, 200)}.` : "";
        const aspect = body.aspect ? ` Aspect ratio ${String(body.aspect).slice(0, 10)}.` : "";
        const url = await image(`${prompt}.${style}${aspect} High quality, coherent composition, no watermark, no text unless asked.`, cleanImages(body.images).slice(0, 2));
        return json({ ok: true, image: url });
      }

      const system = `${spec.system}\n\n${COMMON_RULES}`;
      const inputs = renderInputs(body.inputs);
      const context = typeof body.context === "string" ? body.context.slice(0, spec.maxContext ?? MAX_CONTEXT) : "";

      if (spec.kind === "chat") {
        const history = (Array.isArray(body.messages) ? body.messages : [])
          .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .slice(-10)
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 3000) }));
        if (!history.length || history[history.length - 1].role !== "user") return json({ error: "Ask a question first." }, 400);
        const messages: ChatMessage[] = [
          { role: "system", content: context ? `${system}\n\n=== USER DOCUMENTS ===\n${context}\n=== END DOCUMENTS ===` : system },
          ...history,
        ];
        const reply = await chat(messages, { model: spec.model ?? FLASH_DEFAULT, maxTokens: spec.maxTokens ?? 2048 });
        return json({ ok: true, output: reply });
      }

      const userPrompt = [
        inputs ? `Inputs:\n${inputs}` : "",
        context ? `Document text:\n${context}` : "",
        `Task: ${spec.task ?? "Help with the request."}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      if (spec.kind === "vision") {
        const imgs = cleanImages(body.images).slice(0, spec.maxImages ?? MAX_IMAGES);
        if (!imgs.length) return json({ error: "Add at least one image." }, 400);
        const content: Part[] = [{ type: "text", text: userPrompt }, ...imgs.map((url) => ({ type: "image_url", image_url: { url } }) as Part)];
        const wantsJson = toolId === "auto-text-extractor";
        const text = await chat([{ role: "system", content: system }, { role: "user", content }], {
          model: spec.model ?? FLASH_DEFAULT,
          maxTokens: spec.maxTokens ?? 4096,
          json: wantsJson,
        });
        return json({ ok: true, output: wantsJson ? parseJson(text) : text });
      }

      const messages: ChatMessage[] = [{ role: "system", content: system }, { role: "user", content: userPrompt }];
      if (body.action === "refine" && typeof body.previous === "string" && body.instruction) {
        messages.push({ role: "assistant", content: body.previous.slice(0, 20_000) });
        messages.push({
          role: "user",
          content: `Revise the previous answer: ${String(body.instruction).slice(0, 1000)}. Return the full revised deliverable in the same format.`,
        });
      }
      const text = await chat(messages, {
        model: spec.model ?? FLASH_DEFAULT,
        maxTokens: spec.maxTokens ?? 8192,
        json: spec.kind === "json",
      });
      return json({ ok: true, output: spec.kind === "json" ? parseJson(text) : text });
    } catch (e) {
      const status = e instanceof ModelError ? e.status : 500;
      return json({ error: e instanceof Error ? e.message : String(e) }, status >= 400 ? status : 500);
    }
  }),
);

