import { defineTool } from "../sdk";
import { z } from "zod";
import { SITE, dbMessage, devClient, fail, latestVersion, notSignedIn, text } from "./dev-shared";
import { listingSchema } from "./dev-schemas";
import { supabaseKey, supabaseUrl } from "../env";

/*
 * AI apps: the developer's Claude sends a DEFINITION (the screen, its fields and the AI instructions), not code.
 * EzYourLife runs it on its own screens and its own AI and charges credits per use, exactly like the built-in apps.
 * The instructions are stored on the server; visitors never receive them. Tools here:
 *   dev_check_similar  → "does something like this already exist?" (call before building)
 *   dev_save_ai_app    → save the definition and/or listing (the database checks it and explains anything wrong)
 *   dev_test_run       → run the saved definition once with real AI, free, 25 a day, the admin can read it
 * Nothing here can approve, price or publish. The checks, preview and review are the same as for file apps.
 */

const fieldType = z.enum(["text", "textarea", "number", "money", "date", "select", "chips", "rows"]);
const column = z.object({
  key: z.string().max(40).optional(),
  label: z.string().min(1).max(40),
  type: z.enum(["text", "number", "money", "date", "select"]).optional(),
  placeholder: z.string().max(80).optional(),
  options: z.array(z.string().max(60)).max(24).optional(),
});

const fieldSchema = z.object({
  key: z.string().max(40).optional().describe("Short id, letters/numbers/underscore. Defaults to the label. Referenced in 'sample' and in the instructions."),
  label: z.string().min(1).max(60).describe("What the visitor reads above the box."),
  type: fieldType.describe("text, textarea (long), number, money (rupees), date, select (one of options), chips (tap one of options), rows (a small table: set columns)."),
  placeholder: z.string().max(240).optional(),
  options: z.array(z.string().max(60)).max(24).optional().describe("For select and chips."),
  required: z.boolean().optional(),
  half: z.boolean().optional().describe("Put two short fields side by side."),
  help: z.string().max(200).optional(),
  default: z.string().max(500).optional(),
  rows: z.number().int().min(2).max(20).optional().describe("Height of a textarea."),
  columns: z.array(column).max(8).optional().describe("For type rows."),
  defaultRows: z.array(z.record(z.string(), z.unknown())).max(10).optional().describe("For type rows: starting rows keyed by column key."),
  profile: z
    .enum(["businessName", "ownerName", "industry", "city", "state", "phone", "email", "address", "gstin", "website", "products", "audience", "tone", "language"])
    .optional()
    .describe("Prefill from the visitor's saved EzYourLife business profile."),
  acceptsHandoff: z.boolean().optional(),
});

export const aiSpecSchema = z
  .object({
    engine: z.enum(["doc", "chat", "vision"]).describe("doc = a form in, a written result out. chat = a conversation (optionally over documents the visitor pastes). vision = photos or scanned pages in, written result out."),
    intro: z.string().min(10).max(200).describe("One sentence under the app's title: what the visitor gets."),
    steps: z.array(z.string().max(80)).max(4).optional().describe("How it works, up to 4 very short steps."),
    cta: z.string().max(40).optional().describe("Button label, e.g. 'Write my reply'."),
    fileName: z.string().max(40).optional().describe("Name for downloads, e.g. 'gst-reply'."),
    fields: z.array(fieldSchema).max(20).optional().describe("doc only: what the visitor fills in."),
    sample: z.record(z.string(), z.unknown()).optional().describe("doc only: a realistic example keyed by field key, for the 'Try an example' button."),
    refineChips: z.array(z.string().max(40)).max(6).optional().describe("doc only: quick edits, e.g. 'Shorter', 'More formal'."),
    welcome: z.string().max(300).optional().describe("chat only: the assistant's first message."),
    suggestions: z.array(z.string().max(100)).max(6).optional().describe("chat only: example questions."),
    documents: z.boolean().optional().describe("chat only: let the visitor paste documents as context."),
    documentHint: z.string().max(200).optional(),
    instructionsLabel: z.string().max(80).optional().describe("vision only: label for the optional note box."),
    ai: z.object({
      system: z.string().min(40).max(20000).describe("The AI's standing instructions: role, rules, tone, output format (Markdown). Stored on the server, never shown to visitors. EzYourLife adds its own safety rules after yours."),
      task: z.string().max(4000).optional().describe("doc and vision: what to produce from the inputs each time, e.g. 'Write the reply using the inputs above.'"),
      model: z.enum(["flash", "lite"]).optional().describe("flash (default, careful) or lite (cheaper, short simple jobs). No other model exists."),
      maxTokens: z.number().int().min(256).max(8192).optional().describe("Longest answer. As small as the output allows (default 4096)."),
      maxImages: z.number().int().min(1).max(4).optional().describe("vision only."),
      maxContext: z.number().int().min(2000).max(30000).optional().describe("chat only: characters of pasted documents."),
    }),
  })
  .describe("The AI app definition.");

