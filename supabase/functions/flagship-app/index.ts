// One function for every flagship app (see _shared/appSpecs/flagship-base.ts). Signed-in users only.
//
// What is charged (on the server, only when the step succeeds — see _shared/billing.ts):
//   final   – the finished result of an interview, upload, plan or pack app: the app's price.
//   variant – one picture from a photo studio app: the app's price, per picture.
//   start   – opens a coaching session: the app's price, per session.
//   ask     – a follow-up question on a finished result: "flagship-followup" (2 credits).
//   image   – an AI picture made from a result: "flagship-image" (30 credits).
// Free steps, capped so they stay cheap: "next" (the next interview question, Flash-Lite, short),
// and "turn" / "wrap" inside a paid coaching session (a signed session ticket is required).
import { billed } from "../_shared/billing.ts";
import { json } from "../_shared/http.ts";
import { chat, image, ModelError, type ChatMessage, type Part } from "../_shared/llm.ts";
import { APP_SPECS, COMMON_RULES } from "../_shared/appSpecs.ts";
import { FOLLOWUP_ID, IMAGE_ID, LITE, type FlagshipSpec } from "../_shared/appSpecs/flagship-base.ts";

const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MAX_FIELD = 6000;
const MAX_INPUTS = 30_000;
const MAX_CONTEXT = 120_000; // ~30k tokens of document text
const MAX_RESULT = 24_000; // result text sent with a follow-up question
const MAX_IMAGES = 8;
const MAX_IMAGE_CHARS = 9_000_000;
const MAX_AUDIO_CHARS = 14_000_000; // ~10 MB recording
const SESSION_HOURS = 6;

type Action = "next" | "final" | "variant" | "start" | "turn" | "wrap" | "ask" | "image";
type Msg = { role: "user" | "assistant"; content: string };

interface Body {
  tool_id?: string;
  action?: Action;
  inputs?: Record<string, unknown>;
  messages?: Msg[];
  context?: string;
  images?: string[];
  audio?: string;
  variant?: string;
  prompt?: string;
  result?: string;
  ticket?: string;
  instruction?: string;
  previous?: string;
}

const specOf = (id: unknown): FlagshipSpec | null => {
  const s = typeof id === "string" ? (APP_SPECS[id] as FlagshipSpec | undefined) : undefined;
  return s?.flagship ? s : null;
};

/** The price id a request is charged under, or null for free steps. */
function chargeFor(b: Body | null): string | null {
  const spec = specOf(b?.tool_id);
  if (!spec || !b) return null;
  switch (b.action) {
    case "final":
      return ["interview", "analyse", "plan", "pack"].includes(spec.flagship.shell) ? (b.tool_id as string) : null;
    case "variant":
      return spec.flagship.shell === "studio" ? (b.tool_id as string) : null;
    case "start":
      return spec.flagship.shell === "coach" ? (b.tool_id as string) : null;
    case "ask":
      return FOLLOWUP_ID;
    case "image":
      return IMAGE_ID;
    default:
      return null;
  }
}

function renderInputs(inputs: Record<string, unknown> | undefined): string {
  if (!inputs) return "";
  let out = "";
  for (const [k, v] of Object.entries(inputs)) {
    if (v === null || v === undefined || v === "") continue;
    const value = typeof v === "string" ? v : JSON.stringify(v);
    out += `- ${k.slice(0, 80)}: ${value.slice(0, MAX_FIELD)}\n`;
    if (out.length > MAX_INPUTS) break;
  }
  return out.slice(0, MAX_INPUTS);
}

const cleanMessages = (m: unknown, max: number): Msg[] =>
  (Array.isArray(m) ? m : [])
    .filter((x) => (x?.role === "user" || x?.role === "assistant") && typeof x.content === "string")
    .slice(-max)
    .map((x) => ({ role: x.role, content: String(x.content).slice(0, 4000) }));

const transcript = (msgs: Msg[], q = "Question", a = "Answer") =>
  msgs.map((m) => `${m.role === "assistant" ? q : a}: ${m.content}`).join("\n\n");

function cleanImages(images: unknown, max = MAX_IMAGES): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((s): s is string => typeof s === "string" && s.startsWith("data:image/") && s.length < MAX_IMAGE_CHARS)
    .slice(0, max);
}

const cleanAudio = (a: unknown): string | null =>
  typeof a === "string" && /^data:audio\/[\w.+-]+;base64,/.test(a) && a.length < MAX_AUDIO_CHARS ? a : null;