const similarLines = (items: { name: string; source?: string; status?: string; short_description?: string; path?: string | null; score?: number }[]) =>
  items.map((s) => {
    const where = s.source === "store" ? "live in the store" : "another developer's app waiting for review";
    const link = s.path ? ` (${SITE}${s.path})` : "";
    const pct = typeof s.score === "number" ? `, ${Math.round(s.score * 100)}% of words in common` : "";
    return `- ${s.name}${link}: ${where}${pct}${s.short_description ? `\n    ${s.short_description}` : ""}`;
  });

export const devCheckSimilar = defineTool({
  name: "dev_check_similar",
  title: "Check for similar apps before building",
  description:
    "Looks for apps already in the EzYourLife store (or waiting for review) that do about the same job as the one being built, by name and one-line description. Call it BEFORE converting the app, and again if the name or description changes. If it finds any: tell the developer which ones, ask whether theirs really is different, and if so get a one or two sentence note in their own words (how it differs) and pass it as listing.similar_note. The team reads that note next to the similar apps and decides; it is not an automatic block.",
  inputSchema: {
    name: z.string().trim().min(3).max(60).describe("The app's name."),
    short_description: z.string().trim().max(160).optional().describe("The one-line description of what it does."),
    app_id: z.string().uuid().optional().describe("The developer's own app, if it exists already (so it is not compared with itself)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ name, short_description, app_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    const { data, error } = await devClient(ctx).rpc("dev_find_similar", { _name: name, _short: short_description ?? "", _app_id: app_id ?? null });
    if (error) return fail(dbMessage(error.message));
    const items = (data ?? []) as { name: string; source?: string; status?: string; short_description?: string; path?: string | null; score?: number }[];
    if (!items.length) {
      return text("No similar app found. Go ahead. (This is a word match on the name and description; the checks look again before sending.)", { similar: [] });
    }
    return text(
      [
        `Found ${items.length} similar app${items.length > 1 ? "s" : ""}:`,
        ...similarLines(items),
        "",
        "Tell the developer about these. Ask: does yours do something different? If it does, get one or two sentences in their own words on how (who it is for, what it adds, what it does differently) and pass them as listing.similar_note when you save. The EzYourLife team reads the note beside these apps and decides. If it does the same job, say so plainly and let the developer decide whether to continue.",
      ].join("\n"),
      { similar: items },
    );
  },
});

export const devSaveAiApp = defineTool({
  name: "dev_save_ai_app",
  title: "Save an AI app's definition and listing",
  description:
    "Saves an AI app: its definition (screen type, fields, AI instructions) and/or its store listing, to the editable version. The app then runs on EzYourLife's own screens and AI and is charged in credits per use; there is no code and no file. An app becomes an AI app by saving a definition while it has no live version (an app that is live as a file app, or live as an AI app, keeps its kind: create a new app instead). If the latest version is decided, this starts the next version; the live app does not change until it is approved. Saving clears earlier check results. If the definition is wrong the answer says exactly what to fix.",
  inputSchema: {
    app_id: z.string().uuid(),
    spec: aiSpecSchema.optional().describe("The complete definition. Leave out to change only the listing."),
    listing: listingSchema.optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ app_id, spec, listing }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    if (!spec && !listing) return fail("Nothing to save: pass spec, listing or both.");
    const { data, error } = await devClient(ctx).rpc("dev_save_ai_app", { _app_id: app_id, _spec: spec ?? null, _listing: listing ?? null });
    if (error) return fail(dbMessage(error.message));
    return text(`Saved version ${data.version_no} as an AI app. Next: dev_test_run with a realistic example, then dev_run_checks.`, data);
  },
});


export const aiStepSchema = z
  .object({
    inputs: z
      .array(z.object({ key: z.string().min(1).max(40).describe("Letters, numbers, underscore: the key the page sends."), label: z.string().max(80).optional().describe("What the visitor typed or chose, in words.") }))
      .max(30)
      .describe("Every answer the page sends to window.ezyourlife.ai(inputs). The team reads this to see which of the visitor's answers reach the AI."),
    fallback: z.string().min(10).max(500).describe("What the page shows when the AI is unavailable or the visitor has no credits. The page must really do this (keep the app's own fallback code)."),
    ai: z.object({
      system: z.string().min(80).max(20000).describe("The AI's standing instructions, moved here from the app's old server code: role, rules, tone, what it must never invent. Stored on the server, never shown to visitors."),
      task: z.string().min(20).max(4000).describe("What to produce from the inputs each time, and the exact layout of the answer. For JSON: every field name and what it holds."),
      model: z.enum(["flash", "lite"]).optional().describe("flash (default) or lite (cheaper, short simple jobs)."),
      maxTokens: z.number().int().min(256).max(8192).optional().describe("Longest answer. As small as the output allows."),
      json: z.boolean().optional().describe("true when the page expects an object: window.ezyourlife.ai then resolves with the parsed JSON object. false: it resolves with text."),
    }),
  })
  .describe("The AI step of a file app.");

export const devSaveAiStep = defineTool({
  name: "dev_save_ai_step",
  title: "Save the AI step of a file app",
  description:
    "FILE APPS that use AI (for example an AI Studio export that called Gemini from its own server): saves the AI step, the instructions the store runs on its own AI keys when the page calls window.ezyourlife.ai(inputs). The app's own code must call that function instead of its old server call, and keep its own fallback. Upload the app first (dev_import_project or the upload link; a new upload keeps the saved step). The visitor is charged credits per AI result only; the app opens free. EzYourLife works out the cost itself and the team sets the price: the developer does not set one and is not shown one. Pass spec: null to remove the step. Saving clears earlier check results. Next: dev_test_run with a realistic example.",
  inputSchema: {
    app_id: z.string().uuid(),
    spec: aiStepSchema.nullable().describe("The complete AI step, or null to remove it."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ app_id, spec }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    const { data, error } = await devClient(ctx).rpc("dev_save_ai_step", { _app_id: app_id, _spec: spec === null ? null : { engine: "api", ...spec } });
    if (error) return fail(dbMessage(error.message));
    if (!data?.ai_step) return text(`Removed the AI step from version ${data.version_no}. Next: dev_run_checks.`, { version_no: data.version_no, ai_step: false });
    return text(`Saved the AI step on version ${data.version_no}. Next: dev_test_run with a realistic example (the page's own sample input), then read the answer critically.`, { version_no: data.version_no, ai_step: true });
  },
});