/** An unfinished `[Your Business Name]`-style placeholder — not a markdown link, not a `[1]` footnote. */
function hasPlaceholder(s: string): boolean {
  const spans = s.match(/\[[^\]\n]{2,80}\](?!\()/g) ?? [];
  return spans.some((m) => !/^\[\d+\]$/.test(m));
}

/**
 * Cuts a markdown section's text down to `max` words if the model ran over, so the Brand Identity
 * Kit's "100 words" promise holds even on the rare generation that doesn't stick to it itself.
 * A no-op when the heading isn't found or the section is already short enough.
 */
function clampSectionWords(markdown: string, heading: RegExp, max: number): string {
  const m = markdown.match(heading);
  if (!m || m.index === undefined) return markdown;
  const start = m.index + m[0].length;
  const rest = markdown.slice(start);
  const nextHeading = rest.search(/\n#{1,6}\s/);
  const sectionEnd = nextHeading === -1 ? rest.length : nextHeading;
  const section = rest.slice(0, sectionEnd).trim();
  const words = section.split(/\s+/).filter(Boolean);
  if (words.length <= max) return markdown;
  const clamped = `${words.slice(0, max).join(" ").replace(/[,;:—-]+$/, "")}.`;
  return `${markdown.slice(0, start)}\n\n${clamped}\n${rest.slice(sectionEnd)}`;
}

/** Field labels whose value is longer than the form's own maxLength for them — the server-side
 *  half of that limit, so a request that bypasses the form can't send something long enough to
 *  waste tokens or time out. */
function overLimitFields(inputs: Record<string, unknown> | undefined, limits: Record<string, number> | undefined): string[] {
  if (!inputs || !limits) return [];
  return Object.entries(limits)
    .filter(([label, max]) => typeof inputs[label] === "string" && (inputs[label] as string).length > max)
    .map(([label]) => label);
}

// ---- Coaching session tickets: HMAC-signed { user, app, expiry }, so free turns need a paid start.
const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(SERVICE_ROLE || "flagship"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}
async function makeTicket(user: string, app: string): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ u: user, a: app, e: Date.now() + SESSION_HOURS * 3600_000 })));
  return `${payload}.${await hmac(payload)}`;
}
async function checkTicket(ticket: unknown, user: string | null, app: string): Promise<boolean> {
  if (typeof ticket !== "string" || !user) return false;
  const [payload, sig] = ticket.split(".");
  if (!payload || !sig || (await hmac(payload)) !== sig) return false;
  try {
    const p = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return p.u === user && p.a === app && typeof p.e === "number" && p.e > Date.now();
  } catch {
    return false;
  }
}

Deno.serve(
  billed(
    {
      tool: (b: Body | null) => chargeFor(b),
      defaultCredits: (id) => APP_SPECS[id]?.credits,
    },
    async (_req, ctx) => {
      const body = (ctx.body ?? {}) as Body;
      const toolId = String(body.tool_id ?? "");
      const spec = specOf(toolId);
      if (!spec) return json({ error: "unknown_app" }, 400);
      const f = spec.flagship;
      const tooLong = overLimitFields(body.inputs, f.fieldLimits);
      if (tooLong.length) return json({ error: `Too long: ${tooLong.join(", ")}. Please shorten and try again.` }, 400);
      const system = `${spec.system}\n\n${COMMON_RULES}`;
      const inputs = renderInputs(body.inputs);
      // The public API (keyboard, Siri) calls with the service key and names the person it already checked and charged.
      const userId = ctx.caller.internal && typeof (body as Record<string, unknown>).user_id === "string" ? String((body as Record<string, unknown>).user_id) : ctx.caller.userId;

      try {
        switch (body.action) {
          // Free: the next interview question (Flash-Lite, short answers, capped length).
          case "next": {
            if (f.shell !== "interview") return json({ error: "bad_action" }, 400);
            const max = (f.maxTurns ?? 20) * 2;
            const history = cleanMessages(body.messages, max + 2);
            if (history.length > max) return json({ ok: true, output: "", done: true });
            const prompt = [
              `You are interviewing the customer so you can write ${spec.task?.split("\n")[0].replace(/^Write /, "").replace(/\.$/, "") ?? "their result"} afterwards.`,
              f.guide ?? "",
              "Ask exactly one warm, specific question at a time, building on what they just said. Reflect one detail back in a few words before asking, so they feel heard. Keep it under 60 words. Use their language (English, Hindi or Hinglish). Do not write the final result.",
              inputs ? `What they told you before starting:\n${inputs}` : "",
              history.length ? `Interview so far:\n${transcript(history)}` : "This is the first question.",
              "Reply with only your next question.",
            ]
              .filter(Boolean)
              .join("\n\n");
            const q = await chat([{ role: "user", content: prompt }], { model: LITE, maxTokens: 300 });
            return json({ ok: true, output: q.trim() });
          }

          // Paid: the finished result.
          case "final": {
            if (!["interview", "analyse", "plan", "pack"].includes(f.shell)) return json({ error: "bad_action" }, 400);
            const history = cleanMessages(body.messages, (f.maxTurns ?? 30) * 2 + 2);
            const context = typeof body.context === "string" ? body.context.slice(0, MAX_CONTEXT) : "";
            const imgs = cleanImages(body.images);
            const audio = cleanAudio(body.audio);
            if (f.shell === "analyse" && !context.trim() && !imgs.length && !audio && !inputs.trim()) {
              return json({ error: "Add a file, a photo or some text first." }, 400);
            }
            if (f.shell === "interview" && history.filter((m) => m.role === "user").length < 2 && !inputs.trim()) {
              return json({ error: "Answer a few questions first." }, 400);
            }
            const text = [
              inputs ? `What the customer told us:\n${inputs}` : "",
              history.length ? `Interview with the customer (their own words; keep their voice and details):\n${transcript(history)}` : "",
              context ? `Their documents:\n${context}` : "",
              imgs.length ? `${imgs.length} photo(s) or scanned page(s) are attached. Read them carefully.` : "",
              audio ? "A recording is attached. Work from what is actually said in it." : "",
              `Task:\n${spec.task}`,
            ]
              .filter(Boolean)
              .join("\n\n");
            const content: Part[] = [
              { type: "text", text },
              ...imgs.map((url) => ({ type: "image_url", image_url: { url } }) as Part),
              ...(audio ? [{ type: "image_url", image_url: { url: audio } } as Part] : []),
            ];
            const messages: ChatMessage[] = [{ role: "system", content: system }, { role: "user", content: content.length > 1 ? content : text }];
            if (typeof body.previous === "string" && body.instruction) {
              messages.push({ role: "assistant", content: body.previous.slice(0, 40_000) });
              messages.push({ role: "user", content: `Revise the result: ${String(body.instruction).slice(0, 1000)}. Return the full revised result in the same format.` });
            }
            const out = await chat(messages, { model: spec.model, maxTokens: spec.maxTokens });
            // An empty or blank reply is a failure, not a result: answer with an error status so the
            // billing wrapper (billed(), which only charges a 2xx response) never charges for it.
            if (!out || !out.trim()) {
              return json({ error: "No result came back. Please try again. You were not charged." }, 502);
            }
            let finalOut = out;
            // The Brand Identity Kit must never ship with unfinished template placeholders (the prompt
            // already says so — this is the safety net for the rare case one slips through): ask once
            // for a clean rewrite with a committed name and real detail everywhere, instead of returning it as is.
            if (toolId === "brand-identity-studio" && hasPlaceholder(finalOut)) {
              try {
                const retry = await chat(
                  [
                    ...messages,
                    { role: "assistant", content: finalOut.slice(0, 40_000) },
                    {
                      role: "user",
                      content:
                        "That still has unfinished placeholder text in square brackets (like [Your Business Name] or [.com]). Rewrite the whole kit with no placeholders anywhere: commit to one real, concrete business name (your own top recommendation, if one wasn't given) and real details throughout, and drop any 'To complete' section. Return the full kit in the same format.",
                    },
                  ],
                  { model: spec.model, maxTokens: spec.maxTokens },
                );
                if (retry?.trim() && !hasPlaceholder(retry)) finalOut = retry;
              } catch {
                // Keep the first result rather than fail the whole request over the retry.
              }
            }
            // The brand story is promised at 100 words or fewer; the prompt already asks for that,
            // this just guarantees it on the rare run that goes over instead of trusting the model.
            if (toolId === "brand-identity-studio") {
              finalOut = clampSectionWords(finalOut, /^#{1,6}\s*brand story\b.*$/im, 100);
            }
            return json({ ok: true, output: finalOut });
          }

          // Paid per picture: one photo studio option.
          case "variant": {
            if (f.shell !== "studio") return json({ error: "bad_action" }, 400);
            const look = f.variants?.[String(body.variant ?? "")];
            if (!look) return json({ error: "Pick one of the options." }, 400);
            const photos = cleanImages(body.images, 2);
            const prompt = [look, inputs ? `Details from the customer:\n${inputs}` : "", spec.task ?? "", "Photorealistic, high quality, no watermark, no text unless asked."]
              .filter(Boolean)
              .join("\n\n")
              .slice(0, 4000);
            const url = await image(prompt, photos);
            return json({ ok: true, output: url });
          }

          // Paid per session: open a coaching session and give the first reply.
          case "start": {
            if (f.shell !== "coach" || !userId) return json({ error: "bad_action" }, 400);
            const opening = await chat(
              [
                { role: "system", content: `${system}\n\n${f.guide ?? ""}` },
                { role: "user", content: `${inputs ? `About me:\n${inputs}\n\n` : ""}Start the session: greet me in one line, say what we will do, and ask your first question or set the first exercise.` },
              ],
              { model: LITE, maxTokens: 500 },
            );
            return json({ ok: true, output: opening, ticket: await makeTicket(userId, toolId) });
          }

          // Free inside a paid session: one coaching turn.
          case "turn": {
            if (f.shell !== "coach") return json({ error: "bad_action" }, 400);
            if (!(await checkTicket(body.ticket, userId, toolId))) return json({ error: "session_ended", message: "This session has ended. Start a new one." }, 403);
            const max = (f.maxTurns ?? 20) * 2;
            const history = cleanMessages(body.messages, max + 2);
            if (history.length > max) return json({ error: "session_full", message: "This session is full. Get your summary, then start a new one." }, 409);
            if (!history.length || history[history.length - 1].role !== "user") return json({ error: "Say something first." }, 400);
            const reply = await chat(
              [{ role: "system", content: `${system}\n\n${f.guide ?? ""}${inputs ? `\n\nAbout the customer:\n${inputs}` : ""}\n\nKeep each reply short (under 150 words) and end with one question or next exercise.` }, ...history],
              { model: LITE, maxTokens: 600 },
            );
            return json({ ok: true, output: reply });
          }

          // Free inside a paid session: the scored summary that closes it.
          case "wrap": {
            if (f.shell !== "coach") return json({ error: "bad_action" }, 400);
            if (!(await checkTicket(body.ticket, userId, toolId))) return json({ error: "session_ended", message: "This session has ended. Start a new one." }, 403);
            const history = cleanMessages(body.messages, (f.maxTurns ?? 20) * 2 + 2);
            if (history.filter((m) => m.role === "user").length < 1) return json({ error: "Have the session first." }, 400);
            const out = await chat(
              [
                { role: "system", content: system },
                { role: "user", content: `${inputs ? `About the customer:\n${inputs}\n\n` : ""}Session transcript:\n${transcript(history, "Coach", "Customer")}\n\nTask:\n${spec.task}` },
              ],
              { model: spec.model, maxTokens: 3000 },
            );
            return json({ ok: true, output: out });
          }

          // 2 credits: a follow-up question on a finished result.
          case "ask": {
            const result = typeof body.result === "string" ? body.result.slice(0, MAX_RESULT) : "";
            const history = cleanMessages(body.messages, 8);
            if (!result || !history.length || history[history.length - 1].role !== "user") return json({ error: "Ask a question first." }, 400);
            const s = APP_SPECS[FOLLOWUP_ID];
            const reply = await chat([{ role: "system", content: `${s.system}\n\n=== THE RESULT ===\n${result}\n=== END ===` }, ...history], {
              model: s.model,
              maxTokens: s.maxTokens,
            });
            return json({ ok: true, output: reply });
          }

          // 30 credits: an AI picture made from a result.
          case "image": {
            const what = String(body.prompt ?? "").trim().slice(0, 1200);
            if (!what) return json({ error: "Describe the picture first." }, 400);
            const style = f.imageStyle ?? "Clean, professional, warm natural light.";
            const url = await image(`${what}\n\nStyle: ${style}\nHigh quality, coherent composition, no watermark, no text unless asked.`, cleanImages(body.images, 1));
            return json({ ok: true, output: url });
          }

          default:
            return json({ error: "bad_action" }, 400);
        }
      } catch (e) {
        const status = e instanceof ModelError ? e.status : 500;
        return json({ error: e instanceof Error ? e.message : String(e) }, status >= 400 ? status : 500);
      }
    },
  ),
);