export const devTestRun = defineTool({
  name: "dev_test_run",
  title: "Test-run an AI app with the real AI",
  description:
    "Runs the saved definition (or, for a file app, its AI step) of the app's latest version once, on EzYourLife's real AI, exactly as a visitor's run would go. Free for the developer and not charged to anyone. Limited to 25 runs a day per developer. Every run is kept, with its inputs and answer, for the team to read at review, and at least one successful run of the exact version is required before it can be sent. Use realistic inputs (for doc apps: the sample), read the answer critically, and improve the instructions if it is wrong, generic or invents facts. Returns the full answer. For a file app with an AI step, pass inputs exactly as the page sends them to window.ezyourlife.ai(inputs); the answer is the parsed JSON or text the page would receive.",
  inputSchema: {
    app_id: z.string().uuid(),
    inputs: z.record(z.string(), z.unknown()).optional().describe("doc apps: the field values keyed by field key (strings; rows fields as arrays of objects). vision apps: an optional note under the key 'Extra instructions' (the pictures go in images)."),
    messages: z
      .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(3000) }))
      .max(10)
      .optional()
      .describe("chat apps: the conversation so far; the last message must be from the user."),
    context: z.string().max(30000).optional().describe("chat apps with documents: pasted document text."),
    images: z.array(z.string().max(1500000)).max(4).optional().describe("vision apps: small pictures as data URLs, e.g. data:image/jpeg;base64,..."),
    refine: z
      .object({ previous: z.string().max(20000), instruction: z.string().max(1000) })
      .optional()
      .describe("doc apps: revise an earlier answer with an instruction such as 'Shorter'."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  handler: async ({ app_id, inputs, messages, context, images, refine }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    const sb = devClient(ctx);
    try {
      const { data: app, error } = await sb.from("dev_apps").select("tool_id, kind").eq("id", app_id).maybeSingle();
      if (error) return fail(dbMessage(error.message));
      if (!app) return fail("App not found.");
      const v = await latestVersion(sb, app_id);
      if (!v) return fail("App not found.");
      const isStep = app.kind !== "ai";
      if (isStep && !v.spec) return fail("This file app has no AI step. Test it with dev_get_preview_link, or save an AI step with dev_save_ai_step first.");
      if (!v.spec) return fail("This version has no definition yet. Save one with dev_save_ai_app first.");
      if (isStep && (!inputs || !Object.keys(inputs).length)) {
        const keys = (v.spec.inputs ?? []).map((i) => i.key).join(", ");
        return fail(`Pass inputs: a realistic example of what the page sends to window.ezyourlife.ai${keys ? ` (keys: ${keys})` : ""}. Use the app's own sample or example data.`);
      }

      const res = await fetch(`${supabaseUrl()}/functions/v1/dev-app-run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ctx.getToken()}`, apikey: supabaseKey() },
        body: JSON.stringify({
          tool_id: app.tool_id,
          preview_version_id: v.id,
          ...(isStep ? { action: "generate" } : {}),
          ...(inputs ? { inputs } : {}),
          ...(messages ? { messages } : {}),
          ...(context ? { context } : {}),
          ...(images ? { images } : {}),
          ...(refine ? { action: "refine", previous: refine.previous, instruction: refine.instruction } : {}),
        }),
        signal: AbortSignal.timeout(110_000),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; output?: string; result?: unknown; error?: string; message?: string; preview?: { left: number | null } } | null;
      const answer = isStep ? (body?.result === undefined || body?.result === null ? "" : typeof body.result === "string" ? body.result : JSON.stringify(body.result, null, 2)) : (body?.output ?? "");
      if (!res.ok || !body?.ok || !answer) {
        const why = body?.message || body?.error || `The test run failed (${res.status}).`;
        return fail(`${why}${res.status >= 500 ? " Nothing was charged. Try once more, and tell the developer if it keeps failing." : ""}`);
      }
      const left = body.preview?.left;
      const out = answer.length > 20000 ? `${answer.slice(0, 20000)}\n\n[shortened here; the team sees the full answer]` : answer;
      return text(
        `Test run OK (version ${v.version_no}${left === null || left === undefined ? "" : `, ${left} test runs left today`}). Read it as the visitor would. Is it correct, specific and in the right format? If not, improve ai.system / ai.task and save again.\n\n--- Answer ---\n${out}`,
        { ok: true, version_no: v.version_no, left: left ?? null },
      );
    } catch (e) {
      return fail(dbMessage(e instanceof Error ? e.message : String(e)));
    }
  },
});

export const devAiTools = [devCheckSimilar, devSaveAiApp, devSaveAiStep, devTestRun];
